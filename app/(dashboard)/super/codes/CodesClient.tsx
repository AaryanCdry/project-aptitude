'use client';

import { useState, useTransition } from 'react';

type Code = {
  id: string;
  code: string;
  is_used: boolean;
  used_by_college_id: string | null;
  created_at: string;
  used_at: string | null;
};

type Props = {
  codes: Code[];
  generateAction: () => Promise<{ success?: true; code?: string; error?: string }>;
  revokeAction: (id: string) => Promise<{ success?: true; error?: string }>;
};

export default function CodesClient({ codes: initialCodes, generateAction, revokeAction }: Props) {
  const [codes, setCodes] = useState<Code[]>(initialCodes);
  const [newCode, setNewCode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [generateError, setGenerateError] = useState<string | null>(null);
  const [revokeError, setRevokeError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleGenerate() {
    setGenerateError(null);
    setNewCode(null);
    startTransition(async () => {
      const res = await generateAction();
      if ('error' in res && res.error) {
        setGenerateError(res.error);
        return;
      }
      if (res.code) {
        setNewCode(res.code);
        const now = new Date().toISOString();
        setCodes(prev => [
          { id: crypto.randomUUID(), code: res.code!, is_used: false, used_by_college_id: null, created_at: now, used_at: null },
          ...prev,
        ]);
      }
    });
  }

  function handleRevoke(id: string) {
    setRevokeError(null);
    startTransition(async () => {
      const res = await revokeAction(id);
      if ('error' in res && res.error) {
        setRevokeError(res.error);
        return;
      }
      setCodes(prev => prev.filter(c => c.id !== id));
    });
  }

  function copyCode(code: string) {
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <div className="space-y-6">
      {/* Generate button */}
      <div className="flex items-center gap-4">
        <button
          onClick={handleGenerate}
          disabled={isPending}
          className="flex items-center gap-2 px-5 py-2.5 bg-primary text-on-primary rounded-lg font-metric-label hover:bg-primary/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isPending ? (
            <><span className="material-symbols-outlined text-[18px] animate-spin">progress_activity</span>Generating…</>
          ) : (
            <><span className="material-symbols-outlined text-[18px]">add</span>Generate New Code</>
          )}
        </button>
        {generateError && (
          <p className="text-sm text-error font-body-md">{generateError}</p>
        )}
      </div>

      {/* New code banner */}
      {newCode && (
        <div className="flex items-center gap-4 p-4 bg-secondary-container rounded-xl border border-secondary/20">
          <span className="material-symbols-outlined text-on-secondary-container" style={{ fontVariationSettings: '"FILL" 1' }}>key</span>
          <div className="flex-1">
            <p className="font-caption text-on-secondary-container/70 text-xs mb-0.5">New registration code — share this with the college</p>
            <p className="font-mono text-on-secondary-container text-lg font-bold tracking-widest">{newCode}</p>
          </div>
          <button
            onClick={() => copyCode(newCode)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-secondary text-on-secondary rounded-lg text-sm font-metric-label hover:opacity-90 transition-all"
          >
            <span className="material-symbols-outlined text-[16px]">{copied ? 'check' : 'content_copy'}</span>
            {copied ? 'Copied!' : 'Copy'}
          </button>
        </div>
      )}

      {revokeError && (
        <div className="p-3 bg-error-container text-on-error-container rounded-lg text-sm font-body-md flex items-center gap-2">
          <span className="material-symbols-outlined text-base">error</span>
          {revokeError}
        </div>
      )}

      {/* Codes table */}
      <div className="bg-surface-container-low border border-outline-variant rounded-xl overflow-hidden">
        <div className="grid grid-cols-[1fr_120px_160px_160px_80px] text-xs font-metric-label text-on-surface-variant uppercase tracking-wider px-6 py-3 border-b border-outline-variant bg-surface-container">
          <span>Code</span>
          <span>Status</span>
          <span>Created</span>
          <span>Used At</span>
          <span></span>
        </div>

        {codes.length === 0 && (
          <div className="px-6 py-12 text-center text-on-surface-variant font-body-md">
            No codes yet. Generate one to get started.
          </div>
        )}

        {codes.map(c => (
          <div
            key={c.id}
            className="grid grid-cols-[1fr_120px_160px_160px_80px] items-center px-6 py-4 border-b border-outline-variant last:border-0 hover:bg-surface-container transition-colors"
          >
            <span className="font-mono text-on-surface font-bold tracking-widest">{c.code}</span>

            <span>
              {c.is_used ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-surface-container-highest text-on-surface-variant rounded-full text-xs font-metric-label">
                  <span className="material-symbols-outlined text-[12px]">check_circle</span>Used
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-tertiary-container text-on-tertiary-container rounded-full text-xs font-metric-label">
                  <span className="material-symbols-outlined text-[12px]">circle</span>Available
                </span>
              )}
            </span>

            <span className="font-body-sm text-on-surface-variant text-xs">
              {new Date(c.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
            </span>

            <span className="font-body-sm text-on-surface-variant text-xs">
              {c.used_at
                ? new Date(c.used_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
                : '—'}
            </span>

            <span className="flex justify-end">
              {!c.is_used && (
                <button
                  onClick={() => handleRevoke(c.id)}
                  disabled={isPending}
                  title="Revoke code"
                  className="p-1.5 text-error hover:bg-error-container rounded-lg transition-colors disabled:opacity-40"
                >
                  <span className="material-symbols-outlined text-[18px]">delete</span>
                </button>
              )}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
