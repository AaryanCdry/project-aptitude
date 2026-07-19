'use client';

import React, { useState, useRef, useTransition, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { processBulkEnrollment, BulkRow, BulkResult } from '@/app/actions/enrollment';

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

function parseCSV(text: string): BulkRow[] {
  const lines = text.trim().split('\n').filter(Boolean);
  if (lines.length === 0) return [];
  const firstLower = lines[0].toLowerCase();
  const hasHeader = firstLower.includes('name') || firstLower.includes('email');
  const headers = hasHeader
    ? parseCSVLine(lines[0]).map(h => h.toLowerCase().trim())
    : ['name', 'email', 'registration_id', 'department', 'class', 'section', 'semester'];
  const dataLines = hasHeader ? lines.slice(1) : lines;
  return dataLines.map((line) => {
    const values = parseCSVLine(line);
    const get = (key: string) => values[headers.indexOf(key)]?.trim() || undefined;
    return {
      name: get('name') ?? '',
      email: get('email') ?? '',
      registration_id: get('registration_id'),
      department: get('department'),
      class: get('class'),
      section: get('section'),
      semester: get('semester'),
    };
  }).filter(r => r.name || r.email);
}

export default function BulkUploadClient() {
  const [isDragging, setIsDragging] = useState(false);
  const [rows, setRows] = useState<BulkRow[]>([]);
  const [results, setResults] = useState<BulkResult[] | null>(null);
  const [fileName, setFileName] = useState('');
  const [isPending, startTransition] = useTransition();
  const [progress, setProgress] = useState(0);
  const fileRef = useRef<HTMLInputElement>(null);

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

  const handleFile = useCallback((file: File) => {
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const parsed = parseCSV(text);
      setRows(parsed);
      setResults(null);
      setProgress(0);
    };
    reader.readAsText(file);
  }, []);

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  const handleProcess = () => {
    if (!rows.length) return;
    setProgress(0);
    startTransition(async () => {
      // Simulate progress ticks while the action runs
      const timer = setInterval(() => setProgress((p) => Math.min(p + 12, 90)), 400);
      const res = await processBulkEnrollment(rows);
      clearInterval(timer);
      setProgress(100);
      setResults(res);
    });
  };

  const valid = results?.filter((r) => r.status === 'valid') ?? [];
  const errors = results?.filter((r) => r.status === 'error') ?? [];

  const printCredentials = () => {
    const validRows = results?.filter(r => r.status === 'valid') ?? [];
    if (!validRows.length) return;

    const escHtml = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

    const cards = validRows.map(r => [
      '<div class="card">',
      '  <div class="card-header">',
      `    <div class="card-name">${escHtml(r.name)}</div>`,
      `    <div class="card-email">${escHtml(r.email)}</div>`,
      '  </div>',
      '  <div class="card-body">',
      `    <div class="field"><span class="label">Reg ID</span><span class="value">${escHtml(r.registration_id || '—')}</span></div>`,
      `    <div class="field"><span class="label">Department</span><span class="value">${escHtml(r.department || '—')}</span></div>`,
      `    <div class="field"><span class="label">Class</span><span class="value">${escHtml(r.class || '—')}${r.section ? ' · ' + escHtml(r.section) : ''}</span></div>`,
      `    <div class="field"><span class="label">Semester</span><span class="value">${escHtml(r.semester || '—')}</span></div>`,
      '  </div>',
      '  <div class="card-footer">',
      '    <div class="cred-label">Temporary Password</div>',
      `    <div class="cred-value">${escHtml(r.tempPassword ?? '—')}</div>`,
      '    <div class="cred-note">Change password on first login</div>',
      '  </div>',
      '</div>',
    ].join('\n')).join('\n');

    const styles = [
      '* { box-sizing: border-box; margin: 0; padding: 0; }',
      "body { font-family: 'Segoe UI', sans-serif; background: #fff; color: #1a1a2e; padding: 24px; }",
      'h1 { font-size: 18px; font-weight: 700; margin-bottom: 4px; }',
      '.meta { font-size: 12px; color: #666; margin-bottom: 20px; }',
      '.grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; }',
      '.card { border: 1.5px solid #e2e8f0; border-radius: 10px; overflow: hidden; break-inside: avoid; }',
      '.card-header { background: #f1f5ff; padding: 12px 14px; border-bottom: 1px solid #e2e8f0; }',
      '.card-name { font-size: 14px; font-weight: 700; }',
      '.card-email { font-size: 11px; color: #555; margin-top: 2px; }',
      '.card-body { padding: 10px 14px; display: flex; flex-direction: column; gap: 5px; }',
      '.field { display: flex; justify-content: space-between; font-size: 11px; }',
      '.label { color: #888; }',
      '.value { font-weight: 600; }',
      '.card-footer { background: #1e293b; color: #fff; padding: 10px 14px; }',
      '.cred-label { font-size: 9px; text-transform: uppercase; letter-spacing: 1px; color: #94a3b8; margin-bottom: 3px; }',
      ".cred-value { font-family: 'Courier New', monospace; font-size: 16px; font-weight: 700; letter-spacing: 2px; color: #fbbf24; }",
      '.cred-note { font-size: 9px; color: #94a3b8; margin-top: 5px; }',
      '@media print { body { padding: 12px; } @page { margin: 12mm; size: A4; } }',
    ].join('\n');

    const date = new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });

    const parts = [
      '<!DOCTYPE html><html><head><meta charset="utf-8">',
      '<title>Student Credentials</title>',
      `<style>${styles}</style>`,
      '</head><body>',
      '<h1>Student Login Credentials</h1>',
      `<p class="meta">Generated ${date} &middot; ${validRows.length} students &middot; Keep this sheet confidential</p>`,
      `<div class="grid">${cards}</div>`,
      '</body></html>',
    ];

    const blob = new Blob(parts, { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const win = window.open(url, '_blank');
    if (win) setTimeout(() => URL.revokeObjectURL(url), 30000);
  };

  // Download template CSV
  const downloadTemplate = () => {
    const csv = [
      'name,email,registration_id,department,class,section,semester',
      'Jane Doe,jane.doe@university.edu,REG-2024-001,Computer Science,BCA-24-25-A,A,3',
      'John Smith,john.smith@university.edu,REG-2024-002,Commerce,BCom-24-25-B,,',
    ].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'enrollment_template.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-container-max-width mx-auto pb-24">
      {/* Page header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <Link href="/admin/enrollment" className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-surface-container-high transition-colors text-on-surface-variant">
            <span className="material-symbols-outlined">arrow_back</span>
          </Link>
          <div>
            <h1 className="font-headline-md text-headline-md text-on-surface">Bulk Student Enrollment</h1>
            <p className="font-caption text-on-surface-variant">Upload a CSV to enroll multiple students at once.</p>
          </div>
        </div>
        <button onClick={downloadTemplate} className="flex items-center gap-1.5 text-on-surface-variant hover:text-primary transition-colors text-body-md font-body-md">
          <span className="material-symbols-outlined">download</span>
          CSV Template
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: Upload + Settings */}
        <div className="lg:col-span-1 space-y-6">
          {/* Drop Zone */}
          <div
            onClick={() => fileRef.current?.click()}
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={onDrop}
            className={`rounded-xl border-2 border-dashed p-8 flex flex-col items-center justify-center text-center cursor-pointer h-64 transition-colors group ${isDragging ? 'border-primary bg-primary-fixed/10' : 'border-outline-variant bg-surface-container-low hover:border-primary hover:bg-primary-fixed/5'}`}
          >
            <input ref={fileRef} type="file" accept=".csv" className="sr-only" onChange={onFileChange} />
            <div className={`w-16 h-16 rounded-full bg-primary-fixed flex items-center justify-center mb-4 group-hover:scale-110 transition-transform ${isDragging ? 'scale-110' : ''}`}>
              <span className="material-symbols-outlined text-primary text-3xl">cloud_upload</span>
            </div>
            <h3 className="font-metric-label text-on-surface mb-1">{fileName || 'Drag & Drop CSV File'}</h3>
            <p className="font-caption text-on-surface-variant">
              {fileName ? `${rows.length} rows parsed` : <>or <span className="text-primary font-semibold">browse files</span> to upload</>}
            </p>
            <p className="font-caption text-outline mt-4 text-xs">Required: name, email · Optional: registration_id, department, class, section, semester</p>
          </div>

          {/* Settings */}
          <div className="bg-surface rounded-xl border border-outline-variant p-6 shadow-sm">
            <h3 className="font-metric-label text-on-surface mb-4 pb-2 border-b border-outline-variant">Enrollment Settings</h3>
            <div className="space-y-4">
              {/* Toggles */}
              {[['Auto-Generate Credentials', 'Create User IDs and passwords'], ['Send via Email', 'Notify students instantly']].map(([label, sub]) => (
                <div key={label} className="flex items-center justify-between">
                  <div>
                    <p className="font-body-md text-on-surface font-medium">{label}</p>
                    <p className="font-caption text-on-surface-variant">{sub}</p>
                  </div>
                  <div className="relative inline-flex items-center cursor-pointer">
                    <input defaultChecked className="sr-only peer" type="checkbox" />
                    <div className="w-11 h-6 bg-surface-variant peer-checked:bg-primary rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all" />
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-6 pt-4 border-t border-outline-variant">
              <button
                onClick={handleProcess}
                disabled={!rows.length || isPending || hasDuplicates}
                className="w-full bg-primary text-on-primary font-metric-label py-3 px-4 rounded-lg hover:bg-on-primary-fixed-variant transition-colors flex justify-center items-center gap-2 disabled:opacity-60"
              >
                <span className="material-symbols-outlined text-sm">{isPending ? 'hourglass_empty' : hasDuplicates ? 'error' : 'play_arrow'}</span>
                {isPending ? 'Processing…' : hasDuplicates ? 'Resolve duplicates to continue' : `Process ${rows.length ? `(${rows.length} rows)` : 'Upload'}`}
              </button>
            </div>
          </div>
        </div>

        {/* Right: Status + Preview */}
        <div className="lg:col-span-2 space-y-6">
          {/* Status card (shown once file loaded) */}
          {rows.length > 0 && (
            <div className="bg-surface rounded-xl border border-outline-variant p-6 shadow-sm">
              <div className="flex justify-between items-center mb-6">
                <h3 className="font-metric-label text-on-surface">Processing Status</h3>
                <span className="bg-surface-variant text-primary font-caption px-3 py-1 rounded-full">{fileName}</span>
              </div>
              {/* Progress bar */}
              <div className="overflow-hidden h-2 mb-3 rounded-full bg-surface-variant">
                <div className="h-full bg-secondary rounded-full transition-all duration-300" style={{ width: `${progress}%` }} />
              </div>
              <div className="flex justify-between font-caption">
                <span className="text-secondary font-semibold">{progress === 100 ? 'Complete' : progress > 0 ? `Validating (${progress}%)` : 'Ready to process'}</span>
                <span className="text-on-surface-variant">{results ? `${results.length} / ${rows.length}` : `${rows.length} rows`} loaded</span>
              </div>
              {/* KPI row */}
              <div className="grid grid-cols-3 gap-4 mt-6">
                <div className="p-4 bg-surface-container-low rounded-lg border border-outline-variant text-center">
                  <p className="font-caption text-on-surface-variant mb-1">Total Found</p>
                  <p className="font-display-sm text-[28px] text-on-surface">{rows.length}</p>
                </div>
                <div className="p-4 bg-surface-container-low rounded-lg border border-outline-variant text-center">
                  <p className="font-caption text-on-surface-variant mb-1">Valid Entries</p>
                  <p className="font-display-sm text-[28px] text-secondary">{results ? valid.length : '—'}</p>
                </div>
                <div className="p-4 bg-error-container rounded-lg border border-error/20 text-center">
                  <p className="font-caption text-on-error-container mb-1">Errors</p>
                  <p className="font-display-sm text-[28px] text-error">{results ? errors.length : '—'}</p>
                </div>
              </div>
            </div>
          )}

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

          {/* Credential Preview / Error Table */}
          <div className="bg-surface rounded-xl border border-outline-variant flex flex-col overflow-hidden shadow-sm">
            <div className="p-4 border-b border-outline-variant flex justify-between items-center bg-surface-container-lowest">
              <h3 className="font-metric-label text-on-surface">
                {results ? 'Credential Preview' : rows.length > 0 ? `Parsed Rows (${rows.length})` : 'Preview'}
              </h3>
              {results && valid.length > 0 && (
                <button
                  onClick={printCredentials}
                  className="flex items-center text-primary font-metric-label bg-primary-fixed/20 px-3 py-1.5 rounded-lg text-sm hover:bg-primary-fixed/40 transition-colors"
                >
                  <span className="material-symbols-outlined mr-2 text-sm">print</span>
                  Print Credentials
                </button>
              )}
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-outline-variant bg-surface-container-low">
                    {(results
                      ? ['Student Name', 'Email', 'Reg ID', 'Dept', 'Class', 'Sec', 'Sem', 'Temp Password', 'Status']
                      : ['Name', 'Email', 'Reg ID', 'Department', 'Class', 'Section', 'Semester']
                    ).map((h) => (
                      <th key={h} className="py-3 px-4 font-caption text-on-surface-variant font-semibold whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="font-body-md text-on-surface divide-y divide-outline-variant">
                  {results ? results.map((r, i) => (
                    <tr key={i} className={`hover:bg-surface-container-lowest transition-colors ${r.status === 'error' ? 'bg-error-container/10' : ''}`}>
                      <td className="py-3 px-4">{r.name}</td>
                      <td className="py-3 px-4 text-on-surface-variant text-sm">{r.email}</td>
                      <td className="py-3 px-4 text-sm">{r.registration_id || <span className="text-outline">—</span>}</td>
                      <td className="py-3 px-4 text-sm">{r.department || <span className="text-outline">—</span>}</td>
                      <td className="py-3 px-4 text-sm">{r.class || <span className="text-outline">—</span>}</td>
                      <td className="py-3 px-4 text-sm">{r.section || <span className="text-outline">—</span>}</td>
                      <td className="py-3 px-4 text-sm">{r.semester || <span className="text-outline">—</span>}</td>
                      <td className="py-3 px-4 font-mono text-sm tracking-widest">{r.tempPassword ?? '—'}</td>
                      <td className="py-3 px-4">
                        {r.status === 'valid' ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-secondary-fixed text-on-secondary-fixed-variant">Valid</span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-error-container text-error" title={r.message}>{r.message ?? 'Error'}</span>
                        )}
                      </td>
                    </tr>
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
                  {!results && rows.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-12 text-center text-on-surface-variant">
                        <span className="material-symbols-outlined text-3xl block mb-2 text-outline">upload_file</span>
                        Upload a CSV file to see a preview.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
