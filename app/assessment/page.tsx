import { redirect } from 'next/navigation';
import { getOrCreateActiveTest, getTestMeta } from '../actions/assessment';
import { startFinalExam } from '../actions/finals';
import { startScheduledTest } from '../actions/scheduled-tests';
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

  // ?test=<id> launches a specific assigned test. Dispatch by test type:
  // FINAL → startFinalExam, CENTER → startScheduledTest. Anything else falls
  // through to the self-paced adaptive flow.
  let testId: string;
  if (testParam) {
    const meta = await getTestMeta(testParam);
    if (!meta) redirect('/student');
    const res = meta.type === 'FINAL'
      ? await startFinalExam(testParam)
      : meta.type === 'CENTER'
        ? await startScheduledTest(testParam)
        : { error: 'Unsupported test type.' as string };
    if ('error' in res) redirect('/student');
    testId = (res as { testId: string }).testId;
  } else {
    const test = await getOrCreateActiveTest();
    testId = test.id;
  }

  return (
    <AssessmentClient testId={testId} domainFilter={domainFilter} />
  );
}
