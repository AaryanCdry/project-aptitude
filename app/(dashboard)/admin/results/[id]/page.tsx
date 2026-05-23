// Test result detail re-exported under /admin/* so it sits naturally under
// the Principal/HOD layout (sidebar, header). `getTestResultDetails` is
// already scope-checked via `canViewStudent`.
export { default } from '@/app/(dashboard)/student/results/[id]/page';
