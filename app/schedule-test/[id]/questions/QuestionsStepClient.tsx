'use client';

import { useMemo, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import {
  addQuestion,
  bulkAddQuestions,
  extractQuestionsFromPdf,
  generateBatchQuestions,
} from '@/app/actions/admin';
import {
  attachManyToDraft,
  attachQuestionToDraft,
  detachQuestionFromDraft,
  discardDraft,
  finalizeTest,
  searchBankQuestions,
} from '@/app/actions/scheduling';

const DOMAINS = ['QUANTITATIVE', 'LOGICAL', 'VERBAL', 'SPATIAL'] as const;
type Domain = typeof DOMAINS[number];

const DOMAIN_LABEL: Record<Domain, string> = {
  QUANTITATIVE: 'Quantitative',
  LOGICAL: 'Logical',
  VERBAL: 'Verbal',
  SPATIAL: 'Spatial',
};

const SUB_TYPES: Record<Domain, string[]> = {
  QUANTITATIVE: ['Arithmetic', 'Algebra', 'Geometry', 'Data Interpretation', 'Number Series', 'Percentages', 'Ratios & Proportions'],
  LOGICAL: ['Series Completion', 'Analogies', 'Classification', 'Coding-Decoding', 'Blood Relations', 'Syllogisms', 'Direction Sense'],
  VERBAL: ['Reading Comprehension', 'Vocabulary', 'Grammar', 'Sentence Completion', 'Para Jumbles', 'Idioms & Phrases'],
  SPATIAL: ['Pattern Recognition', 'Mental Rotation', 'Figure Series', 'Matrices', 'Spatial Reasoning'],
};

const CORRECT_MAP: Record<string, number> = { A: 0, B: 1, C: 2, D: 3 };
const VALID_DOMAINS = DOMAINS as readonly string[];

const CSV_TEMPLATE = `domain,sub_type,difficulty,text,option_a,option_b,option_c,option_d,correct,time_sec,explanation
QUANTITATIVE,Arithmetic,3,What is 25% of 200?,25,50,75,100,B,60,25% of 200 = 50
`;

type Question = {
  id: string;
  domain: string;
  sub_type?: string | null;
  difficulty: number;
  text: string;
  options: string[];
  correct_index?: number | null;
};

type DraftDTO = {
  id: string;
  class_label: string;
  title: string;
  domain_quotas: Record<string, number>;
  question_ids: string[];
  questions: Question[];
};

type Tab = 'add' | 'generate' | 'pdf' | 'csv' | 'bank';

type DraftQuestion = {
  text: string;
  options: string[];
  correct_index: number;
  explanation?: string;
  difficulty?: number;
};

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

function parseAndValidateCSV(text: string): ParsedRow[] {
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
  if (lines.length < 2) return [];
  const headers = parseCSVLine(lines[0]).map(h => h.toLowerCase().replace(/\s+/g, '_'));
  return lines.slice(1).map((line, i) => {
    const rowNum = i + 2;
    const values = parseCSVLine(line);
    const row: Record<string, string> = {};
    headers.forEach((h, idx) => { row[h] = values[idx] ?? ''; });
    const domain = (row.domain ?? '').trim().toUpperCase();
    if (!VALID_DOMAINS.includes(domain)) return { rowNum, domain, difficulty: 0, text: '', options: [], correct_index: 0, time_suggestion_sec: 90, error: `Invalid domain "${row.domain}"` };
    const difficulty = parseInt(row.difficulty ?? '');
    if (isNaN(difficulty) || difficulty < 1 || difficulty > 10) return { rowNum, domain, difficulty: 0, text: '', options: [], correct_index: 0, time_suggestion_sec: 90, error: 'Difficulty must be 1–10' };
    const text2 = (row.text ?? '').trim();
    if (!text2) return { rowNum, domain, difficulty, text: '', options: [], correct_index: 0, time_suggestion_sec: 90, error: 'Question text is required' };
    const optA = (row.option_a ?? '').trim();
    const optB = (row.option_b ?? '').trim();
    if (!optA || !optB) return { rowNum, domain, difficulty, text: text2, options: [], correct_index: 0, time_suggestion_sec: 90, error: 'At least options A and B are required' };
    const correctKey = (row.correct ?? '').trim().toUpperCase();
    if (!['A', 'B', 'C', 'D'].includes(correctKey)) return { rowNum, domain, difficulty, text: text2, options: [], correct_index: 0, time_suggestion_sec: 90, error: 'Correct must be A, B, C, or D' };
    const options = [optA, optB, (row.option_c ?? '').trim(), (row.option_d ?? '').trim()].filter(Boolean);
    const correct_index = CORRECT_MAP[correctKey];
    if (correct_index >= options.length) return { rowNum, domain, difficulty, text: text2, options, correct_index: 0, time_suggestion_sec: 90, error: `Option ${correctKey} is empty` };
    return {
      rowNum, domain,
      sub_type: (row.sub_type ?? '').trim() || undefined,
      difficulty, text: text2, options, correct_index,
      time_suggestion_sec: parseInt(row.time_sec ?? '') || 90,
      explanation: (row.explanation ?? '').trim() || undefined,
    };
  });
}

export default function QuestionsStepClient({ draft }: { draft: DraftDTO }) {
  const router = useRouter();
  const [questions, setQuestions] = useState<Question[]>(draft.questions);
  const [tab, setTab] = useState<Tab>('add');
  const [flash, setFlash] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null);
  const [pending, startTransition] = useTransition();

  const quotas = draft.domain_quotas as Record<Domain, number>;
  const activeDomains = useMemo(
    () => DOMAINS.filter((d) => (quotas[d] ?? 0) > 0),
    [quotas],
  );

  const counts = useMemo(() => {
    const c: Record<string, number> = {};
    questions.forEach((q) => { c[q.domain] = (c[q.domain] ?? 0) + 1; });
    return c;
  }, [questions]);

  const remaining = (d: Domain) => Math.max(0, (quotas[d] ?? 0) - (counts[d] ?? 0));
  const totalTarget = activeDomains.reduce((s, d) => s + (quotas[d] ?? 0), 0);
  const totalAttached = questions.length;
  const isComplete = activeDomains.every((d) => remaining(d) === 0) && totalAttached === totalTarget;

  const underQuotaDomains = activeDomains.filter((d) => remaining(d) > 0);

  function showFlash(kind: 'ok' | 'err', text: string) {
    setFlash({ kind, text });
    if (kind === 'ok') setTimeout(() => setFlash((f) => (f && f.text === text ? null : f)), 2500);
  }

  async function refetchAttachedQuestions(ids: string[]) {
    // We don't have a server "load questions" endpoint other than getDraft;
    // simplest path is to just trust the inserted rows returned from
    // addQuestion / bulkAddQuestions and append them locally.
    return ids;
  }

  async function handleAttachOne(q: Question) {
    const res = await attachQuestionToDraft(draft.id, q.id);
    if ('error' in res && res.error) {
      showFlash('err', res.error);
      return false;
    }
    setQuestions((qs) => [...qs, q]);
    return true;
  }

  async function handleAttachMany(qs: Question[]) {
    if (qs.length === 0) return;
    const res = await attachManyToDraft(draft.id, qs.map((q) => q.id));
    if ('error' in res && res.error) {
      showFlash('err', res.error);
      return;
    }
    const attached = (res as { attached: number }).attached;
    // Filter to the first N that fit per-domain (mirrors server logic loosely);
    // for accuracy we re-fetch via getDraft would be ideal but server already
    // truncated — we add up to per-domain remaining greedy.
    const next: Question[] = [];
    const localCounts = { ...counts } as Record<string, number>;
    for (const q of qs) {
      const target = quotas[q.domain as Domain] ?? 0;
      if (target === 0) continue;
      if ((localCounts[q.domain] ?? 0) >= target) continue;
      localCounts[q.domain] = (localCounts[q.domain] ?? 0) + 1;
      next.push(q);
      if (next.length >= attached) break;
    }
    setQuestions((prev) => [...prev, ...next]);
    showFlash('ok', `${attached} question${attached !== 1 ? 's' : ''} added.`);
  }

  async function handleDetach(questionId: string) {
    const res = await detachQuestionFromDraft(draft.id, questionId);
    if ('error' in res && res.error) {
      showFlash('err', res.error);
      return;
    }
    setQuestions((qs) => qs.filter((q) => q.id !== questionId));
  }

  function handleFinalize() {
    startTransition(async () => {
      const res = await finalizeTest(draft.id);
      if ('error' in res && res.error) {
        showFlash('err', res.error);
        return;
      }
      router.push('/admin/assessments');
      router.refresh();
    });
  }

  function handleDiscard() {
    if (!confirm('Discard this draft? Attached questions will remain in the bank.')) return;
    startTransition(async () => {
      const res = await discardDraft(draft.id);
      if ('error' in res && res.error) {
        showFlash('err', res.error);
        return;
      }
      router.push('/schedule-test');
      router.refresh();
    });
  }

  // ─── Add Manual state ────────────────────────────────────────────────────
  const initialAddDomain = (underQuotaDomains[0] ?? activeDomains[0] ?? 'QUANTITATIVE') as Domain;
  const [addDomain, setAddDomain] = useState<Domain>(initialAddDomain);
  const [addSubType, setAddSubType] = useState(SUB_TYPES[initialAddDomain][0]);
  const [addDifficulty, setAddDifficulty] = useState(5);
  const [addText, setAddText] = useState('');
  const [addOptions, setAddOptions] = useState(['', '', '', '']);
  const [addCorrectIndex, setAddCorrectIndex] = useState(0);
  const [addError, setAddError] = useState('');

  function changeAddDomain(d: Domain) {
    setAddDomain(d);
    setAddSubType(SUB_TYPES[d][0]);
  }

  function handleAddSubmit(e: React.FormEvent) {
    e.preventDefault();
    setAddError('');
    if (remaining(addDomain) === 0) { setAddError(`${addDomain} quota is full.`); return; }
    const filled = addOptions.map((o) => o.trim()).filter(Boolean);
    if (filled.length < 2) { setAddError('Add at least 2 options.'); return; }
    const correctText = addOptions[addCorrectIndex]?.trim();
    if (!correctText) { setAddError('The selected correct option is empty.'); return; }
    const newCorrectIndex = filled.indexOf(correctText);

    startTransition(async () => {
      try {
        const q = await addQuestion({
          domain: addDomain,
          sub_type: addSubType,
          difficulty: addDifficulty,
          text: addText.trim(),
          options: filled,
          correct_index: newCorrectIndex,
          time_suggestion_sec: 90,
          source: 'manual',
        });
        const attached = await handleAttachOne(q as Question);
        if (attached) {
          setAddText('');
          setAddOptions(['', '', '', '']);
          setAddCorrectIndex(0);
          showFlash('ok', 'Question added.');
        }
      } catch (err: any) {
        setAddError(err?.message ?? 'Failed to add question');
      }
    });
  }

  // ─── Generate state ──────────────────────────────────────────────────────
  const [genDomain, setGenDomain] = useState<Domain>(initialAddDomain);
  const [genSubType, setGenSubType] = useState(SUB_TYPES[initialAddDomain][0]);
  const [genDifficulty, setGenDifficulty] = useState(5);
  const [genDrafts, setGenDrafts] = useState<DraftQuestion[]>([]);
  const [genLoading, setGenLoading] = useState(false);
  const [genError, setGenError] = useState('');
  const [approvingIdx, setApprovingIdx] = useState<number | null>(null);

  function changeGenDomain(d: Domain) {
    setGenDomain(d);
    setGenSubType(SUB_TYPES[d][0]);
  }

  async function handleGenerate() {
    setGenLoading(true);
    setGenError('');
    setGenDrafts([]);
    try {
      const result = await generateBatchQuestions(genDomain, genSubType, genDifficulty);
      setGenDrafts(result as DraftQuestion[]);
    } catch (err: any) {
      setGenError(err?.message ?? 'Failed to generate');
    } finally {
      setGenLoading(false);
    }
  }

  async function handleApproveGenDraft(idx: number) {
    if (remaining(genDomain) === 0) { setGenError(`${genDomain} quota is full.`); return; }
    setApprovingIdx(idx);
    const d = genDrafts[idx];
    try {
      const q = await addQuestion({
        domain: genDomain,
        sub_type: genSubType,
        difficulty: genDifficulty,
        text: d.text,
        options: d.options,
        correct_index: d.correct_index,
        explanation: d.explanation,
        time_suggestion_sec: 90,
        source: 'gemini',
      });
      const ok = await handleAttachOne(q as Question);
      if (ok) setGenDrafts((ds) => ds.filter((_, i) => i !== idx));
    } catch (err: any) {
      setGenError(err?.message ?? 'Failed to save');
    } finally {
      setApprovingIdx(null);
    }
  }

  // ─── PDF state ───────────────────────────────────────────────────────────
  const [pdfDomain, setPdfDomain] = useState<Domain>(initialAddDomain);
  const [pdfDifficulty, setPdfDifficulty] = useState(5);
  const [pdfDrafts, setPdfDrafts] = useState<DraftQuestion[]>([]);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [pdfSaving, setPdfSaving] = useState(false);
  const [pdfError, setPdfError] = useState('');
  const [pdfFileName, setPdfFileName] = useState('');
  const [pdfSelection, setPdfSelection] = useState<Set<number>>(new Set());

  async function handlePdfPick(file: File) {
    setPdfError(''); setPdfDrafts([]); setPdfSelection(new Set()); setPdfFileName(file.name); setPdfLoading(true);
    try {
      const buf = await file.arrayBuffer();
      let binary = '';
      const bytes = new Uint8Array(buf);
      for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
      const pdfBase64 = btoa(binary);
      const drafts = await extractQuestionsFromPdf({ pdfBase64, domain: pdfDomain, defaultDifficulty: pdfDifficulty });
      if (drafts.length === 0) setPdfError('No questions could be extracted.');
      setPdfDrafts(drafts as DraftQuestion[]);
      // Preselect up to remaining quota
      const cap = remaining(pdfDomain);
      const pre = new Set<number>();
      for (let i = 0; i < drafts.length && i < cap; i++) pre.add(i);
      setPdfSelection(pre);
    } catch (err: any) {
      setPdfError(err?.message ?? 'Failed to read PDF.');
    } finally {
      setPdfLoading(false);
    }
  }

  async function handlePdfSaveSelected() {
    const indices = Array.from(pdfSelection);
    if (indices.length === 0) return;
    const cap = remaining(pdfDomain);
    if (indices.length > cap) { setPdfError(`Only ${cap} more ${pdfDomain} question(s) fit your quota.`); return; }
    setPdfSaving(true);
    try {
      const rows = indices.map((i) => {
        const d = pdfDrafts[i];
        return {
          domain: pdfDomain,
          difficulty: d.difficulty ?? pdfDifficulty,
          text: d.text,
          options: d.options,
          correct_index: d.correct_index,
          explanation: d.explanation,
          time_suggestion_sec: 60,
        };
      });
      const added = await bulkAddQuestions(rows);
      await handleAttachMany(added as Question[]);
      setPdfDrafts([]);
      setPdfSelection(new Set());
      setPdfFileName('');
    } catch (err: any) {
      setPdfError(err?.message ?? 'Failed to save.');
    } finally {
      setPdfSaving(false);
    }
  }

  // ─── CSV state ───────────────────────────────────────────────────────────
  const [csvRows, setCsvRows] = useState<ParsedRow[]>([]);
  const [csvUploading, setCsvUploading] = useState(false);

  function downloadCsvTemplate() {
    const blob = new Blob([CSV_TEMPLATE], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'questions_template.csv';
    a.click();
    URL.revokeObjectURL(url);
  }

  async function handleCsvUpload() {
    const valid = csvRows.filter((r) => !r.error && activeDomains.includes(r.domain as Domain));
    if (valid.length === 0) return;
    setCsvUploading(true);
    try {
      const added = await bulkAddQuestions(valid);
      await handleAttachMany(added as Question[]);
      setCsvRows([]);
    } catch (err: any) {
      showFlash('err', err?.message ?? 'CSV upload failed');
    } finally {
      setCsvUploading(false);
    }
  }

  // ─── Bank state ──────────────────────────────────────────────────────────
  const [bankDomain, setBankDomain] = useState<Domain>(initialAddDomain);
  const [bankSearch, setBankSearch] = useState('');
  const [bankMinDiff, setBankMinDiff] = useState(1);
  const [bankMaxDiff, setBankMaxDiff] = useState(10);
  const [bankResults, setBankResults] = useState<Question[]>([]);
  const [bankLoading, setBankLoading] = useState(false);
  const [bankSelection, setBankSelection] = useState<Set<string>>(new Set());

  async function searchBank() {
    setBankLoading(true);
    try {
      const data = await searchBankQuestions({
        domain: bankDomain,
        difficultyMin: bankMinDiff,
        difficultyMax: bankMaxDiff,
        search: bankSearch || undefined,
        excludeIds: questions.filter((q) => q.domain === bankDomain).map((q) => q.id),
        limit: 50,
      });
      setBankResults(data as Question[]);
      setBankSelection(new Set());
    } catch (err: any) {
      showFlash('err', err?.message ?? 'Bank search failed');
    } finally {
      setBankLoading(false);
    }
  }

  async function handleBankAddSelected() {
    const cap = remaining(bankDomain);
    const picks = Array.from(bankSelection).slice(0, cap);
    if (picks.length === 0) return;
    const toAdd = bankResults.filter((q) => picks.includes(q.id));
    await handleAttachMany(toAdd);
    setBankResults((rs) => rs.filter((r) => !picks.includes(r.id)));
    setBankSelection(new Set());
  }

  const tabDefs: { id: Tab; label: string; icon: string }[] = [
    { id: 'add', label: 'Add manually', icon: 'edit_note' },
    { id: 'generate', label: 'Generate with AI', icon: 'auto_awesome' },
    { id: 'pdf', label: 'Upload PDF', icon: 'picture_as_pdf' },
    { id: 'csv', label: 'CSV import', icon: 'upload_file' },
    { id: 'bank', label: 'Pick from bank', icon: 'inventory_2' },
  ];

  return (
    <div>
      <div className="mb-6 flex items-start justify-between gap-4 flex-wrap">
        <div>
          <p className="font-metric-label text-on-surface-variant text-xs uppercase tracking-wider mb-1">Step 2 of 2</p>
          <h1 className="font-headline-md text-2xl text-on-surface">{draft.title}</h1>
          <p className="font-body-md text-on-surface-variant mt-1">
            {draft.class_label} · author {totalTarget} question{totalTarget !== 1 ? 's' : ''} matching the quotas below.
          </p>
        </div>
        <button
          onClick={handleDiscard}
          disabled={pending}
          className="text-error font-metric-label text-sm hover:underline flex items-center gap-1"
        >
          <span className="material-symbols-outlined text-sm">delete</span>
          Discard draft
        </button>
      </div>

      {flash && (
        <div className={`mb-4 px-4 py-3 rounded-lg ${flash.kind === 'ok' ? 'bg-secondary-fixed text-on-secondary-fixed' : 'bg-error-container text-on-error-container'}`}>
          {flash.text}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-6">

        {/* ─── Left: Quota tracker + selected list ────────────────────────── */}
        <aside className="space-y-4 lg:sticky lg:top-4 self-start">
          <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-4">
            <h3 className="font-headline-md text-on-surface text-base mb-3">Quotas</h3>
            <div className="space-y-3">
              {activeDomains.map((d) => {
                const target = quotas[d] ?? 0;
                const have = counts[d] ?? 0;
                const pct = target > 0 ? Math.min(100, Math.round((have / target) * 100)) : 0;
                const done = have >= target;
                return (
                  <div key={d}>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="font-metric-label text-on-surface">{DOMAIN_LABEL[d]}</span>
                      <span className={`font-metric-label ${done ? 'text-secondary' : 'text-on-surface-variant'}`}>
                        {have} / {target}{done && ' ✓'}
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-surface-container-high rounded-full overflow-hidden">
                      <div className={`h-full ${done ? 'bg-secondary' : 'bg-primary'}`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="mt-4 pt-3 border-t border-outline-variant flex items-center justify-between">
              <span className="font-metric-label text-on-surface">Total</span>
              <span className="font-headline-md text-on-surface">{totalAttached} / {totalTarget}</span>
            </div>
            <button
              onClick={handleFinalize}
              disabled={!isComplete || pending}
              className="mt-4 w-full px-4 py-2.5 rounded-lg bg-primary text-on-primary font-metric-label text-sm hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined text-sm">send</span>
              {pending ? 'Scheduling…' : 'Finalize & Schedule'}
            </button>
          </div>

          {questions.length > 0 && (
            <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-4">
              <h3 className="font-headline-md text-on-surface text-base mb-3">Selected ({questions.length})</h3>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {activeDomains.map((d) => {
                  const list = questions.filter((q) => q.domain === d);
                  if (list.length === 0) return null;
                  return (
                    <div key={d}>
                      <p className="font-metric-label text-on-surface-variant text-[10px] uppercase mb-1">{DOMAIN_LABEL[d]}</p>
                      {list.map((q) => (
                        <div key={q.id} className="flex items-start gap-2 px-2 py-1.5 hover:bg-surface-container rounded-lg group">
                          <p className="flex-1 font-body-md text-on-surface text-xs line-clamp-2">{q.text}</p>
                          <button
                            onClick={() => handleDetach(q.id)}
                            className="text-on-surface-variant hover:text-error opacity-0 group-hover:opacity-100 transition-opacity"
                            title="Remove from this test"
                          >
                            <span className="material-symbols-outlined text-sm">close</span>
                          </button>
                        </div>
                      ))}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </aside>

        {/* ─── Right: Authoring tabs ──────────────────────────────────────── */}
        <section>
          <div className="flex flex-wrap gap-1 mb-4 bg-surface-container-low p-1 rounded-xl w-fit">
            {tabDefs.map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg font-metric-label text-sm transition-all ${
                  tab === t.id ? 'bg-surface text-on-surface shadow-sm' : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                <span className="material-symbols-outlined text-sm">{t.icon}</span>
                {t.label}
              </button>
            ))}
          </div>

          {underQuotaDomains.length === 0 && (
            <div className="bg-secondary-fixed/30 border border-secondary text-on-secondary-fixed-variant rounded-xl p-4 mb-4 flex items-center gap-3">
              <span className="material-symbols-outlined">check_circle</span>
              <p className="font-body-md text-sm">All quotas filled — click <strong>Finalize &amp; Schedule</strong> to publish.</p>
            </div>
          )}

          {/* ─── Add Manual ───────────────────────────────────────────────── */}
          {tab === 'add' && (
            <form onSubmit={handleAddSubmit} className="bg-surface-container-lowest border border-outline-variant rounded-xl p-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-metric-label text-on-surface-variant text-xs uppercase mb-1.5">Domain</label>
                  <select
                    value={addDomain}
                    onChange={(e) => changeAddDomain(e.target.value as Domain)}
                    className="w-full px-3 py-2 rounded-lg border border-outline-variant bg-surface-container-lowest text-sm"
                  >
                    {activeDomains.map((d) => (
                      <option key={d} value={d} disabled={remaining(d) === 0}>
                        {DOMAIN_LABEL[d]} ({remaining(d)} left)
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-metric-label text-on-surface-variant text-xs uppercase mb-1.5">Sub-type</label>
                  <select
                    value={addSubType}
                    onChange={(e) => setAddSubType(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-outline-variant bg-surface-container-lowest text-sm"
                  >
                    {SUB_TYPES[addDomain].map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-metric-label text-on-surface-variant text-xs uppercase mb-1.5">
                  Difficulty: <span className="font-bold">{addDifficulty}/10</span>
                </label>
                <input
                  type="range" min={1} max={10} value={addDifficulty}
                  onChange={(e) => setAddDifficulty(Number(e.target.value))}
                  className="w-full accent-primary"
                />
              </div>

              <div>
                <label className="block font-metric-label text-on-surface-variant text-xs uppercase mb-1.5">Question text</label>
                <textarea
                  value={addText}
                  onChange={(e) => setAddText(e.target.value)}
                  required rows={3}
                  className="w-full px-3 py-2 rounded-lg border border-outline-variant bg-surface-container-lowest text-sm resize-none"
                  placeholder="Enter the question…"
                />
              </div>

              <div>
                <label className="block font-metric-label text-on-surface-variant text-xs uppercase mb-2">
                  Options <span className="font-normal">(select the correct answer)</span>
                </label>
                <div className="space-y-2">
                  {addOptions.map((opt, i) => (
                    <div key={i} className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${addCorrectIndex === i ? 'border-primary bg-primary/5' : 'border-outline-variant'}`}>
                      <input
                        type="radio" name="correct"
                        checked={addCorrectIndex === i}
                        onChange={() => setAddCorrectIndex(i)}
                        className="text-primary"
                      />
                      <span className="font-bold text-on-surface-variant text-sm w-5">{String.fromCharCode(65 + i)}.</span>
                      <input
                        type="text" value={opt}
                        onChange={(e) => { const next = [...addOptions]; next[i] = e.target.value; setAddOptions(next); }}
                        placeholder={`Option ${String.fromCharCode(65 + i)}`}
                        className="flex-1 bg-transparent border-none outline-none text-on-surface text-sm"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {addError && <p className="text-error font-caption text-sm">{addError}</p>}

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={pending || !addText.trim() || remaining(addDomain) === 0}
                  className="inline-flex items-center gap-2 px-5 py-2 rounded-lg bg-primary text-on-primary font-metric-label text-sm hover:bg-primary/90 disabled:opacity-50"
                >
                  <span className="material-symbols-outlined text-sm">add_circle</span>
                  Add to test
                </button>
              </div>
            </form>
          )}

          {/* ─── Generate ─────────────────────────────────────────────────── */}
          {tab === 'generate' && (
            <div className="space-y-4">
              <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-5 space-y-4">
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block font-metric-label text-on-surface-variant text-xs uppercase mb-1.5">Domain</label>
                    <select
                      value={genDomain}
                      onChange={(e) => changeGenDomain(e.target.value as Domain)}
                      className="w-full px-3 py-2 rounded-lg border border-outline-variant bg-surface-container-lowest text-sm"
                    >
                      {activeDomains.map((d) => (
                        <option key={d} value={d} disabled={remaining(d) === 0}>
                          {DOMAIN_LABEL[d]} ({remaining(d)} left)
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block font-metric-label text-on-surface-variant text-xs uppercase mb-1.5">Sub-type</label>
                    <select
                      value={genSubType}
                      onChange={(e) => setGenSubType(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-outline-variant bg-surface-container-lowest text-sm"
                    >
                      {SUB_TYPES[genDomain].map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block font-metric-label text-on-surface-variant text-xs uppercase mb-1.5">Difficulty: {genDifficulty}/10</label>
                    <input
                      type="range" min={1} max={10} value={genDifficulty}
                      onChange={(e) => setGenDifficulty(Number(e.target.value))}
                      className="w-full accent-primary"
                    />
                  </div>
                </div>
                <button
                  onClick={handleGenerate}
                  disabled={genLoading || remaining(genDomain) === 0}
                  className="inline-flex items-center gap-2 px-5 py-2 rounded-lg bg-primary text-on-primary font-metric-label text-sm hover:bg-primary/90 disabled:opacity-50"
                >
                  <span className={`material-symbols-outlined text-sm ${genLoading ? 'animate-spin' : ''}`}>
                    {genLoading ? 'refresh' : 'auto_awesome'}
                  </span>
                  {genLoading ? 'Generating…' : 'Generate 5 drafts'}
                </button>
                {genError && <p className="text-error font-caption text-sm">{genError}</p>}
              </div>

              {genDrafts.length > 0 && (
                <div className="space-y-3">
                  {genDrafts.map((d, idx) => (
                    <div key={idx} className="bg-surface-container-lowest border border-outline-variant rounded-xl p-4">
                      <p className="font-body-md text-on-surface mb-2">{d.text}</p>
                      <div className="grid grid-cols-2 gap-2 mb-3">
                        {d.options.map((o, i) => (
                          <div key={i} className={`text-sm px-2 py-1 rounded border ${i === d.correct_index ? 'border-secondary bg-secondary-fixed/40 text-on-secondary-fixed-variant font-semibold' : 'border-outline-variant text-on-surface'}`}>
                            <span className="font-bold mr-1.5">{String.fromCharCode(65 + i)}.</span>{o}
                          </div>
                        ))}
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleApproveGenDraft(idx)}
                          disabled={approvingIdx !== null || remaining(genDomain) === 0}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-on-primary font-metric-label text-sm hover:bg-primary/90 disabled:opacity-50"
                        >
                          <span className={`material-symbols-outlined text-sm ${approvingIdx === idx ? 'animate-spin' : ''}`}>
                            {approvingIdx === idx ? 'refresh' : 'check_circle'}
                          </span>
                          Approve &amp; add
                        </button>
                        <button
                          onClick={() => setGenDrafts((ds) => ds.filter((_, i) => i !== idx))}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-outline-variant text-on-surface-variant font-metric-label text-sm hover:bg-surface-container"
                        >
                          Reject
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ─── PDF ─────────────────────────────────────────────────────── */}
          {tab === 'pdf' && (
            <div className="space-y-4">
              <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-5 space-y-3">
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block font-metric-label text-on-surface-variant text-xs uppercase mb-1.5">Domain</label>
                    <select
                      value={pdfDomain}
                      onChange={(e) => setPdfDomain(e.target.value as Domain)}
                      disabled={pdfLoading}
                      className="w-full px-3 py-2 rounded-lg border border-outline-variant bg-surface-container-lowest text-sm"
                    >
                      {activeDomains.map((d) => (
                        <option key={d} value={d} disabled={remaining(d) === 0}>
                          {DOMAIN_LABEL[d]} ({remaining(d)} left)
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block font-metric-label text-on-surface-variant text-xs uppercase mb-1.5">Default difficulty</label>
                    <input
                      type="number" min={1} max={10}
                      value={pdfDifficulty}
                      onChange={(e) => setPdfDifficulty(Math.max(1, Math.min(10, Number(e.target.value) || 5)))}
                      disabled={pdfLoading}
                      className="w-full px-3 py-2 rounded-lg border border-outline-variant bg-surface-container-lowest text-sm"
                    />
                  </div>
                  <div className="flex items-end">
                    <label className={`w-full inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-metric-label text-sm cursor-pointer ${pdfLoading ? 'bg-surface-container text-on-surface-variant' : 'bg-primary text-on-primary hover:bg-primary/90'}`}>
                      <span className={`material-symbols-outlined text-sm ${pdfLoading ? 'animate-spin' : ''}`}>
                        {pdfLoading ? 'refresh' : 'picture_as_pdf'}
                      </span>
                      {pdfLoading ? 'Extracting…' : 'Upload PDF'}
                      <input
                        type="file" accept="application/pdf,.pdf"
                        className="hidden" disabled={pdfLoading}
                        onChange={(e) => { const f = e.target.files?.[0]; if (f) handlePdfPick(f); e.target.value = ''; }}
                      />
                    </label>
                  </div>
                </div>
                {pdfFileName && <p className="font-caption text-on-surface-variant text-xs">{pdfFileName}</p>}
                {pdfError && <p className="text-error font-caption text-sm">{pdfError}</p>}
              </div>

              {pdfDrafts.length > 0 && (
                <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-5">
                  <div className="flex items-center justify-between mb-3 flex-wrap gap-3">
                    <p className="font-metric-label text-on-surface">
                      {pdfDrafts.length} draft{pdfDrafts.length !== 1 ? 's' : ''} extracted — {pdfSelection.size} selected (cap {remaining(pdfDomain)})
                    </p>
                    <button
                      onClick={handlePdfSaveSelected}
                      disabled={pdfSaving || pdfSelection.size === 0}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-on-primary font-metric-label text-sm hover:bg-primary/90 disabled:opacity-50"
                    >
                      <span className={`material-symbols-outlined text-sm ${pdfSaving ? 'animate-spin' : ''}`}>
                        {pdfSaving ? 'refresh' : 'save'}
                      </span>
                      Save selected
                    </button>
                  </div>
                  <div className="space-y-2 max-h-[60vh] overflow-y-auto">
                    {pdfDrafts.map((d, i) => {
                      const checked = pdfSelection.has(i);
                      return (
                        <label key={i} className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer ${checked ? 'border-primary bg-primary/5' : 'border-outline-variant'}`}>
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => setPdfSelection((s) => { const ns = new Set(s); if (ns.has(i)) ns.delete(i); else ns.add(i); return ns; })}
                          />
                          <div className="flex-1 min-w-0">
                            <p className="font-body-md text-on-surface text-sm mb-1">{d.text}</p>
                            <div className="grid grid-cols-2 gap-1 text-xs">
                              {d.options.map((o, oi) => (
                                <span key={oi} className={`px-1.5 py-0.5 rounded ${oi === d.correct_index ? 'bg-secondary-fixed/40 font-semibold' : ''}`}>
                                  {String.fromCharCode(65 + oi)}. {o}
                                </span>
                              ))}
                            </div>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ─── CSV ─────────────────────────────────────────────────────── */}
          {tab === 'csv' && (
            <div className="space-y-4">
              <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-5">
                <p className="font-body-md text-on-surface-variant text-sm mb-3">
                  Upload a CSV with columns: <code className="px-1 py-0.5 rounded bg-surface-container text-xs">domain, sub_type, difficulty, text, option_a–d, correct (A/B/C/D), time_sec, explanation</code>.
                  Rows outside an active domain or over a quota are skipped on save.
                </p>
                <div className="flex flex-wrap gap-3 items-center">
                  <button
                    onClick={downloadCsvTemplate}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-outline-variant text-on-surface font-metric-label text-sm hover:bg-surface-container"
                  >
                    <span className="material-symbols-outlined text-sm">download</span>
                    Template
                  </button>
                  <label className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-on-primary font-metric-label text-sm hover:bg-primary/90 cursor-pointer">
                    <span className="material-symbols-outlined text-sm">upload_file</span>
                    Choose CSV
                    <input
                      type="file" accept=".csv,text/csv" className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0]; if (!file) return;
                        const reader = new FileReader();
                        reader.onload = (ev) => { setCsvRows(parseAndValidateCSV(ev.target?.result as string)); };
                        reader.readAsText(file);
                        e.target.value = '';
                      }}
                    />
                  </label>
                </div>
              </div>

              {csvRows.length > 0 && (() => {
                const valid = csvRows.filter((r) => !r.error && activeDomains.includes(r.domain as Domain));
                const errors = csvRows.filter((r) => r.error || !activeDomains.includes(r.domain as Domain));
                return (
                  <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-4">
                    <div className="flex items-center justify-between mb-3 flex-wrap gap-3">
                      <p className="font-metric-label text-on-surface">
                        {csvRows.length} parsed — {valid.length} valid, {errors.length} skipped
                      </p>
                      <button
                        onClick={handleCsvUpload}
                        disabled={csvUploading || valid.length === 0}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-on-primary font-metric-label text-sm hover:bg-primary/90 disabled:opacity-50"
                      >
                        <span className={`material-symbols-outlined text-sm ${csvUploading ? 'animate-spin' : ''}`}>
                          {csvUploading ? 'refresh' : 'upload'}
                        </span>
                        Add {valid.length} valid row{valid.length !== 1 ? 's' : ''}
                      </button>
                    </div>
                    <div className="max-h-96 overflow-y-auto space-y-1 text-sm">
                      {csvRows.map((r) => (
                        <div key={r.rowNum} className={`flex items-start gap-3 px-3 py-1.5 rounded ${r.error ? 'bg-error-container/30' : ''}`}>
                          <span className="font-mono text-xs text-on-surface-variant w-8">{r.rowNum}</span>
                          <span className="font-metric-label text-xs">{r.domain}</span>
                          <span className="flex-1 truncate">{r.text}</span>
                          {r.error && <span className="text-error text-xs">{r.error}</span>}
                          {!r.error && !activeDomains.includes(r.domain as Domain) && (
                            <span className="text-on-surface-variant text-xs">no quota</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()}
            </div>
          )}

          {/* ─── Bank ────────────────────────────────────────────────────── */}
          {tab === 'bank' && (
            <div className="space-y-4">
              <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-5">
                <div className="grid grid-cols-4 gap-3 mb-3">
                  <div>
                    <label className="block font-metric-label text-on-surface-variant text-xs uppercase mb-1.5">Domain</label>
                    <select
                      value={bankDomain}
                      onChange={(e) => setBankDomain(e.target.value as Domain)}
                      className="w-full px-3 py-2 rounded-lg border border-outline-variant bg-surface-container-lowest text-sm"
                    >
                      {activeDomains.map((d) => (
                        <option key={d} value={d} disabled={remaining(d) === 0}>
                          {DOMAIN_LABEL[d]} ({remaining(d)} left)
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block font-metric-label text-on-surface-variant text-xs uppercase mb-1.5">Diff min</label>
                    <input type="number" min={1} max={10} value={bankMinDiff} onChange={(e) => setBankMinDiff(Number(e.target.value) || 1)} className="w-full px-3 py-2 rounded-lg border border-outline-variant bg-surface-container-lowest text-sm" />
                  </div>
                  <div>
                    <label className="block font-metric-label text-on-surface-variant text-xs uppercase mb-1.5">Diff max</label>
                    <input type="number" min={1} max={10} value={bankMaxDiff} onChange={(e) => setBankMaxDiff(Number(e.target.value) || 10)} className="w-full px-3 py-2 rounded-lg border border-outline-variant bg-surface-container-lowest text-sm" />
                  </div>
                  <div>
                    <label className="block font-metric-label text-on-surface-variant text-xs uppercase mb-1.5">Search text</label>
                    <input type="text" value={bankSearch} onChange={(e) => setBankSearch(e.target.value)} placeholder="optional" className="w-full px-3 py-2 rounded-lg border border-outline-variant bg-surface-container-lowest text-sm" />
                  </div>
                </div>
                <div className="flex justify-between items-center gap-3">
                  <button
                    onClick={searchBank}
                    disabled={bankLoading}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-on-primary font-metric-label text-sm hover:bg-primary/90 disabled:opacity-50"
                  >
                    <span className={`material-symbols-outlined text-sm ${bankLoading ? 'animate-spin' : ''}`}>{bankLoading ? 'refresh' : 'search'}</span>
                    Search bank
                  </button>
                  <button
                    onClick={handleBankAddSelected}
                    disabled={bankSelection.size === 0 || remaining(bankDomain) === 0}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-on-primary font-metric-label text-sm hover:bg-primary/90 disabled:opacity-50"
                  >
                    <span className="material-symbols-outlined text-sm">add</span>
                    Add {Math.min(bankSelection.size, remaining(bankDomain))} selected
                  </button>
                </div>
              </div>

              {bankResults.length > 0 && (
                <div className="bg-surface-container-lowest border border-outline-variant rounded-xl divide-y divide-outline-variant max-h-[60vh] overflow-y-auto">
                  {bankResults.map((q) => {
                    const checked = bankSelection.has(q.id);
                    return (
                      <label key={q.id} className={`flex items-start gap-3 p-3 cursor-pointer ${checked ? 'bg-primary/5' : ''}`}>
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => setBankSelection((s) => { const ns = new Set(s); if (ns.has(q.id)) ns.delete(q.id); else ns.add(q.id); return ns; })}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-surface-container text-on-surface-variant">L{q.difficulty}</span>
                            {q.sub_type && <span className="text-[10px] text-on-surface-variant">{q.sub_type}</span>}
                          </div>
                          <p className="text-sm text-on-surface line-clamp-2">{q.text}</p>
                        </div>
                      </label>
                    );
                  })}
                </div>
              )}
              {!bankLoading && bankResults.length === 0 && (
                <p className="text-on-surface-variant text-sm text-center py-8">
                  No results yet. Pick a domain and click Search.
                </p>
              )}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
