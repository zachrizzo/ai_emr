import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getSupabaseConfig } from "@/utils/supabase-config";

// Define public paths that don't require authentication
const publicPaths = ['/login', '/signup', '/forgot-password'];

export async function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname;

  // Skip middleware for static files, api routes, and public files
  if (
    path.startsWith("/_next") ||
    path.startsWith("/api") ||
    path.includes(".") ||
    path.startsWith("/public")
  ) {
    return NextResponse.next();
  }

  const res = NextResponse.next();

  // Get Supabase configuration
  const { supabaseUrl, supabaseAnonKey } = getSupabaseConfig();

  // Create a server-side Supabase client with the correct configuration
  const supabase = createServerClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        get(name: string) {
          return req.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          res.cookies.set({
            name,
            value,
            ...options,
            sameSite: "lax",
            secure: process.env.NODE_ENV === "production",
          });
        },
        remove(name: string, options: CookieOptions) {
          res.cookies.delete({
            name,
            ...options,
            sameSite: "lax",
            secure: process.env.NODE_ENV === "production",
          });
        },
      },
    }
  );

  try {
    // Get the session and refresh if needed
    const { data: { session }, error } = await supabase.auth.getSession();

    if (error) {
      throw error;
    }

    // For public paths
    if (publicPaths.includes(path)) {
      // Redirect authenticated users away from public paths
      if (session) {
        return NextResponse.redirect(new URL('/', req.url));
      }
      return res;
    }

    // For protected paths
    if (!session) {
      // Clean the path before redirecting
      const cleanPath = path.split('@')[0].replace(/\/$/, '');
      // Redirect unauthenticated users to login
      const loginUrl = new URL('/login', req.url);
      if (cleanPath !== '') {
        loginUrl.searchParams.set('redirectTo', cleanPath);
      }
      return NextResponse.redirect(loginUrl);
    }

    // User is authenticated and accessing a protected route
    // Set session info in headers and allow access
    res.headers.set('x-user-id', session.user.id);
    res.headers.set('x-user-email', session.user.email || '');

    return res;

  } catch (error) {
    console.error("Middleware error:", error);
    // Clear any invalid session cookies
    res.cookies.delete('sb-access-token');
    res.cookies.delete('sb-refresh-token');

    if (!publicPaths.includes(path)) {
      const loginUrl = new URL('/login', req.url);
      loginUrl.searchParams.set('error', 'server_error');
      return NextResponse.redirect(loginUrl);
    }
    return res;
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public (public files)
     */
    '/((?!_next/static|_next/image|favicon.ico|public).*)',
  ],
};
