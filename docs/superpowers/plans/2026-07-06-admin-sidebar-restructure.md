# Admin/Mentor Sidebar Restructure Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Split the Admin and Mentor sidebars into a "Daily Operations" group (always expanded) and a "Setup & Configuration" group (collapsed by default, state persisted per role in `localStorage`), and bring Mentor's mobile sidebar behavior in line with Admin's (hamburger + slide-over overlay).

**Architecture:** Two new small, reusable presentational/client components (`NavSectionLabel`, `CollapsibleNavSection`) are composed into the existing `AdminShell.tsx`, and into a newly-extracted `MentorSidebar.tsx` client component that `mentor/layout.tsx` (a server component) renders. No routes, permissions, or `NavLink` props change — this is a pure regrouping + one drive-by mobile-nav parity fix.

**Tech Stack:** Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS v4 with the project's Material Design token classes (`bg-surface-container-lowest`, `text-on-surface-variant`, etc.), Material Symbols icon font (`material-symbols-outlined`).

## Global Constraints

- No test runner is configured in this repo (`package.json` only has `lint`, `build`, `dev`, `start` — no jest/vitest/playwright). Verification is `npm run lint`, `npx tsc --noEmit`, and manual browser checks against the running dev server — do not invent a test framework.
- Follow existing patterns exactly: server components fetch data and pass plain props to client components (see `AdminShell.tsx` / its parent `page.tsx`/`layout.tsx` pattern already in the repo).
- Use the project's existing Tailwind design-token classes and `material-symbols-outlined` icon font — do not introduce new CSS files, animation libraries, or icon sets.
- `@/*` path alias maps to the repo root (see `tsconfig.json`).
- Never use API routes for data — not applicable here (no data changes in this feature), noted only because it's a repo-wide rule.

---

### Task 1: `NavSectionLabel` component

**Files:**
- Create: `components/NavSectionLabel.tsx`

**Interfaces:**
- Produces: `NavSectionLabel({ label: string })` — default export, a plain (non-`'use client'`) presentational component rendering a small uppercase section heading above a group of nav items. Used by Task 3 and Task 4.

- [ ] **Step 1: Create the component**

```tsx
// components/NavSectionLabel.tsx
interface NavSectionLabelProps {
  label: string;
}

export default function NavSectionLabel({ label }: NavSectionLabelProps) {
  return (
    <p className="px-4 pt-4 pb-1 font-caption text-on-surface-variant text-xs font-semibold uppercase tracking-wide">
      {label}
    </p>
  );
}
```

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors mentioning `NavSectionLabel.tsx`

- [ ] **Step 3: Commit**

```bash
git add components/NavSectionLabel.tsx
git commit -m "feat: add NavSectionLabel component for sidebar section headings"
```

---

### Task 2: `CollapsibleNavSection` component

**Files:**
- Create: `components/CollapsibleNavSection.tsx`

**Interfaces:**
- Consumes: nothing from earlier tasks.
- Produces: `CollapsibleNavSection({ storageKey: string, label: string, children: React.ReactNode })` — default export, client component. Renders a clickable header (label + `expand_more`/`expand_less` icon) followed by `children` when expanded. Collapsed by default; persists the open/closed choice to `localStorage[storageKey]` (`'true'`/`'false'` strings). Used by Task 3 and Task 4 with `storageKey="sidebar-setup-collapsed:admin"` and `storageKey="sidebar-setup-collapsed:mentor"` respectively.

- [ ] **Step 1: Create the component**

```tsx
// components/CollapsibleNavSection.tsx
'use client';

import { useEffect, useState } from 'react';

interface CollapsibleNavSectionProps {
  storageKey: string;
  label: string;
  children: React.ReactNode;
}

export default function CollapsibleNavSection({ storageKey, label, children }: CollapsibleNavSectionProps) {
  const [collapsed, setCollapsed] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem(storageKey);
    if (stored !== null) {
      setCollapsed(stored === 'true');
    }
  }, [storageKey]);

  function toggle(event: React.MouseEvent) {
    event.stopPropagation();
    setCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem(storageKey, String(next));
      return next;
    });
  }

  return (
    <div className="mt-2">
      <button
        type="button"
        onClick={toggle}
        className="w-full flex items-center justify-between px-4 pt-4 pb-1 font-caption text-on-surface-variant text-xs font-semibold uppercase tracking-wide"
      >
        <span>{label}</span>
        <span className="material-symbols-outlined text-[16px]">
          {collapsed ? 'expand_more' : 'expand_less'}
        </span>
      </button>
      {!collapsed && <div className="flex flex-col gap-0.5">{children}</div>}
    </div>
  );
}
```

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors mentioning `CollapsibleNavSection.tsx`

- [ ] **Step 3: Commit**

```bash
git add components/CollapsibleNavSection.tsx
git commit -m "feat: add CollapsibleNavSection component with localStorage-persisted state"
```

---

### Task 3: Regroup `AdminShell.tsx` nav items

**Files:**
- Modify: `app/(dashboard)/admin/AdminShell.tsx:1-56` (imports and the `<nav>` block)

**Interfaces:**
- Consumes: `NavSectionLabel` from Task 1, `CollapsibleNavSection` from Task 2 (both default exports from `@/components/...`).
- Produces: no new exports; `AdminShell` keeps its existing `Props` signature (`children`, `name`, `initials`, `roleLabel`, `isHOD`) unchanged.

- [ ] **Step 1: Add imports**

In `app/(dashboard)/admin/AdminShell.tsx`, after the existing `NavLink` import (line 5), add:

```tsx
import NavSectionLabel from '@/components/NavSectionLabel';
import CollapsibleNavSection from '@/components/CollapsibleNavSection';
```

- [ ] **Step 2: Replace the `<nav>` block**

Replace lines 42-56 (the entire `<nav className="flex-1 p-3 flex flex-col gap-0.5 overflow-y-auto" onClick={...}>...</nav>` block) with:

```tsx
      <nav className="flex-1 p-3 flex flex-col gap-0.5 overflow-y-auto" onClick={() => setSidebarOpen(false)}>
        <NavSectionLabel label="Daily Operations" />
        <NavLink href="/admin" icon="dashboard" label="Overview" exact />
        <NavLink href="/admin/questions" icon="quiz" label="Questions" />
        <NavLink href="/admin/assessments" icon="calendar_month" label="Test Scheduling" />
        <NavLink href="/admin/finals" icon="workspace_premium" label="Final Exams" />
        <NavLink href="/admin/reports" icon="assessment" label="Analytics" />

        <CollapsibleNavSection storageKey="sidebar-setup-collapsed:admin" label="Setup & Configuration">
          <NavLink href="/admin/enrollment" icon="group_add" label="Enrollment" />
          {!isHOD && <NavLink href="/admin/departments" icon="account_tree" label="Departments" />}
          <NavLink href="/admin/classes" icon="meeting_room" label="Classes" />
          <NavLink href="/admin/batches" icon="groups" label="Batches" />
          <NavLink href="/admin/staff" icon="badge" label="Staff" />
          <NavLink href="/admin/jobs" icon="work" label="Jobs" />
          {!isHOD && <NavLink href="/admin/settings" icon="settings" label="Settings" />}
        </CollapsibleNavSection>

        <NavLink href="/admin/profile" icon="person" label="Profile" />
      </nav>
```

- [ ] **Step 3: Type-check and lint**

Run: `npx tsc --noEmit && npm run lint`
Expected: no errors

- [ ] **Step 4: Manual browser verification**

Run: `npm run dev`, then log in as an Admin and navigate to `/admin`.

Verify:
- "Daily Operations" label appears above Overview/Questions/Test Scheduling/Final Exams/Analytics, all visible without clicking anything.
- "Setup & Configuration" appears below, collapsed by default (Enrollment/Departments/Classes/Batches/Staff/Jobs/Settings not visible).
- Clicking "Setup & Configuration" expands it and shows those 7 items (or 5 if logged in as HOD — Departments and Settings should still be hidden for HOD, same as before).
- Reload the page — the expanded/collapsed state persists (because of `localStorage`).
- Clicking "Setup & Configuration" to toggle it does NOT close the mobile sidebar overlay (test on a narrow viewport / mobile emulation) — but clicking an actual `NavLink` still does close it.
- Profile link still appears at the very bottom, outside both sections.

- [ ] **Step 5: Commit**

```bash
git add "app/(dashboard)/admin/AdminShell.tsx"
git commit -m "feat: split admin sidebar into Daily Operations and Setup & Configuration"
```

---

### Task 4: Extract `MentorSidebar` client component with mobile nav, and regroup its items

**Files:**
- Create: `app/(dashboard)/mentor/MentorSidebar.tsx`
- Modify: `app/(dashboard)/mentor/layout.tsx` (replace inline JSX with a call to `MentorSidebar`)

**Interfaces:**
- Consumes: `NavLink` (`@/components/NavLink`), `LogoutButton` (`@/components/LogoutButton`), `NavSectionLabel` from Task 1, `CollapsibleNavSection` from Task 2.
- Produces: `MentorSidebar({ children: React.ReactNode, name: string, initials: string })` — default export, client component, rendered by `mentor/layout.tsx`.

- [ ] **Step 1: Create `MentorSidebar.tsx`**

```tsx
// app/(dashboard)/mentor/MentorSidebar.tsx
'use client';

import { useState } from 'react';
import LogoutButton from '@/components/LogoutButton';
import NavLink from '@/components/NavLink';
import NavSectionLabel from '@/components/NavSectionLabel';
import CollapsibleNavSection from '@/components/CollapsibleNavSection';

interface Props {
  children: React.ReactNode;
  name: string;
  initials: string;
}

export default function MentorSidebar({ children, name, initials }: Props) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const sidebarContent = (
    <>
      <div className="px-6 pt-5 pb-3 flex items-center gap-2 border-b border-outline-variant">
        <span className="material-symbols-outlined text-primary text-xl" style={{ fontVariationSettings: '"FILL" 1' }}>neurology</span>
        <span className="font-headline-md text-primary font-bold text-base tracking-tight">AptiLead</span>
      </div>

      <div className="px-5 py-4 flex items-center gap-3 border-b border-outline-variant">
        <div className="w-9 h-9 rounded-full bg-secondary-fixed text-on-secondary-fixed flex items-center justify-center font-bold text-sm shrink-0">
          {initials}
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-metric-label text-on-surface text-sm font-semibold truncate">{name}</p>
          <p className="font-caption text-on-surface-variant text-xs">Mentor</p>
        </div>
        <button
          onClick={() => setSidebarOpen(false)}
          className="md:hidden p-1 rounded-lg text-on-surface-variant hover:bg-surface-container transition-colors"
          aria-label="Close menu"
        >
          <span className="material-symbols-outlined text-xl">close</span>
        </button>
      </div>

      <nav className="flex-1 p-3 flex flex-col gap-0.5 overflow-y-auto" onClick={() => setSidebarOpen(false)}>
        <NavLink href="/mentor" icon="dashboard" label="Dashboard" exact />

        <NavSectionLabel label="Daily Operations" />
        <NavLink href="/mentor/proctor" icon="security" label="Proctoring" />
        <NavLink href="/mentor/assessments" icon="quiz" label="Assessments" />
        <NavLink href="/schedule-test" icon="add_circle" label="Schedule Test" />
        <NavLink href="/mentor/questions" icon="help" label="Question Bank" />

        <CollapsibleNavSection storageKey="sidebar-setup-collapsed:mentor" label="Setup & Configuration">
          <NavLink href="/mentor/classes" icon="meeting_room" label="My Classes" />
          <NavLink href="/mentor/students" icon="group" label="My Students" />
          <NavLink href="/mentor/certificates" icon="workspace_premium" label="Certificates" />
          <NavLink href="/mentor/jobs" icon="work" label="Jobs" />
        </CollapsibleNavSection>

        <NavLink href="/mentor/profile" icon="person" label="Profile" />
      </nav>

      <div className="p-3 border-t border-outline-variant">
        <LogoutButton />
      </div>
    </>
  );

  return (
    <div className="flex h-screen bg-background">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex flex-col w-64 border-r border-outline-variant bg-surface-container-lowest shrink-0 sticky top-0 h-screen overflow-y-auto">
        {sidebarContent}
      </aside>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/50" onClick={() => setSidebarOpen(false)} />
          <aside className="relative flex flex-col w-72 max-w-[85vw] bg-surface-container-lowest h-full shadow-2xl">
            {sidebarContent}
          </aside>
        </div>
      )}

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile top bar */}
        <header className="md:hidden flex items-center gap-3 px-4 py-3 bg-surface-container-lowest border-b border-outline-variant sticky top-0 z-10 shrink-0">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-1 -ml-1 rounded-lg text-primary hover:bg-surface-container transition-colors"
            aria-label="Open menu"
          >
            <span className="material-symbols-outlined text-xl">menu</span>
          </button>
          <span className="font-headline-md text-primary font-bold text-base tracking-tight">AptiLead</span>
        </header>

        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
```

Note: the desktop `<main>` keeps the original mentor layout's un-padded `overflow-y-auto` (no `p-4 md:p-8`) since mentor pages already manage their own padding — adding shell-level padding here would double it up. This matches the original `mentor/layout.tsx:69` exactly.

- [ ] **Step 2: Replace `mentor/layout.tsx`**

Replace the full contents of `app/(dashboard)/mentor/layout.tsx` with:

```tsx
import React from 'react';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { canAccessDashboard } from '@/lib/auth/access';
import { getRoleHome } from '@/lib/auth/roles';
import { redirect } from 'next/navigation';
import { getInitials } from '@/lib/utils';
import MentorSidebar from './MentorSidebar';

export default async function MentorLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const adminClient = createAdminClient();
  const { data: profile } = await adminClient
    .from('users')
    .select('name, email, role')
    .eq('id', user.id)
    .single();

  if (!canAccessDashboard('/mentor', profile?.role)) {
    redirect(getRoleHome(profile?.role) ?? '/login?error=profile');
  }

  const name = profile?.name ?? user?.email ?? 'Mentor';
  const initials = getInitials(name);

  return (
    <MentorSidebar name={name} initials={initials}>
      {children}
    </MentorSidebar>
  );
}
```

- [ ] **Step 3: Type-check and lint**

Run: `npx tsc --noEmit && npm run lint`
Expected: no errors (in particular, confirm no unused-import warnings on the old `LogoutButton`/`NavLink` imports that used to live directly in `layout.tsx`, since they've moved to `MentorSidebar.tsx`)

- [ ] **Step 4: Manual browser verification**

Run: `npm run dev`, then log in as a Mentor and navigate to `/mentor`.

Verify:
- Dashboard link at top, unaffected.
- "Daily Operations" label with Proctoring/Assessments/Schedule Test/Question Bank always visible.
- "Setup & Configuration" collapsed by default; expanding shows My Classes/My Students/Certificates/Jobs; state persists across reload (separate `localStorage` key from Admin's — confirm collapsing/expanding one role's section doesn't affect the other by checking both in the same browser).
- Profile link still at the bottom, outside both sections.
- On a narrow viewport (or mobile device emulation), confirm a hamburger button now appears in a top bar, clicking it opens a slide-over sidebar with a backdrop, clicking the backdrop or the close (X) button closes it, and clicking any `NavLink` inside it also closes it.
- Confirm the desktop layout (`md:` breakpoint and above) is visually unchanged from before aside from the new section grouping — no unexpected padding around page content.

- [ ] **Step 5: Commit**

```bash
git add "app/(dashboard)/mentor/MentorSidebar.tsx" "app/(dashboard)/mentor/layout.tsx"
git commit -m "feat: split mentor sidebar into sections and add mobile nav parity with admin"
```

---

## Self-Review Notes

- **Spec coverage:** Admin mapping (Task 3), Mentor mapping (Task 4), `NavSectionLabel`/`CollapsibleNavSection` components (Tasks 1-2), `stopPropagation` requirement (Task 2 Step 1), `localStorage` persistence (Task 2), HOD conditional preserved (Task 3 Step 2), Mentor mobile nav drive-by (Task 4) — all covered.
- **Placeholder scan:** none found — every step has literal, complete code.
- **Type consistency:** `CollapsibleNavSection` props (`storageKey`, `label`, `children`) match exactly between its Task 2 definition and both call sites in Tasks 3 and 4. `NavSectionLabel` prop (`label`) matches across Task 1 definition and both call sites.
