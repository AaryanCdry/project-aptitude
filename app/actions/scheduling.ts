'use server';

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { revalidatePath } from 'next/cache';
import { getCallerScope, resolveAllowedClassIds } from './scope';

const QUOTA_DOMAINS = ['QUANTITATIVE', 'LOGICAL', 'VERBAL', 'SPATIAL'] as const;

const STAFF_ROLES = ['ADMIN', 'SUB_ADMIN', 'MENTOR', 'SUPER_ADMIN'];

type Draft = {
  id: string;
  college_id: string | null;
  title: string;
  instructions: string | null;
  due_date: string | null;
  scheduled_at: string | null;
  class_ids: string[];
  question_ids: string[];
  domain_quotas: Record<string, number>;
  status: 'DRAFT' | 'ACTIVE';
  created_by: string;
  test_type: 'CENTER' | 'FINAL';
};

async function assertCallerCanEditDraft(assessmentId: string) {
  const scope = await getCallerScope();
  if (!scope.userId) return { error: 'Not authenticated' as const };
  const adminClient = createAdminClient();
  const { data } = await adminClient
    .from('cohort_assessments')
    .select('id, college_id, title, instructions, due_date, scheduled_at, class_ids, question_ids, domain_quotas, status, created_by, test_type')
    .eq('id', assessmentId)
    .single();
  if (!data) return { error: 'Draft not found' as const };
  const draft = data as unknown as Draft;
  if (draft.status !== 'DRAFT') return { error: 'This test has already been scheduled' as const };
  const isOwner = draft.created_by === scope.userId;
  const isPrincipal = scope.role === 'ADMIN' || scope.role === 'SUPER_ADMIN';
  if (!isOwner && !isPrincipal) return { error: 'Not authorized to edit this draft' as const };
  return { draft, adminClient, scope };
}

export async function createTestDraft(formData: FormData) {
  const scope = await getCallerScope();
  if (!scope.userId) return { error: 'Not authenticated' };
  if (!STAFF_ROLES.includes(scope.role ?? '')) return { error: 'Not authorized to schedule tests' };

  const title = ((formData.get('title') as string) ?? '').trim();
  const instructions = ((formData.get('instructions') as string) ?? '').trim() || null;
  const due_date = (formData.get('due_date') as string) || '';
  const scheduled_at_raw = (formData.get('scheduled_at') as string) || '';
  const class_ids_raw = (formData.get('class_ids') as string) || '';
  const batch_id = (formData.get('batch_id') as string) || null;
  const test_type = ((formData.get('test_type') as string) ?? 'CENTER') === 'FINAL' ? 'FINAL' : 'CENTER';
  const duration_minutes = Math.max(5, Math.min(180, parseInt((formData.get('duration_minutes') as string) || '45', 10) || 45));

  if (!title) return { error: 'Title is required.' };

  const domain_quotas: Record<string, number> = {};
  let totalQuota = 0;
  for (const d of QUOTA_DOMAINS) {
    const raw = formData.get(`quota_${d}`);
    const n = Math.max(0, Math.floor(Number(raw ?? 0) || 0));
    if (n > 0) {
      domain_quotas[d] = n;
      totalQuota += n;
    }
  }
  if (totalQuota === 0) return { error: 'Set at least one domain quota.' };

  let class_ids = class_ids_raw.split(',').map((s) => s.trim()).filter(Boolean);

  // If a batch was selected, merge its class IDs — but first verify the batch belongs to the caller's college
  if (batch_id) {
    const adminClient2 = createAdminClient();
    const { data: batchRow } = await adminClient2
      .from('batches')
      .select('id, college_id')
      .eq('id', batch_id)
      .single();
    if (!batchRow) return { error: 'Batch not found.' };
    if (scope.role !== 'SUPER_ADMIN' && (batchRow as any).college_id !== scope.collegeId) {
      return { error: 'Batch is outside your college scope.' };
    }
    const { data: batchClasses } = await adminClient2
      .from('classes')
      .select('id')
      .eq('batch_id', batch_id);
    const batchClassIds = (batchClasses ?? []).map((c: any) => c.id as string);
    class_ids = [...new Set([...class_ids, ...batchClassIds])];
  }

  if (class_ids.length === 0) return { error: 'Select at least one class.' };

  const scheduledAtIso = scheduled_at_raw ? new Date(scheduled_at_raw).toISOString() : null;
  const dueDateIso = due_date ? new Date(due_date).toISOString() : null;

  const adminClient = createAdminClient();

  // Derive college_id from the first selected class via its department
  const { data: classRow } = await adminClient
    .from('classes')
    .select('id, dept_id, departments!dept_id(college_id)')
    .eq('id', class_ids[0])
    .single();
  if (!classRow) return { error: 'Selected class not found.' };
  const college_id = (classRow.departments as any)?.college_id ?? null;

  // Scope checks
  if (scope.role !== 'SUPER_ADMIN' && scope.collegeId && college_id !== scope.collegeId) {
    return { error: 'Class outside your college scope.' };
  }

  const allowedClassIds = await resolveAllowedClassIds(scope);
  if (allowedClassIds !== null) {
    const allowedSet = new Set(allowedClassIds);
    const bad = class_ids.find((id) => !allowedSet.has(id));
    if (bad) return { error: 'One or more classes are outside your scope.' };
  }

  const { data: inserted, error } = await adminClient
    .from('cohort_assessments')
    .insert({
      college_id,
      title,
      instructions,
      due_date: dueDateIso,
      scheduled_at: scheduledAtIso,
      created_by: scope.userId,
      class_ids,
      question_ids: [],
      domain_quotas,
      status: 'DRAFT',
      test_type,
      batch_id,
      duration_minutes,
    })
    .select('id')
    .single();
  if (error) return { error: error.message };
  return { success: true as const, assessmentId: inserted.id as string };
}

export async function getDraft(assessmentId: string) {
  const scope = await getCallerScope();
  if (!scope.userId) return null;
  const adminClient = createAdminClient();
  const { data } = await adminClient
    .from('cohort_assessments')
    .select('id, college_id, title, instructions, due_date, scheduled_at, class_ids, question_ids, domain_quotas, status, created_by')
    .eq('id', assessmentId)
    .single();
  if (!data) return null;
  const draft = data as any;
  const isOwner = draft.created_by === scope.userId;
  const isPrincipal = scope.role === 'ADMIN' || scope.role === 'SUPER_ADMIN';
  if (!isOwner && !isPrincipal) return null;

  // Resolve class names for display
  const classIds: string[] = (draft.class_ids ?? []) as string[];
  let classLabel = '';
  if (classIds.length > 0) {
    const { data: classRows } = await adminClient.from('classes').select('id, name').in('id', classIds);
    const nameMap: Record<string, string> = Object.fromEntries((classRows ?? []).map((c: any) => [c.id, c.name]));
    classLabel = classIds.map((id) => nameMap[id] ?? id).filter(Boolean).join(', ');
  }

  const ids: string[] = (draft.question_ids ?? []) as string[];
  let questions: any[] = [];
  if (ids.length > 0) {
    const { data: qs } = await adminClient
      .from('questions')
      .select('id, domain, sub_type, difficulty, text, options, correct_index')
      .in('id', ids);
    questions = qs ?? [];
  }
  return {
    id: draft.id as string,
    college_id: (draft.college_id ?? null) as string | null,
    class_label: classLabel,
    title: draft.title as string,
    instructions: (draft.instructions ?? null) as string | null,
    due_date: (draft.due_date ?? null) as string | null,
    scheduled_at: (draft.scheduled_at ?? null) as string | null,
    class_ids: classIds,
    question_ids: ids,
    domain_quotas: (draft.domain_quotas ?? {}) as Record<string, number>,
    status: draft.status as 'DRAFT' | 'ACTIVE',
    created_by: draft.created_by as string,
    questions,
  };
}

export async function attachQuestionToDraft(assessmentId: string, questionId: string) {
  const gate = await assertCallerCanEditDraft(assessmentId);
  if ('error' in gate) return gate;
  const { draft, adminClient } = gate;

  const ids = (draft.question_ids ?? []) as string[];
  if (ids.includes(questionId)) return { error: 'Already attached' };

  const { data: q } = await adminClient
    .from('questions')
    .select('id, domain')
    .eq('id', questionId)
    .single();
  if (!q) return { error: 'Question not found' };

  const quotas = draft.domain_quotas ?? {};
  const target = quotas[q.domain] ?? 0;
  if (target === 0) return { error: `No quota for ${q.domain}` };

  let currentInDomain = 0;
  if (ids.length > 0) {
    const { data: existing } = await adminClient
      .from('questions')
      .select('id, domain')
      .in('id', ids);
    currentInDomain = (existing ?? []).filter((x: any) => x.domain === q.domain).length;
  }
  if (currentInDomain >= target) return { error: `${q.domain} quota is full` };

  const next = [...ids, questionId];
  const { error } = await adminClient
    .from('cohort_assessments')
    .update({ question_ids: next })
    .eq('id', assessmentId);
  if (error) return { error: error.message };
  return { success: true as const };
}

export async function attachManyToDraft(assessmentId: string, questionIds: string[]) {
  const gate = await assertCallerCanEditDraft(assessmentId);
  if ('error' in gate) return gate;
  const { draft, adminClient } = gate;

  const existing = new Set<string>((draft.question_ids ?? []) as string[]);
  const candidates = questionIds.filter((id) => !existing.has(id));
  if (candidates.length === 0) return { success: true as const, attached: 0, skipped: 0 };

  const allIds = Array.from(new Set([...existing, ...candidates]));
  const { data: qs } = await adminClient
    .from('questions')
    .select('id, domain')
    .in('id', allIds);
  const byId: Record<string, string> = Object.fromEntries((qs ?? []).map((q: any) => [q.id, q.domain]));

  const quotas = draft.domain_quotas ?? {};
  const counts: Record<string, number> = {};
  existing.forEach((id) => {
    const d = byId[id];
    if (d) counts[d] = (counts[d] ?? 0) + 1;
  });

  const accepted: string[] = [];
  for (const id of candidates) {
    const d = byId[id];
    if (!d) continue;
    const target = quotas[d] ?? 0;
    if (target === 0) continue;
    if ((counts[d] ?? 0) >= target) continue;
    counts[d] = (counts[d] ?? 0) + 1;
    accepted.push(id);
  }
  if (accepted.length === 0) return { error: 'No questions accepted — quotas full or invalid domains' };

  const finalList = [...Array.from(existing), ...accepted];
  const { error } = await adminClient
    .from('cohort_assessments')
    .update({ question_ids: finalList })
    .eq('id', assessmentId);
  if (error) return { error: error.message };
  return { success: true as const, attached: accepted.length, skipped: candidates.length - accepted.length };
}

export async function detachQuestionFromDraft(assessmentId: string, questionId: string) {
  const gate = await assertCallerCanEditDraft(assessmentId);
  if ('error' in gate) return gate;
  const { draft, adminClient } = gate;
  const next = ((draft.question_ids ?? []) as string[]).filter((id) => id !== questionId);
  const { error } = await adminClient
    .from('cohort_assessments')
    .update({ question_ids: next })
    .eq('id', assessmentId);
  if (error) return { error: error.message };
  return { success: true as const };
}

export async function finalizeTest(assessmentId: string) {
  const gate = await assertCallerCanEditDraft(assessmentId);
  if ('error' in gate) return gate;
  const { draft, adminClient } = gate;

  const ids = (draft.question_ids ?? []) as string[];
  if (ids.length === 0) return { error: 'No questions attached' };

  const { data: qs } = await adminClient
    .from('questions')
    .select('id, domain')
    .in('id', ids);
  const counts: Record<string, number> = {};
  (qs ?? []).forEach((q: any) => { counts[q.domain] = (counts[q.domain] ?? 0) + 1; });

  const quotas = draft.domain_quotas ?? {};
  for (const [d, target] of Object.entries(quotas)) {
    if ((counts[d] ?? 0) !== target) {
      return { error: `${d} quota is ${counts[d] ?? 0}/${target} — finalize requires an exact match` };
    }
  }

  // Get students from the selected classes directly (no cohort_members needed)
  const classIds = (draft.class_ids ?? []) as string[];
  let studentIds: string[] = [];
  if (classIds.length > 0) {
    const { data: classStudents } = await adminClient
      .from('users')
      .select('id')
      .eq('role', 'STUDENT')
      .in('class_id', classIds);
    studentIds = (classStudents ?? []).map((u: any) => u.id);
  }

  const { error: flipErr } = await adminClient
    .from('cohort_assessments')
    .update({ status: 'ACTIVE' })
    .eq('id', assessmentId);
  if (flipErr) return { error: flipErr.message };

  let scheduled = 0;
  if (studentIds.length > 0) {
    const testType = (draft.test_type ?? 'CENTER') as 'CENTER' | 'FINAL';
    const rows = studentIds.map((id) => ({
      student_id: id,
      type: testType,
      status: 'SCHEDULED' as const,
      scheduled_at: draft.scheduled_at ?? new Date().toISOString(),
      assessment_id: assessmentId,
    }));
    const { error: testsError } = await adminClient.from('tests').insert(rows);
    if (testsError) {
      await adminClient.from('cohort_assessments').update({ status: 'DRAFT' }).eq('id', assessmentId);
      return { error: `Failed to schedule tests: ${testsError.message}` };
    }
    scheduled = rows.length;
  }

  if (draft.test_type === 'FINAL') {
    revalidatePath('/admin/finals');
  } else {
    revalidatePath('/admin/assessments');
  }
  return { success: true as const, scheduled };
}

export async function discardDraft(assessmentId: string) {
  const gate = await assertCallerCanEditDraft(assessmentId);
  if ('error' in gate) return gate;
  const { adminClient } = gate;
  const { error } = await adminClient
    .from('cohort_assessments')
    .delete()
    .eq('id', assessmentId)
    .eq('status', 'DRAFT');
  if (error) return { error: error.message };
  return { success: true as const };
}

export async function updateTestDraft(
  assessmentId: string,
  data: {
    title: string;
    instructions: string | null;
    scheduled_at: string | null;
    due_date: string | null;
    class_ids: string[];
    domain_quotas: Record<string, number>;
    duration_minutes: number;
  }
) {
  const gate = await assertCallerCanEditDraft(assessmentId);
  if ('error' in gate) return gate;
  const { adminClient, scope } = gate;

  if (!data.title.trim()) return { error: 'Title is required.' };
  if (data.class_ids.length === 0) return { error: 'Select at least one class.' };
  const totalQuota = Object.values(data.domain_quotas).reduce((s, n) => s + n, 0);
  if (totalQuota === 0) return { error: 'Set at least one domain quota.' };

  const allowedClassIds = await resolveAllowedClassIds(scope);
  if (allowedClassIds !== null) {
    const allowedSet = new Set(allowedClassIds);
    const bad = data.class_ids.find((id) => !allowedSet.has(id));
    if (bad) return { error: 'One or more classes are outside your scope.' };
  }

  const { error } = await adminClient
    .from('cohort_assessments')
    .update({
      title: data.title.trim(),
      instructions: data.instructions || null,
      scheduled_at: data.scheduled_at,
      due_date: data.due_date,
      class_ids: data.class_ids,
      domain_quotas: data.domain_quotas,
      question_ids: [],
      duration_minutes: Math.max(5, Math.min(180, data.duration_minutes || 45)),
    })
    .eq('id', assessmentId);

  if (error) return { error: error.message };
  revalidatePath('/admin/assessments');
  return { success: true as const };
}

export async function deleteScheduledAssessment(assessmentId: string) {
  const scope = await getCallerScope();
  if (!scope.userId) return { error: 'Not authenticated' };

  const adminClient = createAdminClient();
  const { data: row } = await adminClient
    .from('cohort_assessments')
    .select('id, status, created_by')
    .eq('id', assessmentId)
    .single();

  if (!row) return { error: 'Assessment not found.' };
  if (row.status === 'DRAFT') return { error: 'Use discard for draft assessments.' };

  const isOwner = row.created_by === scope.userId;
  const isPrincipal = scope.role === 'ADMIN' || scope.role === 'SUPER_ADMIN';
  if (!isOwner && !isPrincipal) return { error: 'Not authorized to delete this assessment.' };

  // Block deletion if any student has already completed this test
  const { count } = await adminClient
    .from('tests')
    .select('id', { count: 'exact', head: true })
    .eq('assessment_id', assessmentId)
    .eq('status', 'COMPLETED');

  if ((count ?? 0) > 0) {
    return { error: `Cannot delete: ${count} student(s) have already completed this test. Export their results first.` };
  }

  const { error } = await adminClient
    .from('cohort_assessments')
    .delete()
    .eq('id', assessmentId);

  if (error) return { error: error.message };
  revalidatePath('/admin/assessments');
  return { success: true as const };
}

export async function updateActiveAssessment(
  assessmentId: string,
  data: {
    title: string;
    instructions: string | null;
    scheduled_at: string | null;
    due_date: string | null;
  }
) {
  const scope = await getCallerScope();
  if (!scope.userId) return { error: 'Not authenticated' };

  if (!data.title.trim()) return { error: 'Title is required.' };

  const adminClient = createAdminClient();
  const { data: row } = await adminClient
    .from('cohort_assessments')
    .select('id, college_id, status, created_by')
    .eq('id', assessmentId)
    .single();

  if (!row) return { error: 'Assessment not found.' };
  if (row.status !== 'ACTIVE') return { error: 'Only finalized assessments can be edited here.' };

  const isOwner = row.created_by === scope.userId;
  const isPrincipal = scope.role === 'ADMIN' || scope.role === 'SUPER_ADMIN';
  if (!isOwner && !isPrincipal) return { error: 'Not authorized to edit this assessment.' };

  const { error } = await adminClient
    .from('cohort_assessments')
    .update({
      title: data.title.trim(),
      instructions: data.instructions || null,
      scheduled_at: data.scheduled_at,
      due_date: data.due_date,
    })
    .eq('id', assessmentId);

  if (error) return { error: error.message };
  revalidatePath('/admin/assessments');
  return { success: true as const };
}

export async function getDraftAssessments() {
  const scope = await getCallerScope();
  if (!scope.userId) return [];

  const adminClient = createAdminClient();

  let query = adminClient
    .from('cohort_assessments')
    .select('id, title, instructions, scheduled_at, due_date, class_ids, domain_quotas, question_ids, created_at, created_by, duration_minutes')
    .eq('status', 'DRAFT')
    .eq('test_type', 'CENTER')
    .order('created_at', { ascending: false });

  if (scope.role !== 'SUPER_ADMIN') {
    if (scope.collegeId) query = (query as any).eq('college_id', scope.collegeId);
    if (scope.role !== 'ADMIN') {
      query = (query as any).eq('created_by', scope.userId);
    }
  }

  const { data, error } = await query;
  if (error) return [];

  const rows = data ?? [];
  const allClassIds = [...new Set(rows.flatMap((a: any) => (a.class_ids ?? []) as string[]))];
  const classNameMap: Record<string, string> = {};
  if (allClassIds.length > 0) {
    const { data: classRows } = await adminClient.from('classes').select('id, name').in('id', allClassIds);
    (classRows ?? []).forEach((c: any) => { classNameMap[c.id] = c.name; });
  }

  return rows.map((a: any) => {
    const classIds = (a.class_ids ?? []) as string[];
    const classLabel = classIds.map((id: string) => classNameMap[id] ?? '').filter(Boolean).join(', ') || null;
    const quotas = (a.domain_quotas ?? {}) as Record<string, number>;
    const totalQuota = Object.values(quotas).reduce((s: number, n: number) => s + n, 0);
    const attached = ((a.question_ids ?? []) as string[]).length;
    return {
      id: a.id as string,
      title: a.title as string,
      instructions: (a.instructions ?? null) as string | null,
      scheduled_at: (a.scheduled_at ?? null) as string | null,
      due_date: (a.due_date ?? null) as string | null,
      class_ids: classIds,
      class_label: classLabel,
      domain_quotas: quotas,
      total_quota: totalQuota,
      attached,
      created_at: a.created_at as string,
      duration_minutes: (a.duration_minutes ?? 45) as number,
    };
  });
}

export async function searchBankQuestions(args: {
  domain: string;
  difficultyMin?: number;
  difficultyMax?: number;
  subType?: string;
  search?: string;
  excludeIds?: string[];
  limit?: number;
}) {
  const scope = await getCallerScope();
  if (!scope.userId) return [];
  if (!STAFF_ROLES.includes(scope.role ?? '')) return [];

  const adminClient = createAdminClient();
  let q: any = adminClient
    .from('questions')
    .select('id, domain, sub_type, difficulty, text, options, correct_index')
    .eq('domain', args.domain)
    .eq('active', true)
    .order('created_at', { ascending: false })
    .limit(args.limit ?? 100);

  if (typeof args.difficultyMin === 'number') q = q.gte('difficulty', args.difficultyMin);
  if (typeof args.difficultyMax === 'number') q = q.lte('difficulty', args.difficultyMax);
  if (args.subType) q = q.eq('sub_type', args.subType);
  if (args.search) q = q.ilike('text', `%${args.search}%`);
  if (args.excludeIds && args.excludeIds.length > 0) {
    q = q.not('id', 'in', `(${args.excludeIds.join(',')})`);
  }
  const { data } = await q;
  return data ?? [];
}
