export const ROLE_HOME = {
  SUPER_ADMIN: '/super',
  ADMIN: '/admin',
  SUB_ADMIN: '/admin',
  MENTOR: '/mentor',
  STUDENT: '/student',
  COMPANY: '/company',
} as const;

export type AppRole = keyof typeof ROLE_HOME;

export function isAppRole(role: unknown): role is AppRole {
  return typeof role === 'string' && role in ROLE_HOME;
}

export function getRoleHome(role: unknown) {
  return isAppRole(role) ? ROLE_HOME[role] : null;
}
