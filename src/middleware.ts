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
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({ name, value, ...options });
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          response.cookies.set({ name, value, ...options });
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({ name, value: '', ...options });
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          response.cookies.set({ name, value: '', ...options });
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  // --- Redirect authenticated users from auth pages ---
  if (user && (pathname === '/login' || pathname === '/signup')) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // --- Redirect unauthenticated users from protected pages ---
  const isProtectedPath = !['/login', '/signup', '/pending-approval'].includes(pathname);
  if (!user && isProtectedPath) {
    return NextResponse.redirect(new URL('/login', request.url));
  }
  
  if (user) {
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('role, approval_status')
      .eq('id', user.id)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Middleware profile error:', error);
      return NextResponse.redirect(new URL('/login', request.url));
    }

    if (!profile) {
      if (pathname.startsWith('/(dashboard)')) {
        return NextResponse.redirect(new URL('/login', request.url));
      }
      return response;
    }
    
    const { role, approval_status } = profile;

    // --- Customer Approval Flow ---
    if (role === 'customer') {
      if (approval_status !== 'approved' && pathname !== '/pending-approval') {
        return NextResponse.redirect(new URL('/pending-approval', request.url));
      }
      if (approval_status === 'approved' && pathname === '/pending-approval') {
        return NextResponse.redirect(new URL('/dashboard', request.url));
      }
    }
    
    // --- Role-Based Route Protection ---
    const rolePaths: Record<string, string[]> = {
      super_admin: ['/admin', '/sales', '/dashboard', '/properties', '/leads', '/tasks', '/calls'],
      admin: ['/admin', '/sales', '/dashboard', '/properties', '/leads', '/tasks', '/calls'],
      agent: ['/dashboard', '/properties', '/leads', '/tasks', '/agent', '/calls'],
      caller_1: ['/dashboard', '/calls'],
      caller_2: ['/dashboard', '/calls'],
      sales_manager: ['/dashboard', '/sales', '/leads', '/tasks'],
      sales_executive_1: ['/dashboard', '/sales', '/leads', '/tasks', '/agent'],
      sales_executive_2: ['/dashboard', '/sales', '/leads', '/tasks', '/agent'],
      customer: ['/dashboard', '/my-interests', '/my-appointments', '/properties'],
    };

    const allowedPaths = rolePaths[role] || [];
    const isPathAllowed = allowedPaths.some(path => pathname.startsWith(path)) || pathname === '/dashboard' || pathname === '/';

    if (isProtectedPath && !isPathAllowed && pathname !== '/dashboard' && pathname !== '/') {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
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
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
