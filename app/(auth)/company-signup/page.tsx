'use client';

import { useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { completeCompanySignup } from '@/app/actions/company';
import { getCompanySignupNextStep } from '@/lib/auth/signup';

const INDUSTRIES = [
  'Technology', 'Finance & Banking', 'Healthcare', 'Manufacturing', 'Consulting',
  'E-Commerce', 'Education', 'Telecommunications', 'Automotive', 'Other',
];

export default function CompanySignupPage() {
  const [companyName, setCompanyName] = useState('');
  const [industry, setIndustry] = useState('');
  const [website, setWebsite] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (password !== confirmPassword) { setError('Passwords do not match.'); return; }
    if (password.length < 8) { setError('Password must be at least 8 characters.'); return; }

    setLoading(true);
    const supabase = createClient();

    const { data, error: signupError } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name: companyName, role: 'COMPANY' } },
    });

    if (signupError) { setError(signupError.message); setLoading(false); return; }

    if (data.user) {
      const res = await completeCompanySignup({
        companyName,
        email,
        industry: industry || null,
        website: website || null,
      });
      if ('error' in res) {
        setError(res.error ?? 'Failed to create account. Please try again.');
        setLoading(false);
        return;
      }
    }

    if (getCompanySignupNextStep(Boolean(data.session)) === 'dashboard') {
      window.location.replace('/company');
      return;
    }

    setSuccess(true);
    setLoading(false);
  }

  if (success) {
    return (
      <div className="min-h-screen bg-surface-container-lowest flex items-center justify-center p-4">
        <div className="w-full max-w-[480px] bg-surface-container-lowest border border-outline-variant rounded-xl shadow-sm p-8 text-center">
          <span className="material-symbols-outlined text-5xl text-secondary block mb-4" style={{ fontVariationSettings: '"FILL" 1' }}>mark_email_read</span>
          <h2 className="font-display-sm text-on-surface mb-2">Check your email</h2>
          <p className="font-body-md text-on-surface-variant mb-6">
            We sent a confirmation link to <strong>{email}</strong>. Click it to activate your company account.
          </p>
          <Link href="/login" className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-on-primary rounded-lg font-metric-label hover:opacity-90 transition-opacity">
            Back to Sign In
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex">
      {/* Left brand panel */}
      <div
        className="hidden lg:flex lg:w-[45%] bg-primary flex-col justify-between p-12 relative overflow-hidden"
        style={{ backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.12) 1px, transparent 1px)', backgroundSize: '20px 20px' }}
      >
        <div className="relative z-10 flex items-center gap-2.5">
          <span className="material-symbols-outlined text-on-primary text-2xl" style={{ fontVariationSettings: '"FILL" 1' }}>neurology</span>
          <span className="font-headline-md text-on-primary text-xl font-bold tracking-tight">AptiLead</span>
        </div>
        <div className="relative z-10">
          <p className="font-display-lg text-on-primary text-5xl font-bold leading-[1.1] mb-5">
            Hire<br />smarter,<br />faster.
          </p>
          <p className="font-body-lg text-on-primary/60 text-lg leading-relaxed">
            Post requirements and connect<br />with aptitude-verified candidates.
          </p>
        </div>
        <p className="relative z-10 font-caption text-on-primary/40 text-sm">© 2026 AptiLead</p>
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex items-center justify-center p-8 bg-surface-container-lowest overflow-y-auto">
        <div className="w-full max-w-sm animate-fade-scale">
          <div className="flex lg:hidden items-center gap-2 mb-8 justify-center">
            <span className="material-symbols-outlined text-primary text-2xl" style={{ fontVariationSettings: '"FILL" 1' }}>neurology</span>
            <span className="font-headline-md text-primary text-xl font-bold tracking-tight">AptiLead</span>
          </div>

          <div className="mb-8">
            <h1 className="font-display-sm text-on-surface text-2xl font-bold mb-1.5">Company Registration</h1>
            <p className="font-body-md text-on-surface-variant">Create your recruiter account to post job openings.</p>
          </div>

          <form onSubmit={handleSignup} className="flex flex-col gap-4">
            {error && (
              <div className="p-3.5 bg-error-container text-on-error-container rounded-lg font-body-md text-sm flex items-center gap-2">
                <span className="material-symbols-outlined text-base shrink-0">error</span>
                {error}
              </div>
            )}

            <div className="flex flex-col gap-1.5">
              <label className="font-metric-label text-on-surface text-sm" htmlFor="companyName">Company Name</label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-outline text-[18px]">business</span>
                <input
                  id="companyName" type="text" value={companyName} onChange={e => setCompanyName(e.target.value)}
                  placeholder="Acme Corp" required
                  className="w-full pl-10 pr-4 py-2.5 bg-surface-container-lowest border border-outline-variant rounded-lg font-body-md text-on-surface focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all text-sm"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="font-metric-label text-on-surface text-sm" htmlFor="industry">Industry</label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-outline text-[18px]">factory</span>
                <select
                  id="industry" value={industry} onChange={e => setIndustry(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-surface-container-lowest border border-outline-variant rounded-lg font-body-md text-on-surface focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all text-sm appearance-none"
                >
                  <option value="">Select industry…</option>
                  {INDUSTRIES.map(i => <option key={i} value={i}>{i}</option>)}
                </select>
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="font-metric-label text-on-surface text-sm" htmlFor="website">
                Website <span className="font-caption text-on-surface-variant">(optional)</span>
              </label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-outline text-[18px]">link</span>
                <input
                  id="website" type="url" value={website} onChange={e => setWebsite(e.target.value)}
                  placeholder="https://acmecorp.com"
                  className="w-full pl-10 pr-4 py-2.5 bg-surface-container-lowest border border-outline-variant rounded-lg font-body-md text-on-surface focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all text-sm"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="font-metric-label text-on-surface text-sm" htmlFor="email">Work Email</label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-outline text-[18px]">mail</span>
                <input
                  id="email" type="email" value={email} onChange={e => setEmail(e.target.value)}
                  placeholder="hr@acmecorp.com" required
                  className="w-full pl-10 pr-4 py-2.5 bg-surface-container-lowest border border-outline-variant rounded-lg font-body-md text-on-surface focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all text-sm"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="font-metric-label text-on-surface text-sm" htmlFor="password">Password</label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-outline text-[18px]">lock</span>
                <input
                  id="password" type="password" value={password} onChange={e => setPassword(e.target.value)}
                  placeholder="Min. 8 characters" required minLength={8}
                  className="w-full pl-10 pr-4 py-2.5 bg-surface-container-lowest border border-outline-variant rounded-lg font-body-md text-on-surface focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all text-sm"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="font-metric-label text-on-surface text-sm" htmlFor="confirmPassword">Confirm Password</label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-outline text-[18px]">lock_reset</span>
                <input
                  id="confirmPassword" type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)}
                  placeholder="••••••••" required
                  className="w-full pl-10 pr-4 py-2.5 bg-surface-container-lowest border border-outline-variant rounded-lg font-body-md text-on-surface focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all text-sm"
                />
              </div>
            </div>

            <button
              type="submit" disabled={loading}
              className="w-full px-6 py-3 rounded-lg font-metric-label bg-primary text-on-primary hover:bg-primary/90 shadow-sm transition-all flex items-center justify-center gap-2 mt-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <><span className="material-symbols-outlined text-[18px] animate-spin">progress_activity</span>Creating account…</>
              ) : (
                <>Register Company<span className="material-symbols-outlined text-[18px]">business</span></>
              )}
            </button>

            <p className="text-center font-body-md text-on-surface-variant text-sm">
              Already have an account?{' '}
              <Link href="/login" className="text-primary font-metric-label hover:underline">Sign in</Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
