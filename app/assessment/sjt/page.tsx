import { createSjtTest } from '@/app/actions/sjt';
import SJTClient from './SJTClient';

export default async function SjtAssessmentPage() {
  const { testId, expires_at } = await createSjtTest();
  return <SJTClient testId={testId} expiresAt={expires_at} />;
}
