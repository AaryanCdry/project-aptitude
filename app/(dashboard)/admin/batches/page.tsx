import { getBatches } from '@/app/actions/batches';
import { getAcademicYears } from '@/app/actions/academic-years';
import { getCallerScope, resolveAllowedClassIds } from '@/app/actions/scope';
import { createAdminClient } from '@/lib/supabase/admin';
import BatchesClient from './BatchesClient';

type ClassRow = { id: string; name: string; batch_id: string | null };

export default async function BatchesPage() {
  const [batches, academicYears, scope] = await Promise.all([getBatches(), getAcademicYears(), getCallerScope()]);

  // All classes for this college (for the "Add class" dropdowns)
  const adminClient = createAdminClient();
  const allowedClassIds = await resolveAllowedClassIds(scope);

  // allowedClassIds == null  → unrestricted (no filter)
  // allowedClassIds is []    → explicitly no access (limit 0)
  // allowedClassIds is [...] → restricted to those IDs
  const classesQ = (() => {
    const base = adminClient
      .from('classes')
      .select('id, name, batch_id')
      .order('name');
    if (allowedClassIds == null) return base;
    if (allowedClassIds.length === 0) return base.limit(0);
    return base.in('id', allowedClassIds);
  })();

  const { data, error: classesError } = await classesQ;
  if (classesError) throw new Error(`Failed to load classes: ${classesError.message}`);
  const classRows = data as ClassRow[] | null;

  const allClasses = (classRows ?? []).map(c => ({
    id: c.id,
    name: c.name,
    batchId: c.batch_id,
  }));

  return <BatchesClient batches={batches} allClasses={allClasses} academicYears={academicYears} />;
}
