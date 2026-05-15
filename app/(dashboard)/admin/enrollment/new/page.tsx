import { createClient } from '@/lib/supabase/server';
import ManualEnrollmentForm from './ManualEnrollmentForm';

export default async function NewEnrollmentPage() {
  const supabase = await createClient();
  const { data: cohorts } = await supabase
    .from('cohorts')
    .select('id, name')
    .order('created_at', { ascending: false });

  return <ManualEnrollmentForm cohorts={cohorts ?? []} />;
}
