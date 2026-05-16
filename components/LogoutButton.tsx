'use client';

import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

export default function LogoutButton({ className }: { className?: string }) {
  const router = useRouter();

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  }

  return (
    <button
      onClick={handleLogout}
      className={className ?? 'w-full flex items-center gap-2 px-3 py-2 text-sm font-metric-label text-error hover:bg-error-container/20 rounded-lg transition-colors'}
    >
      <span className="material-symbols-outlined text-[18px]">logout</span>
      Sign Out
    </button>
  );
}
