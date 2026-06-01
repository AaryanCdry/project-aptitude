'use server';

import { cache } from 'react';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export type Role = 'SUPER_ADMIN' | 'ADMIN' | 'SUB_ADMIN' | 'MENTOR' | 'STUDENT';

export interface CallerScope {
  userId: string | null;
  role: Role | null;
  collegeId: string | null;
  departmentId: string | null;
  classIds: string[];
}

const EMPTY: CallerScope = {
  userId: null,
  role: null,
  collegeId: null,
  departmentId: null,
  classIds: [],
};

export const getCallerScope = cache(async (): Promise<CallerScope> => {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return EMPTY;

  const adminClient = createAdminClient();
  const { data: profile } = await adminClient
    .from('users')
    .select('id, role, college_id, department_id, class_id')
    .eq('id', user.id)
    .single();

  if (!profile) return EMPTY;

  const role = (profile.role ?? 'STUDENT') as Role;

  let classIds: string[] = [];
  if (role === 'MENTOR') {
    const { data: assignments } = await adminClient
      .from('mentor_classes')
      .select('class_id')
      .eq('mentor_id', user.id);
    classIds = (assignments ?? []).map((r: any) => r.class_id);
  } else if (role === 'STUDENT' && profile.class_id) {
    classIds = [profile.class_id];
  }

  return {
    userId: profile.id,
    role,
    collegeId: profile.college_id ?? null,
    departmentId: profile.department_id ?? null,
    classIds,
  };
});

// Resolve which class IDs the caller may operate on, given their scope.
// - SUPER_ADMIN: no restriction (returns null → "all")
// - ADMIN (Principal): all classes within their college
// - SUB_ADMIN (HOD):   all classes within their department
// - MENTOR:            only classes assigned via mentor_classes
// - STUDENT:           their own class (rarely useful for action gating)
export async function resolveAllowedClassIds(scope: CallerScope): Promise<string[] | null> {
  if (!scope.role) return [];
  if (scope.role === 'SUPER_ADMIN') return null;

  const adminClient = createAdminClient();

  if (scope.role === 'ADMIN') {
    if (!scope.collegeId) return [];
    const { data: depts } = await adminClient
      .from('departments')
      .select('id')
      .eq('college_id', scope.collegeId);
    const deptIds = (depts ?? []).map((d: any) => d.id);
    if (deptIds.length === 0) return [];
    const { data: classes } = await adminClient
      .from('classes')
      .select('id')
      .in('dept_id', deptIds);
    return (classes ?? []).map((c: any) => c.id);
  }

  if (scope.role === 'SUB_ADMIN') {
    if (!scope.departmentId) return [];
    const { data: classes } = await adminClient
      .from('classes')
      .select('id')
      .eq('dept_id', scope.departmentId);
    return (classes ?? []).map((c: any) => c.id);
  }

  if (scope.role === 'MENTOR') return scope.classIds;
  if (scope.role === 'STUDENT') return scope.classIds;

  return [];
}

// Can the caller view the dashboard of the given student?
//   - SUPER_ADMIN: always
//   - the student themselves: always
//   - ADMIN (Principal):  target must share the caller's college
//   - SUB_ADMIN (HOD):    target must share the caller's college AND department
//   - MENTOR:             target's class_id must be in the mentor's classIds
//   - anyone else:        no
export async function canViewStudent(studentId: string): Promise<boolean> {
  const scope = await getCallerScope();
  if (!scope.userId || !scope.role) return false;
  if (scope.userId === studentId) return true;
  if (scope.role === 'SUPER_ADMIN') return true;

  const adminClient = createAdminClient();
  const { data: target } = await adminClient
    .from('users')
    .select('id, role, college_id, department_id, class_id')
    .eq('id', studentId)
    .eq('role', 'STUDENT')
    .single();
  if (!target) return false;

  if (scope.role === 'ADMIN') return target.college_id === scope.collegeId;
  if (scope.role === 'SUB_ADMIN') {
    return target.college_id === scope.collegeId && target.department_id === scope.departmentId;
  }
  if (scope.role === 'MENTOR') {
    return target.class_id != null && scope.classIds.includes(target.class_id);
  }
  return false;
}
