'use server';

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { revalidatePath } from 'next/cache';
import { getCallerScope } from './scope';

// ─── Fetch all enrolled students (scoped by caller role) ────────────────────
// ADMIN (Principal)  → all students in college
// SUB_ADMIN (HOD)    → only students in their department
// MENTOR             → only students in their assigned classes

export async function getEnrolledStudents() {
  const scope = await getCallerScope();
  if (!scope.userId) return [];

  let query = createAdminClient()
    .from('users')
    .select(`
      id, name, email, role, created_at, temp_password,
      registration_id, section, semester, department_id, class_id,
      departments!department_id(name),
      classes!class_id(name, year, batches!batch_id(name), academic_years!academic_year_id(name))
    `)
    .eq('role', 'STUDENT')
    .order('created_at', { ascending: false });

  if (scope.collegeId) query = (query as any).eq('college_id', scope.collegeId);

  if (scope.role === 'SUB_ADMIN') {
    if (!scope.departmentId) return [];
    query = (query as any).eq('department_id', scope.departmentId);
  } else if (scope.role === 'MENTOR') {
    if (scope.classIds.length === 0) return [];
    query = (query as any).in('class_id', scope.classIds);
  }

  const { data, error } = await query;
  if (error) {
    console.error('Error fetching students:', error.message ?? JSON.stringify(error));
    return [];
  }

  // Fetch last_sign_in_at for all students from auth.users in one call
  const adminClient = createAdminClient();
  const authMap: Record<string, string | null> = {};
  try {
    const { data: { users: authUsers } } = await adminClient.auth.admin.listUsers({
      page: 1,
      perPage: 1000,
    });
    (authUsers ?? []).forEach((au: any) => {
      authMap[au.id] = au.last_sign_in_at ?? null;
    });
  } catch {
    // If auth fetch fails, fall through — status will degrade to INVITED/INACTIVE
  }

  const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;

  return (data ?? []).map((u: any, i: number) => {
    const year = new Date(u.created_at).getFullYear();
    const lastSignIn = authMap[u.id] ?? null;
    const status = !lastSignIn
      ? 'INVITED'
      : new Date(lastSignIn).getTime() > sevenDaysAgo
        ? 'ACTIVE'
        : 'INACTIVE';
    return {
      ...u,
      platformId: `STU-${year}-${String(i + 1).padStart(3, '0')}`,
      departmentName: (u.departments as any)?.name ?? null,
      className: (u.classes as any)?.name ?? null,
      classYear: (u.classes as any)?.year ?? null,
      batchName: (u.classes as any)?.batches?.name ?? null,
      academicYearName: (u.classes as any)?.academic_years?.name ?? null,
      status,
      dateEnrolled: new Date(u.created_at).toLocaleDateString('en-US', {
        month: 'short', day: 'numeric', year: 'numeric',
      }),
    };
  });
}

// ─── Enrollment stats (scoped to admin's college) ─────────────────────────────

export async function getEnrollmentStats() {
  const scope = await getCallerScope();
  if (!scope.userId) return { totalStudents: 0 };

  const adminClient = createAdminClient();

  let countQ = adminClient
    .from('users')
    .select('*', { count: 'exact', head: true })
    .eq('role', 'STUDENT');
  if (scope.collegeId) countQ = (countQ as any).eq('college_id', scope.collegeId);
  if (scope.role === 'SUB_ADMIN' && scope.departmentId) {
    countQ = (countQ as any).eq('department_id', scope.departmentId);
  } else if (scope.role === 'MENTOR') {
    if (scope.classIds.length === 0) return { totalStudents: 0 };
    countQ = (countQ as any).in('class_id', scope.classIds);
  }
  const { count: totalStudents } = await countQ;

  return { totalStudents: totalStudents ?? 0 };
}

// ─── Manual enrollment (single student) ───────────────────────────────────────

export async function enrollStudent(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Not authenticated' };

  const { data: adminProfile } = await supabase
    .from('users')
    .select('college_id')
    .eq('id', user.id)
    .single();
  const collegeId = adminProfile?.college_id ?? null;

  const name = formData.get('name') as string;
  const email = formData.get('email') as string;
  const sendInvite = formData.get('sendInvite') === 'true';
  const departmentId = (formData.get('department_id') as string) || null;
  const classId = (formData.get('class_id') as string) || null;
  const section = (formData.get('section') as string) || null;
  const registrationId = (formData.get('registration_id') as string) || null;
  const semesterRaw = (formData.get('semester') as string) || '';
  const semester = semesterRaw ? Math.max(1, Math.min(12, parseInt(semesterRaw, 10))) : null;

  if (!name || !email) return { error: 'Name and email are required.' };
  if (semesterRaw && Number.isNaN(parseInt(semesterRaw, 10))) {
    return { error: 'Semester must be a number between 1 and 12.' };
  }

  const tempPassword = Math.random().toString(36).slice(-8) + 'A1!';
  const adminClient = createAdminClient();

  const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
    email,
    password: tempPassword,
    email_confirm: true,
  });

  if (authError) return { error: authError.message };

  const userId = authData.user?.id;
  if (!userId) return { error: 'Could not create user.' };

  const { error: userError } = await adminClient.from('users').upsert({
    id: userId,
    email,
    name,
    role: 'STUDENT',
    college_id: collegeId,
    temp_password: tempPassword,
    department_id: departmentId,
    class_id: classId,
    section,
    registration_id: registrationId,
    semester,
  });

  if (userError) return { error: userError.message };

  let emailSent = false;
  let emailError: string | undefined;

  if (sendInvite) {
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${siteUrl}/login`,
    });
    emailSent = !resetError;
    emailError = resetError?.message;
  }

  revalidatePath('/admin/enrollment');
  return { success: true as const, studentId: userId, tempPassword, emailSent, emailError };
}

// ─── Bulk enrollment (CSV rows) ───────────────────────────────────────────────

export interface BulkRow {
  name: string;
  email: string;
  registration_id?: string;
  department?: string;   // name — resolved to ID on server
  class?: string;        // name — resolved to ID on server
  batch?: string;        // name — resolved to ID on server
  academic_year?: string;// name — resolved to ID on server
  section?: string;
  semester?: string;     // numeric string 1-12
}

export interface BulkResult extends BulkRow {
  studentId?: string;
  tempPassword?: string;
  status: 'valid' | 'error';
  message?: string;
}

export async function processBulkEnrollment(
  rows: BulkRow[],
): Promise<BulkResult[]> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  let collegeId: string | null = null;
  if (user) {
    const { data: adminProfile } = await supabase
      .from('users')
      .select('college_id')
      .eq('id', user.id)
      .single();
    collegeId = adminProfile?.college_id ?? null;
  }

  const adminClient = createAdminClient();
  const results: BulkResult[] = [];

  // Batch-resolve department names → IDs for this college
  const deptNameMap: Record<string, string> = {};
  if (collegeId) {
    const deptNames = [...new Set(rows.map(r => r.department?.trim()).filter(Boolean))] as string[];
    if (deptNames.length > 0) {
      const { data: deptRows } = await adminClient
        .from('departments')
        .select('id, name')
        .eq('college_id', collegeId)
        .in('name', deptNames);
      (deptRows ?? []).forEach((d: any) => { deptNameMap[d.name.toLowerCase()] = d.id; });

      // Auto-create missing departments
      const missingDepts = deptNames.filter(name => !deptNameMap[name.toLowerCase()]);
      if (missingDepts.length > 0) {
        const newDepts = missingDepts.map(name => ({
          name,
          college_id: collegeId,
          course_type: 'UG',
          semester_count: 8
        }));
        const { data: insertedDepts } = await adminClient
          .from('departments')
          .insert(newDepts)
          .select('id, name');
        (insertedDepts ?? []).forEach((d: any) => { deptNameMap[d.name.toLowerCase()] = d.id; });
      }
    }
  }

  // Batch-resolve batch names → IDs for this college
  const batchNameMap: Record<string, string> = {};
  if (collegeId) {
    const batchNames = [...new Set(rows.map(r => r.batch?.trim()).filter(Boolean))] as string[];
    if (batchNames.length > 0) {
      const { data: batchRows } = await adminClient
        .from('batches')
        .select('id, name')
        .eq('college_id', collegeId)
        .in('name', batchNames);
      (batchRows ?? []).forEach((b: any) => { batchNameMap[b.name.toLowerCase()] = b.id; });

      const missingBatches = batchNames.filter(name => !batchNameMap[name.toLowerCase()]);
      if (missingBatches.length > 0) {
        const newBatches = missingBatches.map(name => ({
          name,
          college_id: collegeId,
          start_date: `${new Date().getFullYear()}-08-01`,
          end_date: `${new Date().getFullYear() + 4}-05-31`,
          status: 'ACTIVE'
        }));
        const { data: insertedBatches } = await adminClient.from('batches').insert(newBatches).select('id, name');
        (insertedBatches ?? []).forEach((b: any) => { batchNameMap[b.name.toLowerCase()] = b.id; });
      }
    }
  }

  // Batch-resolve academic year names → IDs for this college
  const academicYearNameMap: Record<string, string> = {};
  if (collegeId) {
    const ayNames = [...new Set(rows.map(r => r.academic_year?.trim()).filter(Boolean))] as string[];
    if (ayNames.length > 0) {
      const { data: ayRows } = await adminClient
        .from('academic_years')
        .select('id, name')
        .eq('college_id', collegeId)
        .in('name', ayNames);
      (ayRows ?? []).forEach((ay: any) => { academicYearNameMap[ay.name.toLowerCase()] = ay.id; });

      const missingAys = ayNames.filter(name => !academicYearNameMap[name.toLowerCase()]);
      if (missingAys.length > 0) {
        const newAys = missingAys.map(name => ({
          name,
          college_id: collegeId,
          start_date: `${new Date().getFullYear()}-08-01`,
          end_date: `${new Date().getFullYear() + 1}-05-31`,
          is_current: true
        }));
        const { data: insertedAys } = await adminClient.from('academic_years').insert(newAys).select('id, name');
        (insertedAys ?? []).forEach((ay: any) => { academicYearNameMap[ay.name.toLowerCase()] = ay.id; });
      }
    }
  }

  // Batch-resolve class names → IDs for this college
  const classNameMap: Record<string, string> = {};
  if (collegeId) {
    // 1. Ensure a default Academic Year exists (for fallback)
    let defaultAcademicYearId: string | null = null;
    const { data: currentAy } = await adminClient.from('academic_years')
      .select('id').eq('college_id', collegeId).eq('is_current', true).limit(1).single();
    
    if (currentAy) {
      defaultAcademicYearId = currentAy.id;
    } else {
      const year = new Date().getFullYear();
      const { data: newAy } = await adminClient.from('academic_years').insert({
        college_id: collegeId,
        name: `${year}-${year + 1}`,
        start_date: `${year}-08-01`,
        end_date: `${year + 1}-05-31`,
        is_current: true
      }).select('id').single();
      defaultAcademicYearId = newAy?.id ?? null;
    }

    // 2. Ensure a default Batch exists (for fallback)
    let defaultBatchId: string | null = null;
    const { data: batches } = await adminClient.from('batches')
      .select('id').eq('college_id', collegeId).order('created_at', { ascending: false }).limit(1);
    
    if (batches && batches.length > 0) {
      defaultBatchId = batches[0].id;
    } else {
      const year = new Date().getFullYear();
      const { data: newBatch } = await adminClient.from('batches').insert({
        college_id: collegeId,
        name: `Batch ${year}-${year + 4}`,
        start_date: `${year}-08-01`,
        end_date: `${year + 4}-05-31`,
        status: 'ACTIVE'
      }).select('id').single();
      defaultBatchId = newBatch?.id ?? null;
    }

    const classNames = [...new Set(rows.map(r => r.class?.trim()).filter(Boolean))] as string[];
    if (classNames.length > 0) {
      let classQ = adminClient.from('classes').select('id, name, dept_id, departments!dept_id(college_id)').in('name', classNames);
      const { data: classRows } = await classQ;
      (classRows ?? []).forEach((c: any) => {
        if ((c.departments as any)?.college_id === collegeId) {
          classNameMap[c.name.toLowerCase()] = c.id;
        }
      });

      // Auto-create missing classes
      // We need to associate them with the department specified in the row.
      const missingClasses = classNames.filter(name => !classNameMap[name.toLowerCase()]);
      if (missingClasses.length > 0) {
        const newClasses = [];
        for (const clsName of missingClasses) {
          // Find the department for this class from the first row that mentions it
          const rowForClass = rows.find(r => r.class?.trim().toLowerCase() === clsName.toLowerCase());
          const deptName = rowForClass?.department?.trim().toLowerCase();
          const deptId = deptName ? deptNameMap[deptName] : null;
          
          const rowBatchName = rowForClass?.batch?.trim().toLowerCase();
          const rowAyName = rowForClass?.academic_year?.trim().toLowerCase();

          const batchIdToUse = rowBatchName && batchNameMap[rowBatchName] ? batchNameMap[rowBatchName] : defaultBatchId;
          const ayIdToUse = rowAyName && academicYearNameMap[rowAyName] ? academicYearNameMap[rowAyName] : defaultAcademicYearId;
          
          if (deptId) {
            newClasses.push({
              name: rowForClass!.class!.trim(),
              dept_id: deptId,
              year: 1, // default to year 1
              academic_year_id: ayIdToUse,
              batch_id: batchIdToUse
            });
          }
        }
        
        if (newClasses.length > 0) {
          const { data: insertedClasses } = await adminClient
            .from('classes')
            .insert(newClasses)
            .select('id, name');
          (insertedClasses ?? []).forEach((c: any) => { classNameMap[c.name.toLowerCase()] = c.id; });
        }
      }
    }
  }

  // ─── Duplicate detection (defense in depth — client also blocks these) ────
  const emailCounts = new Map<string, number>();
  for (const r of rows) {
    const key = r.email?.trim().toLowerCase();
    if (!key) continue;
    emailCounts.set(key, (emailCounts.get(key) ?? 0) + 1);
  }

  const existingEmails = new Set<string>();
  if (collegeId) {
    const { data: existingRows } = await adminClient
      .from('users')
      .select('email')
      .eq('college_id', collegeId);
    (existingRows ?? []).forEach((u: any) => {
      if (u.email) existingEmails.add(String(u.email).trim().toLowerCase());
    });
  }

  for (const row of rows) {
    const emailKey = row.email?.trim().toLowerCase();

    if (emailKey && (emailCounts.get(emailKey) ?? 0) > 1) {
      results.push({ ...row, status: 'error', message: 'Duplicate email within this upload' });
      continue;
    }

    if (emailKey && existingEmails.has(emailKey)) {
      results.push({ ...row, status: 'error', message: 'Email already enrolled' });
      continue;
    }

    if (!row.name || !row.email || !row.email.includes('@')) {
      results.push({ ...row, status: 'error', message: 'Invalid email or name' });
      continue;
    }

    const semesterRaw = row.semester?.trim() ?? '';
    const semesterNum = semesterRaw ? parseInt(semesterRaw, 10) : null;
    if (semesterRaw && (isNaN(semesterNum!) || semesterNum! < 1 || semesterNum! > 12)) {
      results.push({ ...row, status: 'error', message: 'Semester must be 1–12' });
      continue;
    }

    const departmentId = row.department ? (deptNameMap[row.department.trim().toLowerCase()] ?? null) : null;
    const classId = row.class ? (classNameMap[row.class.trim().toLowerCase()] ?? null) : null;

    const tempPassword = Math.random().toString(36).slice(-8) + 'A1!';

    try {
      const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
        email: row.email,
        password: tempPassword,
        email_confirm: true,
      });

      if (authError) {
        results.push({ ...row, status: 'error', message: authError.message });
        continue;
      }

      const userId = authData.user?.id;
      if (!userId) {
        results.push({ ...row, status: 'error', message: 'User creation failed' });
        continue;
      }

      await adminClient.from('users').upsert({
        id: userId,
        email: row.email,
        name: row.name,
        role: 'STUDENT',
        college_id: collegeId,
        temp_password: tempPassword,
        registration_id: row.registration_id?.trim() || null,
        department_id: departmentId,
        class_id: classId,
        section: row.section?.trim() || null,
        semester: semesterNum,
      });

      results.push({
        ...row,
        studentId: `AP-${new Date().getFullYear()}-${Math.floor(Math.random() * 9000 + 1000)}`,
        tempPassword,
        status: 'valid',
      });
    } catch (err: any) {
      results.push({ ...row, status: 'error', message: err?.message ?? 'Unknown error' });
    }
  }

  revalidatePath('/admin/enrollment');
  return results;
}
// ─── Update student profile details ──────────────────────────────────────────

export async function updateStudentDetails(
  studentId: string,
  data: {
    name: string;
    registration_id: string | null;
    department_id: string | null;
    class_id: string | null;
    section: string | null;
    semester: number | null;
  }
) {
  const scope = await getCallerScope();
  if (!scope.userId) return { error: 'Not authenticated' };

  const adminClient = createAdminClient();
  const { error } = await adminClient
    .from('users')
    .update({
      name: data.name,
      registration_id: data.registration_id || null,
      department_id: data.department_id || null,
      class_id: data.class_id || null,
      section: data.section || null,
      semester: data.semester || null,
    })
    .eq('id', studentId);

  if (error) return { error: error.message };
  revalidatePath('/admin/enrollment');
  return { success: true as const };
}

// ─── Remove (delete) a student account ────────────────────────────────────────

export async function removeStudent(studentId: string) {
  const scope = await getCallerScope();
  if (!scope.userId) return { error: 'Not authenticated' };

  const adminClient = createAdminClient();

  const { error: userError } = await adminClient
    .from('users')
    .delete()
    .eq('id', studentId);

  if (userError) return { error: userError.message };

  const { error: authError } = await adminClient.auth.admin.deleteUser(studentId);
  if (authError) return { error: authError.message };

  revalidatePath('/admin/enrollment');
  return { success: true as const };
}

// ─── Reset a student's password (admin action) ────────────────────────────────

export async function resetStudentPassword(studentId: string, sendEmail: boolean = true) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Not authenticated' };

  const adminClient = createAdminClient();
  const newPassword = Math.random().toString(36).slice(-8) + 'A1!';

  // Update auth password
  const { error: authError } = await adminClient.auth.admin.updateUserById(studentId, {
    password: newPassword,
  });
  if (authError) return { error: authError.message };

  // Fetch student email for sending reset link
  const { data: studentRow } = await adminClient
    .from('users')
    .select('email')
    .eq('id', studentId)
    .single();

  // Save new temp password and clear old one
  await adminClient
    .from('users')
    .update({ temp_password: newPassword })
    .eq('id', studentId);

  // Optionally send a reset email via Supabase
  if (sendEmail && studentRow?.email) {
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';
    await supabase.auth.resetPasswordForEmail(studentRow.email, {
      redirectTo: `${siteUrl}/reset-password`,
    });
  }

  revalidatePath('/admin/enrollment');
  return { success: true as const, newPassword };
}
