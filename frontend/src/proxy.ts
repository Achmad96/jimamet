import { NextRequest, NextResponse } from "next/server";

/**
 * Next.js Proxy — runs server-side BEFORE any page renders.
 * Checks for auth_token cookie on protected routes.
 * No content flash — instant redirect if unauthenticated.
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const authToken = request.cookies.get("auth_token")?.value;
  const authRole = request.cookies.get("auth_role")?.value;

  // ── Protected routes: require auth_token cookie ──
  const isProtectedRoute =
    pathname.startsWith("/dashboard") || pathname.startsWith("/ahli-gizi");

  if (isProtectedRoute && !authToken) {
    const loginUrl = new URL("/login", request.url);
    return NextResponse.redirect(loginUrl);
  }

  // ── If logged in and visiting /login or /register → redirect to dashboard ──
  const isAuthPage = pathname === "/login" || pathname === "/register";

  if (isAuthPage && authToken) {
    const target =
      authRole === "ahli_gizi" ? "/ahli-gizi" : "/dashboard";
    return NextResponse.redirect(new URL(target, request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Protected routes
    "/dashboard/:path*",
    "/ahli-gizi/:path*",
    // Auth pages (redirect if already logged in)
    "/login",
    "/register",
  ],
};

