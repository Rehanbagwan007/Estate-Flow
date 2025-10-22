
import { type NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function middleware(request: NextRequest) {
  const { supabase, response } = {
    supabase: createClient(),
    response: NextResponse.next({
      request: {
        headers: request.headers,
      },
    }),
  }

  // Refresh session if expired - required for Server Components
  await supabase.auth.getSession()

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - /login
     * - /signup
     * - /pending-approval
     */
    '/((?!_next/static|_next/image|favicon.ico|login|signup|pending-approval).*)',
  ],
}
