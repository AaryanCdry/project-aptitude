'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

// Certificates are now AUTO-ISSUED when a FINAL exam is completed with score ≥70.
// Eligibility is no longer "passed N tests with avg X" — it's purely "passed a FINAL exam".
// Mentors can revoke (for fraud); they no longer manually issue.

export async function getStudentCertificates() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data: certs, error } = await supabase
    .from('certificates')
    .select('id, qr_code, issued_at, revoked, tier, users!issued_by(name, email)')
    .eq('student_id', user.id)
    .order('issued_at', { ascending: false });

  if (error) throw error;
  return (certs ?? []).map((c: any) => ({
    id: c.id,
    qrCode: c.qr_code,
    issuedAt: c.issued_at,
    revoked: c.revoked,
    tier: c.tier ?? null,
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

  const { data: certs } = await supabase
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
