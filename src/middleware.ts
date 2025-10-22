import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({ name, value, ...options })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({ name, value, ...options })
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({ name, value: '', ...options })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({ name, value: '', ...options })
        },
      },
    }
  )

  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user;

  const { pathname } = request.nextUrl;

  // Define public routes that do not require authentication
  const publicRoutes = ['/login', '/signup', '/pending-approval'];

  // If user is logged in and trying to access a public route (except pending), redirect to dashboard
  if (user && publicRoutes.includes(pathname) && pathname !== '/pending-approval') {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // If user is not logged in and trying to access a protected route, redirect to login
  if (!user && !publicRoutes.includes(pathname)) {
    // Allow access to root only to redirect, everything else needs login
    if (pathname === '/') return response;
    return NextResponse.redirect(new URL('/login', request.url));
  }
  
  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, approval_status')
      .eq('id', user.id)
      .single();

    if (profile) {
      // ** CRITICAL FIX: Admins and Super Admins should NEVER be stuck in an approval loop. **
      const isAdmin = ['super_admin', 'admin'].includes(profile.role);
      
      if (isAdmin) {
        // If an admin is on the pending page for some reason, get them out.
        if (pathname.startsWith('/pending-approval')) {
            return NextResponse.redirect(new URL('/dashboard', request.url));
        }
        // Otherwise, let them proceed.
        return response;
      }

      // For all other roles, enforce the approval flow.
      const isApproved = profile.approval_status === 'approved';
      const onPendingPage = pathname.startsWith('/pending-approval');

      if (!isApproved && !onPendingPage) {
          return NextResponse.redirect(new URL('/pending-approval', request.url));
      }
      if (isApproved && onPendingPage) {
          return NextResponse.redirect(new URL('/dashboard', request.url));
      }

    } else {
      // This can happen if the profile is not yet created after signup.
      // A redirect to login is a safe fallback.
      return NextResponse.redirect(new URL('/login?message=Profile not found. Please try logging in again.', request.url));
    }
  }

  return response
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
}
