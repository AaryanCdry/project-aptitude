'use client';

import { useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

export default function SignupPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const router = useRouter();

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }

    setLoading(true);
    const supabase = createClient();

    const { data, error: signupError } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name } },
    });

    if (signupError) {
      setError(signupError.message);
      setLoading(false);
      return;
    }

    // Insert into users table with default STUDENT role
    if (data.user) {
      await supabase.from('users').insert({
        id: data.user.id,
        name,
        email,
        role: 'STUDENT',
      });
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
            We sent a confirmation link to <strong>{email}</strong>. Click it to activate your account.
          </p>
          <Link href="/login" className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-on-primary rounded-lg font-metric-label hover:opacity-90 transition-opacity">
            Back to Sign In
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface-container-lowest flex items-center justify-center p-4">
      <main className="w-full max-w-[480px] bg-surface-container-lowest border border-outline-variant rounded-xl shadow-[0px_10px_15px_-3px_rgba(79,70,229,0.05)] overflow-hidden flex flex-col">
        <header className="px-8 py-6 border-b border-outline-variant flex justify-center items-center bg-surface-container-lowest">
          <div className="text-center">
            <h1 className="font-display-sm text-display-sm text-on-surface">AptiLead</h1>
            <p className="font-body-md text-on-surface-variant mt-1">Create your student account.</p>
          </div>
        </header>

        <form onSubmit={handleSignup} className="p-8 flex flex-col gap-5">
          {error && (
            <div className="p-4 bg-error-container text-on-error-container rounded-lg font-body-md">
              {error}
            </div>
          )}

          <div className="flex flex-col gap-2">
            <label className="font-metric-label text-on-surface" htmlFor="name">Full Name</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <span className="material-symbols-outlined text-outline">person</span>
              </div>
              <input
                id="name"
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Jane Doe"
                required
                className="w-full pl-12 pr-4 py-3 bg-surface-container-lowest border border-outline-variant rounded-lg font-body-md text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
              />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label className="font-metric-label text-on-surface" htmlFor="email">Email Address</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <span className="material-symbols-outlined text-outline">mail</span>
              </div>
              <input
                id="email"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="jane.doe@college.edu"
                required
                className="w-full pl-12 pr-4 py-3 bg-surface-container-lowest border border-outline-variant rounded-lg font-body-md text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
              />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label className="font-metric-label text-on-surface" htmlFor="password">Password</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <span className="material-symbols-outlined text-outline">lock</span>
              </div>
              <input
                id="password"
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Min. 8 characters"
                required
                minLength={8}
                className="w-full pl-12 pr-4 py-3 bg-surface-container-lowest border border-outline-variant rounded-lg font-body-md text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
              />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label className="font-metric-label text-on-surface" htmlFor="confirmPassword">Confirm Password</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <span className="material-symbols-outlined text-outline">lock_reset</span>
              </div>
              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full pl-12 pr-4 py-3 bg-surface-container-lowest border border-outline-variant rounded-lg font-body-md text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full px-6 py-3 rounded-lg font-metric-label bg-primary text-on-primary hover:opacity-90 shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 flex items-center justify-center gap-2 mt-2 disabled:opacity-50"
          >
            {loading ? 'Creating account…' : 'Create Account'}
            {!loading && <span className="material-symbols-outlined text-[18px]">person_add</span>}
          </button>

          <p className="text-center font-body-md text-on-surface-variant">
            Already have an account?{' '}
            <Link href="/login" className="text-primary font-metric-label hover:underline">
              Sign in
            </Link>
          </p>
        </form>
      </main>
    </div>
  );
}
