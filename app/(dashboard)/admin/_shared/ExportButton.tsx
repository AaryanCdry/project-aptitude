'use client';

import { useEffect, useRef, useState } from 'react';
import { getExportData, type ExportData } from '@/app/actions/reports';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function triggerDownload(content: BlobPart, mime: string, filename: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

const gradeColor = (grade: string) => {
  if (grade === 'A+' || grade === 'A') return '#166534';
  if (grade === 'B') return '#1e40af';
  if (grade === 'C') return '#854d0e';
  if (grade === 'D') return '#9a3412';
  return '#7c3aed';
};

const gradeBg = (grade: string) => {
  if (grade === 'A+' || grade === 'A') return '#dcfce7';
  if (grade === 'B') return '#dbeafe';
  if (grade === 'C') return '#fef9c3';
  if (grade === 'D') return '#ffedd5';
  return '#ede9fe';
};

// ─── HTML generator ───────────────────────────────────────────────────────────

function generateHTML(d: ExportData): string {
  const barRow = (domain: string, avg: number) => `
    <div style="margin-bottom:14px">
      <div style="display:flex;justify-content:space-between;margin-bottom:5px">
        <span style="font-weight:600;font-size:13px;color:#1e1b4b">${domain}</span>
        <span style="font-weight:700;font-size:13px;color:#3525cd">${avg}%</span>
      </div>
      <div style="height:8px;background:#e0e7ff;border-radius:99px;overflow:hidden">
        <div style="height:100%;width:${avg}%;background:linear-gradient(90deg,#3525cd,#4f46e5);border-radius:99px"></div>
      </div>
    </div>`;

  const studentRow = (r: ExportData['rows'][0], i: number) => `
    <tr style="background:${i % 2 === 0 ? '#fff' : '#f8f7ff'}">
      <td style="padding:11px 14px;border-bottom:1px solid #e5e7eb;font-weight:600;color:#111827">${r.name}</td>
      <td style="padding:11px 14px;border-bottom:1px solid #e5e7eb;color:#6b7280;font-size:13px">${r.email}</td>
      <td style="padding:11px 14px;border-bottom:1px solid #e5e7eb;text-align:center;color:#374151">${r.testsCompleted}</td>
      <td style="padding:11px 14px;border-bottom:1px solid #e5e7eb;text-align:center;font-weight:700;color:#3525cd">${r.avgScore > 0 ? r.avgScore + '%' : '—'}</td>
      <td style="padding:11px 14px;border-bottom:1px solid #e5e7eb;text-align:center">
        <span style="display:inline-block;padding:2px 10px;border-radius:99px;font-size:12px;font-weight:700;background:${gradeBg(r.grade)};color:${gradeColor(r.grade)}">${r.grade || '—'}</span>
      </td>
      <td style="padding:11px 14px;border-bottom:1px solid #e5e7eb;color:#6b7280;font-size:13px">${r.joined}</td>
    </tr>`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>AptiLead — College Report</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap');
  *{box-sizing:border-box;margin:0;padding:0}
  body{font-family:'DM Sans',system-ui,sans-serif;background:#f8f7ff;color:#1e1b4b;-webkit-print-color-adjust:exact;print-color-adjust:exact}
  @media print{body{background:#fff}.no-print{display:none}}
</style>
</head>
<body>
<div style="max-width:860px;margin:0 auto;padding:40px 24px">

  <!-- Header -->
  <div style="background:linear-gradient(135deg,#3525cd 0%,#4f46e5 100%);border-radius:16px;padding:36px 40px;color:#fff;margin-bottom:32px;position:relative;overflow:hidden">
    <div style="position:absolute;top:0;left:0;right:0;bottom:0;opacity:.08;background-image:radial-gradient(circle,#fff 1px,transparent 1px);background-size:20px 20px"></div>
    <div style="position:relative">
      <div style="font-size:22px;font-weight:800;letter-spacing:-0.5px;margin-bottom:4px">AptiLead</div>
      <div style="font-size:14px;opacity:.7">College Performance Report</div>
      <div style="margin-top:20px;font-size:13px;opacity:.6">Generated ${d.generatedAt}</div>
    </div>
  </div>

  <!-- KPI row -->
  <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:16px;margin-bottom:32px">
    ${[
      { label: 'Total Students', value: d.summary.totalStudents, sub: 'enrolled', color: '#3525cd', bg: '#ede9fe' },
      { label: 'Average Score', value: d.summary.overallAvg + '%', sub: 'college-wide', color: '#00687a', bg: '#ccfbf1' },
      { label: 'Tests Completed', value: d.summary.totalTests, sub: 'all time', color: '#684000', bg: '#fef3c7' },
    ].map(k => `
      <div style="background:#fff;border:1px solid #e5e7eb;border-radius:12px;padding:20px;border-top:3px solid ${k.color}">
        <div style="font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:.08em;color:#6b7280;margin-bottom:8px">${k.label}</div>
        <div style="font-size:36px;font-weight:800;color:#111827;line-height:1">${k.value}</div>
        <div style="font-size:12px;color:#9ca3af;margin-top:6px">${k.sub}</div>
      </div>`).join('')}
  </div>

  <!-- Domain performance -->
  ${d.domainAverages.length ? `
  <div style="background:#fff;border:1px solid #e5e7eb;border-radius:12px;padding:24px;margin-bottom:32px">
    <h2 style="font-size:16px;font-weight:700;color:#111827;margin-bottom:20px">Domain Performance</h2>
    ${d.domainAverages.map(da => barRow(da.domain, da.average)).join('')}
  </div>` : ''}

  <!-- Student table -->
  <div style="background:#fff;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden;margin-bottom:32px">
    <div style="padding:20px 24px;border-bottom:1px solid #e5e7eb;display:flex;justify-content:space-between;align-items:center">
      <h2 style="font-size:16px;font-weight:700;color:#111827">Student Breakdown</h2>
      <span style="font-size:12px;color:#6b7280">${d.rows.length} students</span>
    </div>
    <table style="width:100%;border-collapse:collapse;font-size:14px">
      <thead>
        <tr style="background:#f3f4f6">
          <th style="padding:11px 14px;text-align:left;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:.06em;color:#6b7280">Name</th>
          <th style="padding:11px 14px;text-align:left;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:.06em;color:#6b7280">Email</th>
          <th style="padding:11px 14px;text-align:center;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:.06em;color:#6b7280">Tests</th>
          <th style="padding:11px 14px;text-align:center;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:.06em;color:#6b7280">Avg Score</th>
          <th style="padding:11px 14px;text-align:center;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:.06em;color:#6b7280">Grade</th>
          <th style="padding:11px 14px;text-align:left;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:.06em;color:#6b7280">Joined</th>
        </tr>
      </thead>
      <tbody>
        ${d.rows.map((r, i) => studentRow(r, i)).join('')}
      </tbody>
    </table>
  </div>

  <!-- Footer -->
  <div style="text-align:center;color:#9ca3af;font-size:12px">
    AptiLead Adaptive Assessment Platform &nbsp;·&nbsp; Confidential
  </div>
</div>

<div class="no-print" style="position:fixed;bottom:24px;right:24px">
  <button onclick="window.print()" style="background:#3525cd;color:#fff;border:none;padding:12px 20px;border-radius:10px;font-size:14px;font-weight:600;cursor:pointer;display:flex;align-items:center;gap:8px;box-shadow:0 4px 12px rgba(53,37,205,.3)">
    🖨️ Print / Save as PDF
  </button>
</div>
</body>
</html>`;
}

// ─── XLSX generator ───────────────────────────────────────────────────────────

async function generateXLSX(d: ExportData): Promise<Uint8Array> {
  const XLSX = await import('xlsx');

  const wb = XLSX.utils.book_new();

  // Summary sheet
  const summaryData = [
    ['AptiLead — College Report'],
    [`Generated: ${d.generatedAt}`],
    [],
    ['Summary'],
    ['Total Students', d.summary.totalStudents],
    ['Tests Completed', d.summary.totalTests],
    ['Overall Average', `${d.summary.overallAvg}%`],
    [],
    ['Domain Performance'],
    ['Domain', 'Average Score'],
    ...d.domainAverages.map(da => [da.domain, `${da.average}%`]),
  ];
  const ws1 = XLSX.utils.aoa_to_sheet(summaryData);
  ws1['!cols'] = [{ wch: 28 }, { wch: 20 }];
  XLSX.utils.book_append_sheet(wb, ws1, 'Summary');

  // Students sheet
  const studentData = [
    ['Name', 'Email', 'Tests Completed', 'Average Score', 'Grade', 'Joined'],
    ...d.rows.map(r => [
      r.name,
      r.email,
      r.testsCompleted,
      r.avgScore > 0 ? `${r.avgScore}%` : 'No data',
      r.grade || '—',
      r.joined,
    ]),
  ];
  const ws2 = XLSX.utils.aoa_to_sheet(studentData);
  ws2['!cols'] = [{ wch: 24 }, { wch: 28 }, { wch: 16 }, { wch: 14 }, { wch: 10 }, { wch: 18 }];
  XLSX.utils.book_append_sheet(wb, ws2, 'Students');

  return XLSX.write(wb, { type: 'array', bookType: 'xlsx' }) as Uint8Array;
}

// ─── PDF generator ────────────────────────────────────────────────────────────

async function generatePDF(d: ExportData): Promise<Uint8Array> {
  const { default: jsPDF } = await import('jspdf');
  const { default: autoTable } = await import('jspdf-autotable');

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const W = doc.internal.pageSize.getWidth();

  // Header band
  doc.setFillColor(53, 37, 205);
  doc.roundedRect(14, 10, W - 28, 32, 4, 4, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('AptiLead', 22, 23);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('College Performance Report', 22, 30);
  doc.setFontSize(8);
  doc.setTextColor(200, 195, 255);
  doc.text(`Generated: ${d.generatedAt}`, 22, 37);

  // KPI band
  const kpis = [
    { label: 'Total Students', value: String(d.summary.totalStudents) },
    { label: 'Avg Score', value: `${d.summary.overallAvg}%` },
    { label: 'Tests Done', value: String(d.summary.totalTests) },
  ];
  let kx = 14;
  const kw = (W - 28 - 8) / 3;
  kpis.forEach(({ label, value }) => {
    doc.setFillColor(246, 245, 255);
    doc.roundedRect(kx, 48, kw, 20, 3, 3, 'F');
    doc.setTextColor(107, 114, 128);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.text(label.toUpperCase(), kx + 5, 55);
    doc.setTextColor(17, 24, 39);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text(value, kx + 5, 63);
    kx += kw + 4;
  });

  // Domain performance
  if (d.domainAverages.length) {
    doc.setTextColor(17, 24, 39);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('Domain Performance', 14, 80);
    let dy = 85;
    d.domainAverages.forEach(({ domain, average }) => {
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(55, 65, 81);
      doc.text(domain, 14, dy);
      doc.setTextColor(53, 37, 205);
      doc.setFont('helvetica', 'bold');
      doc.text(`${average}%`, W - 14, dy, { align: 'right' });
      // Track
      doc.setFillColor(224, 231, 255);
      doc.roundedRect(14, dy + 1, W - 28, 3, 1, 1, 'F');
      // Fill
      doc.setFillColor(53, 37, 205);
      doc.roundedRect(14, dy + 1, (W - 28) * (average / 100), 3, 1, 1, 'F');
      dy += 10;
    });
  }

  // Student table
  const startY = d.domainAverages.length ? 85 + d.domainAverages.length * 10 + 8 : 80;
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(17, 24, 39);
  doc.text('Student Breakdown', 14, startY);

  autoTable(doc, {
    startY: startY + 4,
    head: [['Name', 'Email', 'Tests', 'Score', 'Grade', 'Joined']],
    body: d.rows.map(r => [
      r.name,
      r.email,
      r.testsCompleted,
      r.avgScore > 0 ? `${r.avgScore}%` : '—',
      r.grade || '—',
      r.joined,
    ]),
    headStyles: {
      fillColor: [53, 37, 205],
      textColor: 255,
      fontSize: 8,
      fontStyle: 'bold',
      cellPadding: 4,
    },
    bodyStyles: { fontSize: 8, cellPadding: 3.5 },
    alternateRowStyles: { fillColor: [248, 247, 255] },
    columnStyles: {
      0: { cellWidth: 38 },
      1: { cellWidth: 50 },
      2: { cellWidth: 14, halign: 'center' },
      3: { cellWidth: 16, halign: 'center', fontStyle: 'bold', textColor: [53, 37, 205] },
      4: { cellWidth: 14, halign: 'center' },
      5: { cellWidth: 28 },
    },
    margin: { left: 14, right: 14 },
  });

  // Footer
  const pages = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i);
    doc.setFontSize(7);
    doc.setTextColor(156, 163, 175);
    doc.text('AptiLead — Confidential', 14, doc.internal.pageSize.getHeight() - 8);
    doc.text(`Page ${i} of ${pages}`, W - 14, doc.internal.pageSize.getHeight() - 8, { align: 'right' });
  }

  return doc.output('arraybuffer') as unknown as Uint8Array;
}

// ─── Component ────────────────────────────────────────────────────────────────

type Format = 'html' | 'xlsx' | 'pdf';

const formats: { key: Format; label: string; icon: string; ext: string }[] = [
  { key: 'html', label: 'HTML Report', icon: 'code', ext: '.html' },
  { key: 'xlsx', label: 'Excel / XLSX', icon: 'table', ext: '.xlsx' },
  { key: 'pdf', label: 'PDF', icon: 'picture_as_pdf', ext: '.pdf' },
];

export default function ExportButton() {
  const [loading, setLoading] = useState<Format | null>(null);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  async function handleExport(format: Format) {
    setOpen(false);
    setLoading(format);
    try {
      const data = await getExportData();
      const date = new Date().toISOString().slice(0, 10);

      if (format === 'html') {
        const html = generateHTML(data);
        triggerDownload(html, 'text/html;charset=utf-8', `aptitudepro-report-${date}.html`);
      } else if (format === 'xlsx') {
        const buf = await generateXLSX(data);
        triggerDownload(buf.buffer as ArrayBuffer, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', `aptitudepro-report-${date}.xlsx`);
      } else if (format === 'pdf') {
        const buf = await generatePDF(data);
        triggerDownload(buf.buffer as ArrayBuffer, 'application/pdf', `aptitudepro-report-${date}.pdf`);
      }
    } finally {
      setLoading(null);
    }
  }

  const isLoading = loading !== null;

  return (
    <div className="relative" ref={ref}>
      <div className="flex items-center rounded-lg overflow-hidden shadow-sm border border-primary">
        {/* Main label — clicking opens dropdown */}
        <button
          onClick={() => setOpen(o => !o)}
          disabled={isLoading}
          className="bg-primary text-on-primary px-4 py-2.5 font-metric-label flex items-center gap-2 hover:bg-primary/90 transition-colors disabled:opacity-60 text-sm"
        >
          {isLoading ? (
            <span className="material-symbols-outlined text-[16px] animate-spin">progress_activity</span>
          ) : (
            <span className="material-symbols-outlined text-[16px]" style={{ fontVariationSettings: '"FILL" 1' }}>download</span>
          )}
          {isLoading ? `Exporting ${loading?.toUpperCase()}…` : 'Export Report'}
          <span className="material-symbols-outlined text-[16px] transition-transform" style={{ transform: open ? 'rotate(180deg)' : 'none' }}>
            expand_more
          </span>
        </button>
      </div>

      {open && (
        <div className="absolute right-0 top-full mt-1.5 w-48 bg-surface-container-lowest border border-outline-variant rounded-xl shadow-lg z-50 overflow-hidden animate-fade-scale origin-top-right">
          {formats.map(({ key, label, icon }) => (
            <button
              key={key}
              onClick={() => handleExport(key)}
              className="w-full flex items-center gap-3 px-4 py-3 text-sm font-metric-label text-on-surface hover:bg-surface-container transition-colors text-left"
            >
              <span className="material-symbols-outlined text-[18px] text-on-surface-variant" style={{ fontVariationSettings: '"FILL" 1' }}>{icon}</span>
              {label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
