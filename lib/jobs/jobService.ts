import { unstable_cache } from 'next/cache';
import { JSearchProvider } from './providers/jSearch';
import type { Job, JobSearchParams } from './providers/base';

const provider = new JSearchProvider();

const cachedSearch = unstable_cache(
  async (params: JobSearchParams): Promise<Job[]> => provider.search(params),
  ['jobs-search'],
  { revalidate: 3600, tags: ['jobs'] },
);

export async function searchJobs(params: JobSearchParams): Promise<Job[]> {
  return cachedSearch(params);
}
