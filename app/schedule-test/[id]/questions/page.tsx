import { redirect } from 'next/navigation';
import { getDraft } from '@/app/actions/scheduling';
import QuestionsStepClient from './QuestionsStepClient';

export default async function QuestionsStepPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const draft = await getDraft(id);
  if (!draft) redirect('/schedule-test');
  if (draft.status !== 'DRAFT') redirect('/admin/assessments');

  return <QuestionsStepClient draft={draft} />;
}
