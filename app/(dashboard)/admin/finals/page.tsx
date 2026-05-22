import { getScheduledFinals } from '@/app/actions/finals';
import FinalsClient from './FinalsClient';

export default async function FinalsPage() {
  const data = await getScheduledFinals();
  return <FinalsClient initialData={data} />;
}
