'use client';

import { useState } from 'react';
import { revokeCertificate } from '@/app/actions/certificates';

type Student = {
  id: string;
  name: string;
  email: string;
  certificate: { id: string; qr_code: string; issued_at: string; revoked: boolean; tier: string | null } | null;
};

const TIER_CHIP: Record<string, string> = {
  ADVANCED:     'bg-error-container text-on-error-container',
  INTERMEDIATE: 'bg-primary-fixed-dim text-on-primary-fixed',
  BASIC:        'bg-secondary-fixed text-on-secondary-fixed-variant',
};

export default function MentorCertificatesClient({ students }: { students: Student[] }) {
  const [list, setList] = useState(students);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [tab, setTab] = useState<'issued' | 'all'>('issued');

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
    { key: 'issued' as const, label: 'Issued', count: list.filter(s => s.certificate && !s.certificate.revoked).length },
    { key: 'all' as const, label: 'All Students', count: list.length },
  ];

  const filtered = list.filter(s => {
    if (tab === 'issued') return s.certificate && !s.certificate.revoked;
    return true;
  });

  return (
    <div className="bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden shadow-sm">
      <div className="px-5 py-3 bg-primary-fixed/20 border-b border-outline-variant">
        <p className="font-caption text-on-surface-variant">
          Certificates are <strong>auto-issued</strong> when a student passes a Final Exam (≥70%). Mentors can revoke for fraud.
        </p>
      </div>

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

      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-outline-variant">
              {['Student', 'Tier', 'Status', 'Actions'].map(h => (
                <th key={h} className="py-3 px-5 font-metric-label text-on-surface-variant text-sm">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-outline-variant">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={4} className="py-12 text-center text-on-surface-variant font-body-md">
                  No students in this category.
                </td>
              </tr>
            ) : (
              filtered.map(s => {
                const hasCert = s.certificate && !s.certificate.revoked;
                const isRevoked = s.certificate?.revoked;
                const tier = s.certificate?.tier;

                return (
                  <tr key={s.id} className="hover:bg-surface-container transition-colors">
                    <td className="py-3 px-5">
                      <div>
                        <p className="font-body-md text-on-surface">{s.name ?? '—'}</p>
                        <p className="font-caption text-on-surface-variant">{s.email}</p>
                      </div>
                    </td>
                    <td className="py-3 px-5">
                      {tier ? (
                        <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${TIER_CHIP[tier] ?? ''}`}>
                          {tier}
                        </span>
                      ) : (
                        <span className="text-on-surface-variant">—</span>
                      )}
                    </td>
                    <td className="py-3 px-5">
                      {isRevoked ? (
                        <span className="bg-error-container text-on-error-container text-xs font-bold px-2.5 py-1 rounded-full">Revoked</span>
                      ) : hasCert ? (
                        <span className="bg-secondary-fixed text-on-secondary-fixed-variant text-xs font-bold px-2.5 py-1 rounded-full inline-flex items-center gap-1 w-fit">
                          <span className="material-symbols-outlined text-xs">verified</span> Certified
                        </span>
                      ) : (
                        <span className="bg-surface-container-high text-on-surface-variant text-xs font-bold px-2.5 py-1 rounded-full">No Certificate</span>
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
