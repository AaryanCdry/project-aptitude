import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export default async function Home() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const role = user.user_metadata?.role ?? 'STUDENT';

  if (role === 'SUPER_ADMIN') {
    redirect('/super');
  } else if (role === 'ADMIN') {
    redirect('/admin');
  } else if (role === 'SUB_ADMIN') {
    redirect('/subadmin');
  } else if (role === 'MENTOR') {
    redirect('/mentor');
  } else {
    redirect('/student');
  }
}
