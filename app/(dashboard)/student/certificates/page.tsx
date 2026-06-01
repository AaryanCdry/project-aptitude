import React from 'react';
import { getStudentCertificates } from '@/app/actions/certificates';
import { getStudentBadges } from '@/app/actions/badges';
import CopyButton from './CopyButton';

const TIER_COLORS: Record<string, { bg: string; text: string; border: string; icon: string }> = {
  ADVANCED:     { bg: 'bg-error-container/20',   text: 'text-on-error-container',            border: 'border-error/30',           icon: 'text-error' },
  INTERMEDIATE: { bg: 'bg-primary/5',            text: 'text-on-primary-fixed',              border: 'border-primary/20',         icon: 'text-primary' },
  BASIC:        { bg: 'bg-secondary-fixed/20',   text: 'text-on-secondary-fixed-variant',    border: 'border-secondary/20',       icon: 'text-secondary' },
};
const TIER_CHIP: Record<string, string> = {
  ADVANCED:     'bg-error-container text-on-error-container',
  INTERMEDIATE: 'bg-primary-fixed-dim text-on-primary-fixed',
  BASIC:        'bg-secondary-fixed text-on-secondary-fixed-variant',
};

export default async function StudentCertificatesPage() {
  const [certificates, badges] = await Promise.all([
    getStudentCertificates(),
    getStudentBadges(),
  ]);
  const active = certificates.filter(c => !c.revoked);
  const revoked = certificates.filter(c => c.revoked);

  return (
    <div className="p-margin-desktop max-w-container-max-width mx-auto">
      <div className="mb-8">
        <h1 className="font-display-sm text-on-surface mb-2">My Certificates &amp; Badges</h1>
        <p className="font-body-md text-on-surface-variant">
          Achievements earned from final exams. Share certificate links or scan QR codes for verification.
        </p>
      </div>

      {certificates.length === 0 && badges.length === 0 ? (
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-16 text-center shadow-sm">
          <span className="material-symbols-outlined text-5xl text-outline block mb-4">workspace_premium</span>
          <h3 className="font-headline-md text-on-surface mb-2">No certificates yet</h3>
          <p className="font-body-md text-on-surface-variant max-w-md mx-auto mb-6">
            Complete a final exam with a score of 70% or higher to earn a certificate and badge.
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
        <div className="flex flex-col gap-10">
          {/* ── Certificates ──────────────────────────────────────────── */}
          {certificates.length > 0 && (
            <div>
              {active.length > 0 && (
                <section className="mb-8">
                  <h2 className="font-headline-md text-on-surface mb-4">Active Certificates ({active.length})</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {active.map(cert => (
                      <CertificateCard key={cert.id} cert={cert} />
                    ))}
                  </div>
                </section>
              )}

              {revoked.length > 0 && (
                <section className="mb-8">
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

          {/* ── Badges ───────────────────────────────────────────────── */}
          {badges.length > 0 && (
            <section>
              <h2 className="font-headline-md text-on-surface mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-xl" style={{ fontVariationSettings: '"FILL" 1' }}>military_tech</span>
                Badges ({badges.length})
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {badges.map(badge => {
                  const colors = TIER_COLORS[badge.tier] ?? TIER_COLORS.BASIC;
                  const chipCls = TIER_CHIP[badge.tier] ?? TIER_CHIP.BASIC;
                  const issuedDate = new Date(badge.issuedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
                  return (
                    <div
                      key={badge.id}
                      className={`flex items-center gap-4 p-4 rounded-2xl border ${colors.border} ${colors.bg} shadow-sm`}
                    >
                      <span
                        className={`material-symbols-outlined text-4xl shrink-0 ${colors.icon}`}
                        style={{ fontVariationSettings: '"FILL" 1' }}
                      >
                        military_tech
                      </span>
                      <div className="flex-1 min-w-0">
                        <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${chipCls}`}>
                          {badge.tier}
                        </span>
                        {(badge as any).assessmentTitle && (
                          <p className="font-body-md text-on-surface text-sm font-semibold mt-1 truncate">{(badge as any).assessmentTitle}</p>
                        )}
                        {(badge as any).className && (
                          <p className="font-caption text-on-surface-variant text-xs mt-0.5 truncate">
                            <span className="material-symbols-outlined text-[11px] align-middle mr-0.5">school</span>
                            {(badge as any).className}
                          </p>
                        )}
                        <p className="font-caption text-on-surface-variant text-[11px] mt-0.5">Earned {issuedDate}</p>
                      </div>
                    </div>
                  );
                })}
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
        <h3 className="font-headline-md text-on-surface mb-1">
          {cert.assessmentTitle ?? 'Aptitude Proficiency Certificate'}
        </h3>
        {cert.className && (
          <p className="font-caption text-primary text-xs mb-0.5 flex items-center gap-1">
            <span className="material-symbols-outlined text-[12px]">school</span>
            {cert.className}
          </p>
        )}
        <p className="font-caption text-on-surface-variant">Issued {issuedDate}</p>
      </div>

      <div className="p-6 flex items-center gap-6">
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
