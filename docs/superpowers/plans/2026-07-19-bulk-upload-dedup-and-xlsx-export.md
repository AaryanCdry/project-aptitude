# Bulk Upload Duplicate Detection & Excel Export Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Block duplicate-email bulk enrollments (client + server), and add `.xlsx` export to the exam analytics table and `.xlsx` upload support to the mentor question-bank bulk uploader.

**Architecture:** Four independent, additive changes to existing client components and one server action — no new files, no new dependencies (`xlsx` is already installed). Each task modifies exactly one file and is independently testable.

**Tech Stack:** Next.js App Router, React client components, Supabase (server actions + admin client), `xlsx` (SheetJS) for spreadsheet generation/parsing.

## Global Constraints

- Match rule for duplicate detection is **email only**, case-insensitive, trimmed (per spec `docs/superpowers/specs/2026-07-19-bulk-upload-dedup-and-xlsx-export-design.md`).
- No new npm dependencies — `xlsx@^0.18.5` is already in `package.json`.
- **No automated test runner exists in this repo** (no `jest`/`vitest`/`@testing-library` in `package.json`, no `*.test.*` files, no `test` script). Verification steps in this plan use `npm run build` (type-checks + compiles) and manual browser checks via `npm run dev`, consistent with how the rest of this codebase is verified. Do not introduce a test framework as part of this work — out of scope.
- Follow existing code style in each file (Tailwind utility classes, Material Symbols icons, existing naming conventions) rather than introducing new patterns.

---

### Task 1: Server-side duplicate detection in `processBulkEnrollment`

**Files:**
- Modify: `app/actions/enrollment.ts:203-315` (the `processBulkEnrollment` function)

**Interfaces:**
- Consumes: existing `BulkRow`/`BulkResult` types (`app/actions/enrollment.ts:186-201`) — unchanged.
- Produces: `processBulkEnrollment(rows: BulkRow[]): Promise<BulkResult[]>` — signature unchanged; behavior now short-circuits duplicate/pre-existing emails before attempting `createUser`.

- [ ] **Step 1: Read the current function to confirm line numbers still match**

Run: view `app/actions/enrollment.ts` lines 203-315. Confirm the `for (const row of rows)` loop starts around line 252, directly after the class-name-map block (ends ~line 250).

- [ ] **Step 2: Insert duplicate-detection logic before the per-row loop**

In `app/actions/enrollment.ts`, immediately after the class-name-map block (after the closing `}` that ends at line 250, before `for (const row of rows) {` at line 252), insert:

```typescript
  // ─── Duplicate detection (defense in depth — client also blocks these) ────
  const emailCounts = new Map<string, number>();
  for (const r of rows) {
    const key = r.email?.trim().toLowerCase();
    if (!key) continue;
    emailCounts.set(key, (emailCounts.get(key) ?? 0) + 1);
  }

  const existingEmails = new Set<string>();
  if (collegeId) {
    const { data: existingRows } = await adminClient
      .from('users')
      .select('email')
      .eq('college_id', collegeId);
    (existingRows ?? []).forEach((u: any) => {
      if (u.email) existingEmails.add(String(u.email).trim().toLowerCase());
    });
  }
```

- [ ] **Step 3: Reject duplicate/pre-existing rows at the top of the loop body**

In the same file, change the start of the `for (const row of rows) {` loop body from:

```typescript
  for (const row of rows) {
    if (!row.name || !row.email || !row.email.includes('@')) {
      results.push({ ...row, status: 'error', message: 'Invalid email or name' });
      continue;
    }
```

to:

```typescript
  for (const row of rows) {
    const emailKey = row.email?.trim().toLowerCase();

    if (emailKey && (emailCounts.get(emailKey) ?? 0) > 1) {
      results.push({ ...row, status: 'error', message: 'Duplicate email within this upload' });
      continue;
    }

    if (emailKey && existingEmails.has(emailKey)) {
      results.push({ ...row, status: 'error', message: 'Email already enrolled' });
      continue;
    }

    if (!row.name || !row.email || !row.email.includes('@')) {
      results.push({ ...row, status: 'error', message: 'Invalid email or name' });
      continue;
    }
```

- [ ] **Step 4: Type-check the change**

Run: `npm run build`
Expected: build succeeds with no new TypeScript errors in `app/actions/enrollment.ts`.

- [ ] **Step 5: Manual verification**

Run: `npm run dev`, sign in as an admin, go to `/admin/enrollment/bulk`.
1. Upload a CSV with two rows sharing the same email (different case, e.g. `Jane@x.edu` and `jane@x.edu`) and click Process (Task 2 will add a client-side block for this — for this task, verify via a direct check that both rows come back `status: 'error'` with `message: 'Duplicate email within this upload'` by temporarily observing the `results` in the Credential Preview table, since the client gate isn't wired yet).
2. Upload a CSV with an email that belongs to an already-enrolled student in this college; confirm that row returns `status: 'error'`, `message: 'Email already enrolled'`.
3. Upload a CSV with all-new, all-unique emails; confirm rows still process normally (`status: 'valid'`, accounts created).

- [ ] **Step 6: Commit**

```bash
git add app/actions/enrollment.ts
git commit -m "fix: reject duplicate and already-enrolled emails in bulk enrollment"
```

---

### Task 2: Client-side duplicate warning + Process gate in `BulkUploadClient`

**Files:**
- Modify: `app/(dashboard)/admin/enrollment/bulk/BulkUploadClient.tsx`

**Interfaces:**
- Consumes: `rows: BulkRow[]` state already in this component (`useState<BulkRow[]>([])`, line 53).
- Produces: no new exports — purely internal UI behavior (duplicate banner, disabled Process button while duplicates exist).

- [ ] **Step 1: Add `useMemo` import**

In `app/(dashboard)/admin/enrollment/bulk/BulkUploadClient.tsx`, change line 3 from:

```typescript
import React, { useState, useRef, useTransition, useCallback } from 'react';
```

to:

```typescript
import React, { useState, useRef, useTransition, useCallback, useMemo } from 'react';
```

- [ ] **Step 2: Compute duplicate email set**

Immediately after the `fileRef` declaration (`const fileRef = useRef<HTMLInputElement>(null);`, line 58), insert:

```typescript
  const duplicateEmails = useMemo(() => {
    const counts = new Map<string, number>();
    for (const r of rows) {
      const key = r.email?.trim().toLowerCase();
      if (!key) continue;
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
    return new Set([...counts.entries()].filter(([, c]) => c > 1).map(([k]) => k));
  }, [rows]);

  const hasDuplicates = duplicateEmails.size > 0;
```

- [ ] **Step 3: Gate the Process button on `hasDuplicates`**

Change the Process button (lines 243-251) from:

```typescript
              <button
                onClick={handleProcess}
                disabled={!rows.length || isPending}
                className="w-full bg-primary text-on-primary font-metric-label py-3 px-4 rounded-lg hover:bg-on-primary-fixed-variant transition-colors flex justify-center items-center gap-2 disabled:opacity-60"
              >
                <span className="material-symbols-outlined text-sm">{isPending ? 'hourglass_empty' : 'play_arrow'}</span>
                {isPending ? 'Processing…' : `Process ${rows.length ? `(${rows.length} rows)` : 'Upload'}`}
              </button>
```

to:

```typescript
              <button
                onClick={handleProcess}
                disabled={!rows.length || isPending || hasDuplicates}
                className="w-full bg-primary text-on-primary font-metric-label py-3 px-4 rounded-lg hover:bg-on-primary-fixed-variant transition-colors flex justify-center items-center gap-2 disabled:opacity-60"
              >
                <span className="material-symbols-outlined text-sm">{isPending ? 'hourglass_empty' : hasDuplicates ? 'error' : 'play_arrow'}</span>
                {isPending ? 'Processing…' : hasDuplicates ? 'Resolve duplicates to continue' : `Process ${rows.length ? `(${rows.length} rows)` : 'Upload'}`}
              </button>
```

- [ ] **Step 4: Add the duplicate warning banner**

In the "Right: Status + Preview" column, immediately before the "Credential Preview / Error Table" div (before the line `{/* Credential Preview / Error Table */}` at line 290), insert:

```typescript
          {/* Duplicate warning banner */}
          {!results && hasDuplicates && (
            <div className="bg-error-container/40 border border-error/30 rounded-xl p-4 flex items-start gap-3">
              <span className="material-symbols-outlined text-error mt-0.5">warning</span>
              <div>
                <p className="font-metric-label text-on-error-container mb-1">
                  {duplicateEmails.size} duplicate email{duplicateEmails.size !== 1 ? 's' : ''} found
                </p>
                <p className="font-caption text-on-error-container break-all">
                  {[...duplicateEmails].join(', ')}
                </p>
                <p className="font-caption text-on-error-container mt-1">
                  Remove or fix the duplicate rows in your file and re-upload before processing.
                </p>
              </div>
            </div>
          )}

```

- [ ] **Step 5: Highlight duplicate rows in the parsed-rows preview table**

Change the preview-rows mapping (lines 337-347) from:

```typescript
                  )) : rows.slice(0, 5).map((r, i) => (
                    <tr key={i} className="hover:bg-surface-container-lowest transition-colors">
                      <td className="py-3 px-4">{r.name || <span className="text-outline italic">empty</span>}</td>
                      <td className="py-3 px-4 text-on-surface-variant">{r.email || <span className="text-error italic">missing</span>}</td>
                      <td className="py-3 px-4 text-sm text-on-surface-variant">{r.registration_id || <span className="text-outline">—</span>}</td>
                      <td className="py-3 px-4 text-sm text-on-surface-variant">{r.department || <span className="text-outline">—</span>}</td>
                      <td className="py-3 px-4 text-sm text-on-surface-variant">{r.class || <span className="text-outline">—</span>}</td>
                      <td className="py-3 px-4 text-sm text-on-surface-variant">{r.section || <span className="text-outline">—</span>}</td>
                      <td className="py-3 px-4 text-sm text-on-surface-variant">{r.semester || <span className="text-outline">—</span>}</td>
                    </tr>
                  ))}
```

to:

```typescript
                  )) : rows.slice(0, 5).map((r, i) => {
                    const isDup = !!r.email && duplicateEmails.has(r.email.trim().toLowerCase());
                    return (
                      <tr key={i} className={`hover:bg-surface-container-lowest transition-colors ${isDup ? 'bg-error-container/10' : ''}`}>
                        <td className="py-3 px-4">{r.name || <span className="text-outline italic">empty</span>}</td>
                        <td className="py-3 px-4 text-on-surface-variant">
                          {r.email || <span className="text-error italic">missing</span>}
                          {isDup && <span className="ml-2 inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-error-container text-error">Duplicate</span>}
                        </td>
                        <td className="py-3 px-4 text-sm text-on-surface-variant">{r.registration_id || <span className="text-outline">—</span>}</td>
                        <td className="py-3 px-4 text-sm text-on-surface-variant">{r.department || <span className="text-outline">—</span>}</td>
                        <td className="py-3 px-4 text-sm text-on-surface-variant">{r.class || <span className="text-outline">—</span>}</td>
                        <td className="py-3 px-4 text-sm text-on-surface-variant">{r.section || <span className="text-outline">—</span>}</td>
                        <td className="py-3 px-4 text-sm text-on-surface-variant">{r.semester || <span className="text-outline">—</span>}</td>
                      </tr>
                    );
                  })}
```

- [ ] **Step 6: Type-check the change**

Run: `npm run build`
Expected: build succeeds with no new TypeScript errors in `BulkUploadClient.tsx`.

- [ ] **Step 7: Manual verification**

Run: `npm run dev`, go to `/admin/enrollment/bulk`.
1. Upload a CSV containing two rows with the same email (any case). Confirm: a red warning banner appears listing the duplicate email; the affected preview row(s) are highlighted with a "Duplicate" tag; the Process button is disabled and reads "Resolve duplicates to continue".
2. Upload a CSV with no duplicate emails. Confirm: no banner, no highlighting, Process button enabled and behaves as before.
3. With Task 1 already committed, confirm processing a duplicate-free file still creates accounts successfully end-to-end.

- [ ] **Step 8: Commit**

```bash
git add "app/(dashboard)/admin/enrollment/bulk/BulkUploadClient.tsx"
git commit -m "feat: block bulk enrollment upload when duplicate emails are present"
```

---

### Task 3: Excel export for `ExamAnalyticsTable`

**Files:**
- Modify: `app/(dashboard)/admin/reports/ExamAnalyticsTable.tsx`

**Interfaces:**
- Consumes: existing `groups: StudentGroup[]` computed in this component (line 84) — same data `exportCsv()` already uses.
- Produces: no new exports — adds a sibling `exportXlsx()` function and a second export button, both purely internal to this component.

- [ ] **Step 1: Add the `exportXlsx` function**

In `app/(dashboard)/admin/reports/ExamAnalyticsTable.tsx`, immediately after the closing `}` of `exportCsv()` (line 147), insert:

```typescript
  async function exportXlsx() {
    const XLSX = await import('xlsx');
    const headers = ['Student', 'Email', 'Class', 'Assessment', 'Type', 'Date', 'Q%', 'L%', 'V%', 'S%', 'Overall%', 'Percentile', 'Certificate', 'Badge'];
    const allFiltered = groups.flatMap(g => g.rows);
    const aoa = [headers, ...allFiltered.map(r => [
      r.studentName, r.studentEmail, r.className ?? '', r.assessmentTitle ?? '',
      r.type,
      r.completedAt ? new Date(r.completedAt).toLocaleDateString() : '',
      r.domainScores.QUANTITATIVE, r.domainScores.LOGICAL,
      r.domainScores.VERBAL, r.domainScores.SPATIAL,
      r.overallScore, r.avgPercentile,
      r.certTier ?? '', r.badgeTier ?? '',
    ])];
    const ws = XLSX.utils.aoa_to_sheet(aoa);
    ws['!cols'] = headers.map(() => ({ wch: 16 }));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Exam Analytics');
    const buf = XLSX.write(wb, { type: 'array', bookType: 'xlsx' }) as Uint8Array;
    const blob = new Blob([buf.buffer as ArrayBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const a = Object.assign(document.createElement('a'), {
      href: URL.createObjectURL(blob),
      download: `exam_analytics_${new Date().toISOString().slice(0, 10)}.xlsx`,
    });
    a.click();
    URL.revokeObjectURL(a.href);
  }
```

- [ ] **Step 2: Add a second export button next to "Export CSV"**

Change the export button (lines 222-229) from:

```typescript
          <button
            onClick={exportCsv}
            disabled={groups.length === 0}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-outline-variant text-on-surface font-metric-label text-sm hover:bg-surface-container disabled:opacity-50"
          >
            <span className="material-symbols-outlined text-sm">download</span>
            Export CSV
          </button>
        </div>
```

to:

```typescript
          <button
            onClick={exportCsv}
            disabled={groups.length === 0}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-outline-variant text-on-surface font-metric-label text-sm hover:bg-surface-container disabled:opacity-50"
          >
            <span className="material-symbols-outlined text-sm">download</span>
            CSV
          </button>
          <button
            onClick={exportXlsx}
            disabled={groups.length === 0}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-outline-variant text-on-surface font-metric-label text-sm hover:bg-surface-container disabled:opacity-50"
          >
            <span className="material-symbols-outlined text-sm">download</span>
            Excel
          </button>
        </div>
```

- [ ] **Step 3: Type-check the change**

Run: `npm run build`
Expected: build succeeds with no new TypeScript errors in `ExamAnalyticsTable.tsx`.

- [ ] **Step 4: Manual verification**

Run: `npm run dev`, go to the admin exam analytics/reports page that renders `ExamAnalyticsTable`.
1. Click "CSV" — confirm existing CSV download still works unchanged.
2. Click "Excel" — confirm a `.xlsx` file downloads, opens correctly (e.g. in Excel/LibreOffice/WPS), and its rows/columns match the CSV export for the same filtered data.

- [ ] **Step 5: Commit**

```bash
git add "app/(dashboard)/admin/reports/ExamAnalyticsTable.tsx"
git commit -m "feat: add Excel export option to exam analytics table"
```

---

### Task 4: Excel template + upload support in `MentorQuestionsClient`

**Files:**
- Modify: `app/(dashboard)/mentor/questions/MentorQuestionsClient.tsx`

**Interfaces:**
- Consumes: existing `ParsedRow` type (lines 78-89), `VALID_DOMAINS`/`CORRECT_MAP` constants (lines 91-92), existing `parseCSVLine` helper (lines 99-117).
- Produces: `validateRow(row: Record<string, string>, rowNum: number): ParsedRow` (new, extracted from existing `parseAndValidateCSV` body — matches the same-named helper already used in `app/schedule-test/[id]/questions/QuestionsStepClient.tsx:107-130`), `parseAndValidateExcel(buffer: ArrayBuffer): ParsedRow[]` (new), `downloadExcelTemplate(): void` (new). None of these are exported outside this file — purely internal, mirroring the sibling `QuestionsStepClient.tsx`.

- [ ] **Step 1: Add the `xlsx` import**

In `app/(dashboard)/mentor/questions/MentorQuestionsClient.tsx`, change line 5 from:

```typescript
import { uploadQuestionImage } from '@/lib/uploadQuestionImage';
```

to:

```typescript
import { uploadQuestionImage } from '@/lib/uploadQuestionImage';
import * as xlsx from 'xlsx';
```

- [ ] **Step 2: Extract `validateRow` and add `parseAndValidateExcel`**

Replace the current `parseAndValidateCSV` function (lines 119-162) — which currently inlines all validation — with a `validateRow` helper plus two thin parse functions:

```typescript
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
```

- [ ] **Step 3: Add `downloadExcelTemplate`**

Immediately after the existing `downloadTemplate` function (after its closing `}` at line 506), insert:

```typescript

  function downloadExcelTemplate() {
    const ws = xlsx.utils.aoa_to_sheet([
      ['domain', 'sub_type', 'difficulty', 'text', 'option_a', 'option_b', 'option_c', 'option_d', 'correct', 'time_sec', 'explanation'],
      ['QUANTITATIVE', 'Arithmetic', 3, 'What is 25% of 200?', '25', '50', '75', '100', 'B', 60, '25% of 200 = 50'],
    ]);
    const wb = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(wb, ws, 'Questions');
    xlsx.writeFile(wb, 'questions_template.xlsx');
  }
```

- [ ] **Step 4: Add the Excel template button and widen the upload input**

Change the template/upload controls (lines 1444-1474) from:

```typescript
            <div className="flex gap-3 items-center flex-wrap">
              <button
                onClick={downloadTemplate}
                className="inline-flex items-center gap-2 px-4 py-2 border border-outline-variant text-on-surface rounded-lg font-metric-label text-sm hover:bg-surface-container transition-colors"
              >
                <span className="material-symbols-outlined text-sm">download</span>
                Download Template
              </button>

              <label className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-on-primary rounded-lg font-metric-label text-sm hover:opacity-90 transition-opacity cursor-pointer">
                <span className="material-symbols-outlined text-sm">upload_file</span>
                Choose CSV File
                <input
                  type="file"
                  accept=".csv,text/csv"
                  className="hidden"
                  onChange={e => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    setBulkResult(null);
                    const reader = new FileReader();
                    reader.onload = ev => {
                      const text = ev.target?.result as string;
                      setParsedRows(parseAndValidateCSV(text));
                    };
                    reader.readAsText(file);
                    e.target.value = '';
                  }}
                />
              </label>
            </div>
```

to:

```typescript
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
```

- [ ] **Step 5: Type-check the change**

Run: `npm run build`
Expected: build succeeds with no new TypeScript errors in `MentorQuestionsClient.tsx`.

- [ ] **Step 6: Manual verification**

Run: `npm run dev`, sign in as a mentor, go to the question bank bulk-upload tab.
1. Click "CSV Template" — confirm unchanged behavior (downloads `questions_template.csv`).
2. Click "Excel Template" — confirm `questions_template.xlsx` downloads and opens with the same columns as the CSV template.
3. Fill in a few rows in the downloaded `.xlsx` template (including one with a deliberately invalid domain) and upload it via "Choose File". Confirm rows parse with the same validation behavior as the CSV path (valid rows show as valid, the invalid-domain row shows its error).
4. Upload a `.csv` file again to confirm the CSV path still works unchanged.

- [ ] **Step 7: Commit**

```bash
git add "app/(dashboard)/mentor/questions/MentorQuestionsClient.tsx"
git commit -m "feat: add Excel template and upload support to mentor question bulk upload"
```
