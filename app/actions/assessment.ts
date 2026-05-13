'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

const TOTAL_QUESTIONS_PER_TEST = 25;

export async function getOrCreateActiveTest() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  // Check for an IN_PROGRESS test
  const { data: existingTest, error: fetchError } = await supabase
    .from('tests')
    .select('*')
    .eq('student_id', user.id)
    .eq('status', 'IN_PROGRESS')
    .single();

  if (existingTest) {
    return existingTest;
  }

  // Create a new test if none exists
  const { data: newTest, error: insertError } = await supabase
    .from('tests')
    .insert({
      student_id: user.id,
      type: 'SELF',
      status: 'IN_PROGRESS',
    })
    .select()
    .single();

  if (insertError) throw insertError;
  return newTest;
}

export async function fetchNextQuestion(testId: string) {
  const supabase = await createClient();

  // Get test attempts for this test
  const { data: attempts, error: attemptsError } = await supabase
    .from('test_attempts')
    .select('question_id, is_correct, questions(difficulty)')
    .eq('test_id', testId)
    .order('created_at', { ascending: true });

  if (attemptsError) throw attemptsError;

  // If we've reached the limit, finish the test
  if (attempts && attempts.length >= TOTAL_QUESTIONS_PER_TEST) {
    return { finished: true };
  }

  // Adaptive Logic: Determine target difficulty
  let targetDifficulty = 3; // start with medium
  if (attempts && attempts.length > 0) {
    const lastAttempt = attempts[attempts.length - 1];
    const q: any = Array.isArray(lastAttempt.questions) ? lastAttempt.questions[0] : lastAttempt.questions;
    const lastDifficulty = q?.difficulty || 3;
    if (lastAttempt.is_correct) {
      targetDifficulty = Math.min(5, lastDifficulty + 1);
    } else {
      targetDifficulty = Math.max(1, lastDifficulty - 1);
    }
  }

  const answeredQuestionIds = attempts ? attempts.map(a => a.question_id) : [];

  // Fetch a question matching the difficulty that hasn't been answered yet
  let query = supabase
    .from('questions')
    .select('*')
    .eq('difficulty', targetDifficulty)
    .limit(10); // fetch a few to pick randomly

  if (answeredQuestionIds.length > 0) {
    // In Supabase, NOT IN uses a comma-separated string enclosed in parentheses
    query = query.not('id', 'in', `(${answeredQuestionIds.join(',')})`);
  }

  const { data: questions, error: qError } = await query;
  
  if (qError) throw qError;

  if (!questions || questions.length === 0) {
    // Fallback: Just fetch any unanswered question if no question matches the difficulty
    let fallbackQuery = supabase
      .from('questions')
      .select('*')
      .limit(1);
    if (answeredQuestionIds.length > 0) {
      fallbackQuery = fallbackQuery.not('id', 'in', `(${answeredQuestionIds.join(',')})`);
    }
    const { data: fallbackQuestions } = await fallbackQuery;
    if (!fallbackQuestions || fallbackQuestions.length === 0) {
      return { finished: true }; // No more questions available
    }
    return { question: fallbackQuestions[0], progress: attempts ? attempts.length : 0, total: TOTAL_QUESTIONS_PER_TEST };
  }

  // Pick a random question from the matched difficulty ones
  const randomQuestion = questions[Math.floor(Math.random() * questions.length)];
  return { question: randomQuestion, progress: attempts ? attempts.length : 0, total: TOTAL_QUESTIONS_PER_TEST };
}

export async function submitAnswer(testId: string, questionId: string, selectedAnswer: string, timeTakenMs: number) {
  const supabase = await createClient();

  // Verify correct answer
  const { data: question } = await supabase
    .from('questions')
    .select('correct_answer')
    .eq('id', questionId)
    .single();

  if (!question) throw new Error('Question not found');

  const isCorrect = question.correct_answer === selectedAnswer;

  const { error } = await supabase
    .from('test_attempts')
    .insert({
      test_id: testId,
      question_id: questionId,
      selected_answer: selectedAnswer,
      is_correct: isCorrect,
      time_taken_ms: timeTakenMs,
    });

  if (error) throw error;
  
  return { success: true, isCorrect };
}

export async function finishTest(testId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Mark test as completed
  await supabase
    .from('tests')
    .update({ status: 'COMPLETED', completed_at: new Date().toISOString() })
    .eq('id', testId);

  // Calculate score and fetch attempt details for review
  const { data: attempts } = await supabase
    .from('test_attempts')
    .select(`
      is_correct,
      selected_answer,
      questions (
        text,
        options,
        correct_answer,
        explanation
      )
    `)
    .eq('test_id', testId);

  const correctCount = attempts ? attempts.filter(a => a.is_correct).length : 0;
  const total = attempts ? attempts.length : 0;
  const scorePercent = total > 0 ? Math.round((correctCount / total) * 100) : 0;

  // Save to scores table (overall score)
  if (user) {
    await supabase
      .from('scores')
      .insert({
        student_id: user.id,
        test_id: testId,
        domain: 'QUANTITATIVE', // default for now, could be improved based on test questions
        score: scorePercent,
        percentile: 50.0 // mock percentile
      });
  }

  return { score: scorePercent, attempts };
}

export async function getTestResultDetails(testId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  // Fetch test details
  const { data: test, error: testError } = await supabase
    .from('tests')
    .select('*')
    .eq('id', testId)
    .single();

  if (testError || !test) throw new Error('Test not found');

  // Fetch overall score
  const { data: scoreData } = await supabase
    .from('scores')
    .select('*')
    .eq('test_id', testId)
    .single();

  // Fetch attempts with question details
  const { data: attempts } = await supabase
    .from('test_attempts')
    .select(`
      id,
      is_correct,
      selected_answer,
      time_taken_ms,
      questions (
        id,
        text,
        options,
        correct_answer,
        explanation,
        difficulty,
        domain
      )
    `)
    .eq('test_id', testId)
    .order('created_at', { ascending: true });

  return { test, score: scoreData, attempts };
}
