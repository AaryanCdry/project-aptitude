type AppRole = 'SUPER_ADMIN' | 'ADMIN' | 'SUB_ADMIN' | 'MENTOR' | 'STUDENT' | 'COMPANY';

function isRouteSegment(pathname: string, route: string) {
  return pathname === route || pathname.startsWith(`${route}/`);
}

const DASHBOARD_ACCESS: Array<{ route: string; roles: AppRole[] }> = [
  { route: '/super', roles: ['SUPER_ADMIN'] },
  { route: '/admin', roles: ['ADMIN', 'SUB_ADMIN'] },
  { route: '/mentor', roles: ['MENTOR', 'ADMIN', 'SUPER_ADMIN'] },
  { route: '/student', roles: ['STUDENT'] },
  { route: '/company', roles: ['COMPANY'] },
];

export function canAccessDashboard(pathname: string, role: unknown) {
  const policy = DASHBOARD_ACCESS.find(({ route }) => isRouteSegment(pathname, route));
  if (!policy) return true;
  return policy.roles.includes(role as AppRole);
}
