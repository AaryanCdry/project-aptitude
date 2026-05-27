'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

type Mode = 'loading' | 'form' | 'success' | 'invalid';

const BrandPanel = () => (
  <div
    className="hidden lg:flex lg:w-[45%] bg-primary flex-col justify-between p-12 relative overflow-hidden"
    style={{
      backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.12) 1px, transparent 1px)',
      backgroundSize: '20px 20px',
    }}
  >
    <div className="relative z-10 flex items-center gap-2.5">
      <span className="material-symbols-outlined text-on-primary text-2xl" style={{ fontVariationSettings: '"FILL" 1' }}>neurology</span>
      <span className="font-headline-md text-on-primary text-xl font-bold tracking-tight">AptitudePro</span>
    </div>
    <div className="relative z-10">
      <p className="font-display-lg text-on-primary text-5xl font-bold leading-[1.1] mb-5">
        Measure<br />what<br />matters.
      </p>
      <p className="font-body-lg text-on-primary/60 text-lg leading-relaxed">
        Adaptive aptitude assessments<br />for colleges that care about outcomes.
      </p>
    </div>
    <p className="relative z-10 font-caption text-on-primary/40 text-sm">© 2026 AptitudePro</p>
  </div>
);

export default function ResetPasswordPage() {
  const [mode, setMode] = useState<Mode>('loading');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();

    const code = new URLSearchParams(window.location.search).get('code');
    if (code) {
      supabase.auth.exchangeCodeForSession(code).then(({ error }) => {
        setMode(error ? 'invalid' : 'form');
      });
      return;
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') setMode('form');
    });

    const timer = setTimeout(() => {
      setMode((prev) => prev === 'loading' ? 'invalid' : prev);
    }, 2000);

    return () => {
      subscription.unsubscribe();
      clearTimeout(timer);
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    if (password !== confirm) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    const supabase = createClient();
    const { error: updateError } = await supabase.auth.updateUser({ password });
    setLoading(false);

    if (updateError) {
      setError(updateError.message);
      return;
    }

    setMode('success');
    setTimeout(() => router.push('/login'), 2500);
  };

  return (
    <div className="min-h-screen flex">
      <BrandPanel />

      <div className="flex-1 flex items-center justify-center p-8 bg-surface-container-lowest">
        <div className="w-full max-w-sm animate-fade-scale">
          {/* Mobile wordmark */}
          <div className="flex lg:hidden items-center gap-2 mb-8 justify-center">
            <span className="material-symbols-outlined text-primary text-2xl" style={{ fontVariationSettings: '"FILL" 1' }}>neurology</span>
            <span className="font-headline-md text-primary text-xl font-bold tracking-tight">AptitudePro</span>
          </div>

          {mode === 'loading' && (
            <div className="flex flex-col items-center gap-4 py-8 text-on-surface-variant">
              <span className="material-symbols-outlined text-4xl animate-spin text-primary">progress_activity</span>
              <p className="font-body-md">Verifying your link…</p>
            </div>
          )}

          {mode === 'invalid' && (
            <div className="flex flex-col items-center gap-6 text-center">
              <div className="w-16 h-16 rounded-full bg-error-container flex items-center justify-center">
                <span className="material-symbols-outlined text-3xl text-error">link_off</span>
              </div>
              <div>
                <h1 className="font-display-sm text-on-surface text-2xl font-bold mb-2">Link expired</h1>
                <p className="font-body-md text-on-surface-variant">
                  Reset links expire after 1 hour. Request a new one.
                </p>
              </div>
              <Link
                href="/forgot-password"
                className="w-full px-6 py-3 rounded-lg font-metric-label bg-primary text-on-primary hover:bg-primary/90 shadow-sm transition-all flex items-center justify-center gap-2"
              >
                Request new link
                <span className="material-symbols-outlined text-[18px]">send</span>
              </Link>
              <Link href="/login" className="font-metric-label text-primary hover:underline flex items-center gap-1 text-sm">
                <span className="material-symbols-outlined text-[18px]">arrow_back</span>
                Back to sign in
              </Link>
            </div>
          )}

          {mode === 'success' && (
            <div className="flex flex-col items-center gap-6 text-center">
              <div className="w-16 h-16 rounded-full bg-secondary-fixed flex items-center justify-center">
                <span className="material-symbols-outlined text-3xl text-on-secondary-fixed">check_circle</span>
              </div>
              <div>
                <h1 className="font-display-sm text-on-surface text-2xl font-bold mb-2">Password updated!</h1>
                <p className="font-body-md text-on-surface-variant">Redirecting you to sign in…</p>
              </div>
            </div>
          )}

          {mode === 'form' && (
            <>
              <div className="mb-8">
                <h1 className="font-display-sm text-on-surface text-2xl font-bold mb-1.5">Choose a new password</h1>
                <p className="font-body-md text-on-surface-variant">Must be at least 8 characters.</p>
              </div>

              <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                {error && (
                  <div className="p-3.5 bg-error-container text-on-error-container rounded-lg font-body-md text-sm flex items-center gap-2">
                    <span className="material-symbols-outlined text-base shrink-0">error</span>
                    {error}
                  </div>
                )}

                <div className="flex flex-col gap-1.5">
                  <label className="font-metric-label text-on-surface text-sm" htmlFor="password">New password</label>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-outline text-[18px]">lock</span>
                    <input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      required
                      placeholder="Min. 8 characters"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-10 pr-10 py-2.5 bg-surface-container-lowest border border-outline-variant rounded-lg font-body-md text-on-surface focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-on-surface-variant/60 text-sm"
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

                <div className="flex flex-col gap-1.5">
                  <label className="font-metric-label text-on-surface text-sm" htmlFor="confirm">Confirm password</label>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-outline text-[18px]">lock_reset</span>
                    <input
                      id="confirm"
                      type={showPassword ? 'text' : 'password'}
                      required
                      placeholder="Re-enter your password"
                      value={confirm}
                      onChange={(e) => setConfirm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 bg-surface-container-lowest border border-outline-variant rounded-lg font-body-md text-on-surface focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-on-surface-variant/60 text-sm"
                    />
                  </div>
                  {confirm && password !== confirm && (
                    <p className="font-caption text-error text-xs">Passwords do not match.</p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={loading || (!!confirm && password !== confirm)}
                  className="w-full px-6 py-3 rounded-lg font-metric-label bg-primary text-on-primary hover:bg-primary/90 shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 flex items-center justify-center gap-2 mt-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <span className="material-symbols-outlined text-[18px] animate-spin">progress_activity</span>
                      Updating…
                    </>
                  ) : (
                    <>
                      Set New Password
                      <span className="material-symbols-outlined text-[18px]">check</span>
                    </>
                  )}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
