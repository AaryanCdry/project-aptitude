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
  
  if (!user && !pathname.startsWith('/login')) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  if (user) {
    const role = user.user_metadata?.role;
    
    // Example role-based protection
    if (pathname.startsWith('/admin') && role !== 'ADMIN') {
      const url = request.nextUrl.clone()
      url.pathname = '/student' // fallback
      return NextResponse.redirect(url)
    }
    
    if (pathname.startsWith('/mentor') && role !== 'MENTOR' && role !== 'ADMIN') {
      const url = request.nextUrl.clone()
      url.pathname = '/student'
      return NextResponse.redirect(url)
    }

    if (pathname === '/login') {
      const url = request.nextUrl.clone()
      url.pathname = role ? `/${role.toLowerCase()}` : '/student'
      return NextResponse.redirect(url)
    }
  }

  return supabaseResponse
}
