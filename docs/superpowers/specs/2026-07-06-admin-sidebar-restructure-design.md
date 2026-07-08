# Admin/Mentor Sidebar Restructure Design

**Date:** July 6, 2026
**Status:** Approved
**Proposed by:** Rahul

## Objective

Split the Admin and Mentor sidebars into two visually distinct groups based on usage frequency, so daily-use navigation isn't buried among rarely-used, one-time-setup items. Reduces perceived clutter without removing any existing functionality or routes.

## Problem

The Admin sidebar currently lists 12 flat items mixing:
- **One-time setup** tasks (done once at the start of a year, rarely revisited): adding students, mentors, HODs; creating departments, classes, batches
- **Daily operations** (used every day): managing questions, scheduling tests, viewing analytics, tracking performance

These are visually indistinguishable today, so admins scan past setup items every time they look for a daily task.

## Scope

Applies to:
- `app/(dashboard)/admin/AdminShell.tsx` (Admin/HOD)
- `app/(dashboard)/mentor/layout.tsx` (Mentor)

Explicitly out of scope: Student (`StudentShell.tsx`) and Company (`CompanyShell.tsx`) sidebars — both are already mostly daily-use with no meaningful setup cluster, so splitting them would add UI complexity without a real decluttering benefit.

## Item Mapping

### Admin (HOD sees the same, minus items already hidden today via `isHOD`)

| Group | Items |
|---|---|
| Always visible (outside both sections) | Profile |
| Daily Operations (always expanded) | Overview, Questions, Test Scheduling, Final Exams, Analytics |
| Setup & Configuration (collapsed by default) | Enrollment, Departments *(hidden for HOD)*, Classes, Batches, Staff, Settings *(hidden for HOD)*, Jobs |

### Mentor

| Group | Items |
|---|---|
| Always visible (outside both sections) | Dashboard, Profile |
| Daily Operations (always expanded) | Proctoring, Assessments, Schedule Test, Question Bank |
| Setup & Configuration (collapsed by default) | My Classes, My Students, Certificates, Jobs |

No routes, permissions, or `NavLink` props change — items are only regrouped visually.

## Components

### `components/NavSectionLabel.tsx` (new)
Plain presentational component: renders a small uppercase label (e.g. "DAILY OPERATIONS") above a group of `NavLink`s. No interactivity, no state.

### `components/CollapsibleNavSection.tsx` (new, client component)
Renders a clickable header (label + chevron icon) followed by its children (`NavLink`s), used for the "Setup & Configuration" group.

- **State:** `useState<boolean>` for collapsed/expanded, defaulting to `true` (collapsed) to avoid an SSR/hydration mismatch flash.
- **Persistence:** on mount, reads `localStorage.getItem(storageKey)` in a `useEffect` and updates state if a previous preference exists. On toggle, writes the new value back to `localStorage`.
- **Props:** `storageKey: string` (e.g. `sidebar-setup-collapsed:admin`, `sidebar-setup-collapsed:mentor` — separate keys per role so preferences don't bleed across roles on shared devices), `label: string`, `children: React.ReactNode`.
- **Event handling:** the toggle header's `onClick` calls `event.stopPropagation()` before flipping state, so it doesn't trigger the parent nav's "close mobile menu on click" handler (used in `AdminShell.tsx`).
- **Visual collapse:** chevron rotates (`expand_more` icon, rotated via a CSS class) between collapsed/expanded states; content is simply not rendered (or height-collapsed) when collapsed — no animation library needed, a CSS `transition` on `max-height` or `grid-template-rows` is sufficient.

### `AdminShell.tsx` changes
Rearrange the existing `<NavLink>` calls into `<NavSectionLabel>` + a flat list (Daily Operations) and `<CollapsibleNavSection>` (Setup & Configuration). The `isHOD` conditional rendering for Departments/Settings stays exactly as-is, just relocated into the Setup group.

### `mentor/layout.tsx` changes
Two changes bundled together:
1. Regroup nav items the same way (`NavSectionLabel` + `CollapsibleNavSection`), matching the Admin pattern.
2. Convert the sidebar's mobile behavior to match `AdminShell.tsx`: add a `sidebarOpen` state, a mobile hamburger header, and a slide-over overlay for small screens. This requires extracting the sidebar's interactive parts into a small client component (e.g. `MentorSidebar.tsx`) since `mentor/layout.tsx` is currently a server component (it does the Supabase auth/profile fetch) — the layout stays a server component and passes `name`/`initials`/`roleLabel`-equivalent props into the new client sidebar, following the same split `AdminShell.tsx` already uses.

## Data Flow

No new data flow — this is a client-side, purely presentational change. No new DB tables, no new server actions, no changes to `NavLink`.

## Testing

- Manual verification in the browser (per repo convention — no existing UI test suite covers sidebar rendering):
  - Admin: confirm all 12 items still route correctly, HOD still doesn't see Departments/Settings, Setup section starts collapsed, expands on click and persists across a page reload.
  - Mentor: confirm all 10 items still route correctly, Setup section behaves the same as Admin's, and the new mobile hamburger/overlay opens/closes correctly and closes on nav-link click (matching `AdminShell.tsx` behavior).
  - Confirm collapsing/expanding the Setup section does not trigger the mobile-overlay-close handler.

## Out of Scope

- No per-item usage counts or badges
- No animation library — CSS-only transition
- No change to Student or Company sidebars
- No change to `NavLink` component itself
