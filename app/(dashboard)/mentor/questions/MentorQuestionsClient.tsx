'use client';

import { useState, useTransition } from 'react';
import { addQuestion, bulkAddQuestions, extractQuestionsFromPdf, generateBatchQuestions, toggleQuestionActive, deleteQuestion, generateExplanation } from '@/app/actions/admin';
import { uploadQuestionImage } from '@/lib/uploadQuestionImage';
import * as xlsx from 'xlsx';

const DOMAINS = ['QUANTITATIVE', 'LOGICAL', 'VERBAL', 'SPATIAL', 'PERSONALITY', 'SJT'] as const;

const SUB_TYPES: Record<string, string[]> = {
  QUANTITATIVE: ['Arithmetic', 'Algebra', 'Geometry', 'Data Interpretation', 'Number Series', 'Percentages', 'Ratios & Proportions'],
  LOGICAL: ['Series Completion', 'Analogies', 'Classification', 'Coding-Decoding', 'Blood Relations', 'Syllogisms', 'Direction Sense'],
  VERBAL: ['Reading Comprehension', 'Vocabulary', 'Grammar', 'Sentence Completion', 'Para Jumbles', 'Idioms & Phrases'],
  SPATIAL: ['Pattern Recognition', 'Mental Rotation', 'Figure Series', 'Matrices', 'Spatial Reasoning'],
  PERSONALITY: ['Openness', 'Conscientiousness', 'Extraversion', 'Agreeableness', 'Neuroticism'],
  SJT: ['Teamwork', 'Communication', 'Leadership', 'Problem Solving', 'Adaptability'],
};

const PERSONALITY_TRAITS = ['OPENNESS', 'CONSCIENTIOUSNESS', 'EXTRAVERSION', 'AGREEABLENESS', 'NEUROTICISM'];
const SJT_CATEGORIES = ['TEAMWORK', 'COMMUNICATION', 'LEADERSHIP', 'PROBLEM_SOLVING', 'ADAPTABILITY'];

const DOMAIN_BADGE: Record<string, string> = {
  QUANTITATIVE: 'bg-primary-fixed-dim text-on-primary-fixed',
  LOGICAL:      'bg-secondary-fixed text-on-secondary-fixed-variant',
  VERBAL:       'bg-surface-container-high text-on-surface',
  SPATIAL:      'bg-tertiary-fixed text-on-tertiary-fixed-variant',
  PERSONALITY:  'bg-secondary/20 text-secondary',
  SJT:          'bg-tertiary/20 text-tertiary',
};

function difficultyBadge(d: number) {
  if (d <= 3) return 'bg-green-100 text-green-800 border-green-200';
  if (d <= 6) return 'bg-yellow-100 text-yellow-800 border-yellow-200';
  if (d <= 8) return 'bg-orange-100 text-orange-800 border-orange-200';
  return 'bg-red-100 text-red-800 border-red-200';
}

function difficultyLabel(d: number) {
  if (d <= 3) return 'Easy';
  if (d <= 6) return 'Medium';
  if (d <= 8) return 'Hard';
  return 'Expert';
}

type Question = {
  id: string;
  domain: string;
  sub_type?: string | null;
  difficulty: number;
  text: string;
  options: string[];
  correct_answer?: string;
  correct_index?: number | null;
  explanation?: string | null;
  active?: boolean;
  time_suggestion_sec?: number | null;
  source?: string | null;
  image_url?: string | null;
  options_images?: (string | null)[] | null;
  question_type?: string | null;
  personality_trait?: string | null;
  trait_scores_map?: Array<{ trait: string; score: number }> | null;
  forced_choice_opts?: Array<{ text: string; trait: string }> | null;
  sjt_category?: string | null;
  sjt_best_index?: number | null;
  sjt_worst_index?: number | null;
};

type DraftQuestion = {
  text: string;
  options: string[];
  correct_index: number;
  explanation: string;
  difficulty?: number;  // optional — set when extracted from a PDF
};

type Tab = 'browse' | 'add' | 'generate' | 'bulk';

type ParsedRow = {
  rowNum: number;
  domain: string;
  sub_type?: string;
  difficulty: number;
  text: string;
  options: string[];
  correct_index: number;
  time_suggestion_sec: number;
  explanation?: string;
  error?: string;
};

const VALID_DOMAINS = ['QUANTITATIVE', 'LOGICAL', 'VERBAL', 'SPATIAL', 'PERSONALITY', 'SJT'];
const CORRECT_MAP: Record<string, number> = { A: 0, B: 1, C: 2, D: 3 };

const CSV_TEMPLATE = `domain,sub_type,difficulty,text,option_a,option_b,option_c,option_d,correct,time_sec,explanation
QUANTITATIVE,Arithmetic,3,What is 25% of 200?,25,50,75,100,B,60,25% of 200 = 25/100 * 200 = 50
LOGICAL,Syllogisms,5,"All cats are animals. Some animals are pets. What follows?",All cats are pets,Some cats may be pets,No cats are pets,All pets are cats,B,90,
`;

function parseCSVLine(line: string): string[] {
  const fields: string[] = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') { current += '"'; i++; }
      else inQuotes = !inQuotes;
    } else if (ch === ',' && !inQuotes) {
      fields.push(current.trim());
      current = '';
    } else {
      current += ch;
    }
  }
  fields.push(current.trim());
  return fields;
}

function validateRow(row: Record<string, string>, rowNum: number): ParsedRow {
  const domain = (row.domain ?? '').trim().toUpperCase();
  const blank: ParsedRow = { rowNum, domain, difficulty: 0, text: '', options: [], correct_index: 0, time_suggestion_sec: 90 };
  if (!VALID_DOMAINS.includes(domain)) return { ...blank, error: `Invalid domain "${row.domain}"` };

  const difficulty = parseInt(row.difficulty ?? '');
  if (isNaN(difficulty) || difficulty < 1 || difficulty > 10) return { ...blank, error: 'Difficulty must be 1–10' };

  const text = (row.text ?? '').trim();
  if (!text) return { ...blank, difficulty, error: 'Question text is required' };

  const optA = (row.option_a ?? '').trim();
  const optB = (row.option_b ?? '').trim();
  if (!optA || !optB) return { ...blank, difficulty, text, error: 'At least options A and B are required' };

  const correctKey = (row.correct ?? '').trim().toUpperCase();
  if (!['A', 'B', 'C', 'D'].includes(correctKey)) return { ...blank, difficulty, text, error: 'Correct must be A, B, C, or D' };

  const options = [optA, optB, (row.option_c ?? '').trim(), (row.option_d ?? '').trim()].filter(Boolean);
  const correct_index = CORRECT_MAP[correctKey];
  if (correct_index >= options.length) return { ...blank, difficulty, text, options, error: `Option ${correctKey} is empty` };

  return {
    rowNum,
    domain,
    sub_type: (row.sub_type ?? '').trim() || undefined,
    difficulty,
    text,
    options,
    correct_index,
    time_suggestion_sec: parseInt(row.time_sec ?? '') || 90,
    explanation: (row.explanation ?? '').trim() || undefined,
  };
}

function parseAndValidateCSV(text: string): ParsedRow[] {
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
  if (lines.length < 2) return [];
  const headers = parseCSVLine(lines[0]).map(h => h.toLowerCase().replace(/\s+/g, '_'));

  return lines.slice(1).map((line, i) => {
    const values = parseCSVLine(line);
    const row: Record<string, string> = {};
    headers.forEach((h, idx) => { row[h] = values[idx] ?? ''; });
    return validateRow(row, i + 2);
  });
}

function parseAndValidateExcel(buffer: ArrayBuffer): ParsedRow[] {
  const workbook = xlsx.read(buffer, { type: 'array' });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rawRows = xlsx.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: '' });
  return rawRows.map((raw, i) => {
    const row: Record<string, string> = {};
    for (const [k, v] of Object.entries(raw)) {
      row[k.toLowerCase().replace(/\s+/g, '_')] = String(v ?? '').trim();
    }
    return validateRow(row, i + 2);
  });
}

function getCorrectIdx(q: Question): number {
  if (q.correct_index != null && q.correct_index >= 0) return q.correct_index;
  return q.options.findIndex(o => o === q.correct_answer);
}

export default function MentorQuestionsClient({ initialQuestions }: { initialQuestions: Question[] }) {
  const [tab, setTab] = useState<Tab>('browse');
  const [questions, setQuestions] = useState(initialQuestions);
  const [isPending, startTransition] = useTransition();

  // Browse
  const [filterDomain, setFilterDomain] = useState('ALL');
  const [filterSubType, setFilterSubType] = useState('ALL');
  const [filterActive, setFilterActive] = useState<'ALL' | 'active' | 'inactive'>('ALL');
  const [search, setSearch] = useState('');
  const [minDiff, setMinDiff] = useState(1);
  const [maxDiff, setMaxDiff] = useState(10);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [loadingExplain, setLoadingExplain] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [browseError, setBrowseError] = useState('');
  const [bulkError, setBulkError] = useState('');

  // Add Manual
  const [addDomain, setAddDomain] = useState('QUANTITATIVE');
  const [addSubType, setAddSubType] = useState(SUB_TYPES.QUANTITATIVE[0]);
  const [addDifficulty, setAddDifficulty] = useState(5);
  const [addTimeSec, setAddTimeSec] = useState(90);
  const [addText, setAddText] = useState('');
  const [addOptions, setAddOptions] = useState(['', '', '', '']);
  const [addCorrectIndex, setAddCorrectIndex] = useState(0);
  const [addError, setAddError] = useState('');
  const [addImageUrl, setAddImageUrl] = useState<string | null>(null);
  const [addImagePreview, setAddImagePreview] = useState<string | null>(null);
  const [addImageUploading, setAddImageUploading] = useState(false);
  const [addOptionImages, setAddOptionImages] = useState<(string | null)[]>([null, null, null, null]);
  const [addOptionImagePreviews, setAddOptionImagePreviews] = useState<(string | null)[]>([null, null, null, null]);
  const [showOptionImages, setShowOptionImages] = useState(false);

  // Question type for PERSONALITY / SJT domains
  const [addQuestionType, setAddQuestionType] = useState('MCQ');
  const [addPersonalityTrait, setAddPersonalityTrait] = useState(PERSONALITY_TRAITS[0]);
  const [addForcedChoiceOpts, setAddForcedChoiceOpts] = useState([
    { text: '', trait: PERSONALITY_TRAITS[0] },
    { text: '', trait: PERSONALITY_TRAITS[1] },
  ]);
  const [addTraitScoresMap, setAddTraitScoresMap] = useState(
    [0, 1, 2, 3].map(i => ({ trait: PERSONALITY_TRAITS[i % PERSONALITY_TRAITS.length], score: 2 }))
  );
  const [addSjtCategory, setAddSjtCategory] = useState(SJT_CATEGORIES[0]);
  const [addSjtBestIndex, setAddSjtBestIndex] = useState<number | null>(null);
  const [addSjtWorstIndex, setAddSjtWorstIndex] = useState<number | null>(null);

  // AI Generate
  const [genDomain, setGenDomain] = useState('QUANTITATIVE');
  const [genSubType, setGenSubType] = useState(SUB_TYPES.QUANTITATIVE[0]);
  const [genDifficulty, setGenDifficulty] = useState(5);
  const [genTimeSec, setGenTimeSec] = useState(90);
  const [drafts, setDrafts] = useState<DraftQuestion[]>([]);
  const [genLoading, setGenLoading] = useState(false);
  const [genError, setGenError] = useState('');
  const [approvingIdx, setApprovingIdx] = useState<number | null>(null);

  // Bulk Upload
  const [parsedRows, setParsedRows] = useState<ParsedRow[]>([]);
  const [bulkUploading, setBulkUploading] = useState(false);
  const [bulkResult, setBulkResult] = useState<{ added: number } | null>(null);

  // PDF Upload — AI extraction of questions from an uploaded PDF
  const [pdfDomain, setPdfDomain] = useState('QUANTITATIVE');
  const [pdfDifficulty, setPdfDifficulty] = useState(5);
  const [pdfDrafts, setPdfDrafts] = useState<DraftQuestion[]>([]);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [pdfError, setPdfError] = useState('');
  const [pdfFileName, setPdfFileName] = useState('');
  const [pdfSaving, setPdfSaving] = useState(false);
  const [pdfResult, setPdfResult] = useState<{ added: number } | null>(null);

  async function handlePdfPick(file: File) {
    setPdfError('');
    setPdfResult(null);
    setPdfDrafts([]);
    setPdfFileName(file.name);
    setPdfLoading(true);
    try {
      const buf = await file.arrayBuffer();
      let binary = '';
      const bytes = new Uint8Array(buf);
      for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
      const pdfBase64 = btoa(binary);
      const drafts = await extractQuestionsFromPdf({
        pdfBase64,
        domain: pdfDomain,
        defaultDifficulty: pdfDifficulty,
      });
      if (drafts.length === 0) setPdfError('No questions could be extracted from this PDF.');
      setPdfDrafts(drafts as DraftQuestion[]);
    } catch (err: any) {
      setPdfError(err?.message ?? 'Failed to read PDF.');
    } finally {
      setPdfLoading(false);
    }
  }

  async function handlePdfSaveAll() {
    if (pdfDrafts.length === 0) return;
    setPdfSaving(true);
    try {
      const rows = pdfDrafts.map(d => ({
        domain: pdfDomain,
        difficulty: d.difficulty ?? pdfDifficulty,
        text: d.text,
        options: d.options,
        correct_index: d.correct_index,
        explanation: d.explanation,
        time_suggestion_sec: 60,
      }));
      const added = await bulkAddQuestions(rows);
      setQuestions(qs => [...(added as Question[]), ...qs]);
      setPdfResult({ added: added.length });
      setPdfDrafts([]);
      setPdfFileName('');
    } catch (err: any) {
      setPdfError(err?.message ?? 'Failed to save questions.');
    } finally {
      setPdfSaving(false);
    }
  }

  function discardPdfDraft(i: number) {
    setPdfDrafts(prev => prev.filter((_, idx) => idx !== i));
  }

  const domainCounts = DOMAINS.reduce((acc, d) => {
    acc[d] = questions.filter(q => q.domain === d).length;
    return acc;
  }, {} as Record<string, number>);

  const filtered = questions.filter(q => {
    if (filterDomain !== 'ALL' && q.domain !== filterDomain) return false;
    if (filterSubType !== 'ALL' && q.sub_type !== filterSubType) return false;
    if (filterActive === 'active' && q.active === false) return false;
    if (filterActive === 'inactive' && q.active !== false) return false;
    if (q.difficulty < minDiff || q.difficulty > maxDiff) return false;
    if (search && !q.text.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  function changeDomain(domain: string, setD: (d: string) => void, setST: (s: string) => void, isAdd = false) {
    setD(domain);
    setST(SUB_TYPES[domain]?.[0] ?? '');
    if (isAdd) {
      setAddQuestionType(domain === 'SJT' ? 'SJT' : domain === 'PERSONALITY' ? 'LIKERT' : 'MCQ');
      setAddSjtBestIndex(null);
      setAddSjtWorstIndex(null);
    }
  }

  async function handleToggleActive(id: string, currentActive: boolean | undefined) {
    setTogglingId(id);
    setBrowseError('');
    try {
      const res = await toggleQuestionActive(id);
      setQuestions(qs => qs.map(q => q.id === id ? { ...q, active: res.active } : q));
    } catch (err: any) {
      setBrowseError(err.message ?? 'Failed to toggle question');
    } finally {
      setTogglingId(null);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this question? This cannot be undone.')) return;
    setDeletingId(id);
    setBrowseError('');
    try {
      await deleteQuestion(id);
      setQuestions(qs => qs.filter(q => q.id !== id));
      if (expandedId === id) setExpandedId(null);
    } catch (err: any) {
      setBrowseError(err.message ?? 'Failed to delete question');
    } finally {
      setDeletingId(null);
    }
  }

  async function handleGenerateExplanation(id: string) {
    setLoadingExplain(id);
    setBrowseError('');
    try {
      const res = await generateExplanation(id);
      setQuestions(qs => qs.map(q => q.id === id ? { ...q, explanation: res.explanation } : q));
    } catch (err: any) {
      setBrowseError(err.message ?? 'Failed to generate explanation');
    } finally {
      setLoadingExplain(null);
    }
  }

  function handleAddSubmit(e: React.FormEvent) {
    e.preventDefault();
    setAddError('');

    const isSjtDomain = addDomain === 'SJT';
    const isPersonalityDomain = addDomain === 'PERSONALITY';
    const isNonMcq = isSjtDomain || (isPersonalityDomain && addQuestionType !== 'MCQ');

    // Build payload
    let options: string[] = [];
    let correctIndex: number | null = null;
    let extraFields: Record<string, unknown> = {};

    if (addQuestionType === 'LIKERT') {
      options = ['1', '2', '3', '4', '5'];
      extraFields = { personality_trait: addPersonalityTrait };
    } else if (addQuestionType === 'FORCED_CHOICE') {
      const fc = addForcedChoiceOpts.map(o => ({ text: o.text.trim(), trait: o.trait }));
      if (fc.some(o => !o.text)) { setAddError('Fill in both forced-choice option texts.'); return; }
      if (fc[0].trait === fc[1].trait) { setAddError('Forced-choice options must map to different personality traits.'); return; }
      options = fc.map(o => o.text);
      extraFields = { forced_choice_opts: fc };
    } else if (addQuestionType === 'PERSONALITY_MCQ') {
      const filledOpts = addOptions.map(o => o.trim()).filter(Boolean);
      if (filledOpts.length < 2) { setAddError('Add at least 2 options.'); return; }
      options = filledOpts;
      extraFields = { trait_scores_map: addTraitScoresMap.slice(0, filledOpts.length) };
    } else if (addQuestionType === 'SJT') {
      const filledOpts = addOptions.map(o => o.trim()).filter(Boolean);
      if (filledOpts.length < 2) { setAddError('Add at least 2 options.'); return; }
      if (addSjtBestIndex === null || addSjtWorstIndex === null) { setAddError('Select Best and Worst response indices.'); return; }
      if (addSjtBestIndex === addSjtWorstIndex) { setAddError('Best and Worst cannot be the same option.'); return; }
      options = filledOpts;
      extraFields = { sjt_category: addSjtCategory, sjt_best_index: addSjtBestIndex, sjt_worst_index: addSjtWorstIndex };
    } else {
      // Regular MCQ
      const filledOpts = addOptions.map(o => o.trim()).filter(Boolean);
      if (filledOpts.length < 2) { setAddError('Add at least 2 options.'); return; }
      const correctText = addOptions[addCorrectIndex]?.trim();
      if (!correctText) { setAddError('The selected correct option is empty.'); return; }
      options = filledOpts;
      correctIndex = filledOpts.indexOf(correctText);
    }

    startTransition(async () => {
      try {
        const q = await addQuestion({
          domain: addDomain,
          sub_type: addSubType,
          difficulty: addDifficulty,
          text: addText.trim(),
          options,
          correct_index: correctIndex ?? undefined,
          time_suggestion_sec: addTimeSec,
          source: 'manual',
          image_url: addImageUrl,
          options_images: addOptionImages.every(u => u === null) ? null : addOptionImages,
          question_type: isNonMcq ? addQuestionType : 'MCQ',
          ...extraFields,
        });
        setQuestions(qs => [q as Question, ...qs]);
        setAddText('');
        setAddOptions(['', '', '', '']);
        setAddCorrectIndex(0);
        setAddImageUrl(null);
        setAddImagePreview(null);
        setAddOptionImages([null, null, null, null]);
        setAddOptionImagePreviews([null, null, null, null]);
        setShowOptionImages(false);
        setAddSjtBestIndex(null);
        setAddSjtWorstIndex(null);
        setTab('browse');
      } catch (err: any) {
        setAddError(err.message ?? 'Failed to add question');
      }
    });
  }

  async function handleGenerate() {
    setGenLoading(true);
    setGenError('');
    setDrafts([]);
    try {
      const result = await generateBatchQuestions(genDomain, genSubType, genDifficulty);
      setDrafts(result);
    } catch (err: any) {
      setGenError(err.message ?? 'Failed to generate questions');
    } finally {
      setGenLoading(false);
    }
  }

  async function handleApproveDraft(idx: number) {
    setApprovingIdx(idx);
    const draft = drafts[idx];
    try {
      const q = await addQuestion({
        domain: genDomain,
        sub_type: genSubType,
        difficulty: genDifficulty,
        text: draft.text,
        options: draft.options,
        correct_index: draft.correct_index,
        time_suggestion_sec: genTimeSec,
        explanation: draft.explanation,
        source: 'gemini',
      });
      setQuestions(qs => [q as Question, ...qs]);
      setDrafts(ds => ds.filter((_, i) => i !== idx));
    } catch (err: any) {
      setGenError(err.message ?? 'Failed to approve draft');
    } finally {
      setApprovingIdx(null);
    }
  }

  async function handleBulkUpload() {
    const valid = parsedRows.filter(r => !r.error);
    if (!valid.length) return;
    setBulkUploading(true);
    setBulkResult(null);
    setBulkError('');
    try {
      const added = await bulkAddQuestions(valid);
      setQuestions(qs => [...(added as Question[]), ...qs]);
      setParsedRows([]);
      setBulkResult({ added: added.length });
    } catch (err: any) {
      setBulkError(err.message ?? 'Upload failed');
    } finally {
      setBulkUploading(false);
    }
  }

  function downloadTemplate() {
    const blob = new Blob([CSV_TEMPLATE], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'questions_template.csv';
    a.click();
    URL.revokeObjectURL(url);
  }

  function downloadExcelTemplate() {
    const ws = xlsx.utils.aoa_to_sheet([
      ['domain', 'sub_type', 'difficulty', 'text', 'option_a', 'option_b', 'option_c', 'option_d', 'correct', 'time_sec', 'explanation'],
      ['QUANTITATIVE', 'Arithmetic', 3, 'What is 25% of 200?', '25', '50', '75', '100', 'B', 60, '25% of 200 = 50'],
    ]);
    const wb = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(wb, ws, 'Questions');
    xlsx.writeFile(wb, 'questions_template.xlsx');
  }

  const tabs = [
    { id: 'browse' as Tab, label: 'Browse', icon: 'table_rows' },
    { id: 'add' as Tab, label: 'Add Manual', icon: 'edit_note' },
    { id: 'generate' as Tab, label: 'AI Generate', icon: 'auto_awesome' },
    { id: 'bulk' as Tab, label: 'Bulk Upload', icon: 'upload_file' },
  ];

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 className="font-headline-lg text-2xl text-on-surface font-bold mb-1">Question Bank</h1>
        <p className="font-body-md text-on-surface-variant">
          {questions.length} questions — {DOMAINS.map(d => `${d}: ${domainCounts[d]}`).join(' · ')}
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-surface-container-low p-1 rounded-xl w-fit">
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg font-metric-label text-sm transition-all ${
              tab === t.id ? 'bg-surface text-on-surface shadow-sm' : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            <span className="material-symbols-outlined text-sm">{t.icon}</span>
            {t.label}
          </button>
        ))}
      </div>

      {/* ===== BROWSE TAB ===== */}
      {tab === 'browse' && (
        <div>
          {/* Filters */}
          <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-4 mb-4 flex flex-wrap gap-3 items-center">
            <div className="relative flex-1 min-w-48">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-sm">search</span>
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search questions…"
                className="w-full pl-9 pr-3 py-2 bg-surface-container-low border border-outline-variant rounded-lg text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <select
              value={filterDomain}
              onChange={e => { setFilterDomain(e.target.value); setFilterSubType('ALL'); }}
              className="bg-surface-container-low border border-outline-variant rounded-lg px-3 py-2 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="ALL">All Domains</option>
              {DOMAINS.map(d => <option key={d} value={d}>{d}</option>)}
            </select>

            {filterDomain !== 'ALL' && (
              <select
                value={filterSubType}
                onChange={e => setFilterSubType(e.target.value)}
                className="bg-surface-container-low border border-outline-variant rounded-lg px-3 py-2 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="ALL">All Sub-types</option>
                {(SUB_TYPES[filterDomain] ?? []).map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            )}

            <div className="flex items-center gap-2 text-sm text-on-surface-variant">
              <span>Lvl</span>
              <input type="number" min={1} max={10} value={minDiff} onChange={e => setMinDiff(Number(e.target.value))} className="w-14 bg-surface-container-low border border-outline-variant rounded-lg px-2 py-2 text-sm text-on-surface text-center focus:outline-none focus:ring-2 focus:ring-primary" />
              <span>–</span>
              <input type="number" min={1} max={10} value={maxDiff} onChange={e => setMaxDiff(Number(e.target.value))} className="w-14 bg-surface-container-low border border-outline-variant rounded-lg px-2 py-2 text-sm text-on-surface text-center focus:outline-none focus:ring-2 focus:ring-primary" />
            </div>

            <select
              value={filterActive}
              onChange={e => setFilterActive(e.target.value as typeof filterActive)}
              className="bg-surface-container-low border border-outline-variant rounded-lg px-3 py-2 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="ALL">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>

            <span className="font-caption text-on-surface-variant ml-auto">{filtered.length} result{filtered.length !== 1 ? 's' : ''}</span>
          </div>

          {browseError && (
            <div className="flex items-center gap-2 mb-3 px-4 py-2 bg-error-container text-on-error-container rounded-lg text-sm">
              <span className="material-symbols-outlined text-sm">error</span>
              <span className="flex-1">{browseError}</span>
              <button onClick={() => setBrowseError('')} className="shrink-0 hover:opacity-70" aria-label="Dismiss">
                <span className="material-symbols-outlined text-sm">close</span>
              </button>
            </div>
          )}

          {/* Question list */}
          <div className="bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden shadow-sm">
            {filtered.length === 0 ? (
              <div className="p-12 text-center text-on-surface-variant font-body-md">
                <span className="material-symbols-outlined text-4xl mb-2 block opacity-40">search_off</span>
                No questions match your filters.
              </div>
            ) : filtered.map(q => {
              const correctIdx = getCorrectIdx(q);
              const isExpanded = expandedId === q.id;
              const isActive = q.active ?? true;

              return (
                <div key={q.id} className={`border-b border-outline-variant/50 last:border-b-0 ${!isActive ? 'opacity-60' : ''}`}>
                  {/* Row */}
                  <div
                    className="flex items-center gap-3 p-4 hover:bg-surface-container-low/50 cursor-pointer transition-colors"
                    onClick={() => setExpandedId(isExpanded ? null : q.id)}
                  >
                    <span className={`material-symbols-outlined text-on-surface-variant text-sm transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`}>chevron_right</span>

                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full whitespace-nowrap ${DOMAIN_BADGE[q.domain] ?? 'bg-surface-container-high text-on-surface'}`}>
                      {q.domain}
                    </span>

                    {q.sub_type && (
                      <span className="text-xs text-on-surface-variant border border-outline-variant px-2 py-0.5 rounded-full whitespace-nowrap hidden sm:inline">{q.sub_type}</span>
                    )}

                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full border whitespace-nowrap ${difficultyBadge(q.difficulty)}`}>
                      {q.difficulty}/10
                    </span>

                    <p className="flex-1 font-body-md text-on-surface text-sm line-clamp-1 min-w-0">{q.text}</p>

                    {q.source === 'gemini' && (
                      <span className="material-symbols-outlined text-sm text-primary opacity-70 shrink-0" title="AI Generated">auto_awesome</span>
                    )}

                    {q.image_url && (
                      <span className="material-symbols-outlined text-sm text-secondary shrink-0" title="Has image">image</span>
                    )}

                    {/* Active toggle */}
                    <button
                      onClick={e => { e.stopPropagation(); handleToggleActive(q.id, q.active); }}
                      disabled={togglingId === q.id}
                      className={`relative inline-flex h-5 w-9 shrink-0 rounded-full transition-colors focus:outline-none disabled:opacity-50 ${isActive ? 'bg-primary' : 'bg-outline-variant'}`}
                      title={isActive ? 'Deactivate' : 'Activate'}
                    >
                      <span className={`inline-block h-4 w-4 mt-0.5 rounded-full bg-white shadow transition-transform ${isActive ? 'translate-x-4' : 'translate-x-0.5'}`} />
                    </button>

                    {/* Delete */}
                    <button
                      onClick={e => { e.stopPropagation(); handleDelete(q.id); }}
                      disabled={deletingId === q.id}
                      className="text-error hover:bg-error-container/20 p-1.5 rounded-lg transition-colors disabled:opacity-50 shrink-0"
                      title="Delete"
                    >
                      <span className={`material-symbols-outlined text-sm ${deletingId === q.id ? 'animate-spin' : ''}`}>
                        {deletingId === q.id ? 'refresh' : 'delete'}
                      </span>
                    </button>
                  </div>

                  {/* Expanded detail */}
                  {isExpanded && (
                    <div className="px-10 pb-5 pt-1 bg-surface-container-low/30 border-t border-outline-variant/30">
                      <p className="font-body-md text-on-surface mt-3 mb-3 leading-relaxed">{q.text}</p>

                      {/* Type metadata chip */}
                      {q.question_type && q.question_type !== 'MCQ' && (
                        <div className="flex flex-wrap gap-2 mb-3">
                          <span className="text-xs font-metric-label px-2 py-0.5 rounded-full bg-secondary/20 text-secondary border border-secondary/30">
                            {q.question_type}
                          </span>
                          {q.personality_trait && (
                            <span className="text-xs font-metric-label px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                              Trait: {q.personality_trait}
                            </span>
                          )}
                          {q.sjt_category && (
                            <span className="text-xs font-metric-label px-2 py-0.5 rounded-full bg-tertiary/10 text-tertiary">
                              {q.sjt_category.replace('_', ' ')}
                            </span>
                          )}
                        </div>
                      )}

                      {q.image_url && (
                        <div className="mb-3 rounded-xl overflow-hidden border border-outline-variant bg-surface-container-low inline-block max-w-full">
                          <img src={q.image_url} alt="Question diagram" className="max-h-56 object-contain p-2" />
                        </div>
                      )}

                      {/* Options — type-specific rendering */}
                      {q.question_type === 'FORCED_CHOICE' && q.forced_choice_opts ? (
                        <div className="grid grid-cols-2 gap-2 mb-4">
                          {q.forced_choice_opts.map((fc, i) => (
                            <div key={i} className="flex items-start gap-2 px-3 py-2 rounded-lg border border-secondary/30 bg-secondary/5 text-sm">
                              <span className="font-bold shrink-0">{String.fromCharCode(65 + i)}.</span>
                              <span className="flex-1">{fc.text}</span>
                              <span className="text-xs font-metric-label text-secondary shrink-0">{fc.trait.slice(0, 3)}</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="grid grid-cols-2 gap-2 mb-4">
                          {q.options.map((opt, i) => {
                            const isBest = q.domain === 'SJT' && i === q.sjt_best_index;
                            const isWorst = q.domain === 'SJT' && i === q.sjt_worst_index;
                            const tsEntry = q.trait_scores_map?.[i];
                            return (
                              <div
                                key={i}
                                className={`flex items-start gap-2 px-3 py-2 rounded-lg border text-sm ${
                                  isBest ? 'bg-green-50 border-green-300 text-green-800 font-semibold'
                                    : isWorst ? 'bg-red-50 border-red-300 text-red-800 font-semibold'
                                    : i === correctIdx && q.domain !== 'SJT' && q.domain !== 'PERSONALITY'
                                      ? 'bg-green-50 border-green-300 text-green-800 font-semibold'
                                      : 'bg-surface-container-low border-outline-variant text-on-surface-variant'
                                }`}
                              >
                                <span className="font-bold shrink-0">{String.fromCharCode(65 + i)}.</span>
                                {q.options_images?.[i]
                                  ? <img src={q.options_images[i]!} alt={`Option ${String.fromCharCode(65 + i)}`} className="h-20 object-contain rounded" />
                                  : <span className="flex-1">{opt}</span>
                                }
                                {isBest && <span className="material-symbols-outlined text-green-600 text-sm shrink-0" title="Best">thumb_up</span>}
                                {isWorst && <span className="material-symbols-outlined text-red-600 text-sm shrink-0" title="Worst">thumb_down</span>}
                                {!isBest && !isWorst && i === correctIdx && q.domain !== 'SJT' && q.domain !== 'PERSONALITY' && (
                                  <span className="material-symbols-outlined text-green-600 text-sm shrink-0">check_circle</span>
                                )}
                                {tsEntry && (
                                  <span className="text-xs font-metric-label text-secondary shrink-0">{tsEntry.trait.slice(0, 3)}+{tsEntry.score}</span>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {q.time_suggestion_sec != null && (
                        <p className="font-caption text-on-surface-variant mb-3 flex items-center gap-1">
                          <span className="material-symbols-outlined text-xs">schedule</span>
                          Suggested: {Math.floor(q.time_suggestion_sec / 60)}m {q.time_suggestion_sec % 60}s
                        </p>
                      )}

                      {q.explanation ? (
                        <div className="bg-surface-container-low rounded-lg px-4 py-3">
                          <p className="font-metric-label text-on-surface-variant text-xs uppercase mb-1">Explanation</p>
                          <p className="font-body-md text-on-surface-variant text-sm leading-relaxed">{q.explanation}</p>
                        </div>
                      ) : q.domain !== 'PERSONALITY' && q.domain !== 'SJT' ? (
                        <button
                          onClick={() => handleGenerateExplanation(q.id)}
                          disabled={loadingExplain === q.id}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary text-on-primary rounded-lg font-metric-label text-sm hover:opacity-90 transition-opacity disabled:opacity-50"
                        >
                          <span className={`material-symbols-outlined text-sm ${loadingExplain === q.id ? 'animate-spin' : ''}`}>
                            {loadingExplain === q.id ? 'refresh' : 'auto_awesome'}
                          </span>
                          {loadingExplain === q.id ? 'Generating…' : 'Generate Explanation'}
                        </button>
                      ) : null}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ===== ADD MANUAL TAB ===== */}
      {tab === 'add' && (
        <form onSubmit={handleAddSubmit} className="bg-surface-container-lowest border border-outline-variant rounded-xl p-6 shadow-sm">
          <h2 className="font-headline-md text-on-surface text-lg font-bold mb-5">Add Question Manually</h2>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block font-metric-label text-on-surface-variant text-sm mb-1.5">Domain</label>
              <select
                value={addDomain}
                onChange={e => changeDomain(e.target.value, setAddDomain, setAddSubType, true)}
                className="w-full bg-surface-container-low border border-outline-variant rounded-lg px-3 py-2.5 text-on-surface text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              >
                {DOMAINS.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div>
              <label className="block font-metric-label text-on-surface-variant text-sm mb-1.5">Sub-type</label>
              <select
                value={addSubType}
                onChange={e => setAddSubType(e.target.value)}
                className="w-full bg-surface-container-low border border-outline-variant rounded-lg px-3 py-2.5 text-on-surface text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              >
                {(SUB_TYPES[addDomain] ?? []).map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>

          {/* Question Type selector — PERSONALITY domain only */}
          {addDomain === 'PERSONALITY' && (
            <div className="mb-4">
              <label className="block font-metric-label text-on-surface-variant text-sm mb-1.5">Question Format</label>
              <div className="flex flex-wrap gap-2">
                {(['LIKERT', 'FORCED_CHOICE', 'PERSONALITY_MCQ'] as const).map(qt => (
                  <button
                    key={qt}
                    type="button"
                    onClick={() => setAddQuestionType(qt)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-metric-label border transition-colors ${addQuestionType === qt ? 'bg-primary text-on-primary border-primary' : 'border-outline-variant text-on-surface-variant hover:bg-surface-container'}`}
                  >
                    {qt === 'LIKERT' ? 'Likert Scale (1–5)' : qt === 'FORCED_CHOICE' ? 'Forced Choice (A or B)' : 'Personality MCQ'}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* SJT category */}
          {addDomain === 'SJT' && (
            <div className="mb-4">
              <label className="block font-metric-label text-on-surface-variant text-sm mb-1.5">SJT Competency Category</label>
              <select
                value={addSjtCategory}
                onChange={e => setAddSjtCategory(e.target.value)}
                className="w-full bg-surface-container-low border border-outline-variant rounded-lg px-3 py-2.5 text-on-surface text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              >
                {SJT_CATEGORIES.map(c => <option key={c} value={c}>{c.replace('_', ' ')}</option>)}
              </select>
            </div>
          )}

          {/* LIKERT: trait selector (options auto-set to 1–5) */}
          {addDomain === 'PERSONALITY' && addQuestionType === 'LIKERT' && (
            <div className="mb-4 p-4 bg-secondary/5 border border-secondary/20 rounded-xl">
              <label className="block font-metric-label text-on-surface-variant text-sm mb-1.5">Personality Trait measured</label>
              <select
                value={addPersonalityTrait}
                onChange={e => setAddPersonalityTrait(e.target.value)}
                className="w-full bg-surface-container-low border border-outline-variant rounded-lg px-3 py-2.5 text-on-surface text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              >
                {PERSONALITY_TRAITS.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
              <p className="text-xs text-on-surface-variant mt-2">Response options 1–5 are added automatically (1 = Strongly Disagree, 5 = Strongly Agree).</p>
            </div>
          )}

          {/* FORCED_CHOICE: two option-trait pairs */}
          {addDomain === 'PERSONALITY' && addQuestionType === 'FORCED_CHOICE' && (
            <div className="mb-4 p-4 bg-secondary/5 border border-secondary/20 rounded-xl">
              <p className="font-metric-label text-on-surface-variant text-sm mb-3">Two options — each maps to a personality trait</p>
              {addForcedChoiceOpts.map((fc, i) => (
                <div key={i} className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={fc.text}
                    onChange={e => {
                      const next = [...addForcedChoiceOpts];
                      next[i] = { ...next[i], text: e.target.value };
                      setAddForcedChoiceOpts(next);
                    }}
                    placeholder={`Option ${String.fromCharCode(65 + i)} text`}
                    className="flex-1 bg-surface-container-low border border-outline-variant rounded-lg px-3 py-2 text-on-surface text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                  <select
                    value={fc.trait}
                    onChange={e => {
                      const next = [...addForcedChoiceOpts];
                      next[i] = { ...next[i], trait: e.target.value };
                      setAddForcedChoiceOpts(next);
                    }}
                    className="bg-surface-container-low border border-outline-variant rounded-lg px-3 py-2 text-on-surface text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    {PERSONALITY_TRAITS.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
              ))}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block font-metric-label text-on-surface-variant text-sm mb-1.5">
                Difficulty: <span className={`font-bold px-1.5 py-0.5 rounded text-xs border ${difficultyBadge(addDifficulty)}`}>{addDifficulty}/10 · {difficultyLabel(addDifficulty)}</span>
              </label>
              <input
                type="range" min={1} max={10} value={addDifficulty}
                onChange={e => setAddDifficulty(Number(e.target.value))}
                className="w-full accent-primary mt-1"
              />
              <div className="flex justify-between text-xs text-on-surface-variant mt-0.5">
                <span>Easy</span><span>Medium</span><span>Hard</span><span>Expert</span>
              </div>
            </div>
            <div>
              <label className="block font-metric-label text-on-surface-variant text-sm mb-1.5">
                Time Suggestion: <span className="font-bold">{Math.floor(addTimeSec / 60)}m {addTimeSec % 60}s</span>
              </label>
              <input
                type="range" min={15} max={300} step={15} value={addTimeSec}
                onChange={e => setAddTimeSec(Number(e.target.value))}
                className="w-full accent-primary mt-1"
              />
              <div className="flex justify-between text-xs text-on-surface-variant mt-0.5">
                <span>15s</span><span>2m 30s</span><span>5m</span>
              </div>
            </div>
          </div>

          <div className="mb-4">
            <label className="block font-metric-label text-on-surface-variant text-sm mb-1.5">Question Text</label>
            <textarea
              value={addText}
              onChange={e => setAddText(e.target.value)}
              required rows={3}
              className="w-full bg-surface-container-low border border-outline-variant rounded-lg px-4 py-2.5 text-on-surface text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none"
              placeholder="Enter the question…"
            />
          </div>

          {/* Question image (optional) */}
          <div className="mb-4">
            <label className="block font-metric-label text-on-surface-variant text-sm mb-1.5">
              Question Image <span className="font-normal text-on-surface-variant/60">(optional — for spatial/visual questions)</span>
            </label>
            {addImagePreview && (
              <div className="relative mb-2 inline-block">
                <img src={addImagePreview} alt="Question preview" className="max-h-48 rounded-lg border border-outline-variant object-contain bg-surface-container-low" />
                <button
                  type="button"
                  onClick={() => { setAddImageUrl(null); setAddImagePreview(null); }}
                  className="absolute -top-2 -right-2 w-6 h-6 bg-error text-on-error rounded-full flex items-center justify-center text-xs hover:opacity-90"
                >
                  <span className="material-symbols-outlined text-[14px]">close</span>
                </button>
              </div>
            )}
            <label className={`inline-flex items-center gap-2 px-3 py-2 border border-outline-variant rounded-lg cursor-pointer text-sm font-metric-label transition-colors ${addImageUploading ? 'opacity-50 pointer-events-none' : 'hover:bg-surface-container-low text-on-surface-variant'}`}>
              <span className="material-symbols-outlined text-sm">{addImageUploading ? 'hourglass_empty' : 'image'}</span>
              {addImageUploading ? 'Uploading…' : addImagePreview ? 'Replace Image' : 'Attach Image'}
              <input
                type="file"
                accept="image/*"
                className="sr-only"
                onChange={async e => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  setAddImageUploading(true);
                  try {
                    const url = await uploadQuestionImage(file);
                    setAddImageUrl(url);
                    setAddImagePreview(URL.createObjectURL(file));
                  } catch (err: any) {
                    setAddError(err.message ?? 'Image upload failed');
                  } finally {
                    setAddImageUploading(false);
                    e.target.value = '';
                  }
                }}
              />
            </label>
          </div>

          {/* PERSONALITY_MCQ: options with trait+score per option */}
          {addDomain === 'PERSONALITY' && addQuestionType === 'PERSONALITY_MCQ' && (
            <div className="mb-5 p-4 bg-secondary/5 border border-secondary/20 rounded-xl">
              <p className="font-metric-label text-on-surface-variant text-sm mb-3">Options — each maps to a trait and score (1–4)</p>
              {addOptions.map((opt, i) => (
                <div key={i} className="flex gap-2 mb-2 items-center">
                  <span className="font-bold text-on-surface-variant text-sm w-5 shrink-0">{String.fromCharCode(65 + i)}.</span>
                  <input
                    type="text" value={opt}
                    onChange={e => { const next = [...addOptions]; next[i] = e.target.value; setAddOptions(next); }}
                    placeholder={`Option ${String.fromCharCode(65 + i)}`}
                    className="flex-1 bg-surface-container-low border border-outline-variant rounded-lg px-3 py-2 text-on-surface text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                  <select
                    value={addTraitScoresMap[i]?.trait ?? PERSONALITY_TRAITS[0]}
                    onChange={e => {
                      const next = [...addTraitScoresMap];
                      next[i] = { ...next[i], trait: e.target.value };
                      setAddTraitScoresMap(next);
                    }}
                    className="bg-surface-container-low border border-outline-variant rounded-lg px-2 py-2 text-on-surface text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    {PERSONALITY_TRAITS.map(t => <option key={t} value={t}>{t.slice(0, 3)}</option>)}
                  </select>
                  <input
                    type="number" min={1} max={4}
                    value={addTraitScoresMap[i]?.score ?? 2}
                    onChange={e => {
                      const next = [...addTraitScoresMap];
                      next[i] = { ...next[i], score: Number(e.target.value) };
                      setAddTraitScoresMap(next);
                    }}
                    className="w-14 bg-surface-container-low border border-outline-variant rounded-lg px-2 py-2 text-on-surface text-sm text-center focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              ))}
            </div>
          )}

          {/* Regular MCQ / SJT options — hidden when PERSONALITY sub-format handles options itself */}
          {addQuestionType !== 'LIKERT' && addQuestionType !== 'FORCED_CHOICE' && addQuestionType !== 'PERSONALITY_MCQ' && (
            <div className="mb-5">
              <div className="flex items-center justify-between mb-2">
                <label className="block font-metric-label text-on-surface-variant text-sm">
                  Options {addQuestionType === 'SJT' ? <span className="font-normal">(4–5 workplace responses)</span> : <span className="font-normal">(click the radio to mark the correct answer)</span>}
                </label>
                {addQuestionType === 'MCQ' && (
                  <button
                    type="button"
                    onClick={() => setShowOptionImages(v => !v)}
                    className="inline-flex items-center gap-1 text-xs text-on-surface-variant hover:text-primary transition-colors font-metric-label"
                  >
                    <span className="material-symbols-outlined text-[14px]">{showOptionImages ? 'hide_image' : 'add_photo_alternate'}</span>
                    {showOptionImages ? 'Hide option images' : 'Add option images'}
                  </button>
                )}
              </div>
              <div className="flex flex-col gap-2">
                {addOptions.map((opt, i) => (
                  <div key={i} className="flex flex-col gap-1">
                    <div
                      className={`flex items-center gap-2 px-3 py-2.5 rounded-lg border transition-colors ${
                        addQuestionType === 'SJT'
                          ? addSjtBestIndex === i ? 'border-green-400 bg-green-50' : addSjtWorstIndex === i ? 'border-red-400 bg-red-50' : 'border-outline-variant'
                          : addCorrectIndex === i ? 'border-primary bg-primary/5' : 'border-outline-variant'
                      }`}
                    >
                      {addQuestionType === 'MCQ' && (
                        <input
                          type="radio" name="correct"
                          checked={addCorrectIndex === i}
                          onChange={() => setAddCorrectIndex(i)}
                          className="text-primary focus:ring-primary shrink-0"
                        />
                      )}
                      <span className="font-bold text-on-surface-variant text-sm w-5 shrink-0">{String.fromCharCode(65 + i)}.</span>
                      <input
                        type="text" value={opt}
                        onChange={e => {
                          const next = [...addOptions];
                          next[i] = e.target.value;
                          setAddOptions(next);
                        }}
                        placeholder={`Option ${String.fromCharCode(65 + i)}`}
                        className="flex-1 bg-transparent border-none outline-none text-on-surface text-sm"
                      />
                      {addQuestionType === 'MCQ' && addCorrectIndex === i && <span className="material-symbols-outlined text-primary text-sm shrink-0">check_circle</span>}
                    </div>
                    {showOptionImages && addQuestionType === 'MCQ' && (
                      <div className="ml-9 flex items-center gap-2">
                        {addOptionImagePreviews[i] && (
                          <div className="relative inline-block">
                            <img src={addOptionImagePreviews[i]!} alt={`Option ${String.fromCharCode(65 + i)}`} className="h-16 rounded border border-outline-variant object-contain bg-surface-container-low" />
                            <button
                              type="button"
                              onClick={() => {
                                const urls = [...addOptionImages]; urls[i] = null; setAddOptionImages(urls);
                                const prev = [...addOptionImagePreviews]; prev[i] = null; setAddOptionImagePreviews(prev);
                              }}
                              className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-error text-on-error rounded-full flex items-center justify-center hover:opacity-90"
                            >
                              <span className="material-symbols-outlined text-[12px]">close</span>
                            </button>
                          </div>
                        )}
                        <label className="inline-flex items-center gap-1 text-xs text-on-surface-variant border border-outline-variant rounded-lg px-2 py-1 cursor-pointer hover:bg-surface-container-low transition-colors font-metric-label">
                          <span className="material-symbols-outlined text-[13px]">image</span>
                          {addOptionImagePreviews[i] ? 'Replace' : 'Add image'}
                          <input
                            type="file"
                            accept="image/*"
                            className="sr-only"
                            onChange={async e => {
                              const file = e.target.files?.[0];
                              if (!file) return;
                              try {
                                const url = await uploadQuestionImage(file);
                                const urls = [...addOptionImages]; urls[i] = url; setAddOptionImages(urls);
                                const prev = [...addOptionImagePreviews]; prev[i] = URL.createObjectURL(file); setAddOptionImagePreviews(prev);
                              } catch (err: any) {
                                setAddError(err.message ?? 'Image upload failed');
                              } finally {
                                e.target.value = '';
                              }
                            }}
                          />
                        </label>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* SJT best/worst pickers */}
              {addQuestionType === 'SJT' && (
                <div className="mt-3 grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-metric-label text-xs text-on-surface-variant mb-1">Best response (expert key)</label>
                    <select
                      value={addSjtBestIndex ?? ''}
                      onChange={e => setAddSjtBestIndex(e.target.value === '' ? null : Number(e.target.value))}
                      className="w-full bg-surface-container-low border border-green-300 rounded-lg px-3 py-2 text-on-surface text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                    >
                      <option value="">— Select —</option>
                      {addOptions.map((_, i) => <option key={i} value={i}>{String.fromCharCode(65 + i)}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block font-metric-label text-xs text-on-surface-variant mb-1">Worst response (expert key)</label>
                    <select
                      value={addSjtWorstIndex ?? ''}
                      onChange={e => setAddSjtWorstIndex(e.target.value === '' ? null : Number(e.target.value))}
                      className="w-full bg-surface-container-low border border-red-300 rounded-lg px-3 py-2 text-on-surface text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                    >
                      <option value="">— Select —</option>
                      {addOptions.map((_, i) => <option key={i} value={i}>{String.fromCharCode(65 + i)}</option>)}
                    </select>
                  </div>
                </div>
              )}
            </div>
          )}

          {addError && <p className="text-error font-caption text-sm mb-3">{addError}</p>}

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={isPending || !addText.trim()}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-on-primary rounded-lg font-metric-label text-sm disabled:opacity-50 hover:opacity-90 transition-opacity"
            >
              <span className="material-symbols-outlined text-sm">add_circle</span>
              {isPending ? 'Adding…' : 'Add to Question Bank'}
            </button>
            <button
              type="button"
              onClick={() => { setTab('browse'); setAddError(''); }}
              className="inline-flex items-center gap-2 px-4 py-2.5 border border-outline-variant text-on-surface-variant rounded-lg font-metric-label text-sm hover:bg-surface-container transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* ===== AI GENERATE TAB ===== */}
      {tab === 'generate' && (
        <div>
          {/* Config */}
          <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-6 shadow-sm mb-6">
            <h2 className="font-headline-md text-on-surface text-lg font-bold mb-1">Generate with AI</h2>
            <p className="font-body-md text-on-surface-variant text-sm mb-5">Gemini will draft 5 questions for you to review before adding to the bank.</p>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block font-metric-label text-on-surface-variant text-sm mb-1.5">Domain</label>
                <select
                  value={genDomain}
                  onChange={e => changeDomain(e.target.value, setGenDomain, setGenSubType)}
                  className="w-full bg-surface-container-low border border-outline-variant rounded-lg px-3 py-2.5 text-on-surface text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  {DOMAINS.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
              <div>
                <label className="block font-metric-label text-on-surface-variant text-sm mb-1.5">Sub-type</label>
                <select
                  value={genSubType}
                  onChange={e => setGenSubType(e.target.value)}
                  className="w-full bg-surface-container-low border border-outline-variant rounded-lg px-3 py-2.5 text-on-surface text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  {(SUB_TYPES[genDomain] ?? []).map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-5">
              <div>
                <label className="block font-metric-label text-on-surface-variant text-sm mb-1.5">
                  Difficulty: <span className={`font-bold px-1.5 py-0.5 rounded text-xs border ${difficultyBadge(genDifficulty)}`}>{genDifficulty}/10 · {difficultyLabel(genDifficulty)}</span>
                </label>
                <input
                  type="range" min={1} max={10} value={genDifficulty}
                  onChange={e => setGenDifficulty(Number(e.target.value))}
                  className="w-full accent-primary mt-1"
                />
                <div className="flex justify-between text-xs text-on-surface-variant mt-0.5">
                  <span>Easy</span><span>Medium</span><span>Hard</span><span>Expert</span>
                </div>
              </div>
              <div>
                <label className="block font-metric-label text-on-surface-variant text-sm mb-1.5">
                  Time per Question: <span className="font-bold">{Math.floor(genTimeSec / 60)}m {genTimeSec % 60}s</span>
                </label>
                <input
                  type="range" min={15} max={300} step={15} value={genTimeSec}
                  onChange={e => setGenTimeSec(Number(e.target.value))}
                  className="w-full accent-primary mt-1"
                />
              </div>
            </div>

            <button
              onClick={handleGenerate}
              disabled={genLoading}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-on-primary rounded-lg font-metric-label text-sm hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              <span className={`material-symbols-outlined text-sm ${genLoading ? 'animate-spin' : ''}`}>
                {genLoading ? 'refresh' : 'auto_awesome'}
              </span>
              {genLoading ? 'Generating 5 questions…' : 'Generate 5 Questions'}
            </button>
            {genError && <p className="text-error font-caption text-sm mt-3">{genError}</p>}
          </div>

          {/* Drafts */}
          {drafts.length > 0 && (
            <div>
              <p className="font-metric-label text-on-surface-variant text-sm mb-3">
                {drafts.length} draft{drafts.length !== 1 ? 's' : ''} remaining — approve to save, reject to discard
              </p>
              <div className="flex flex-col gap-4">
                {drafts.map((draft, idx) => (
                  <div key={idx} className="bg-surface-container-lowest border border-outline-variant rounded-xl p-5 shadow-sm">
                    <div className="flex items-start gap-3 mb-3">
                      <span className="bg-primary/10 text-primary text-xs font-bold px-2 py-0.5 rounded-full shrink-0 mt-0.5">Draft {idx + 1}</span>
                      <p className="font-body-md text-on-surface text-sm leading-relaxed">{draft.text}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-2 mb-3">
                      {draft.options.map((opt, i) => (
                        <div
                          key={i}
                          className={`flex items-start gap-2 px-3 py-2 rounded-lg border text-sm ${
                            i === draft.correct_index
                              ? 'bg-green-50 border-green-300 text-green-800 font-semibold'
                              : 'bg-surface-container-low border-outline-variant text-on-surface-variant'
                          }`}
                        >
                          <span className="font-bold shrink-0">{String.fromCharCode(65 + i)}.</span>
                          <span className="flex-1">{opt}</span>
                          {i === draft.correct_index && <span className="material-symbols-outlined text-green-600 text-sm shrink-0">check_circle</span>}
                        </div>
                      ))}
                    </div>

                    {draft.explanation && (
                      <div className="bg-surface-container-low rounded-lg px-4 py-3 mb-3">
                        <p className="font-metric-label text-on-surface-variant text-xs uppercase mb-1">Explanation</p>
                        <p className="font-body-md text-on-surface-variant text-sm leading-relaxed">{draft.explanation}</p>
                      </div>
                    )}

                    <div className="flex gap-2">
                      <button
                        onClick={() => handleApproveDraft(idx)}
                        disabled={approvingIdx !== null}
                        className="inline-flex items-center gap-1.5 px-4 py-2 bg-primary text-on-primary rounded-lg font-metric-label text-sm hover:opacity-90 transition-opacity disabled:opacity-50"
                      >
                        <span className={`material-symbols-outlined text-sm ${approvingIdx === idx ? 'animate-spin' : ''}`}>
                          {approvingIdx === idx ? 'refresh' : 'check_circle'}
                        </span>
                        {approvingIdx === idx ? 'Saving…' : 'Approve & Save'}
                      </button>
                      <button
                        onClick={() => setDrafts(ds => ds.filter((_, i) => i !== idx))}
                        disabled={approvingIdx !== null}
                        className="inline-flex items-center gap-1.5 px-4 py-2 border border-error text-error rounded-lg font-metric-label text-sm hover:bg-error-container/20 transition-colors disabled:opacity-50"
                      >
                        <span className="material-symbols-outlined text-sm">close</span>
                        Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {!genLoading && drafts.length === 0 && (
            <div className="text-center py-16 text-on-surface-variant">
              <span className="material-symbols-outlined text-5xl mb-3 block opacity-30">auto_awesome</span>
              <p className="font-body-md">Configure options above and click Generate</p>
              <p className="font-caption mt-1 opacity-70">AI drafts questions; you review and approve each one</p>
            </div>
          )}
        </div>
      )}

      {/* ===== BULK UPLOAD TAB ===== */}
      {tab === 'bulk' && (
        <div>
          {/* PDF upload (AI extraction) */}
          <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-6 shadow-sm mb-5">
            <div className="flex items-start justify-between gap-4 mb-1">
              <div>
                <h2 className="font-headline-md text-on-surface text-lg font-bold">Extract Questions from a PDF</h2>
                <p className="font-body-md text-on-surface-variant text-sm mt-1">
                  Upload a PDF of practice questions. Gemini reads it and proposes question drafts — review and save in one click.
                </p>
              </div>
              <span className="px-2 py-1 rounded-full bg-tertiary-fixed text-on-tertiary-fixed text-[11px] font-metric-label uppercase">AI</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-4">
              <div>
                <label className="font-metric-label text-xs uppercase text-on-surface-variant block mb-1">Domain</label>
                <select
                  value={pdfDomain}
                  onChange={e => setPdfDomain(e.target.value)}
                  disabled={pdfLoading}
                  className="w-full px-3 py-2 rounded-lg border border-outline-variant bg-surface-container-lowest text-sm"
                >
                  {DOMAINS.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
              <div>
                <label className="font-metric-label text-xs uppercase text-on-surface-variant block mb-1">Default difficulty (1-10)</label>
                <input
                  type="number"
                  min={1}
                  max={10}
                  value={pdfDifficulty}
                  onChange={e => setPdfDifficulty(Math.max(1, Math.min(10, Number(e.target.value) || 5)))}
                  disabled={pdfLoading}
                  className="w-full px-3 py-2 rounded-lg border border-outline-variant bg-surface-container-lowest text-sm"
                />
                <p className="font-caption text-on-surface-variant text-[11px] mt-1">Used when a question doesn&apos;t advertise its own level.</p>
              </div>
              <div className="flex items-end">
                <label className={`w-full inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-metric-label text-sm transition-colors cursor-pointer ${pdfLoading ? 'bg-surface-container text-on-surface-variant' : 'bg-primary text-on-primary hover:opacity-90'}`}>
                  <span className={`material-symbols-outlined text-sm ${pdfLoading ? 'animate-spin' : ''}`}>
                    {pdfLoading ? 'refresh' : 'picture_as_pdf'}
                  </span>
                  {pdfLoading ? 'Extracting…' : 'Upload PDF'}
                  <input
                    type="file"
                    accept="application/pdf,.pdf"
                    className="hidden"
                    disabled={pdfLoading}
                    onChange={e => {
                      const f = e.target.files?.[0];
                      if (f) handlePdfPick(f);
                      e.target.value = '';
                    }}
                  />
                </label>
              </div>
            </div>

            {pdfFileName && (
              <p className="font-caption text-on-surface-variant text-xs mt-3 flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[14px]">attach_file</span>
                {pdfFileName}
              </p>
            )}
            {pdfError && (
              <p className="font-caption text-error text-xs mt-3 flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[14px]">error</span>
                {pdfError}
              </p>
            )}
            {pdfResult && (
              <div className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-lg px-4 py-2 mt-3">
                <span className="material-symbols-outlined text-green-600 text-sm">check_circle</span>
                <p className="font-body-md text-green-800 text-sm">{pdfResult.added} question{pdfResult.added !== 1 ? 's' : ''} added from the PDF.</p>
              </div>
            )}
          </div>

          {/* PDF drafts review */}
          {pdfDrafts.length > 0 && (
            <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-6 shadow-sm mb-5">
              <div className="flex items-center justify-between mb-3 flex-wrap gap-3">
                <h3 className="font-headline-md text-on-surface font-semibold">
                  {pdfDrafts.length} draft{pdfDrafts.length !== 1 ? 's' : ''} extracted — review &amp; save
                </h3>
                <button
                  onClick={handlePdfSaveAll}
                  disabled={pdfSaving}
                  className="inline-flex items-center gap-2 px-5 py-2 bg-primary text-on-primary rounded-lg font-metric-label text-sm hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                  <span className={`material-symbols-outlined text-sm ${pdfSaving ? 'animate-spin' : ''}`}>
                    {pdfSaving ? 'refresh' : 'save'}
                  </span>
                  {pdfSaving ? 'Saving…' : `Save all ${pdfDrafts.length}`}
                </button>
              </div>
              <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
                {pdfDrafts.map((d, i) => (
                  <div key={i} className="border border-outline-variant rounded-lg p-4 bg-surface-container-low">
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-metric-label bg-surface-container px-2 py-0.5 rounded">#{i + 1}</span>
                        <span className="text-xs font-metric-label bg-primary-fixed-dim text-on-primary-fixed px-2 py-0.5 rounded">L{d.difficulty ?? pdfDifficulty}</span>
                      </div>
                      <button onClick={() => discardPdfDraft(i)} className="text-on-surface-variant hover:text-error" title="Discard this draft">
                        <span className="material-symbols-outlined text-[18px]">close</span>
                      </button>
                    </div>
                    <p className="font-body-md text-on-surface mb-2">{d.text}</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                      {d.options.map((o, oi) => (
                        <div key={oi} className={`text-sm px-2 py-1 rounded border ${oi === d.correct_index ? 'border-secondary bg-secondary-fixed/40 text-on-secondary-fixed-variant font-semibold' : 'border-outline-variant text-on-surface'}`}>
                          <span className="font-metric-label mr-1.5">{String.fromCharCode(65 + oi)}.</span>{o}
                        </div>
                      ))}
                    </div>
                    {d.explanation && (
                      <p className="font-caption text-on-surface-variant mt-2">{d.explanation}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Instructions + template */}
          <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-6 shadow-sm mb-5">
            <h2 className="font-headline-md text-on-surface text-lg font-bold mb-1">Bulk Upload via CSV</h2>
            <p className="font-body-md text-on-surface-variant text-sm mb-4">
              Upload a CSV file with multiple questions at once. Download the template to see the required format.
            </p>

            <div className="bg-surface-container-low rounded-lg px-4 py-3 mb-4 text-sm font-mono text-on-surface-variant overflow-x-auto">
              <p className="font-metric-label text-xs uppercase text-on-surface-variant mb-1">Required columns</p>
              <p>domain · sub_type · difficulty · text · option_a · option_b · option_c · option_d · correct (A/B/C/D) · time_sec · explanation</p>
            </div>

            <div className="flex gap-3 items-center flex-wrap">
              <button
                onClick={downloadTemplate}
                className="inline-flex items-center gap-2 px-4 py-2 border border-outline-variant text-on-surface rounded-lg font-metric-label text-sm hover:bg-surface-container transition-colors"
              >
                <span className="material-symbols-outlined text-sm">download</span>
                CSV Template
              </button>

              <button
                onClick={downloadExcelTemplate}
                className="inline-flex items-center gap-2 px-4 py-2 border border-outline-variant text-on-surface rounded-lg font-metric-label text-sm hover:bg-surface-container transition-colors"
              >
                <span className="material-symbols-outlined text-sm">download</span>
                Excel Template
              </button>

              <label className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-on-primary rounded-lg font-metric-label text-sm hover:opacity-90 transition-opacity cursor-pointer">
                <span className="material-symbols-outlined text-sm">upload_file</span>
                Choose File
                <input
                  type="file"
                  accept=".csv,text/csv,.xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
                  className="hidden"
                  onChange={e => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    setBulkResult(null);
                    const isExcel = file.name.endsWith('.xlsx') || file.name.endsWith('.xls');
                    const reader = new FileReader();
                    if (isExcel) {
                      reader.onload = ev => {
                        setParsedRows(parseAndValidateExcel(ev.target?.result as ArrayBuffer));
                      };
                      reader.readAsArrayBuffer(file);
                    } else {
                      reader.onload = ev => {
                        const text = ev.target?.result as string;
                        setParsedRows(parseAndValidateCSV(text));
                      };
                      reader.readAsText(file);
                    }
                    e.target.value = '';
                  }}
                />
              </label>
            </div>
          </div>

          {/* Success / error banners */}
          {bulkResult && (
            <div className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-xl px-5 py-3 mb-5">
              <span className="material-symbols-outlined text-green-600">check_circle</span>
              <p className="font-body-md text-green-800 text-sm">{bulkResult.added} question{bulkResult.added !== 1 ? 's' : ''} added successfully.</p>
            </div>
          )}
          {bulkError && (
            <div className="flex items-center gap-3 bg-error-container text-on-error-container rounded-xl px-5 py-3 mb-5">
              <span className="material-symbols-outlined">error</span>
              <p className="font-body-md text-sm flex-1">{bulkError}</p>
              <button onClick={() => setBulkError('')} className="shrink-0 hover:opacity-70" aria-label="Dismiss">
                <span className="material-symbols-outlined text-sm">close</span>
              </button>
            </div>
          )}

          {/* Preview table */}
          {parsedRows.length > 0 && (() => {
            const validRows = parsedRows.filter(r => !r.error);
            const errorRows = parsedRows.filter(r => r.error);
            return (
              <div>
                <div className="flex items-center justify-between mb-3 flex-wrap gap-3">
                  <div className="flex items-center gap-3">
                    <span className="font-metric-label text-sm text-on-surface">{parsedRows.length} rows parsed</span>
                    {validRows.length > 0 && <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-green-100 text-green-800">{validRows.length} valid</span>}
                    {errorRows.length > 0 && <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-800">{errorRows.length} errors</span>}
                  </div>
                  {validRows.length > 0 && (
                    <button
                      onClick={handleBulkUpload}
                      disabled={bulkUploading}
                      className="inline-flex items-center gap-2 px-5 py-2 bg-primary text-on-primary rounded-lg font-metric-label text-sm hover:opacity-90 transition-opacity disabled:opacity-50"
                    >
                      <span className={`material-symbols-outlined text-sm ${bulkUploading ? 'animate-spin' : ''}`}>
                        {bulkUploading ? 'refresh' : 'upload'}
                      </span>
                      {bulkUploading ? 'Uploading…' : `Upload ${validRows.length} question${validRows.length !== 1 ? 's' : ''}`}
                    </button>
                  )}
                </div>

                <div className="bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden shadow-sm">
                  <div className="overflow-x-auto max-h-[60vh] overflow-y-auto">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-surface-container-low border-b border-outline-variant sticky top-0">
                        <tr>
                          {['#', 'Domain', 'Sub-type', 'Diff', 'Question', 'Options (A–D)', 'Correct', 'Status'].map(h => (
                            <th key={h} className="px-3 py-3 font-metric-label text-on-surface-variant text-xs uppercase whitespace-nowrap">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-outline-variant/50">
                        {parsedRows.map(row => (
                          <tr key={row.rowNum} className={row.error ? 'bg-red-50/40' : 'hover:bg-surface-container-low/30'}>
                            <td className="px-3 py-2.5 text-on-surface-variant">{row.rowNum}</td>
                            <td className="px-3 py-2.5">
                              {row.domain && (
                                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${DOMAIN_BADGE[row.domain] ?? 'bg-surface-container-high text-on-surface'}`}>
                                  {row.domain}
                                </span>
                              )}
                            </td>
                            <td className="px-3 py-2.5 text-on-surface-variant max-w-24 truncate">{row.sub_type ?? '—'}</td>
                            <td className="px-3 py-2.5">
                              {row.difficulty > 0 && (
                                <span className={`text-xs font-bold px-1.5 py-0.5 rounded border ${difficultyBadge(row.difficulty)}`}>{row.difficulty}</span>
                              )}
                            </td>
                            <td className="px-3 py-2.5 text-on-surface max-w-xs">
                              <div className="line-clamp-2">{row.text}</div>
                            </td>
                            <td className="px-3 py-2.5 text-on-surface-variant max-w-xs">
                              {row.options?.length > 0 ? (
                                <div className="text-xs space-y-0.5">
                                  {row.options.map((o, i) => (
                                    <div key={i} className={i === row.correct_index ? 'text-green-700 font-semibold' : ''}>
                                      {String.fromCharCode(65 + i)}. {o}
                                    </div>
                                  ))}
                                </div>
                              ) : '—'}
                            </td>
                            <td className="px-3 py-2.5 font-bold text-on-surface">
                              {row.options?.length > 0 ? String.fromCharCode(65 + row.correct_index) : '—'}
                            </td>
                            <td className="px-3 py-2.5 whitespace-nowrap">
                              {row.error ? (
                                <span className="inline-flex items-center gap-1 text-xs text-red-700 font-medium">
                                  <span className="material-symbols-outlined text-xs">error</span>
                                  {row.error}
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-xs text-green-700 font-medium">
                                  <span className="material-symbols-outlined text-xs">check_circle</span>
                                  Valid
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            );
          })()}

          {parsedRows.length === 0 && !bulkResult && (
            <div className="text-center py-16 text-on-surface-variant border-2 border-dashed border-outline-variant rounded-xl">
              <span className="material-symbols-outlined text-5xl mb-3 block opacity-30">upload_file</span>
              <p className="font-body-md">Choose a CSV file to preview and upload</p>
              <p className="font-caption mt-1 opacity-70">Download the template above to get started</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
