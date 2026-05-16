'use client';

import { useState, useTransition } from 'react';
import { issueCertificate, revokeCertificate } from '@/app/actions/certificates';

type Student = {
  id: string;
  name: string;
  email: string;
  avgScore: number;
  testsCompleted: number;
  eligible: boolean;
  certificate: { id: string; qr_code: string; issued_at: string; revoked: boolean } | null;
};

export default function MentorCertificatesClient({ students }: { students: Student[] }) {
  const [list, setList] = useState(students);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [tab, setTab] = useState<'eligible' | 'issued' | 'all'>('eligible');

  const [isPending, startTransition] = useTransition();

  async function handleIssue(studentId: string) {
    setLoadingId(studentId);
    try {
      const res = await issueCertificate(studentId);
      setList(prev => prev.map(s =>
        s.id === studentId
          ? { ...s, certificate: { id: '', qr_code: res.qrCode, issued_at: new Date().toISOString(), revoked: false } }
          : s
      ));
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoadingId(null);
    }
  }

  async function handleRevoke(certId: string, studentId: string) {
    if (!confirm('Revoke this certificate? This cannot be undone.')) return;
    setLoadingId(studentId);
    try {
      await revokeCertificate(certId);
      setList(prev => prev.map(s =>
        s.id === studentId && s.certificate
          ? { ...s, certificate: { ...s.certificate, revoked: true } }
          : s
      ));
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoadingId(null);
    }
  }

  const tabs = [
    { key: 'eligible' as const, label: 'Eligible', count: list.filter(s => s.eligible && !s.certificate).length },
    { key: 'issued' as const, label: 'Issued', count: list.filter(s => s.certificate && !s.certificate.revoked).length },
    { key: 'all' as const, label: 'All Students', count: list.length },
  ];

  const filtered = list.filter(s => {
    if (tab === 'eligible') return s.eligible && !s.certificate;
    if (tab === 'issued') return s.certificate && !s.certificate.revoked;
    return true;
  });

  return (
    <div className="bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden shadow-sm">
      {/* Tab bar */}
      <div className="flex border-b border-outline-variant bg-surface-bright">
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-5 py-3 font-metric-label text-sm flex items-center gap-2 border-b-2 transition-colors ${
              tab === t.key
                ? 'border-primary text-primary'
                : 'border-transparent text-on-surface-variant hover:text-on-surface'
            }`}
          >
            {t.label}
            <span className={`text-xs px-1.5 py-0.5 rounded-full ${tab === t.key ? 'bg-primary/15 text-primary' : 'bg-surface-container-high text-on-surface-variant'}`}>
              {t.count}
            </span>
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-outline-variant">
              {['Student', 'Tests', 'Avg Score', 'Status', 'Actions'].map(h => (
                <th key={h} className="py-3 px-5 font-metric-label text-on-surface-variant text-sm">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-outline-variant">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-12 text-center text-on-surface-variant font-body-md">
                  No students in this category.
                </td>
              </tr>
            ) : (
              filtered.map(s => {
                const hasCert = s.certificate && !s.certificate.revoked;
                const isRevoked = s.certificate?.revoked;

                return (
                  <tr key={s.id} className="hover:bg-surface-container transition-colors">
                    <td className="py-3 px-5">
                      <div>
                        <p className="font-body-md text-on-surface">{s.name ?? '—'}</p>
                        <p className="font-caption text-on-surface-variant">{s.email}</p>
                      </div>
                    </td>
                    <td className="py-3 px-5 font-body-md text-on-surface">{s.testsCompleted}</td>
                    <td className="py-3 px-5">
                      <span className={`font-bold ${s.avgScore >= 75 ? 'text-secondary' : s.avgScore >= 50 ? 'text-primary' : 'text-error'}`}>
                        {s.avgScore > 0 ? `${s.avgScore}%` : '—'}
                      </span>
                    </td>
                    <td className="py-3 px-5">
                      {isRevoked ? (
                        <span className="bg-error-container text-on-error-container text-xs font-bold px-2.5 py-1 rounded-full">Revoked</span>
                      ) : hasCert ? (
                        <span className="bg-secondary-fixed text-on-secondary-fixed-variant text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1 w-fit">
                          <span className="material-symbols-outlined text-xs">verified</span> Certified
                        </span>
                      ) : s.eligible ? (
                        <span className="bg-primary-fixed-dim text-on-primary-fixed text-xs font-bold px-2.5 py-1 rounded-full">Eligible</span>
                      ) : (
                        <span className="bg-surface-container-high text-on-surface-variant text-xs font-bold px-2.5 py-1 rounded-full">Not Eligible</span>
                      )}
                    </td>
                    <td className="py-3 px-5">
                      {hasCert ? (
                        <button
                          onClick={() => handleRevoke(s.certificate!.id, s.id)}
                          disabled={loadingId === s.id}
                          className="text-error text-xs font-metric-label hover:underline flex items-center gap-1 disabled:opacity-50"
                        >
                          <span className="material-symbols-outlined text-sm">block</span>
                          Revoke
                        </button>
                      ) : s.eligible && !isRevoked ? (
                        <button
                          onClick={() => handleIssue(s.id)}
                          disabled={loadingId === s.id}
                          className="inline-flex items-center gap-1.5 bg-primary text-on-primary text-xs font-metric-label px-3 py-1.5 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
                        >
                          {loadingId === s.id ? (
                            <span className="material-symbols-outlined text-sm animate-spin">refresh</span>
                          ) : (
                            <span className="material-symbols-outlined text-sm">workspace_premium</span>
                          )}
                          {loadingId === s.id ? 'Issuing…' : 'Issue Certificate'}
                        </button>
                      ) : null}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
