import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import { MiddlewareSecurity } from "@/lib/middleware-security";

// Initialize security middleware
const middlewareSecurity = new MiddlewareSecurity();

export default auth(async (req) => {
  const { pathname, searchParams } = req.nextUrl;
  const isAuthenticated = !!req.auth;

  // Analyze request for security threats
  const securityAnalysis = await middlewareSecurity.analyzeRequest(req);
  
  // Block if IP is blocked or high risk
  if (securityAnalysis.isBlocked || securityAnalysis.riskScore > 95) {
    return middlewareSecurity.handleBlockedRequest(securityAnalysis);
  }

  // Redirect authenticated users away from auth pages
  if (
    isAuthenticated &&
    (pathname === "/auth/signin" ||
      pathname === "/auth/signup" ||
      pathname === "/auth/forgot-password" ||
      pathname.startsWith("/auth/reset-password"))
  ) {
    const callbackUrl = searchParams.get("callbackUrl");
    const redirectUrl = callbackUrl || "/dashboard";
    return NextResponse.redirect(new URL(redirectUrl, req.url));
  }

  // Protect checkout page - require authentication
  if (pathname === "/checkout") {
    if (!isAuthenticated) {
      return NextResponse.redirect(
        new URL(
          "/auth/signin?callbackUrl=" + encodeURIComponent(pathname),
          req.url,
        ),
      );
    }
  }

  // Dashboard protection - including root dashboard path and all sub-paths
  if (pathname === "/dashboard" || pathname.startsWith("/dashboard/")) {
    if (!isAuthenticated) {
      return NextResponse.redirect(
        new URL(
          "/auth/signin?callbackUrl=" + encodeURIComponent(pathname),
          req.url,
        ),
      );
    }

    // Admin routes protection
    if (pathname.startsWith("/dashboard/admin-")) {
      const userRole = (req.auth as { user?: { role?: string } })?.user?.role;
      if (userRole !== "ADMIN") {
        return NextResponse.redirect(new URL("/dashboard", req.url));
      }
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    // Security monitoring for all routes
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
