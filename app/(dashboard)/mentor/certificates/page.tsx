import React from 'react';
import { getMentorCertificates, issueCertificate, revokeCertificate } from '@/app/actions/certificates';
import MentorCertificatesClient from './MentorCertificatesClient';

export default async function MentorCertificatesPage() {
  const students = await getMentorCertificates();

  const eligible = students.filter(s => s.eligible && !s.certificate);
  const issued = students.filter(s => s.certificate && !s.certificate.revoked);
  const revoked = students.filter(s => s.certificate?.revoked);

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="font-display-sm text-on-surface text-2xl font-bold mb-1">Certificates</h1>
        <p className="font-body-md text-on-surface-variant">
          Issue certificates to eligible students (avg ≥ 75%, min 3 tests).
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {[
          { label: 'Eligible (pending)', value: eligible.length, icon: 'pending', color: 'text-primary' },
          { label: 'Issued', value: issued.length, icon: 'workspace_premium', color: 'text-secondary' },
          { label: 'Revoked', value: revoked.length, icon: 'block', color: 'text-error' },
        ].map(({ label, value, icon, color }) => (
          <div key={label} className="bg-surface-container-lowest border border-outline-variant rounded-xl p-5 shadow-sm">
            <div className={`flex items-center gap-2 mb-2 ${color}`}>
              <span className="material-symbols-outlined text-xl" style={{ fontVariationSettings: '"FILL" 1' }}>{icon}</span>
              <p className="font-caption text-on-surface-variant">{label}</p>
            </div>
            <p className="font-display-sm text-2xl text-on-surface font-bold">{value}</p>
          </div>
        ))}
      </div>

      <MentorCertificatesClient students={students} />
    </div>
  );
}
