import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Routes configuration
  const pathname = request.nextUrl.pathname;
  
  const publicPaths = ['/login', '/signup', '/verify'];
  const isPublic = publicPaths.some(p => pathname.startsWith(p));

  if (!user && !isPublic) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }

  if (user) {
    const role = user.user_metadata?.role ?? 'STUDENT';

    const roleHomeMap: Record<string, string> = {
      SUPER_ADMIN: '/super',
      ADMIN:       '/admin',
      SUB_ADMIN:   '/admin',     // HOD shares the Principal dashboard, scoped to their department
      MENTOR:      '/mentor',
      STUDENT:     '/student',
    };

    // Redirect away from login/signup once authenticated
    if (pathname === '/login' || pathname === '/signup') {
      const url = request.nextUrl.clone();
      url.pathname = roleHomeMap[role] ?? '/student';
      return NextResponse.redirect(url);
    }

    // Route guards — redirect to role home if accessing wrong dashboard
    if (pathname.startsWith('/super') && role !== 'SUPER_ADMIN') {
      const url = request.nextUrl.clone();
      url.pathname = roleHomeMap[role] ?? '/student';
      return NextResponse.redirect(url);
    }

    if (pathname.startsWith('/admin') && !['ADMIN', 'SUB_ADMIN'].includes(role)) {
      const url = request.nextUrl.clone();
      url.pathname = roleHomeMap[role] ?? '/student';
      return NextResponse.redirect(url);
    }

    if (pathname.startsWith('/subadmin') && !['SUB_ADMIN', 'ADMIN'].includes(role)) {
      const url = request.nextUrl.clone();
      url.pathname = roleHomeMap[role] ?? '/student';
      return NextResponse.redirect(url);
    }

    if (pathname.startsWith('/mentor') && !['MENTOR', 'ADMIN', 'SUPER_ADMIN'].includes(role)) {
      const url = request.nextUrl.clone();
      url.pathname = roleHomeMap[role] ?? '/student';
      return NextResponse.redirect(url);
    }
  }

  return supabaseResponse
}
