'use client';

import { useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

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

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? window.location.origin;

    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${siteUrl}/reset-password`,
    });

    setLoading(false);

    if (resetError) {
      setError(resetError.message);
      return;
    }

    setSent(true);
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

          {sent ? (
            <div className="flex flex-col items-center gap-6 text-center">
              <div className="w-16 h-16 rounded-full bg-secondary-fixed flex items-center justify-center">
                <span className="material-symbols-outlined text-3xl text-on-secondary-fixed">mark_email_read</span>
              </div>
              <div>
                <h1 className="font-display-sm text-on-surface text-2xl font-bold mb-2">Check your inbox</h1>
                <p className="font-body-md text-on-surface-variant">
                  We sent a reset link to <span className="font-semibold text-on-surface">{email}</span>.
                </p>
                <p className="font-body-md text-on-surface-variant mt-1.5">
                  Check your spam folder if it doesn&apos;t arrive within a minute.
                </p>
              </div>
              <Link
                href="/login"
                className="font-metric-label text-primary hover:underline flex items-center gap-1 text-sm"
              >
                <span className="material-symbols-outlined text-[18px]">arrow_back</span>
                Back to sign in
              </Link>
            </div>
          ) : (
            <>
              <div className="mb-8">
                <h1 className="font-display-sm text-on-surface text-2xl font-bold mb-1.5">Reset password</h1>
                <p className="font-body-md text-on-surface-variant">
                  Enter your account email and we&apos;ll send you a reset link.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="flex flex-col gap-5">
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
                      id="email"
                      type="email"
                      required
                      placeholder="jane.doe@college.edu"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 bg-surface-container-lowest border border-outline-variant rounded-lg font-body-md text-on-surface focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-on-surface-variant/60 text-sm"
                    />
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
                      Sending…
                    </>
                  ) : (
                    <>
                      Send Reset Link
                      <span className="material-symbols-outlined text-[18px]">send</span>
                    </>
                  )}
                </button>

                <p className="text-center font-body-md text-on-surface-variant text-sm">
                  Remember your password?{' '}
                  <Link href="/login" className="text-primary font-metric-label hover:underline">
                    Sign in
                  </Link>
                </p>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
