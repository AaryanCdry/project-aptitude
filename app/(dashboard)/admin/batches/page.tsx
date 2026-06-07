import { getBatches } from '@/app/actions/batches';
import { getCallerScope, resolveAllowedClassIds } from '@/app/actions/scope';
import { createAdminClient } from '@/lib/supabase/admin';
import BatchesClient from './BatchesClient';

export default async function BatchesPage() {
  const [batches, scope] = await Promise.all([getBatches(), getCallerScope()]);

  // All classes for this college (for the "Add class" dropdowns)
  const adminClient = createAdminClient();
  const allowedClassIds = await resolveAllowedClassIds(scope);
  let classesQ = adminClient
    .from('classes')
    .select('id, name, batch_id')
    .order('name');
  if (allowedClassIds !== null && allowedClassIds.length > 0) {
    classesQ = classesQ.in('id', allowedClassIds);
  } else if (allowedClassIds !== null && allowedClassIds.length === 0) {
    classesQ = classesQ.in('id', ['__none__']);
  }
  const { data: classRows } = await classesQ;
  const allClasses = (classRows ?? []).map((c: any) => ({
    id: c.id as string,
    name: c.name as string,
    batchId: (c.batch_id ?? null) as string | null,
  }));

  return <BatchesClient batches={batches} allClasses={allClasses} />;
}
