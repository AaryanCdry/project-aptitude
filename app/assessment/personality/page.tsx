import { createPersonalityTest } from '@/app/actions/personality';
import PersonalityClient from './PersonalityClient';

export default async function PersonalityAssessmentPage() {
  const { testId, expires_at } = await createPersonalityTest();
  return <PersonalityClient testId={testId} expiresAt={expires_at} />;
}
