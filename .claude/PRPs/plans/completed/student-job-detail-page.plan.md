# Plan: Student Job Detail Page

## Summary
Students can currently see AptilLead partner job cards on `/student/jobs` but cannot read the full job description, requirements, or minimum aptitude score. This plan adds a detail page at `/student/jobs/[id]` that shows every field of a job posting and lets the student apply from there too.

## User Story
As a student, I want to click on a partner job card and see the full job description, requirements, package details, and eligibility criteria, so that I can make an informed decision before applying.

## Problem → Solution
Job cards show only title, company, type, location, CTC, deadline, and degree tags — the description and requirements fields sit in the DB but are never surfaced → Add a detail page that renders all fields and includes the Apply button.

## Metadata
- **Complexity**: Medium
- **Source PRD**: N/A
- **PRD Phase**: N/A
- **Estimated Files**: 4 (1 updated action, 1 new page, 1 new client component, 1 updated card)

---

## UX Design

### Before
```
┌────────────────────────────────────┐
│  AptiLead Partners                 │
│  ┌──────────────────┐              │
│  │ Acme Corp        Full Time      │
│  │ Software Engineer               │
│  │ 📍 Bengaluru  💰 6–8 LPA       │
│  │ 📅 Due 30 Jul                  │
│  │ [Apply Now]                     │
│  └──────────────────┘              │
│  (no description visible)          │
└────────────────────────────────────┘
```

### After
```
┌────────────────────────────────────┐
│  AptiLead Partners                 │
│  ┌──────────────────┐              │
│  │ Acme Corp        Full Time      │
│  │ Software Engineer               │
│  │ 📍 Bengaluru  💰 6–8 LPA       │
│  │ 📅 Due 30 Jul                  │
│  │ [View Details →]  [Apply]       │
│  └──────────────────┘              │
└────────────────────────────────────┘

/student/jobs/[id]
┌────────────────────────────────────────┐
│ ← Back to Jobs                         │
│                                        │
│  Software Engineer           Full Time │
│  Acme Corp · IT Industry               │
│  📍 Bengaluru  💰 6–8 LPA  📅 30 Jul  │
│  Eligible: BE, BTech                   │
│  Min score: 60                         │
│                                        │
│  About the Role                        │
│  ─────────────────────────────────     │
│  [full description text]               │
│                                        │
│  Requirements                          │
│  ─────────────────────────────────     │
│  [requirements text]                   │
│                                        │
│  [Apply Now]  ← or "Applied ✓"         │
└────────────────────────────────────────┘
```

### Interaction Changes
| Touchpoint | Before | After | Notes |
|---|---|---|---|
| Partner job card | Apply button only | View Details link + Apply button | Link goes to `/student/jobs/[id]` |
| Job detail page | Doesn't exist | Full detail server page | Server component, apply is a client component |
| Apply from detail page | N/A | Same `applyToPartnerJob` action | Revalidates `/student/jobs` |

---

## Mandatory Reading

| Priority | File | Lines | Why |
|---|---|---|---|
| P0 | `app/actions/jobs.ts` | 47–59 | `getPartnerJobPostings` — shape of job_postings + company_profiles join |
| P0 | `app/actions/jobs.ts` | 61–116 | `applyToPartnerJob` — must reuse exactly |
| P0 | `app/(dashboard)/student/results/[id]/page.tsx` | 1–10 | How dynamic segment params are destructured (`await params`) |
| P1 | `app/(dashboard)/student/jobs/JobsClient.tsx` | 60–138 | `PartnerJobCard` — where to add the View Details link |
| P1 | `app/(dashboard)/student/jobs/page.tsx` | all | Server component that feeds `JobsClient` |
| P2 | `app/(dashboard)/student/jobs/JobsClient.tsx` | 1–58 | Type definitions — `PartnerJob`, `MyApplication` |

## External Documentation
N/A — feature uses established internal patterns only.

---

## Patterns to Mirror

### NAMING_CONVENTION
```typescript
// SOURCE: app/(dashboard)/student/results/[id]/page.tsx:6-9
export default async function TestResultsPage({ params }: { params: { id: string } }) {
  const { id } = await params;          // must await params in Next.js 15
```

### ERROR_HANDLING
```typescript
// SOURCE: app/actions/jobs.ts:61-64
export async function applyToPartnerJob(jobId: string) {
  const scope = await getCallerScope();
  if (!scope.userId) return { error: 'Not authenticated' };
  if (scope.role !== 'STUDENT') return { error: 'Only students can apply' };
```

### DATA_FETCHING_PATTERN
```typescript
// SOURCE: app/actions/jobs.ts:47-58
export async function getPartnerJobPostings() {
  const adminClient = createAdminClient();
  const { data } = await adminClient
    .from('job_postings')
    .select('*, company_profiles!company_id(company_name, industry, website)')
    .eq('is_active', true)
    .order('created_at', { ascending: false });
  return (data ?? []).map(j => ({
    ...j,
    companyName: (j.company_profiles as any)?.company_name ?? 'Unknown Company',
    companyIndustry: (j.company_profiles as any)?.industry ?? null,
  }));
}
```

### CLIENT_COMPONENT_WITH_TRANSITION
```typescript
// SOURCE: app/(dashboard)/student/jobs/JobsClient.tsx:251-258
async function handleApply(jobId: string) {
  setApplyingId(jobId);
  const res = await applyToPartnerJob(jobId);
  if ('success' in res) {
    setAppliedMap(prev => new Map(prev).set(jobId, 'applied'));
  }
  setApplyingId(null);
}
```

### DESIGN_TOKENS
```tsx
// SOURCE: app/(dashboard)/student/jobs/JobsClient.tsx:76-80
<div className="bg-surface-container-lowest border border-secondary/20 rounded-xl p-5 flex flex-col gap-3">
  <p className="font-caption text-secondary text-xs font-semibold">{job.companyName}</p>
  <h3 className="font-metric-label text-on-surface font-semibold">{job.title}</h3>
```

### NAVIGATION_BACK
```tsx
// Use Link from next/link for back navigation — never router.back() in server components
import Link from 'next/link';
<Link href="/student/jobs" className="...">← Back</Link>
```

---

## Files to Change

| File | Action | Justification |
|---|---|---|
| `app/actions/jobs.ts` | UPDATE | Add `getJobPostingById(id)` server action |
| `app/(dashboard)/student/jobs/[id]/page.tsx` | CREATE | New dynamic route server component |
| `app/(dashboard)/student/jobs/[id]/ApplyButton.tsx` | CREATE | Client component for apply interaction |
| `app/(dashboard)/student/jobs/JobsClient.tsx` | UPDATE | Add "View Details" link to `PartnerJobCard` |

## NOT Building
- Company-side job edit from the detail URL
- Admin/mentor view of job detail
- Image/logo upload for companies
- Sharing/social links on the job detail
- Related jobs suggestions on the detail page

---

## Step-by-Step Tasks

### Task 1: Add `getJobPostingById` server action
- **ACTION**: Append a new exported async function to `app/actions/jobs.ts`
- **IMPLEMENT**:
  ```typescript
  export async function getJobPostingById(id: string) {
    const scope = await getCallerScope();
    if (!scope.userId) return null;

    const adminClient = createAdminClient();
    const { data } = await adminClient
      .from('job_postings')
      .select('*, company_profiles!company_id(company_name, industry, website)')
      .eq('id', id)
      .eq('is_active', true)
      .single();
    if (!data) return null;

    return {
      ...data,
      companyName: (data.company_profiles as any)?.company_name ?? 'Unknown Company',
      companyIndustry: (data.company_profiles as any)?.industry ?? null,
      companyWebsite: (data.company_profiles as any)?.website ?? null,
    };
  }
  ```
- **MIRROR**: DATA_FETCHING_PATTERN — same join as `getPartnerJobPostings` but uses `.single()` and adds `website`
- **IMPORTS**: `createAdminClient` and `getCallerScope` are already imported at the top of `app/actions/jobs.ts`
- **GOTCHA**: Must include `.eq('is_active', true)` so students cannot access deactivated jobs by guessing a UUID
- **VALIDATE**: Action returns all fields including `description`, `requirements`, `min_aptitude_score`; returns `null` for inactive or unknown IDs

### Task 2: Create the detail page server component
- **ACTION**: Create new file `app/(dashboard)/student/jobs/[id]/page.tsx`
- **IMPLEMENT**:
  ```tsx
  import { notFound } from 'next/navigation';
  import Link from 'next/link';
  import { getJobPostingById, getMyApplications } from '@/app/actions/jobs';
  import ApplyButton from './ApplyButton';

  const JOB_TYPE_STYLE: Record<string, string> = {
    'Full Time':  'bg-primary/10 text-primary border-primary/20',
    'Internship': 'bg-secondary/10 text-secondary border-secondary/20',
    'Contract':   'bg-tertiary/10 text-tertiary border-tertiary/20',
  };

  export default async function JobDetailPage({ params }: { params: { id: string } }) {
    const { id } = await params;
    const [job, myApplications] = await Promise.all([
      getJobPostingById(id),
      getMyApplications(),
    ]);
    if (!job) notFound();

    const myApp = myApplications.find(a => a.job_id === id);
    const deadline = job.application_deadline
      ? new Date(job.application_deadline).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
      : null;

    return (
      <div className="p-6 max-w-3xl mx-auto">
        <Link
          href="/student/jobs"
          className="inline-flex items-center gap-1 text-sm text-on-surface-variant hover:text-on-surface mb-6 font-metric-label transition-colors"
        >
          <span className="material-symbols-outlined text-[16px]">arrow_back</span>
          Back to Jobs
        </Link>

        <div className="bg-surface-container-lowest border border-secondary/20 rounded-xl p-6 mb-6">
          <div className="flex items-start justify-between gap-3 mb-4">
            <div className="flex-1 min-w-0">
              <p className="font-caption text-secondary text-xs font-semibold mb-0.5">{job.companyName}</p>
              {job.companyIndustry && (
                <p className="font-caption text-on-surface-variant text-xs mb-1">{job.companyIndustry}</p>
              )}
              <h1 className="font-headline-md text-on-surface text-xl font-bold">{job.title}</h1>
            </div>
            {job.job_type && (
              <span className={`shrink-0 text-xs px-2.5 py-1 rounded-full border font-caption ${JOB_TYPE_STYLE[job.job_type] ?? 'bg-surface-container text-on-surface-variant border-outline-variant'}`}>
                {job.job_type}
              </span>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-on-surface-variant font-caption mb-4">
            {job.location && (
              <span className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-base">location_on</span>
                {job.location}
              </span>
            )}
            {job.package_ctc && (
              <span className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-base">payments</span>
                {job.package_ctc}
              </span>
            )}
            {deadline && (
              <span className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-base">event</span>
                Deadline: {deadline}
              </span>
            )}
            {job.min_aptitude_score != null && (
              <span className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-base">grade</span>
                Min score: {job.min_aptitude_score}
              </span>
            )}
          </div>

          {job.degree_types && job.degree_types.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-4">
              {job.degree_types.map((d: string) => (
                <span key={d} className="text-xs px-2 py-0.5 rounded bg-surface-container-low text-on-surface-variant border border-outline-variant font-caption">
                  {d}
                </span>
              ))}
            </div>
          )}

          <ApplyButton jobId={id} initialStatus={myApp?.status ?? null} />
        </div>

        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-6 mb-4">
          <h2 className="font-metric-label text-on-surface font-semibold mb-3">About the Role</h2>
          <p className="font-body-md text-on-surface-variant text-sm whitespace-pre-wrap leading-relaxed">{job.description}</p>
        </div>

        {job.requirements && (
          <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-6">
            <h2 className="font-metric-label text-on-surface font-semibold mb-3">Eligibility & Requirements</h2>
            <p className="font-body-md text-on-surface-variant text-sm whitespace-pre-wrap leading-relaxed">{job.requirements}</p>
          </div>
        )}
      </div>
    );
  }
  ```
- **MIRROR**: NAMING_CONVENTION (await params), DESIGN_TOKENS, NAVIGATION_BACK
- **IMPORTS**: `notFound` from `next/navigation`; `Link` from `next/link`; `getJobPostingById`, `getMyApplications` from `@/app/actions/jobs`; `ApplyButton` from `./ApplyButton`
- **GOTCHA**: `await params` is mandatory in Next.js 15 App Router — omitting it causes a runtime warning or error
- **VALIDATE**: Page renders all fields; invalid UUID gives 404; inactive job gives 404

### Task 3: Create `ApplyButton` client component
- **ACTION**: Create new file `app/(dashboard)/student/jobs/[id]/ApplyButton.tsx`
- **IMPLEMENT**:
  ```tsx
  'use client';

  import { useState, useTransition } from 'react';
  import { applyToPartnerJob } from '@/app/actions/jobs';

  const STATUS_LABEL: Record<string, string> = {
    applied:     'Applied',
    shortlisted: 'Shortlisted ✓',
    rejected:    'Not Selected',
  };

  const STATUS_STYLE: Record<string, string> = {
    applied:     'bg-primary/10 text-primary border-primary/20',
    shortlisted: 'bg-secondary/10 text-secondary border-secondary/20',
    rejected:    'bg-error/10 text-error border-error/20',
  };

  export default function ApplyButton({
    jobId,
    initialStatus,
  }: {
    jobId: string;
    initialStatus: string | null;
  }) {
    const [status, setStatus] = useState<string | null>(initialStatus);
    const [isPending, startTransition] = useTransition();

    function handleApply() {
      startTransition(async () => {
        const res = await applyToPartnerJob(jobId);
        if ('success' in res) setStatus('applied');
      });
    }

    if (status) {
      return (
        <span className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-metric-label border ${STATUS_STYLE[status] ?? ''}`}>
          {STATUS_LABEL[status] ?? status}
        </span>
      );
    }

    return (
      <button
        onClick={handleApply}
        disabled={isPending}
        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-secondary text-on-secondary font-metric-label text-sm hover:bg-secondary/90 transition-colors disabled:opacity-50"
      >
        {isPending ? (
          <><span className="material-symbols-outlined text-sm animate-spin">progress_activity</span>Applying…</>
        ) : (
          <><span className="material-symbols-outlined text-sm">send</span>Apply Now</>
        )}
      </button>
    );
  }
  ```
- **MIRROR**: CLIENT_COMPONENT_WITH_TRANSITION — mirrors the inline handleApply pattern in `JobsClient.tsx`
- **IMPORTS**: `useState`, `useTransition` from `react`; `applyToPartnerJob` from `@/app/actions/jobs`
- **GOTCHA**: Call `setStatus` directly after `await` — do not wrap it in another `startTransition`
- **VALIDATE**: Click → spinner → "Applied" badge shown; refresh page → "Applied" still shown (server-fetched initial status)

### Task 4: Add "View Details" link to `PartnerJobCard`
- **ACTION**: Update `app/(dashboard)/student/jobs/JobsClient.tsx`

  **Step 4a**: Add `import Link from 'next/link';` at the top of the file (after the existing React import line).

  **Step 4b**: Inside `PartnerJobCard`, replace the existing bottom block (lines ~120–138, the `{status ? ... : <button>}` expression) with:
  ```tsx
  <div className="mt-auto flex items-center gap-2 flex-wrap">
    <Link
      href={`/student/jobs/${job.id}`}
      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border border-outline-variant text-on-surface-variant font-metric-label text-sm hover:bg-surface-container hover:text-on-surface transition-colors"
    >
      <span className="material-symbols-outlined text-sm">open_in_new</span>
      View Details
    </Link>

    {status ? (
      <span className={`inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg text-xs font-metric-label border ${STATUS_STYLE[status] ?? ''}`}>
        {STATUS_LABEL[status] ?? status}
      </span>
    ) : (
      <button
        onClick={() => onApply(job.id)}
        disabled={applyPending}
        className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-secondary text-on-secondary font-metric-label text-sm hover:bg-secondary/90 transition-colors disabled:opacity-50"
      >
        {applyPending ? (
          <><span className="material-symbols-outlined text-sm animate-spin">progress_activity</span>Applying…</>
        ) : (
          <><span className="material-symbols-outlined text-sm">send</span>Apply</>
        )}
      </button>
    )}
  </div>
  ```
- **MIRROR**: DESIGN_TOKENS (`border-outline-variant`, `text-on-surface-variant`, `hover:bg-surface-container`)
- **IMPORTS**: `import Link from 'next/link'` at top — `JobsClient.tsx` is `'use client'` so `Link` works fine
- **GOTCHA**: The card `flex flex-col gap-3` layout means `mt-auto` on the new wrapper div pushes buttons to the bottom, same as before
- **VALIDATE**: Each partner job card now shows "View Details" + "Apply" side by side; "View Details" navigates to `/student/jobs/[id]`

---

## Testing Strategy

### Unit Tests
| Test | Input | Expected Output | Edge Case? |
|---|---|---|---|
| `getJobPostingById` with valid active ID | Real job UUID | Full job object with description | No |
| `getJobPostingById` with inactive job | UUID where is_active=false | `null` | Yes |
| `getJobPostingById` with unknown ID | Random UUID | `null` | Yes |

### Edge Cases Checklist
- [ ] Job with no `requirements` — section must not render
- [ ] Job with no `application_deadline` — deadline row must not render
- [ ] Job with no `degree_types` — tags section must not render
- [ ] Job with no `min_aptitude_score` — score row must not render
- [ ] Student already applied — ApplyButton shows status badge, not button
- [ ] Job deactivated between page load and apply attempt — action returns error (existing `applyToPartnerJob` handles this)
- [ ] Description with embedded newlines — `whitespace-pre-wrap` preserves formatting

---

## Validation Commands

### Static Analysis
```bash
npx tsc --noEmit
```
EXPECT: Zero type errors

### Build Check
```bash
npm run build
```
EXPECT: Build succeeds with no errors

### Browser Validation
```bash
npm run dev
```
EXPECT: See Manual Validation below

### Manual Validation
- [ ] Go to `/student/jobs` — confirm partner job cards now show "View Details" link alongside Apply
- [ ] Click "View Details" on any partner job — lands on `/student/jobs/[id]` with full description and requirements
- [ ] Verify all meta fields render: location, CTC, deadline, min score, degree tags
- [ ] Click "Apply Now" on detail page — spinner shows → changes to "Applied" badge
- [ ] Refresh the detail page after applying — still shows "Applied" (server-fetched)
- [ ] Click "Back to Jobs" — returns to `/student/jobs`
- [ ] Manually enter a fake UUID in the URL — 404 page is shown

---

## Acceptance Criteria
- [ ] Students can see full description and requirements on a dedicated detail page
- [ ] "View Details" link appears on every partner job card
- [ ] Apply button on detail page works and shows application status
- [ ] Inactive/nonexistent jobs return 404
- [ ] No TypeScript errors, no build errors
- [ ] Design tokens match existing usage (secondary/outline-variant classes)

## Completion Checklist
- [ ] Server-component + server-action pattern used (no API routes)
- [ ] `await params` used in dynamic page (Next.js 15 requirement)
- [ ] Not-found handled via `notFound()`
- [ ] `is_active` filter applied in `getJobPostingById` for security
- [ ] Client code isolated to `ApplyButton.tsx` only — detail page is a server component
- [ ] No hardcoded data
- [ ] Self-contained — no questions needed during implementation

## Risks
| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| `await params` forgotten | Low | Runtime warning | Enforced by NAMING_CONVENTION pattern |
| Student accesses deactivated job by direct URL | Low | Should 404 | `.eq('is_active', true)` in query |
| Description contains user-supplied HTML | Low | XSS risk | `whitespace-pre-wrap` + plain text output, no `dangerouslySetInnerHTML` |

## Notes
- The "Apply Now" label on the card is shortened to "Apply" to give room for the new "View Details" button without overflow
- `companyWebsite` is fetched in `getJobPostingById` but not linked in the UI (out of scope) — available for future use
