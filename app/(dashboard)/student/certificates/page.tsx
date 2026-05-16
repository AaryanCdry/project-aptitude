import React from 'react';
import { getStudentCertificates } from '@/app/actions/certificates';
import CopyButton from './CopyButton';

export default async function StudentCertificatesPage() {
  const certificates = await getStudentCertificates();
  const active = certificates.filter(c => !c.revoked);
  const revoked = certificates.filter(c => c.revoked);

  return (
    <div className="p-margin-desktop max-w-container-max-width mx-auto">
      <div className="mb-8">
        <h1 className="font-display-sm text-on-surface mb-2">My Certificates</h1>
        <p className="font-body-md text-on-surface-variant">
          Certificates you have earned. Share the link or scan the QR code for verification.
        </p>
      </div>

      {certificates.length === 0 ? (
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-16 text-center shadow-sm">
          <span className="material-symbols-outlined text-5xl text-outline block mb-4">workspace_premium</span>
          <h3 className="font-headline-md text-on-surface mb-2">No certificates yet</h3>
          <p className="font-body-md text-on-surface-variant max-w-md mx-auto mb-6">
            Complete at least 3 tests with an average score of 75% or higher to become eligible for a certificate.
          </p>
          <a
            href="/assessment"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-on-primary rounded-lg font-metric-label"
          >
            <span className="material-symbols-outlined text-sm">play_arrow</span>
            Take a Test
          </a>
        </div>
      ) : (
        <div className="flex flex-col gap-8">
          {active.length > 0 && (
            <section>
              <h2 className="font-headline-md text-on-surface mb-4">Active Certificates ({active.length})</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {active.map(cert => (
                  <CertificateCard key={cert.id} cert={cert} />
                ))}
              </div>
            </section>
          )}

          {revoked.length > 0 && (
            <section>
              <h2 className="font-headline-md text-on-surface mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined text-error text-xl">block</span>
                Revoked ({revoked.length})
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 opacity-60">
                {revoked.map(cert => (
                  <CertificateCard key={cert.id} cert={cert} revoked />
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}

function CertificateCard({ cert, revoked = false }: { cert: any; revoked?: boolean }) {
  const verifyUrl = `/verify/${cert.qrCode}`;
  const issuedDate = new Date(cert.issuedAt).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <div className={`bg-surface-container-lowest border rounded-xl overflow-hidden shadow-sm ${revoked ? 'border-error/30' : 'border-outline-variant'}`}>
      {/* Certificate header */}
      <div className={`p-6 ${revoked ? 'bg-error-container/20' : 'bg-primary/5'} border-b ${revoked ? 'border-error/20' : 'border-outline-variant'}`}>
        <div className="flex items-center justify-between mb-4">
          <span className={`material-symbols-outlined text-4xl ${revoked ? 'text-error' : 'text-primary'}`} style={{ fontVariationSettings: '"FILL" 1' }}>
            workspace_premium
          </span>
          {revoked ? (
            <span className="bg-error-container text-on-error-container text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1">
              <span className="material-symbols-outlined text-xs">block</span> Revoked
            </span>
          ) : (
            <span className="bg-secondary-fixed text-on-secondary-fixed-variant text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1">
              <span className="material-symbols-outlined text-xs">verified</span> Verified
            </span>
          )}
        </div>
        <h3 className="font-headline-md text-on-surface mb-1">Aptitude Proficiency Certificate</h3>
        <p className="font-caption text-on-surface-variant">Issued {issuedDate} · by {cert.issuedBy}</p>
      </div>

      {/* QR placeholder + actions */}
      <div className="p-6 flex items-center gap-6">
        {/* QR Code visual (CSS-based since no library) */}
        <div className="shrink-0 w-20 h-20 bg-surface-container-high rounded-lg border border-outline-variant flex items-center justify-center">
          <span className="material-symbols-outlined text-3xl text-on-surface-variant">qr_code_2</span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-caption text-on-surface-variant mb-1">Verification ID</p>
          <p className="font-body-md text-on-surface font-mono text-xs truncate mb-3">{cert.qrCode}</p>
          {!revoked && (
            <div className="flex gap-2 flex-wrap">
              <a
                href={verifyUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs px-3 py-1.5 border border-outline rounded-lg text-on-surface font-metric-label hover:bg-surface-container transition-colors"
              >
                <span className="material-symbols-outlined text-xs">open_in_new</span>
                Verify
              </a>
              <CopyButton url={`${process.env.NEXT_PUBLIC_SITE_URL ?? ''}/verify/${cert.qrCode}`} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
