# Bulk Upload Duplicate Detection & Excel Export — Design

Date: 2026-07-19

## Background

From a walkthrough with Rahul (admin user), two concrete bugs were raised:

- **Issue 2 — Duplicate names/emails on bulk upload:** uploading a CSV/Excel file with duplicate student names/emails lets the duplicates through. Behavior is inconsistent — duplicates show in some places, not others.
- **Issue 3 — CSV-only export:** some sections only export as CSV; proper `.xlsx` export should be added for completeness (CSV in WPS already works, so this is a nice-to-have, not a blocker).

(A third issue — a step-by-step academic year → batch → class setup guide — is a documentation task for Aryan, out of scope for this spec.)

## Issue 2 — Duplicate Detection on Bulk Enrollment Upload

### Scope

`app/(dashboard)/admin/enrollment/bulk/BulkUploadClient.tsx` and `app/actions/enrollment.ts` (`processBulkEnrollment`).

### Match rule

Duplicate detection matches on **email only** (case-insensitive, trimmed). Email is the unique identifier used for Supabase Auth account creation; names may legitimately collide between different students.

### Client-side (preview gate)

- After `parseCSV`, compute the set of emails that appear more than once among the parsed rows (case-insensitive).
- If any duplicates exist:
  - Show a warning banner above the preview table listing the duplicate emails and how many rows are affected.
  - Highlight the affected rows in the "Parsed Rows" preview table.
  - Disable the "Process" button; its label changes to something like "Resolve duplicates to continue".
- Once the admin fixes the source file and re-uploads (or the file has no duplicates), the Process button re-enables normally. There is no in-app row-editing — the admin corrects the file and re-uploads, consistent with how row errors already work today.

### Server-side (`processBulkEnrollment`), defense in depth

Runs even if the client check is bypassed (e.g. a direct call to the server action):

1. **Within-batch duplicates:** build a count map of emails (case-insensitive) across the incoming `rows`. For every row whose email occurs more than once in the batch, short-circuit it with `status: 'error', message: 'Duplicate email within this upload'` — do **not** call `createUser` for any of these rows.
2. **Already-enrolled duplicates:** before the per-row loop, batch-query existing `users` for emails matching any row's email (single `.in('email', emails)` lookup, case-insensitive comparison done in JS since Postgres `email` storage is not guaranteed lower-cased). Rows whose email already exists get `status: 'error', message: 'Email already enrolled'` instead of attempting `createUser` and surfacing the raw Supabase error.
3. Remaining rows proceed through the existing validation/creation logic unchanged.

This guarantees duplicates can never silently pass through, whether within one file or against existing data, regardless of entry point.

## Issue 3 — Excel (.xlsx) Export

The `xlsx` (SheetJS) package is already a project dependency (`package.json`, `^0.18.5`); no new dependency is needed.

### 3a. `ExamAnalyticsTable.tsx`

Currently exports only CSV via a hand-rolled string-join (`exportCsv()`, using the same `headers`/`csvRows` arrays that are already assembled). Add a sibling `exportXlsx()` that builds the workbook from the same `headers`/`csvRows` data using `XLSX.utils.aoa_to_sheet` + `XLSX.utils.book_new`/`book_append_sheet` + `XLSX.write(wb, { type: 'array', bookType: 'xlsx' })`, mirroring the pattern already used in `app/(dashboard)/admin/_shared/ExportButton.tsx`. Expose both options next to the existing export control (e.g. a small CSV / Excel choice) rather than replacing the CSV option.

### 3b. `MentorQuestionsClient.tsx` (mentor question-bank bulk upload)

This component is a mirror of `app/schedule-test/[id]/questions/QuestionsStepClient.tsx`, which **already** has full `.xlsx` support (Excel template download via `xlsx.writeFile`, and `.xlsx`/`.xls` upload parsing via `xlsx.read` + `sheet_to_json`, alongside the existing CSV path). The mentor copy currently only has the CSV path. Port the same additions into `MentorQuestionsClient.tsx`:

- Add `downloadExcelTemplate()` (same columns as the existing `CSV_TEMPLATE`, following `QuestionsStepClient.tsx`'s implementation).
- Widen the upload `<input accept>` to include `.xlsx,.xls` and the corresponding MIME types.
- Add the `xlsx.read` + `sheet_to_json` parsing branch for array-buffer-based files, reusing the existing per-row validation logic already in this file (domain/difficulty/options/correct-answer checks) — only the row-extraction source changes, not the validation.

No other CSV-only export points were found in scope for this issue (`BulkUploadClient.tsx`'s CSV button is a static template, not a data export, and was not selected as in-scope by the user).

## Out of Scope

- Issue 1 (academic year/batch/class setup flow documentation) — separate deliverable, not code.
- Any UI for editing/fixing duplicate rows inline before re-upload.
- Adding `.xlsx` support to `BulkUploadClient.tsx`'s enrollment template/upload (not requested).

## Testing

- Bulk upload: CSV with intra-file duplicate emails → preview blocks Process; CSV with an email that already exists among enrolled students → server rejects that row with a clear message; CSV with no duplicates → unaffected, uploads as before.
- Excel export: exported `.xlsx` from `ExamAnalyticsTable` opens correctly and matches the CSV export's data; existing CSV export path remains unchanged.
- Mentor question bulk upload: `.xlsx` template downloads and re-uploads correctly; existing CSV template/upload path remains unchanged.
