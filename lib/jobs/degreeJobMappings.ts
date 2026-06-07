export interface DegreeMapping {
  label: string;
  keywords: string[];
}

// Keys match the `course_type` values stored in the `departments` table.
// Add or modify entries here when new course types are introduced.
export const DEGREE_JOB_MAPPINGS: Record<string, DegreeMapping> = {
  BCom: {
    label: 'BCom',
    keywords: ['accountant', 'finance executive', 'auditor', 'banking associate', 'tax consultant', 'commerce graduate jobs'],
  },
  BBA: {
    label: 'BBA',
    keywords: ['business administrator', 'management trainee', 'marketing assistant', 'sales executive', 'HR assistant'],
  },
  BCA: {
    label: 'BCA',
    keywords: ['software developer', 'frontend developer', 'backend developer', 'QA engineer', 'technical support engineer'],
  },
  BSc: {
    label: 'BSc',
    keywords: ['science graduate', 'lab technician', 'research assistant', 'data analyst', 'quality analyst'],
  },
  BA: {
    label: 'BA',
    keywords: ['content writer', 'media executive', 'HR associate', 'public relations', 'arts graduate jobs'],
  },
  'BE/BTech': {
    label: 'BE / BTech',
    keywords: ['software engineer', 'mechanical engineer', 'civil engineer', 'electrical engineer', 'engineering fresher'],
  },
  MBA: {
    label: 'MBA',
    keywords: ['business analyst', 'product manager', 'marketing executive', 'operations manager', 'sales manager'],
  },
  MCA: {
    label: 'MCA',
    keywords: ['software developer', 'systems analyst', 'web developer', 'database administrator', 'IT consultant'],
  },
  MCom: {
    label: 'MCom',
    keywords: ['senior accountant', 'finance manager', 'tax specialist', 'audit manager', 'commerce lecturer'],
  },
  MSc: {
    label: 'MSc',
    keywords: ['data scientist', 'research analyst', 'scientist', 'lecturer', 'biotech analyst'],
  },
  Diploma: {
    label: 'Diploma',
    keywords: ['technician', 'site supervisor', 'electrician', 'diploma fresher', 'junior engineer'],
  },
  Other: {
    label: 'Other',
    keywords: ['fresher jobs India', 'entry level jobs', 'graduate jobs'],
  },
};

export function getKeywordsForDegree(courseType: string): string[] {
  return DEGREE_JOB_MAPPINGS[courseType]?.keywords ?? DEGREE_JOB_MAPPINGS['Other'].keywords;
}

export function buildSearchQuery(courseType: string): string {
  const keywords = getKeywordsForDegree(courseType);
  return keywords[0]; // Use primary keyword; caller can expand if needed
}
