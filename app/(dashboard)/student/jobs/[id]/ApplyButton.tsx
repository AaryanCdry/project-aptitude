'use client';

import { useState, useRef, useTransition } from 'react';
import { createClient } from '@/lib/supabase/client';
import { applyToPartnerJob } from '@/app/actions/jobs';

const STATUS_LABEL: Record<string, string> = {
  applied:     'Applied',
  shortlisted: 'Shortlisted ✓',
  rejected:    'Not Selected',
};

const STATUS_STYLE: Record<string, string> = {
  applied:     'bg-primary/10 text-primary border-primary/20',
  shortlisted: 'bg-secondary/10 text-secondary border-secondary/20',
  rejected:    'bg-error/10 text-error border-error/20',
};

const MAX_SIZE_MB = 5;

export default function ApplyButton({
  jobId,
  studentId,
  initialStatus,
}: {
  jobId: string;
  studentId: string;
  initialStatus: string | null;
}) {
  const [status, setStatus] = useState<string | null>(initialStatus);
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [isPending, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    setFileError(null);
    const f = e.target.files?.[0] ?? null;
    if (!f) { setFile(null); return; }
    if (f.type !== 'application/pdf') {
      setFileError('Only PDF files are accepted.');
      setFile(null);
      return;
    }
    if (f.size > MAX_SIZE_MB * 1024 * 1024) {
      setFileError(`File must be under ${MAX_SIZE_MB} MB.`);
      setFile(null);
      return;
    }
    setFile(f);
  }

  function handleOpen() {
    setOpen(true);
    setFile(null);
    setFileError(null);
    setSubmitError(null);
  }

  function handleClose() {
    setOpen(false);
    setFile(null);
    setFileError(null);
    setSubmitError(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!file) return;

    setSubmitError(null);
    setUploading(true);

    const supabase = createClient();
    const path = `${studentId}/${jobId}-${Date.now()}.pdf`;

    const { error: uploadError } = await supabase.storage
      .from('resumes')
      .upload(path, file, { contentType: 'application/pdf', upsert: false });

    if (uploadError) {
      setSubmitError(uploadError.message);
      setUploading(false);
      return;
    }

    setUploading(false);

    startTransition(async () => {
      // Pass only the storage path — the server validates ownership and builds the URL
      const res = await applyToPartnerJob(jobId, path);
      if ('error' in res) {
        setSubmitError(res.error ?? 'Failed to submit application.');
        return;
      }
      setStatus('applied');
      setOpen(false);
    });
  }

  if (status) {
    return (
      <span className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-metric-label border ${STATUS_STYLE[status] ?? ''}`}>
        {STATUS_LABEL[status] ?? status}
      </span>
    );
  }

  return (
    <>
      <button
        onClick={handleOpen}
        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-secondary text-on-secondary font-metric-label text-sm hover:bg-secondary/90 transition-colors"
      >
        <span className="material-symbols-outlined text-sm">send</span>
        Apply Now
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="w-full max-w-md bg-surface-container-lowest border border-outline-variant rounded-2xl shadow-xl p-6 animate-fade-scale">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="font-metric-label text-on-surface font-bold text-base">Upload Your Resume</h2>
                <p className="font-caption text-on-surface-variant text-xs mt-0.5">PDF only · Max {MAX_SIZE_MB} MB</p>
              </div>
              <button onClick={handleClose} className="text-on-surface-variant hover:text-on-surface transition-colors p-1">
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              {/* Drop zone */}
              <div
                onClick={() => inputRef.current?.click()}
                className={`flex flex-col items-center justify-center gap-3 border-2 border-dashed rounded-xl py-8 px-4 cursor-pointer transition-colors
                  ${file ? 'border-secondary bg-secondary/5' : 'border-outline-variant hover:border-primary hover:bg-primary/5'}`}
              >
                <span className="material-symbols-outlined text-3xl text-outline" style={{ fontVariationSettings: '"FILL" 1' }}>
                  {file ? 'description' : 'upload_file'}
                </span>
                {file ? (
                  <p className="font-body-md text-on-surface text-sm text-center truncate max-w-full px-2">{file.name}</p>
                ) : (
                  <p className="font-body-md text-on-surface-variant text-sm text-center">Click to select your resume PDF</p>
                )}
                <input
                  ref={inputRef}
                  type="file"
                  accept="application/pdf"
                  className="hidden"
                  onChange={handleFileChange}
                />
              </div>

              {fileError && (
                <div className="flex items-center gap-2 p-3 bg-error-container text-on-error-container rounded-lg text-sm">
                  <span className="material-symbols-outlined text-base shrink-0">error</span>
                  {fileError}
                </div>
              )}

              {submitError && (
                <div className="flex items-center gap-2 p-3 bg-error-container text-on-error-container rounded-lg text-sm">
                  <span className="material-symbols-outlined text-base shrink-0">error</span>
                  {submitError}
                </div>
              )}

              <div className="flex gap-3 mt-1">
                <button
                  type="button"
                  onClick={handleClose}
                  className="flex-1 py-2.5 rounded-lg border border-outline-variant text-on-surface-variant font-metric-label text-sm hover:bg-surface-container-low transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!file || uploading || isPending}
                  className="flex-1 py-2.5 rounded-lg bg-secondary text-on-secondary font-metric-label text-sm hover:bg-secondary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {uploading || isPending ? (
                    <><span className="material-symbols-outlined text-sm animate-spin">progress_activity</span>
                    {uploading ? 'Uploading…' : 'Submitting…'}</>
                  ) : (
                    <><span className="material-symbols-outlined text-sm">send</span>Submit Application</>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
