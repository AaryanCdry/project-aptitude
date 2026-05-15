import { createClient } from '@/lib/supabase/server';
import BulkUploadClient from './BulkUploadClient';

export default async function BulkUploadPage() {
  const supabase = await createClient();
  const { data: cohorts } = await supabase
    .from('cohorts')
    .select('id, name')
    .order('created_at', { ascending: false });

  return <BulkUploadClient cohorts={cohorts ?? []} />;
}
