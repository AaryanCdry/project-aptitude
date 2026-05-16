import React from 'react';
import { fetchQuestionsForMentor } from '@/app/actions/admin';
import MentorQuestionsClient from './MentorQuestionsClient';

export default async function MentorQuestionsPage() {
  const questions = await fetchQuestionsForMentor();

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <MentorQuestionsClient initialQuestions={questions} />
    </div>
  );
}
