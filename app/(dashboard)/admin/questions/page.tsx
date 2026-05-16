import React from 'react';
import { fetchAllQuestions } from '@/app/actions/admin';
import QuestionsClient from './QuestionsClient';

export const metadata = {
  title: 'Question Bank | Admin',
};

export default async function AdminQuestionsPage() {
  const questions = await fetchAllQuestions();

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <QuestionsClient initialQuestions={questions} />
    </div>
  );
}
