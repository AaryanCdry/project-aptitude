'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { randomUUID } from 'crypto';

const CERTIFICATE_THRESHOLD = 75; // avg score %
const MIN_TESTS_REQUIRED = 3;

export async function getStudentCertificates() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data: certs, error } = await supabase
    .from('certificates')
    .select('id, qr_code, issued_at, revoked, users!issued_by(name, email)')
    .eq('student_id', user.id)
    .order('issued_at', { ascending: false });

  if (error) throw error;
  return (certs ?? []).map((c: any) => ({
    id: c.id,
    qrCode: c.qr_code,
    issuedAt: c.issued_at,
    revoked: c.revoked,
    issuedBy: c.users?.name ?? 'System',
  }));
}

export async function getMentorCertificates() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data: mentorProfile } = await supabase
    .from('users')
    .select('college_id')
    .eq('id', user.id)
    .single();
  const collegeId = mentorProfile?.college_id;

  let studentsQ = supabase.from('users').select('id, name, email').eq('role', 'STUDENT');
  if (collegeId) studentsQ = (studentsQ as any).eq('college_id', collegeId);
  const { data: students } = await studentsQ;

  const studentIds = (students ?? []).map((s: any) => s.id);
  if (studentIds.length === 0) return [];

  // Exclude OVERALL rows — they skew the per-domain average used for eligibility
  const { data: scores } = await supabase
    .from('scores')
    .select('student_id, score')
    .in('student_id', studentIds)
    .neq('domain', 'OVERALL');

  const { data: tests } = await supabase
    .from('tests')
    .select('student_id')
    .in('student_id', studentIds)
    .eq('status', 'COMPLETED');

  const { data: certs } = await supabase
    .from('certificates')
    .select('id, student_id, qr_code, issued_at, revoked')
    .in('student_id', studentIds)
    .order('issued_at', { ascending: false });

  const scoreMap: Record<string, number[]> = {};
  (scores ?? []).forEach((s: any) => {
    if (!scoreMap[s.student_id]) scoreMap[s.student_id] = [];
    scoreMap[s.student_id].push(s.score);
  });

  const testCount: Record<string, number> = {};
  (tests ?? []).forEach((t: any) => {
    testCount[t.student_id] = (testCount[t.student_id] ?? 0) + 1;
  });

  const certMap: Record<string, any> = {};
  (certs ?? []).forEach((c: any) => {
    if (!certMap[c.student_id]) certMap[c.student_id] = c;
  });

  return (students ?? []).map((s: any) => {
    const sScores = scoreMap[s.id] ?? [];
    const avg = sScores.length
      ? Math.round(sScores.reduce((a: number, b: number) => a + b, 0) / sScores.length)
      : 0;
    const count = testCount[s.id] ?? 0;
    return {
      id: s.id,
      name: s.name,
      email: s.email,
      avgScore: avg,
      testsCompleted: count,
      eligible: avg >= CERTIFICATE_THRESHOLD && count >= MIN_TESTS_REQUIRED,
      certificate: certMap[s.id] ?? null,
    };
  });
}

export async function issueCertificate(studentId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const qrCode = randomUUID();

  const { error } = await supabase
    .from('certificates')
    .insert({ student_id: studentId, issued_by: user.id, qr_code: qrCode });

  if (error) throw error;
  revalidatePath('/mentor/certificates');
  revalidatePath('/student/certificates');
  return { success: true, qrCode };
}

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
