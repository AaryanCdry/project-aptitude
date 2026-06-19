export function isServerActionRequest(request: Request) {
  return request.method === 'POST' && request.headers.has('next-action');
}

export function isRouteSegment(pathname: string, route: string) {
  return pathname === route || pathname.startsWith(`${route}/`);
}

const DASHBOARD_ROUTES = ['/super', '/admin', '/mentor', '/student', '/company'];

export function isDashboardRoute(pathname: string) {
  return DASHBOARD_ROUTES.some((route) => isRouteSegment(pathname, route));
}
