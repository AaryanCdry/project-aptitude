'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const supabase = createClient();
    
    const { data, error: loginError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (loginError) {
      setError(loginError.message);
      setLoading(false);
      return;
    }

    // Role-based routing is handled by middleware, but we can push to root
    // which will redirect appropriately
    router.push('/');
    router.refresh();
  };

  return (
    <div className="min-h-screen bg-surface-container-lowest flex items-center justify-center p-4">
      <main className="w-full max-w-[480px] bg-surface-container-lowest border border-outline-variant rounded-xl shadow-[0px_10px_15px_-3px_rgba(79,70,229,0.05)] overflow-hidden flex flex-col">
        <header className="px-8 py-6 border-b border-outline-variant flex justify-center items-center bg-surface-container-lowest">
          <div className="text-center">
            <h1 className="font-display-sm text-display-sm text-on-surface">Aptitude Pro</h1>
            <p className="font-body-md text-body-md text-on-surface-variant mt-1">Sign in to your account.</p>
          </div>
        </header>

        <form onSubmit={handleLogin} className="p-8 flex flex-col gap-6">
          {error && (
            <div className="p-4 bg-error-container text-on-error-container rounded-lg font-body-md">
              {error}
            </div>
          )}
          
          <div className="flex flex-col gap-2">
            <label className="font-metric-label text-metric-label text-on-surface" htmlFor="email">Email Address</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <span className="material-symbols-outlined text-outline">mail</span>
              </div>
              <input 
                className="w-full pl-12 pr-4 py-3 bg-surface-container-lowest border border-outline-variant rounded-lg font-body-md text-body-md text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors" 
                id="email" 
                placeholder="jane.doe@example.com" 
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label className="font-metric-label text-metric-label text-on-surface" htmlFor="password">Password</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <span className="material-symbols-outlined text-outline">lock</span>
              </div>
              <input 
                className="w-full pl-12 pr-4 py-3 bg-surface-container-lowest border border-outline-variant rounded-lg font-body-md text-body-md text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors" 
                id="password" 
                placeholder="••••••••" 
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </div>

          <button 
            type="submit"
            disabled={loading}
            className="w-full px-6 py-3 rounded-lg font-metric-label text-metric-label bg-primary text-on-primary hover:bg-surface-tint shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 flex items-center justify-center gap-2 mt-4 disabled:opacity-50"
          >
            {loading ? 'Signing in...' : 'Sign In'}
            {!loading && <span className="material-symbols-outlined text-[18px]">login</span>}
          </button>
        </form>
      </main>
    </div>
  );
}
