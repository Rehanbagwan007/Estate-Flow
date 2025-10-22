import { type NextRequest, NextResponse } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';
import { createClient } from '@/lib/supabase/server';

export async function middleware(request: NextRequest) {
  // First, refresh the session
  const response = await updateSession(request);

  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  // If user is not logged in and is not on the login page, redirect to login
  if (!user && pathname !== '/login') {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // If user is logged in and tries to access login page, redirect to dashboard
  if (user && pathname === '/login') {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }
  
  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Feel free to modify this pattern to include more paths.
     */
    '/((?!_next/static|_next/image|favicon.ico|api|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
