'use server';

import { createAdminClient } from '@/lib/supabase/admin';
import { revalidatePath } from 'next/cache';
import { getCallerScope } from './scope';

const ALLOWED = ['ADMIN', 'SUB_ADMIN', 'SUPER_ADMIN'];

function revalidateAll() {
  revalidatePath('/admin/batches');
  revalidatePath('/admin/classes');
}

export type AcademicYear = {
  id: string;
  name: string;
  start_date: string | null;
  end_date: string | null;
  is_current: boolean;
  classCount: number;
};

export async function getAcademicYears(): Promise<AcademicYear[]> {
  const scope = await getCallerScope();
  if (!scope.userId || !ALLOWED.includes(scope.role ?? '')) return [];
  if (!scope.collegeId) return [];

  const adminClient = createAdminClient();

  const { data: years } = await adminClient
    .from('academic_years')
    .select('id, name, start_date, end_date, is_current')
    .eq('college_id', scope.collegeId)
    .order('start_date', { ascending: false, nullsFirst: false });

  if (!years || years.length === 0) return [];

  const yearIds = years.map((y: any) => y.id as string);

  const { data: classes } = await adminClient
    .from('classes')
    .select('id, academic_year_id')
    .in('academic_year_id', yearIds);

  const countByYear: Record<string, number> = {};
  for (const c of classes ?? []) {
    const ayid = (c as any).academic_year_id as string;
    countByYear[ayid] = (countByYear[ayid] ?? 0) + 1;
  }

  return (years as any[]).map((y) => ({
    id: y.id as string,
    name: y.name as string,
    start_date: (y.start_date ?? null) as string | null,
    end_date: (y.end_date ?? null) as string | null,
    is_current: y.is_current as boolean,
    classCount: countByYear[y.id] ?? 0,
  }));
}

export async function createAcademicYear(formData: FormData) {
  const scope = await getCallerScope();
  if (!scope.userId) return { error: 'Not authenticated' };
  if (!ALLOWED.includes(scope.role ?? '')) return { error: 'Not authorized.' };
  if (!scope.collegeId) return { error: 'No college scope.' };

  const name = ((formData.get('name') as string) ?? '').trim();
  if (!name) return { error: 'Academic year name is required.' };

  const start_date = (formData.get('start_date') as string) || null;
  const end_date = (formData.get('end_date') as string) || null;
  const is_current = formData.get('is_current') === 'true';

  const adminClient = createAdminClient();

  if (is_current) {
    await adminClient
      .from('academic_years')
      .update({ is_current: false })
      .eq('college_id', scope.collegeId);
  }

  const { error } = await adminClient.from('academic_years').insert({
    college_id: scope.collegeId,
    name,
    start_date,
    end_date,
    is_current,
  });

  if (error) return { error: error.message };
  revalidateAll();
  return { success: true as const };
}

export async function updateAcademicYear(
  id: string,
  data: { name: string; start_date: string | null; end_date: string | null }
) {
  const scope = await getCallerScope();
  if (!scope.userId) return { error: 'Not authenticated' };
  if (!ALLOWED.includes(scope.role ?? '')) return { error: 'Not authorized.' };
  if (!data.name.trim()) return { error: 'Name is required.' };

  const adminClient = createAdminClient();
  const { data: existing } = await adminClient
    .from('academic_years')
    .select('id, college_id')
    .eq('id', id)
    .single();
  if (!existing) return { error: 'Academic year not found.' };
  if (scope.role !== 'SUPER_ADMIN' && (existing as any).college_id !== scope.collegeId)
    return { error: 'Outside your college scope.' };

  const { error } = await adminClient
    .from('academic_years')
    .update({ name: data.name.trim(), start_date: data.start_date, end_date: data.end_date })
    .eq('id', id);

  if (error) return { error: error.message };
  revalidateAll();
  return { success: true as const };
}

export async function setCurrentAcademicYear(id: string) {
  const scope = await getCallerScope();
  if (!scope.userId) return { error: 'Not authenticated' };
  if (!ALLOWED.includes(scope.role ?? '')) return { error: 'Not authorized.' };
  if (!scope.collegeId) return { error: 'No college scope.' };

  const adminClient = createAdminClient();
  const { data: existing } = await adminClient
    .from('academic_years')
    .select('id, college_id')
    .eq('id', id)
    .single();
  if (!existing) return { error: 'Academic year not found.' };
  if (scope.role !== 'SUPER_ADMIN' && (existing as any).college_id !== scope.collegeId)
    return { error: 'Outside your college scope.' };

  await adminClient
    .from('academic_years')
    .update({ is_current: false })
    .eq('college_id', scope.collegeId);

  const { error } = await adminClient
    .from('academic_years')
    .update({ is_current: true })
    .eq('id', id);

  if (error) return { error: error.message };
  revalidateAll();
  return { success: true as const };
}

export async function deleteAcademicYear(id: string) {
  const scope = await getCallerScope();
  if (!scope.userId) return { error: 'Not authenticated' };
  if (!ALLOWED.includes(scope.role ?? '')) return { error: 'Not authorized.' };

  const adminClient = createAdminClient();
  const { data: existing } = await adminClient
    .from('academic_years')
    .select('id, college_id')
    .eq('id', id)
    .single();
  if (!existing) return { error: 'Academic year not found.' };
  if (scope.role !== 'SUPER_ADMIN' && (existing as any).college_id !== scope.collegeId)
    return { error: 'Outside your college scope.' };

  const { data: classes } = await adminClient
    .from('classes')
    .select('id')
    .eq('academic_year_id', id)
    .limit(1);
  if (classes && classes.length > 0)
    return { error: 'Remove all classes from this academic year before deleting.' };

  const { error } = await adminClient.from('academic_years').delete().eq('id', id);
  if (error) return { error: error.message };
  revalidateAll();
  return { success: true as const };
}
