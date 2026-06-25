import { createClient } from '@/lib/supabase/server';
import AssessmentsPageClient from './AssessmentsPageClient';

async function getLastTest(supabase: Awaited<ReturnType<typeof createClient>>, userId: string, types: string[]) {
  const { data } = await supabase
    .from('tests')
    .select('id, completed_at')
    .eq('student_id', userId)
    .eq('status', 'COMPLETED')
    .in('type', types)
    .order('completed_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  return data ?? null;
}

export default async function AssessmentsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const [lastAptitude, lastPersonality, lastSjt] = await Promise.all([
    getLastTest(supabase, user.id, ['SELF', 'ADAPTIVE', 'CENTER', 'FINAL']),
    getLastTest(supabase, user.id, ['PERSONALITY']),
    getLastTest(supabase, user.id, ['SJT']),
  ]);

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="font-headline-lg text-on-surface text-2xl font-bold mb-1">Assessments</h1>
        <p className="font-body-md text-on-surface-variant">
          Three assessment types to build a complete picture of your strengths.
        </p>
      </div>

      <AssessmentsPageClient
        lastAptitude={lastAptitude}
        lastPersonality={lastPersonality}
        lastSjt={lastSjt}
      />
    </div>
  );
}
