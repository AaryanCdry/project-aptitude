'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { GoogleGenAI } from '@google/genai';

export async function fetchAllQuestions() {
  const supabase = await createClient();
  // Check if admin? Actually middleware handles /admin route protection, 
  // but it's good practice to verify on the server action if used directly.
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data: userData } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single();

  if (userData?.role !== 'ADMIN') {
    throw new Error('Not authorized');
  }

  const { data: questions, error } = await supabase
    .from('questions')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return questions;
}

export async function generateExplanation(questionId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data: userData } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single();

  if (userData?.role !== 'ADMIN') {
    throw new Error('Not authorized');
  }

  // 1. Fetch Question details
  const { data: question, error: qError } = await supabase
    .from('questions')
    .select('text, options, correct_answer')
    .eq('id', questionId)
    .single();

  if (qError || !question) throw new Error('Failed to fetch question');

  // 2. Generate Explanation using Google AI Studio
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured in .env.local');
  }

  const ai = new GoogleGenAI({ apiKey });
  
  const prompt = `You are an expert tutor creating pedagogical explanations for an aptitude test platform.
Please provide a clear, encouraging, and detailed explanation for the following question.

Question: ${question.text}
Options: ${JSON.stringify(question.options)}
Correct Answer: ${question.correct_answer}

Write the explanation directly without any preamble. Focus on the logical steps to arrive at the correct answer. Use Markdown for formatting.`;

  try {
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
    });
    
    const explanation = response.text;
    
    if (!explanation) {
        throw new Error('AI returned an empty response');
    }

    // 3. Save to database
    const { error: updateError } = await supabase
      .from('questions')
      .update({ explanation })
      .eq('id', questionId);

    if (updateError) throw updateError;

    revalidatePath('/admin/questions');
    return { success: true, explanation };
  } catch (error: any) {
    console.error('Gemini AI Error:', error);
    throw new Error(`Failed to generate explanation: ${error.message}`);
  }
}
