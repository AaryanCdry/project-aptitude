import React from 'react';
import { fetchAllQuestions } from '@/app/actions/admin';
import QuestionsClient from './QuestionsClient';

export const metadata = {
  title: 'Question Bank | Admin',
};

export default async function AdminQuestionsPage() {
  const questions = await fetchAllQuestions();

  return <QuestionsClient initialQuestions={questions} />;
}
