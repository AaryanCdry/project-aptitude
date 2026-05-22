import { redirect } from 'next/navigation';
import { getOrCreateActiveTest } from '../actions/assessment';
import { startFinalExam } from '../actions/finals';
import AssessmentClient from './AssessmentClient';

const VALID_DOMAINS = ['QUANTITATIVE', 'LOGICAL', 'VERBAL', 'REASONING', 'SPATIAL'];

export default async function AssessmentPage({
  searchParams,
}: {
  searchParams: Promise<{ domain?: string; test?: string }>;
}) {
  const { domain, test: testParam } = await searchParams;
  const domainFilter = domain && VALID_DOMAINS.includes(domain.toUpperCase())
    ? domain.toUpperCase()
    : null;

  // ?test=<id> launches a specific scheduled FINAL exam; otherwise a self-paced
  // adaptive test is resumed or created.
  let testId: string;
  if (testParam) {
    const res = await startFinalExam(testParam);
    if ('error' in res) redirect('/student');
    testId = res.testId;
  } else {
    const test = await getOrCreateActiveTest();
    testId = test.id;
  }

  return (
    <AssessmentClient testId={testId} domainFilter={domainFilter} />
  );
}
