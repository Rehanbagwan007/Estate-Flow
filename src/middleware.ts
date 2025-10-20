// ...existing code...
import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export async function middleware(request: NextRequest) {
  // start with a NextResponse we can modify
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  // Ensure x-forwarded-host matches Origin to satisfy Server Actions check
  const origin = request.headers.get('origin')
  const forwardedHost = origin ? origin.replace(/^(https?:\/\/)/, '') : '*'
  response.headers.set('x-forwarded-host', forwardedHost)

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options?: any) {
          // set cookie on the outgoing response
          response.cookies.set(name, value, options)
        },
        remove(name: string, options?: any) {
          // remove cookie by setting empty value / maxAge=0
          response.cookies.set(name, '', { ...(options || {}), maxAge: 0 })
        },
      },
    }
  )

  const {
    data: { session },
  } = await supabase.auth.getSession()

  const { pathname } = request.nextUrl

  const publicRoutes = ['/login', '/signup']
  const isPublicRoute = publicRoutes.some(route => pathname.startsWith(route))

  if (!session && !isPublicRoute && pathname !== '/') {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  if (session && isPublicRoute) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
// ...existing code...