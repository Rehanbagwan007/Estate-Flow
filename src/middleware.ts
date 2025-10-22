
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

  const publicRoutes = ['/login', '/signup'];

  // If the user is not logged in and not on a public route, redirect to login.
  if (!user && !publicRoutes.includes(pathname) && pathname !== '/pending-approval') {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // If the user is logged in
  if (user) {
    // If they are on a public route like /login, redirect them to the dashboard.
    if (publicRoutes.includes(pathname)) {
        return NextResponse.redirect(new URL('/dashboard', request.url));
    }

    const { data: profile } = await supabase
        .from('profiles')
        .select('role, approval_status')
        .eq('id', user.id)
        .single();
    
    // If there's no profile, it's a broken state. Log them out and send to login.
    if (!profile) {
        await supabase.auth.signOut();
        return NextResponse.redirect(new URL('/login?message=Profile not found. Please log in again.', request.url));
    }

    const isAdmin = ['super_admin', 'admin'].includes(profile.role);
    const isApproved = profile.approval_status === 'approved';
    const onPendingPage = pathname.startsWith('/pending-approval');

    // Admins should never be on the pending page.
    if (isAdmin && onPendingPage) {
        return NextResponse.redirect(new URL('/dashboard', request.url));
    }

    // If a non-admin user is NOT approved AND they are NOT on the pending page, redirect them there.
    if (!isAdmin && !isApproved && !onPendingPage) {
        return NextResponse.redirect(new URL('/pending-approval', request.url));
    }

    // If a user IS approved and they somehow land on the pending page, redirect them to the dashboard.
    if (isApproved && onPendingPage) {
        return NextResponse.redirect(new URL('/dashboard', request.url));
    }
  }

  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|api|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
