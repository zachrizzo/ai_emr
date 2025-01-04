import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Define public paths that don't require authentication
const publicPaths = ['/login', '/signup', '/forgot-password'];

export async function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname;
  console.log("Middleware executing for path:", path);

  // Skip middleware for static files and api routes
  if (
    path.startsWith("/_next") ||
    path.startsWith("/api") ||
    path.includes(".")
  ) {
    console.log("Skipping middleware for static/api path");
    return NextResponse.next();
  }

  // Check if the current path is public
  if (publicPaths.includes(path)) {
    console.log("Public path accessed:", path);
    return NextResponse.next();
  }

  const res = NextResponse.next();

  // Create a server-side Supabase client
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
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
    const { data: { session } } = await supabase.auth.getSession();
    console.log("Session status:", session ? "Authenticated" : "Not authenticated");

    // If not authenticated and trying to access protected route
    if (!session && !publicPaths.includes(path)) {
      console.log("Unauthorized access attempt, redirecting to login");
      return NextResponse.redirect(new URL('/login', req.url));
    }

    // If authenticated and trying to access login page
    if (session && path === '/login') {
      console.log("Authenticated user accessing login, redirecting to home");
      const redirectUrl = new URL('/', req.url);
      console.log("Redirecting to:", redirectUrl.toString());
      return NextResponse.redirect(redirectUrl, { status: 302 });
    }

    return res;
  } catch (error) {
    console.error("Middleware error:", error);
    // In case of error, redirect to login
    const redirectUrl = new URL('/login', req.url);
    redirectUrl.searchParams.set('error', 'server_error');
    return NextResponse.redirect(redirectUrl, { status: 302 });
  }
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)",],
};
