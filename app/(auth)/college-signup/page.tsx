'use client';

import { useState } from 'react';
import Link from 'next/link';
import { completeCollegeSignup } from '@/app/actions/college-signup';

export default function CollegeSignupPage() {
  const [collegeName, setCollegeName] = useState('');
  const [collegeCode, setCollegeCode] = useState('');
  const [adminName, setAdminName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [registrationCode, setRegistrationCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) { setError('Passwords do not match.'); return; }
    if (password.length < 8) { setError('Password must be at least 8 characters.'); return; }
    if (!/^[A-Za-z0-9]+$/.test(registrationCode.trim())) {
      setError('Registration code must be alphanumeric.');
      return;
    }

    setLoading(true);

    const res = await completeCollegeSignup({
      collegeName,
      collegeCode,
      adminName,
      email,
      password,
      registrationCode,
    });

    if ('error' in res) {
      setError(res.error ?? 'Something went wrong. Please try again.');
      setLoading(false);
      return;
    }

    setSuccess(true);
    setLoading(false);
  }

  if (success) {
    return (
      <div className="min-h-screen bg-surface-container-lowest flex items-center justify-center p-4">
        <div className="w-full max-w-[480px] bg-surface-container-lowest border border-outline-variant rounded-xl shadow-sm p-8 text-center">
          <span className="material-symbols-outlined text-5xl text-secondary block mb-4" style={{ fontVariationSettings: '"FILL" 1' }}>domain_verification</span>
          <h2 className="font-display-sm text-on-surface text-xl font-bold mb-2">College registered!</h2>
          <p className="font-body-md text-on-surface-variant mb-6">
            Your college account has been created. Sign in with your email and password to access the admin dashboard.
          </p>
          <Link
            href="/login"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-on-primary rounded-lg font-metric-label hover:opacity-90 transition-opacity"
          >
            Go to Sign In
            <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
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
            Empower<br />your<br />students.
          </p>
          <p className="font-body-lg text-on-primary/60 text-lg leading-relaxed">
            Aptitude assessments, analytics,<br />and placement readiness — all in one place.
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
            <h1 className="font-display-sm text-on-surface text-2xl font-bold mb-1.5">College Registration</h1>
            <p className="font-body-md text-on-surface-variant">Register your institution using the code provided by AptiLead.</p>
          </div>

          <form onSubmit={handleSignup} className="flex flex-col gap-4">
            {error && (
              <div className="p-3.5 bg-error-container text-on-error-container rounded-lg font-body-md text-sm flex items-center gap-2">
                <span className="material-symbols-outlined text-base shrink-0">error</span>
                {error}
              </div>
            )}

            {/* Registration code — prominent at top */}
            <div className="flex flex-col gap-1.5">
              <label className="font-metric-label text-on-surface text-sm" htmlFor="registrationCode">
                Registration Code <span className="text-error">*</span>
              </label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-outline text-[18px]">key</span>
                <input
                  id="registrationCode"
                  type="text"
                  value={registrationCode}
                  onChange={e => setRegistrationCode(e.target.value.toUpperCase())}
                  placeholder="e.g. A3K9PX2M"
                  required
                  maxLength={16}
                  className="w-full pl-10 pr-4 py-2.5 bg-surface-container-lowest border border-outline-variant rounded-lg font-mono text-on-surface focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all text-sm tracking-widest uppercase"
                />
              </div>
              <p className="font-caption text-on-surface-variant text-xs">Obtained from the AptiLead platform team.</p>
            </div>

            <div className="h-px bg-outline-variant my-1" />

            <div className="flex flex-col gap-1.5">
              <label className="font-metric-label text-on-surface text-sm" htmlFor="collegeName">College Name</label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-outline text-[18px]">school</span>
                <input
                  id="collegeName" type="text" value={collegeName} onChange={e => setCollegeName(e.target.value)}
                  placeholder="Institute of Technology" required
                  className="w-full pl-10 pr-4 py-2.5 bg-surface-container-lowest border border-outline-variant rounded-lg font-body-md text-on-surface focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all text-sm"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="font-metric-label text-on-surface text-sm" htmlFor="collegeCode">
                College Short Code
                <span className="font-caption text-on-surface-variant ml-1">(unique identifier)</span>
              </label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-outline text-[18px]">tag</span>
                <input
                  id="collegeCode" type="text" value={collegeCode}
                  onChange={e => setCollegeCode(e.target.value.toUpperCase())}
                  placeholder="e.g. IOT-001" required
                  className="w-full pl-10 pr-4 py-2.5 bg-surface-container-lowest border border-outline-variant rounded-lg font-mono text-on-surface focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all text-sm"
                />
              </div>
            </div>

            <div className="h-px bg-outline-variant my-1" />

            <div className="flex flex-col gap-1.5">
              <label className="font-metric-label text-on-surface text-sm" htmlFor="adminName">Your Name (Principal / Admin)</label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-outline text-[18px]">person</span>
                <input
                  id="adminName" type="text" value={adminName} onChange={e => setAdminName(e.target.value)}
                  placeholder="Dr. Jane Smith" required
                  className="w-full pl-10 pr-4 py-2.5 bg-surface-container-lowest border border-outline-variant rounded-lg font-body-md text-on-surface focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all text-sm"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="font-metric-label text-on-surface text-sm" htmlFor="email">Email</label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-outline text-[18px]">mail</span>
                <input
                  id="email" type="email" value={email} onChange={e => setEmail(e.target.value)}
                  placeholder="principal@college.edu" required
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
                <><span className="material-symbols-outlined text-[18px] animate-spin">progress_activity</span>Registering…</>
              ) : (
                <>Register College<span className="material-symbols-outlined text-[18px]">school</span></>
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
