import { type NextRequest, NextResponse } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value,
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value,
            ...options,
          })
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value: '',
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value: '',
            ...options,
          })
        },
      },
    }
  );
  
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  const authRoutes = ['/login', '/signup'];
  const isAuthRoute = authRoutes.includes(pathname);

  // If user is authenticated and tries to access login/signup, redirect to dashboard
  if (user && isAuthRoute) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  // If user is not authenticated and tries to access a protected route, redirect to login
  if (!user && !isAuthRoute) {
    // Let the root page handle redirection if it's the target
    if (pathname === '/') {
        return response;
    }
    return NextResponse.redirect(new URL('/login', request.url));
  }
  
  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, approval_status')
      .eq('id', user.id)
      .single();
    
    // If a profile exists, enforce role-based rules
    if (profile) {
        if (profile.role === 'customer') {
            if (profile.approval_status !== 'approved' && pathname !== '/pending-approval') {
                return NextResponse.redirect(new URL('/pending-approval', request.url));
            }
            if (profile.approval_status === 'approved' && pathname === '/pending-approval') {
                return NextResponse.redirect(new URL('/', request.url));
            }
        } else {
            if (pathname === '/pending-approval') {
                return NextResponse.redirect(new URL('/', request.url));
            }
        }
    } 
    // If no profile is found for an authenticated user, it might be a race condition on signup.
    // Instead of logging them out, we'll let the request proceed. 
    // The page-level checks will handle any required redirection if the profile is still missing.
    // The previous logic that caused a redirect loop was here.
  }

  // Refresh the session token
  await supabase.auth.getSession();

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - api/ (API routes)
     * Feel free to modify this pattern to include more paths.
     */
    '/((?!_next/static|_next/image|favicon.ico|api|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
