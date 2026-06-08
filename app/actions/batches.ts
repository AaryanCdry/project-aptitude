'use server';

import { createAdminClient } from '@/lib/supabase/admin';
import { revalidatePath } from 'next/cache';
import { getCallerScope } from './scope';

const ALLOWED = ['ADMIN', 'SUB_ADMIN', 'SUPER_ADMIN'];

function revalidateAll() {
  revalidatePath('/admin/batches');
  revalidatePath('/admin/classes');
}

export async function getBatches() {
  const scope = await getCallerScope();
  if (!scope.userId || !ALLOWED.includes(scope.role ?? '')) return [];

  const adminClient = createAdminClient();

  let query = adminClient
    .from('batches')
    .select('id, name, start_date, end_date, status, college_id')
    .order('start_date', { ascending: false, nullsFirst: false });

  if (scope.role !== 'SUPER_ADMIN') {
    if (!scope.collegeId) return [];
    query = (query as any).eq('college_id', scope.collegeId);
  }

  const { data: batches } = await query;
  if (!batches || batches.length === 0) return [];

  const batchIds = batches.map((b: any) => b.id as string);

  // Classes per batch (with academic year)
  const { data: classes } = await adminClient
    .from('classes')
    .select('id, name, batch_id, academic_year_id, academic_years!academic_year_id(id, name)')
    .in('batch_id', batchIds);

  const classesByBatch: Record<string, Array<{ id: string; name: string }>> = {};
  const allClassIds: string[] = [];
  // Track AY IDs per batch to derive consistent AY
  const ayIdsByBatch: Record<string, Set<string>> = {};
  const ayNameById: Record<string, string> = {};

  for (const c of classes ?? []) {
    const bid = (c as any).batch_id as string;
    if (!classesByBatch[bid]) classesByBatch[bid] = [];
    classesByBatch[bid].push({ id: (c as any).id, name: (c as any).name });
    allClassIds.push((c as any).id);
    const ayId = (c as any).academic_year_id as string | null;
    if (!ayIdsByBatch[bid]) ayIdsByBatch[bid] = new Set();
    if (ayId) {
      ayIdsByBatch[bid].add(ayId);
      const ayName = (c as any).academic_years?.name as string | undefined;
      if (ayName) ayNameById[ayId] = ayName;
    } else {
      // null sentinel so we can detect mixed
      ayIdsByBatch[bid].add('__null__');
    }
  }

  // Student counts per class
  const studentPerClass: Record<string, number> = {};
  if (allClassIds.length > 0) {
    const { data: students } = await adminClient
      .from('users')
      .select('class_id')
      .in('class_id', allClassIds)
      .eq('role', 'STUDENT');
    for (const s of students ?? []) {
      const cid = (s as any).class_id as string;
      studentPerClass[cid] = (studentPerClass[cid] ?? 0) + 1;
    }
  }

  return (batches as any[]).map((b) => {
    const bClasses = classesByBatch[b.id] ?? [];
    const studentTotal = bClasses.reduce((sum, c) => sum + (studentPerClass[c.id] ?? 0), 0);

    // Derive current AY: consistent across all classes → show it; mixed/none → null
    const aySet = ayIdsByBatch[b.id] ?? new Set();
    const nonNullAys = [...aySet].filter(id => id !== '__null__');
    const consistent = aySet.size === 1 && nonNullAys.length === 1;
    const currentAcademicYearId = consistent ? nonNullAys[0] : null;
    const currentAcademicYearName = currentAcademicYearId ? (ayNameById[currentAcademicYearId] ?? null) : null;

    return {
      id: b.id as string,
      name: b.name as string,
      start_date: (b.start_date ?? null) as string | null,
      end_date: (b.end_date ?? null) as string | null,
      status: b.status as 'ACTIVE' | 'ARCHIVED',
      classes: bClasses,
      classCount: bClasses.length,
      studentCount: studentTotal,
      currentAcademicYearId,
      currentAcademicYearName,
    };
  });
}

// Lightweight version for scheduling dropdowns — only ACTIVE batches with class_ids
export async function getBatchesForScheduling() {
  const scope = await getCallerScope();
  if (!scope.userId || !ALLOWED.includes(scope.role ?? '')) return [];

  const adminClient = createAdminClient();

  let query = adminClient
    .from('batches')
    .select('id, name')
    .eq('status', 'ACTIVE')
    .order('name');

  if (scope.role !== 'SUPER_ADMIN') {
    if (!scope.collegeId) return [];
    query = (query as any).eq('college_id', scope.collegeId);
  }

  const { data: batches } = await query;
  if (!batches || batches.length === 0) return [];

  const batchIds = batches.map((b: any) => b.id as string);
  const { data: classes } = await adminClient
    .from('classes')
    .select('id, name, batch_id')
    .in('batch_id', batchIds);

  const classesByBatch: Record<string, Array<{ id: string; name: string }>> = {};
  for (const c of classes ?? []) {
    const bid = (c as any).batch_id as string;
    if (!classesByBatch[bid]) classesByBatch[bid] = [];
    classesByBatch[bid].push({ id: (c as any).id, name: (c as any).name });
  }

  return (batches as any[]).map((b) => ({
    id: b.id as string,
    name: b.name as string,
    classes: classesByBatch[b.id] ?? [],
  }));
}

export async function createBatch(formData: FormData) {
  const scope = await getCallerScope();
  if (!scope.userId) return { error: 'Not authenticated' };
  if (!ALLOWED.includes(scope.role ?? '')) return { error: 'Not authorized.' };
  if (!scope.collegeId) return { error: 'No college scope.' };

  const name = ((formData.get('name') as string) ?? '').trim();
  if (!name) return { error: 'Batch name is required.' };

  const start_date = (formData.get('start_date') as string) || null;
  const end_date = (formData.get('end_date') as string) || null;

  const adminClient = createAdminClient();
  const { error } = await adminClient.from('batches').insert({
    college_id: scope.collegeId,
    name,
    start_date,
    end_date,
    status: 'ACTIVE',
  });

  if (error) return { error: error.message };
  revalidateAll();
  return { success: true as const };
}

export async function updateBatch(batchId: string, data: { name: string; start_date: string | null; end_date: string | null }) {
  const scope = await getCallerScope();
  if (!scope.userId) return { error: 'Not authenticated' };
  if (!ALLOWED.includes(scope.role ?? '')) return { error: 'Not authorized.' };
  if (!data.name.trim()) return { error: 'Name is required.' };

  const adminClient = createAdminClient();
  const { data: existing } = await adminClient.from('batches').select('id, college_id').eq('id', batchId).single();
  if (!existing) return { error: 'Batch not found.' };
  if (scope.role !== 'SUPER_ADMIN' && (existing as any).college_id !== scope.collegeId) return { error: 'Outside your college scope.' };

  const { error } = await adminClient
    .from('batches')
    .update({ name: data.name.trim(), start_date: data.start_date, end_date: data.end_date })
    .eq('id', batchId);

  if (error) return { error: error.message };
  revalidateAll();
  return { success: true as const };
}

export async function archiveBatch(batchId: string, archive: boolean) {
  const scope = await getCallerScope();
  if (!scope.userId) return { error: 'Not authenticated' };
  if (!ALLOWED.includes(scope.role ?? '')) return { error: 'Not authorized.' };

  const adminClient = createAdminClient();
  const { data: existing } = await adminClient.from('batches').select('id, college_id').eq('id', batchId).single();
  if (!existing) return { error: 'Batch not found.' };
  if (scope.role !== 'SUPER_ADMIN' && (existing as any).college_id !== scope.collegeId) return { error: 'Outside your college scope.' };

  const { error } = await adminClient.from('batches').update({ status: archive ? 'ARCHIVED' : 'ACTIVE' }).eq('id', batchId);
  if (error) return { error: error.message };
  revalidateAll();
  return { success: true as const };
}

export async function deleteBatch(batchId: string) {
  const scope = await getCallerScope();
  if (!scope.userId) return { error: 'Not authenticated' };
  if (!ALLOWED.includes(scope.role ?? '')) return { error: 'Not authorized.' };

  const adminClient = createAdminClient();
  const { data: existing } = await adminClient.from('batches').select('id, college_id').eq('id', batchId).single();
  if (!existing) return { error: 'Batch not found.' };
  if (scope.role !== 'SUPER_ADMIN' && (existing as any).college_id !== scope.collegeId) return { error: 'Outside your college scope.' };

  const { data: classes } = await adminClient.from('classes').select('id').eq('batch_id', batchId).limit(1);
  if (classes && classes.length > 0) return { error: 'Remove all classes from this batch before deleting.' };

  const { error } = await adminClient.from('batches').delete().eq('id', batchId);
  if (error) return { error: error.message };
  revalidateAll();
  return { success: true as const };
}

export async function assignClassToBatch(classId: string, batchId: string) {
  const scope = await getCallerScope();
  if (!scope.userId) return { error: 'Not authenticated' };
  if (!ALLOWED.includes(scope.role ?? '')) return { error: 'Not authorized.' };

  const adminClient = createAdminClient();
  const { data: cls } = await adminClient
    .from('classes')
    .select('id, dept_id, departments!dept_id(college_id)')
    .eq('id', classId)
    .single();

  if (!cls) return { error: 'Class not found.' };
  if (scope.role !== 'SUPER_ADMIN' && (cls as any).departments?.college_id !== scope.collegeId) return { error: 'Class outside your college.' };

  // Also verify the batch belongs to the same college (prevents cross-tenant assignment)
  const { data: batch } = await adminClient.from('batches').select('id, college_id').eq('id', batchId).single();
  if (!batch) return { error: 'Batch not found.' };
  if (scope.role !== 'SUPER_ADMIN' && (batch as any).college_id !== scope.collegeId) return { error: 'Batch outside your college scope.' };

  const { error } = await adminClient.from('classes').update({ batch_id: batchId }).eq('id', classId);
  if (error) return { error: error.message };
  revalidateAll();
  return { success: true as const };
}

export async function removeClassFromBatch(classId: string) {
  const scope = await getCallerScope();
  if (!scope.userId) return { error: 'Not authenticated' };
  if (!ALLOWED.includes(scope.role ?? '')) return { error: 'Not authorized.' };

  const adminClient = createAdminClient();

  // Verify the class belongs to the caller's college before clearing its batch
  const { data: cls } = await adminClient
    .from('classes')
    .select('id, dept_id, departments!dept_id(college_id)')
    .eq('id', classId)
    .single();
  if (!cls) return { error: 'Class not found.' };
  if (scope.role !== 'SUPER_ADMIN' && (cls as any).departments?.college_id !== scope.collegeId) {
    return { error: 'Class outside your college scope.' };
  }

  const { error } = await adminClient.from('classes').update({ batch_id: null }).eq('id', classId);
  if (error) return { error: error.message };
  revalidateAll();
  return { success: true as const };
}

export async function setBatchAcademicYear(batchId: string, academicYearId: string | null) {
  const scope = await getCallerScope();
  if (!scope.userId) return { error: 'Not authenticated' };
  if (!ALLOWED.includes(scope.role ?? '')) return { error: 'Not authorized.' };

  const adminClient = createAdminClient();
  const { data: existing } = await adminClient.from('batches').select('id, college_id').eq('id', batchId).single();
  if (!existing) return { error: 'Batch not found.' };
  if (scope.role !== 'SUPER_ADMIN' && (existing as any).college_id !== scope.collegeId)
    return { error: 'Outside your college scope.' };

  const { error } = await adminClient
    .from('classes')
    .update({ academic_year_id: academicYearId })
    .eq('batch_id', batchId);

  if (error) return { error: error.message };
  revalidateAll();
  return { success: true as const };
}
