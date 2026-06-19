'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { createJobPosting } from '@/app/actions/company';

const DEGREE_TYPES = ['BE', 'BTech', 'BCA', 'BSc', 'MBA', 'MCA', 'MTech', 'BBA', 'BCom'];
const JOB_TYPES = ['Full Time', 'Internship', 'Contract'];

export default function NewJobPage() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [requirements, setRequirements] = useState('');
  const [degreeTypes, setDegreeTypes] = useState<string[]>([]);
  const [minScore, setMinScore] = useState('');
  const [packageCtc, setPackageCtc] = useState('');
  const [location, setLocation] = useState('');
  const [jobType, setJobType] = useState('Full Time');
  const [deadline, setDeadline] = useState('');

  function toggleDegree(d: string) {
    setDegreeTypes(prev => prev.includes(d) ? prev.filter(x => x !== d) : [...prev, d]);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const res = await createJobPosting({
        title: title.trim(),
        description: description.trim(),
        requirements: requirements.trim() || undefined,
        degree_types: degreeTypes.length > 0 ? degreeTypes : undefined,
        min_aptitude_score: minScore ? Number(minScore) : null,
        package_ctc: packageCtc.trim() || undefined,
        location: location.trim() || undefined,
        job_type: jobType,
        application_deadline: deadline || undefined,
      });
      if ('error' in res) { setError(res.error ?? null); return; }
      router.push('/company/jobs');
    });
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="font-display-sm text-on-background text-2xl font-bold mb-1">Post a New Job</h1>
        <p className="font-body-md text-on-surface-variant">Fill in the details below. Students will apply in-platform.</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-surface-container-lowest border border-outline-variant rounded-xl p-6 flex flex-col gap-5">
        {error && (
          <div className="p-3 bg-error-container text-on-error-container rounded-lg font-body-md text-sm flex items-center gap-2">
            <span className="material-symbols-outlined text-base shrink-0">error</span>
            {error}
          </div>
        )}

        <div>
          <label className="block font-metric-label text-on-surface-variant text-sm mb-1.5">Job Title *</label>
          <input
            value={title} onChange={e => setTitle(e.target.value)} required
            placeholder="e.g. Software Engineer — Backend"
            className="w-full px-3 py-2.5 bg-surface-container-low border border-outline-variant rounded-lg text-on-surface text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block font-metric-label text-on-surface-variant text-sm mb-1.5">Job Type</label>
            <select
              value={jobType} onChange={e => setJobType(e.target.value)}
              className="w-full px-3 py-2.5 bg-surface-container-low border border-outline-variant rounded-lg text-on-surface text-sm focus:outline-none focus:border-primary"
            >
              {JOB_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className="block font-metric-label text-on-surface-variant text-sm mb-1.5">Location</label>
            <input
              value={location} onChange={e => setLocation(e.target.value)}
              placeholder="e.g. Bengaluru / Remote"
              className="w-full px-3 py-2.5 bg-surface-container-low border border-outline-variant rounded-lg text-on-surface text-sm focus:outline-none focus:border-primary"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block font-metric-label text-on-surface-variant text-sm mb-1.5">Package / CTC</label>
            <input
              value={packageCtc} onChange={e => setPackageCtc(e.target.value)}
              placeholder="e.g. 6–8 LPA"
              className="w-full px-3 py-2.5 bg-surface-container-low border border-outline-variant rounded-lg text-on-surface text-sm focus:outline-none focus:border-primary"
            />
          </div>
          <div>
            <label className="block font-metric-label text-on-surface-variant text-sm mb-1.5">Application Deadline</label>
            <input
              type="date" value={deadline} onChange={e => setDeadline(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
              className="w-full px-3 py-2.5 bg-surface-container-low border border-outline-variant rounded-lg text-on-surface text-sm focus:outline-none focus:border-primary"
            />
          </div>
        </div>

        <div>
          <label className="block font-metric-label text-on-surface-variant text-sm mb-1.5">Job Description *</label>
          <textarea
            value={description} onChange={e => setDescription(e.target.value)} required rows={5}
            placeholder="Describe the role, responsibilities, and what the candidate will be doing…"
            className="w-full px-3 py-2.5 bg-surface-container-low border border-outline-variant rounded-lg text-on-surface text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 resize-none"
          />
        </div>

        <div>
          <label className="block font-metric-label text-on-surface-variant text-sm mb-1.5">
            Eligibility / Requirements <span className="font-caption text-on-surface-variant/60">(optional)</span>
          </label>
          <textarea
            value={requirements} onChange={e => setRequirements(e.target.value)} rows={3}
            placeholder="e.g. Min 7.0 CGPA, strong DSA skills, prior internship preferred…"
            className="w-full px-3 py-2.5 bg-surface-container-low border border-outline-variant rounded-lg text-on-surface text-sm focus:outline-none focus:border-primary resize-none"
          />
        </div>

        <div>
          <label className="block font-metric-label text-on-surface-variant text-sm mb-2">
            Eligible Degree Types <span className="font-caption text-on-surface-variant/60">(leave blank for all)</span>
          </label>
          <div className="flex flex-wrap gap-2">
            {DEGREE_TYPES.map(d => (
              <button
                key={d} type="button" onClick={() => toggleDegree(d)}
                className={`px-3 py-1 rounded-full text-xs font-metric-label border transition-colors ${
                  degreeTypes.includes(d)
                    ? 'bg-primary text-on-primary border-primary'
                    : 'bg-surface-container-low text-on-surface-variant border-outline-variant hover:border-primary'
                }`}
              >
                {d}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block font-metric-label text-on-surface-variant text-sm mb-1.5">
            Min. Aptitude Score (0–100) <span className="font-caption text-on-surface-variant/60">(optional)</span>
          </label>
          <input
            type="number" min={0} max={100} value={minScore} onChange={e => setMinScore(e.target.value)}
            placeholder="e.g. 60"
            className="w-32 px-3 py-2.5 bg-surface-container-low border border-outline-variant rounded-lg text-on-surface text-sm focus:outline-none focus:border-primary"
          />
        </div>

        <div className="flex gap-3 pt-2">
          <button
            type="submit" disabled={isPending}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-on-primary rounded-lg font-metric-label text-sm hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            {isPending ? <><span className="material-symbols-outlined text-[16px] animate-spin">progress_activity</span>Posting…</> : <><span className="material-symbols-outlined text-[16px]">publish</span>Post Job</>}
          </button>
          <button
            type="button" onClick={() => router.back()}
            className="px-4 py-2.5 border border-outline-variant text-on-surface-variant rounded-lg font-metric-label text-sm hover:bg-surface-container transition-colors"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
