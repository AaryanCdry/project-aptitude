'use client';

import { useState, useTransition, useEffect } from 'react';
import { getCompanyProfile, updateCompanyProfile } from '@/app/actions/company';

const INDUSTRIES = [
  'Technology', 'Finance & Banking', 'Healthcare', 'Manufacturing', 'Consulting',
  'E-Commerce', 'Education', 'Telecommunications', 'Automotive', 'Other',
];

export default function CompanyProfilePage() {
  const [companyName, setCompanyName] = useState('');
  const [industry, setIndustry] = useState('');
  const [website, setWebsite] = useState('');
  const [description, setDescription] = useState('');
  const [isPending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getCompanyProfile().then(p => {
      if (!p) return;
      setCompanyName(p.company_name ?? '');
      setIndustry(p.industry ?? '');
      setWebsite(p.website ?? '');
      setDescription(p.description ?? '');
    });
  }, []);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaved(false);
    startTransition(async () => {
      const res = await updateCompanyProfile({
        company_name: companyName.trim(),
        industry: industry || undefined,
        website: website.trim() || undefined,
        description: description.trim() || undefined,
      });
      if ('error' in res) { setError(res.error ?? null); return; }
      setSaved(true);
    });
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="font-display-sm text-on-background text-2xl font-bold mb-1">Company Profile</h1>
        <p className="font-body-md text-on-surface-variant">This information is shown to students on job postings.</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-surface-container-lowest border border-outline-variant rounded-xl p-6 flex flex-col gap-5">
        {error && (
          <div className="p-3 bg-error-container text-on-error-container rounded-lg font-body-md text-sm flex items-center gap-2">
            <span className="material-symbols-outlined text-base shrink-0">error</span>
            {error}
          </div>
        )}
        {saved && (
          <div className="p-3 bg-secondary/10 text-secondary rounded-lg font-body-md text-sm flex items-center gap-2">
            <span className="material-symbols-outlined text-base shrink-0">check_circle</span>
            Profile updated successfully.
          </div>
        )}

        <div>
          <label className="block font-metric-label text-on-surface-variant text-sm mb-1.5">Company Name *</label>
          <input
            value={companyName} onChange={e => setCompanyName(e.target.value)} required
            className="w-full px-3 py-2.5 bg-surface-container-low border border-outline-variant rounded-lg text-on-surface text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
        </div>

        <div>
          <label className="block font-metric-label text-on-surface-variant text-sm mb-1.5">Industry</label>
          <select
            value={industry} onChange={e => setIndustry(e.target.value)}
            className="w-full px-3 py-2.5 bg-surface-container-low border border-outline-variant rounded-lg text-on-surface text-sm focus:outline-none focus:border-primary"
          >
            <option value="">Select…</option>
            {INDUSTRIES.map(i => <option key={i} value={i}>{i}</option>)}
          </select>
        </div>

        <div>
          <label className="block font-metric-label text-on-surface-variant text-sm mb-1.5">Website</label>
          <input
            type="url" value={website} onChange={e => setWebsite(e.target.value)}
            placeholder="https://yourcompany.com"
            className="w-full px-3 py-2.5 bg-surface-container-low border border-outline-variant rounded-lg text-on-surface text-sm focus:outline-none focus:border-primary"
          />
        </div>

        <div>
          <label className="block font-metric-label text-on-surface-variant text-sm mb-1.5">About the Company</label>
          <textarea
            value={description} onChange={e => setDescription(e.target.value)} rows={4}
            placeholder="Tell students what your company does, culture, and what makes you a great place to work…"
            className="w-full px-3 py-2.5 bg-surface-container-low border border-outline-variant rounded-lg text-on-surface text-sm focus:outline-none focus:border-primary resize-none"
          />
        </div>

        <button
          type="submit" disabled={isPending}
          className="self-start inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-on-primary rounded-lg font-metric-label text-sm hover:bg-primary/90 transition-colors disabled:opacity-50"
        >
          {isPending ? <><span className="material-symbols-outlined text-[16px] animate-spin">progress_activity</span>Saving…</> : <><span className="material-symbols-outlined text-[16px]">save</span>Save Changes</>}
        </button>
      </form>
    </div>
  );
}
