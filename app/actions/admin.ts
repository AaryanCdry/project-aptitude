'use server';

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { revalidatePath } from 'next/cache';
import { GoogleGenAI } from '@google/genai';

async function getAuthedUser() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');
  const { data: userData } = await supabase.from('users').select('role, id').eq('id', user.id).single();
  return { user, userData, supabase };
}

export async function fetchAllQuestions() {
  const { userData, supabase } = await getAuthedUser();
  if (userData?.role !== 'ADMIN') throw new Error('Not authorized');

  const { data: questions, error } = await supabase
    .from('questions')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return questions ?? [];
}

export async function fetchQuestionsForMentor() {
  const { userData, supabase } = await getAuthedUser();
  if (!['ADMIN', 'MENTOR', 'SUB_ADMIN'].includes(userData?.role ?? '')) throw new Error('Not authorized');

  const { data: questions, error } = await supabase
    .from('questions')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return questions ?? [];
}

export async function addQuestion(payload: {
  domain: string;
  sub_type?: string;
  difficulty: number;
  text: string;
  options: string[];
  correct_index: number;
  time_suggestion_sec?: number;
  explanation?: string;
  source?: string;
}) {
  const { user, userData } = await getAuthedUser();
  if (!['ADMIN', 'MENTOR', 'SUB_ADMIN'].includes(userData?.role ?? '')) throw new Error('Not authorized');

  const adminClient = createAdminClient();
  const { data, error } = await adminClient
    .from('questions')
    .insert({
      domain: payload.domain,
      sub_type: payload.sub_type ?? null,
      difficulty: payload.difficulty,
      text: payload.text,
      options: payload.options,
      correct_index: payload.correct_index,
      correct_answer: payload.options[payload.correct_index] ?? '',
      time_suggestion_sec: payload.time_suggestion_sec ?? 90,
      explanation: payload.explanation ?? null,
      source: payload.source ?? 'manual',
      active: true,
      approved_by: payload.source === 'gemini' ? user.id : null,
    })
    .select()
    .single();

  if (error) throw error;
  revalidatePath('/mentor/questions');
  revalidatePath('/admin/questions');
  return data;
}

export async function generateBatchQuestions(domain: string, subType: string, difficulty: number) {
  const { userData } = await getAuthedUser();
  if (!['ADMIN', 'MENTOR', 'SUB_ADMIN'].includes(userData?.role ?? '')) throw new Error('Not authorized');

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('GEMINI_API_KEY not configured');

  const ai = new GoogleGenAI({ apiKey });

  const diffDesc = difficulty <= 3
    ? 'straightforward, direct application of concepts'
    : difficulty <= 6
    ? 'moderate complexity, some multi-step reasoning required'
    : 'complex, requires deep understanding and multi-step problem solving';

  const prompt = `Generate 5 high-quality aptitude test questions for:
- Domain: ${domain}
- Sub-type: ${subType}
- Difficulty: ${difficulty}/10 (${diffDesc})

Return ONLY a raw JSON array (no markdown, no code fences) with exactly 5 objects:
[
  {
    "text": "question text",
    "options": ["A) option1", "B) option2", "C) option3", "D) option4"],
    "correct_index": 0,
    "explanation": "step-by-step explanation"
  }
]

Requirements:
- correct_index is 0-based (0=A, 1=B, 2=C, 3=D)
- All 4 options must be plausible
- Explanation walks through the reasoning clearly
- No duplicate questions`;

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: prompt,
  });

  const raw = response.text ?? '';
  const jsonMatch = raw.match(/\[[\s\S]*\]/);
  if (!jsonMatch) throw new Error('AI returned invalid response — no JSON array found');

  const drafts = JSON.parse(jsonMatch[0]);
  if (!Array.isArray(drafts)) throw new Error('AI returned non-array response');

  return drafts as Array<{
    text: string;
    options: string[];
    correct_index: number;
    explanation: string;
  }>;
}

export async function toggleQuestionActive(id: string) {
  const { userData } = await getAuthedUser();
  if (!['ADMIN', 'MENTOR'].includes(userData?.role ?? '')) throw new Error('Not authorized');

  const adminClient = createAdminClient();
  const { data: q } = await adminClient.from('questions').select('active').eq('id', id).single();
  const newActive = !(q?.active ?? true);
  const { error } = await adminClient.from('questions').update({ active: newActive }).eq('id', id);
  if (error) throw error;

  revalidatePath('/mentor/questions');
  revalidatePath('/admin/questions');
  return { active: newActive };
}

export async function deleteQuestion(id: string) {
  const { userData } = await getAuthedUser();
  if (!['ADMIN', 'MENTOR'].includes(userData?.role ?? '')) throw new Error('Not authorized');

  const adminClient = createAdminClient();
  const { error } = await adminClient.from('questions').delete().eq('id', id);
  if (error) throw error;

  revalidatePath('/mentor/questions');
  revalidatePath('/admin/questions');
}

export async function bulkAddQuestions(payload: Array<{
  domain: string;
  sub_type?: string;
  difficulty: number;
  text: string;
  options: string[];
  correct_index: number;
  time_suggestion_sec?: number;
  explanation?: string;
}>) {
  const { userData } = await getAuthedUser();
  if (!['ADMIN', 'MENTOR', 'SUB_ADMIN'].includes(userData?.role ?? '')) throw new Error('Not authorized');

  const adminClient = createAdminClient();

  const rows = payload.map(q => ({
    domain: q.domain,
    sub_type: q.sub_type ?? null,
    difficulty: q.difficulty,
    text: q.text,
    options: q.options,
    correct_index: q.correct_index,
    correct_answer: q.options[q.correct_index] ?? '',
    time_suggestion_sec: q.time_suggestion_sec ?? 90,
    explanation: q.explanation ?? null,
    source: 'manual',
    active: true,
  }));

  const { data, error } = await adminClient
    .from('questions')
    .insert(rows)
    .select();

  if (error) throw error;

  revalidatePath('/mentor/questions');
  revalidatePath('/admin/questions');
  return data ?? [];
}

export async function generateExplanation(questionId: string) {
  const { userData } = await getAuthedUser();
  if (!['ADMIN', 'MENTOR'].includes(userData?.role ?? '')) throw new Error('Not authorized');

  const adminClient = createAdminClient();
  const { data: question, error: qError } = await adminClient
    .from('questions')
    .select('text, options, correct_answer, correct_index')
    .eq('id', questionId)
    .single();

  if (qError || !question) throw new Error('Failed to fetch question');

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('GEMINI_API_KEY is not configured in .env.local');

  const ai = new GoogleGenAI({ apiKey });

  const correctOpt = (question.correct_index != null ? question.options?.[question.correct_index] : null) ?? question.correct_answer;

  const prompt = `You are an expert tutor creating pedagogical explanations for an aptitude test platform.
Provide a clear, encouraging, and detailed explanation for the following question.

Question: ${question.text}
Options: ${JSON.stringify(question.options)}
Correct Answer: ${correctOpt}

Write the explanation directly without any preamble. Focus on the logical steps to arrive at the correct answer. Use Markdown for formatting.`;

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: prompt,
  });

  const explanation = response.text;
  if (!explanation) throw new Error('AI returned an empty response');

  const { error: updateError } = await adminClient
    .from('questions')
    .update({ explanation })
    .eq('id', questionId);

  if (updateError) throw updateError;

  revalidatePath('/admin/questions');
  revalidatePath('/mentor/questions');
  return { success: true, explanation };
}

export async function getScheduledAssessments() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const now = new Date();
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - now.getDay());

  const { data: tests } = await supabase
    .from('tests')
    .select('id, type, status, scheduled_at, created_at, completed_at, student_id, users!student_id(name, email), classes!class_id(name)')
    .order('scheduled_at', { ascending: true, nullsFirst: false });

  const allTests = tests ?? [];
  const completed = allTests.filter((t: any) => t.status === 'COMPLETED');
  const thisWeek = allTests.filter((t: any) => {
    if (!t.scheduled_at) return false;
    const d = new Date(t.scheduled_at);
    return d >= weekStart && d <= now;
  });

  const uniqueCandidates = new Set(allTests.map((t: any) => t.student_id)).size;
  const completionRate = allTests.length > 0
    ? Math.round((completed.length / allTests.length) * 100)
    : 0;

  const upcoming = allTests
    .filter((t: any) => t.status !== 'COMPLETED')
    .slice(0, 10)
    .map((t: any) => ({
      id: t.id,
      title: t.type === 'CENTER' ? 'Center Assessment' : 'Self Assessment',
      type: t.type,
      status: t.status,
      studentName: (t.users as any)?.name ?? (t.users as any)?.email ?? 'Unknown',
      className: (t.classes as any)?.name ?? null,
      scheduledAt: t.scheduled_at,
    }));

  const recentCompleted = completed.slice(0, 5).map((t: any) => ({
    id: t.id,
    title: t.type === 'CENTER' ? 'Center Assessment' : 'Self Assessment',
    type: t.type,
    studentName: (t.users as any)?.name ?? (t.users as any)?.email ?? 'Unknown',
    completedAt: t.completed_at,
  }));

  return {
    totalThisWeek: thisWeek.length,
    totalCandidates: uniqueCandidates,
    completionRate,
    upcoming,
    recentCompleted,
    totalScheduled: allTests.filter((t: any) => t.status !== 'COMPLETED').length,
    totalCompleted: completed.length,
    totalTests: allTests.length,
  };
}
