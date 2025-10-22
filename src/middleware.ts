import { type NextRequest, NextResponse } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';

// This is a temporary solution to a bug in the Supabase library.
// It should be removed once the library is updated.
const createSupabaseMiddlewareClient = (req: NextRequest, res: NextResponse) => {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get: (name) => req.cookies.get(name)?.value,
        set: (name, value, options) => {
          req.cookies.set({ name, value, ...options });
          res.cookies.set({ name, value, ...options });
        },
        remove: (name, options) => {
          req.cookies.set({ name, value: '', ...options });
          res.cookies.set({ name, value: '', ...options });
        },
      },
    }
  );
};

export async function middleware(request: NextRequest) {
  const response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createSupabaseMiddlewareClient(request, response);

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
    return NextResponse.redirect(new URL('/login', request.url));
  }
  
  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, approval_status')
      .eq('id', user.id)
      .single();
    
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
    } else if (!isAuthRoute) {
        // This case handles a user that exists in auth but not in profiles table.
        // It shouldn't happen with the trigger in place, but as a safeguard, log them out.
        await supabase.auth.signOut();
        return NextResponse.redirect(new URL('/login?error=profile_not_found', request.url));
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
     * - api/ (API routes)
     * Feel free to modify this pattern to include more paths.
     */
    '/((?!_next/static|_next/image|favicon.ico|api|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
