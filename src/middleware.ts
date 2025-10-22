import { type NextRequest, NextResponse } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';

export async function middleware(request: NextRequest) {
  // First, refresh the session
  const response = await updateSession(request);

  // Now, create a client to check auth status
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
      },
    }
  )
  const { data: { user } } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  const isLoggedIn = !!user;

  // If user is not logged in and is trying to access a protected route
  if (!isLoggedIn && !['/login', '/signup'].includes(pathname)) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // If user is logged in and tries to access login or signup
  if (isLoggedIn && ['/login', '/signup'].includes(pathname)) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }
  
  return response;
}

// We need to re-import createServerClient here because middleware has a different context
// This is a simplified version just for reading cookies.
import { createServerClient } from '@supabase/ssr'

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - api (API routes)
     * Feel free to modify this pattern to include more paths.
     */
    '/((?!_next/static|_next/image|favicon.ico|api|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
