export interface Job {
  id: string;
  title: string;
  company: string;
  location: string;
  source: string;
  postedAt: string | null;
  applyUrl: string;
}

export interface JobSearchParams {
  query: string;
  location?: string;
  page?: number;
}

export interface JobProvider {
  name: string;
  search(params: JobSearchParams): Promise<Job[]>;
}
