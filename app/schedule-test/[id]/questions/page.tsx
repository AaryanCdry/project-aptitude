import { redirect } from 'next/navigation';
import { getDraft } from '@/app/actions/scheduling';
import QuestionsStepClient from './QuestionsStepClient';

export default async function QuestionsStepPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ returnTo?: string }>;
}) {
  const { id } = await params;
  const { returnTo: rawReturnTo } = await searchParams;
  // Only allow same-origin relative paths — reject absolute URLs and protocol-relative paths
  const safeReturnTo = rawReturnTo && rawReturnTo.startsWith('/') && !rawReturnTo.startsWith('//') ? rawReturnTo : null;
  const draft = await getDraft(id);
  if (!draft) redirect('/schedule-test');
  if (draft.status !== 'DRAFT') redirect(safeReturnTo ?? '/admin/assessments');

  return <QuestionsStepClient draft={draft} returnTo={safeReturnTo} />;
}
