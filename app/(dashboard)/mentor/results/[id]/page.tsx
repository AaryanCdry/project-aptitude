// Test result detail re-exported under /mentor/* so it sits naturally under
// the Mentor layout (sidebar, header). `getTestResultDetails` is already
// scope-checked via `canViewStudent`.
export { default } from '@/app/(dashboard)/student/results/[id]/page';
