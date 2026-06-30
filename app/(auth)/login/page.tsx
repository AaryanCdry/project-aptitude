'use client';

import { useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const supabase = createClient();

    const { error: loginError } = await supabase.auth.signInWithPassword({ email, password });

    if (loginError) {
      setError(loginError.message);
      setLoading(false);
      return;
    }

    router.push('/');
    router.refresh();
  };

  return (
    <div className="min-h-screen flex">
      {/* Left brand panel */}
      <div
        className="hidden lg:flex lg:w-[45%] bg-primary flex-col justify-between p-12 relative overflow-hidden"
        style={{
          backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.12) 1px, transparent 1px)',
          backgroundSize: '20px 20px',
        }}
      >
        {/* Wordmark */}
        <div className="relative z-10 flex items-center gap-2.5">
          <span className="material-symbols-outlined text-on-primary text-2xl" style={{ fontVariationSettings: '"FILL" 1' }}>neurology</span>
          <span className="font-headline-md text-on-primary text-xl font-bold tracking-tight">AptiLead</span>
        </div>

        {/* Tagline */}
        <div className="relative z-10">
          <p className="font-display-lg text-on-primary text-5xl font-bold leading-[1.1] mb-5">
            Measure<br />what<br />matters.
          </p>
          <p className="font-body-lg text-on-primary/60 text-lg leading-relaxed">
            Adaptive aptitude assessments<br />for colleges that care about outcomes.
          </p>
        </div>

        {/* Footer */}
        <div className="relative z-10 flex items-center gap-4">
          <p className="font-caption text-on-primary/40 text-sm">© 2026 AptiLead</p>
        </div>
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex items-center justify-center p-8 bg-surface-container-lowest">
        <div className="w-full max-w-sm animate-fade-scale">
          {/* Mobile wordmark */}
          <div className="flex lg:hidden items-center gap-2 mb-8 justify-center">
            <span className="material-symbols-outlined text-primary text-2xl" style={{ fontVariationSettings: '"FILL" 1' }}>neurology</span>
            <span className="font-headline-md text-primary text-xl font-bold tracking-tight">AptiLead</span>
          </div>

          <div className="mb-8">
            <h1 className="font-display-sm text-on-surface text-2xl font-bold mb-1.5">Sign in</h1>
            <p className="font-body-md text-on-surface-variant">Enter your credentials to continue.</p>
          </div>

          <form onSubmit={handleLogin} className="flex flex-col gap-5">
            {error && (
              <div className="p-3.5 bg-error-container text-on-error-container rounded-lg font-body-md text-sm flex items-center gap-2">
                <span className="material-symbols-outlined text-base shrink-0">error</span>
                {error}
              </div>
            )}

            <div className="flex flex-col gap-1.5">
              <label className="font-metric-label text-on-surface text-sm" htmlFor="email">Email address</label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-outline text-[18px]">mail</span>
                <input
                  className="w-full pl-10 pr-4 py-2.5 bg-surface-container-lowest border border-outline-variant rounded-lg font-body-md text-on-surface focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-on-surface-variant/60 text-sm"
                  id="email"
                  placeholder="jane.doe@college.edu"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <label className="font-metric-label text-on-surface text-sm" htmlFor="password">Password</label>
                <a href="/forgot-password" className="font-caption text-primary hover:underline text-xs">Forgot password?</a>
              </div>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-outline text-[18px]">lock</span>
                <input
                  className="w-full pl-10 pr-10 py-2.5 bg-surface-container-lowest border border-outline-variant rounded-lg font-body-md text-on-surface focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-on-surface-variant/60 text-sm"
                  id="password"
                  placeholder="••••••••"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-outline hover:text-on-surface transition-colors"
                >
                  <span className="material-symbols-outlined text-[18px]">
                    {showPassword ? 'visibility_off' : 'visibility'}
                  </span>
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full px-6 py-3 rounded-lg font-metric-label bg-primary text-on-primary hover:bg-primary/90 shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 flex items-center justify-center gap-2 mt-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <span className="material-symbols-outlined text-[18px] animate-spin">progress_activity</span>
                  Signing in…
                </>
              ) : (
                <>
                  Sign In
                  <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                </>
              )}
            </button>
          </form>

          <div className="mt-6 flex flex-col items-center gap-2">
            <p className="text-center font-body-md text-on-surface-variant text-sm">
              Recruiting?{' '}
              <Link href="/company-signup" className="text-primary font-metric-label hover:underline">Register as a company</Link>
            </p>
            <p className="text-center font-body-md text-on-surface-variant text-sm">
              Registering a college?{' '}
              <Link href="/college-signup" className="text-primary font-metric-label hover:underline">Get started here</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
