import type { Job, JobProvider, JobSearchParams } from './base';

const JSEARCH_HOST = 'jsearch.p.rapidapi.com';
const JSEARCH_URL = `https://${JSEARCH_HOST}/search`;

export class JSearchProvider implements JobProvider {
  name = 'JSearch';

  async search({ query, location, page = 1 }: JobSearchParams): Promise<Job[]> {
    const apiKey = process.env.RAPIDAPI_KEY;
    if (!apiKey) return [];

    const params = new URLSearchParams({ query, page: String(page), num_pages: '1' });
    if (location) params.set('location', location);

    let res: Response;
    try {
      res = await fetch(`${JSEARCH_URL}?${params}`, {
        headers: {
          'x-rapidapi-key': apiKey,
          'x-rapidapi-host': JSEARCH_HOST,
        },
      });
    } catch (err) {
      console.error('[JSearch] Network error:', err);
      return [];
    }

    if (!res.ok) {
      const body = await res.text().catch(() => '');
      console.error(`[JSearch] API error ${res.status}:`, body);
      return [];
    }

    const json = await res.json();
    const data: any[] = json.data ?? [];

    return data.map((item): Job => ({
      id: item.job_id ?? String(Math.random()),
      title: item.job_title ?? 'Untitled',
      company: item.employer_name ?? 'Unknown Company',
      location: [item.job_city, item.job_country].filter(Boolean).join(', ') || 'Remote',
      source: item.job_publisher ?? 'JSearch',
      postedAt: item.job_posted_at_datetime_utc ?? null,
      applyUrl: /^https?:\/\//i.test(item.job_apply_link ?? '') ? item.job_apply_link : '#',
    }));
  }
}
