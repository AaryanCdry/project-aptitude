import React from 'react';
import { getOrCreateActiveTest } from '../actions/assessment';
import AssessmentClient from './AssessmentClient';

export default async function AssessmentPage() {
  const test = await getOrCreateActiveTest();

  return (
    <AssessmentClient testId={test.id} />
  );
}
