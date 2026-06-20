import { NextResponse, type NextRequest } from "next/server";

const protectedPrefixes = ["/dashboard", "/analyzer", "/profiles", "/scenarios", "/autopilot", "/improvement-plans", "/portfolio", "/reports", "/settings", "/admin"];

export function proxy(request: NextRequest) {
  const protectedRoute = protectedPrefixes.some((prefix) => request.nextUrl.pathname === prefix || request.nextUrl.pathname.startsWith(`${prefix}/`));
  if (protectedRoute && !request.cookies.get("credora_access")) {
    const login = new URL("/login", request.url);
    login.searchParams.set("next", request.nextUrl.pathname);
    return NextResponse.redirect(login);
  }
  return NextResponse.next();
}

export const config = { matcher: ["/dashboard/:path*", "/analyzer/:path*", "/profiles/:path*", "/scenarios/:path*", "/autopilot/:path*", "/improvement-plans/:path*", "/portfolio/:path*", "/reports/:path*", "/settings/:path*", "/admin/:path*"] };
