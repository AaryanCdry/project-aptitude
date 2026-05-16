import React from 'react';
import { verifyCertificate } from '@/app/actions/certificates';

export default async function VerifyCertificatePage({ params }: { params: { qr: string } }) {
  const cert = await verifyCertificate(params.qr);

  if (!cert) {
    return (
      <div className="min-h-screen bg-surface-container-lowest flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center bg-surface-container-lowest border border-outline-variant rounded-xl p-8 shadow-sm">
          <span className="material-symbols-outlined text-5xl text-error block mb-4" style={{ fontVariationSettings: '"FILL" 1' }}>
            cancel
          </span>
          <h1 className="font-display-sm text-on-surface text-xl font-bold mb-2">Certificate Not Found</h1>
          <p className="font-body-md text-on-surface-variant">
            This QR code does not match any certificate in our system.
          </p>
        </div>
      </div>
    );
  }

  const certData = cert as any;
  const isRevoked = certData.revoked;
  const student = certData.users;
  const issuedDate = new Date(certData.issued_at).toLocaleDateString('en-US', {
    month: 'long', day: 'numeric', year: 'numeric',
  });

  return (
    <div className="min-h-screen bg-surface-container-lowest flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden shadow-sm">
        {/* Status header */}
        <div className={`p-6 text-center border-b border-outline-variant ${isRevoked ? 'bg-error-container/20' : 'bg-secondary-fixed/20'}`}>
          <span
            className={`material-symbols-outlined text-5xl block mb-3 ${isRevoked ? 'text-error' : 'text-secondary'}`}
            style={{ fontVariationSettings: '"FILL" 1' }}
          >
            {isRevoked ? 'cancel' : 'verified'}
          </span>
          <h1 className={`font-display-sm text-xl font-bold mb-1 ${isRevoked ? 'text-error' : 'text-on-surface'}`}>
            {isRevoked ? 'Certificate Revoked' : 'Certificate Verified'}
          </h1>
          <p className="font-body-md text-on-surface-variant">
            {isRevoked
              ? 'This certificate has been revoked and is no longer valid.'
              : 'This is an authentic Aptitude Pro certificate.'}
          </p>
        </div>

        {/* Certificate details */}
        {!isRevoked && (
          <div className="p-6 flex flex-col gap-4">
            <div className="flex flex-col gap-1">
              <p className="font-caption text-on-surface-variant">Issued To</p>
              <p className="font-headline-md text-on-surface font-bold">{student?.name ?? 'Unknown Student'}</p>
              <p className="font-body-md text-on-surface-variant">{student?.email}</p>
            </div>
            <div className="flex flex-col gap-1">
              <p className="font-caption text-on-surface-variant">Certificate</p>
              <p className="font-body-md text-on-surface">Aptitude Proficiency Certificate</p>
            </div>
            <div className="flex flex-col gap-1">
              <p className="font-caption text-on-surface-variant">Issue Date</p>
              <p className="font-body-md text-on-surface">{issuedDate}</p>
            </div>
            <div className="flex flex-col gap-1">
              <p className="font-caption text-on-surface-variant">Verification ID</p>
              <p className="font-mono text-xs text-on-surface-variant bg-surface-container px-3 py-2 rounded-lg break-all">{params.qr}</p>
            </div>
            <div className="mt-2 p-3 bg-secondary-fixed/20 rounded-lg flex items-center gap-3">
              <span className="material-symbols-outlined text-secondary" style={{ fontVariationSettings: '"FILL" 1' }}>verified_user</span>
              <p className="font-caption text-on-surface-variant">
                Verified by Aptitude Pro · Powered by Supabase
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
