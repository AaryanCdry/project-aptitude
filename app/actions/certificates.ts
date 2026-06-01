'use server';

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { revalidatePath } from 'next/cache';

// Certificates are now AUTO-ISSUED when a FINAL exam is completed with score ≥70.
// Eligibility is no longer "passed N tests with avg X" — it's purely "passed a FINAL exam".
// Mentors can revoke (for fraud); they no longer manually issue.

export async function getStudentCertificates() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const adminClient = createAdminClient();

  // Use admin client to bypass RLS — we still scope by student_id
  const { data: certs, error } = await adminClient
    .from('certificates')
    .select('id, qr_code, issued_at, revoked, tier')
    .eq('student_id', user.id)
    .order('issued_at', { ascending: false });

  if (error) throw error;
  const rows = certs ?? [];

  // test_id is encoded in qr_code: "CERT-{uuid36}-{base36}" (qr_code may be uppercased)
  const testIds = rows.map((c: any) => (c.qr_code as string)?.substring(5, 41)?.toLowerCase()).filter(Boolean) as string[];
  const infoMap: Record<string, { assessmentTitle: string | null; className: string | null }> = {};
  if (testIds.length > 0) {
    const { data: testRows } = await adminClient
      .from('tests')
      .select('id, cohort_assessments!assessment_id(title), users!student_id(classes!class_id(name))')
      .in('id', testIds);
    for (const t of testRows ?? []) {
      infoMap[(t as any).id as string] = {
        assessmentTitle: (t as any).cohort_assessments?.title ?? null,
        className: (t as any).users?.classes?.name ?? null,
      };
    }
  }

  return rows.map((c: any) => {
    const testId = (c.qr_code as string)?.substring(5, 41)?.toLowerCase();
    const info = (testId && infoMap[testId]) ? infoMap[testId] : { assessmentTitle: null, className: null };
    return {
      id: c.id as string,
      qrCode: c.qr_code as string,
      issuedAt: c.issued_at as string,
      revoked: c.revoked as boolean,
      tier: (c.tier ?? null) as string | null,
      issuedBy: 'System',
      assessmentTitle: info.assessmentTitle,
      className: info.className,
    };
  });
}

export async function getMentorCertificates() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  // Use cached scope — avoids a redundant auth+DB round-trip
  const { getCallerScope } = await import('./scope');
  const scope = await getCallerScope();

  const adminClient = createAdminClient();

  // Scope students to the mentor's classes (not the whole college)
  let studentsQ = adminClient.from('users').select('id, name, email').eq('role', 'STUDENT');
  if (scope.role === 'MENTOR' && scope.classIds.length > 0) {
    studentsQ = studentsQ.in('class_id', scope.classIds);
  } else if (scope.collegeId) {
    studentsQ = (studentsQ as any).eq('college_id', scope.collegeId);
  } else {
    return [];
  }

  const { data: students } = await studentsQ;
  const studentIds = (students ?? []).map((s: any) => s.id as string);
  if (studentIds.length === 0) return [];

  const { data: certs } = await adminClient
    .from('certificates')
    .select('id, student_id, qr_code, issued_at, revoked, tier')
    .in('student_id', studentIds)
    .order('issued_at', { ascending: false });

  const certMap: Record<string, any> = {};
  (certs ?? []).forEach((c: any) => {
    if (!certMap[c.student_id]) certMap[c.student_id] = c;
  });

  return (students ?? []).map((s: any) => ({
    id: s.id,
    name: s.name,
    email: s.email,
    certificate: certMap[s.id] ?? null,
  }));
}

// issueCertificate is intentionally removed — certificates are now auto-issued by finishTest()
// when type='FINAL' and score >= 70.  Mentors can only revoke (see below) for fraud handling.

export async function revokeCertificate(certId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { error } = await supabase
    .from('certificates')
    .update({ revoked: true })
    .eq('id', certId);

  if (error) throw error;
  revalidatePath('/mentor/certificates');
  revalidatePath('/student/certificates');
  return { success: true };
}

export async function verifyCertificate(qrCode: string) {
  const supabase = await createClient();

  const { data: cert } = await supabase
    .from('certificates')
    .select('id, qr_code, issued_at, revoked, users!student_id(id, name, email)')
    .eq('qr_code', qrCode)
    .single();

  return cert ?? null;
}
