import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { MiddlewareSecurity } from "@/lib/middleware-security";

// Initialize security middleware
const middlewareSecurity = new MiddlewareSecurity();

// Define protected routes (require authentication)
const protectedRoutes = [
  "/dashboard",
  "/checkout"
];

// Define auth routes (should redirect authenticated users)
const authRoutes = [
  "/auth/signin",
  "/auth/signup", 
  "/auth/forgot-password",
  "/auth/reset-password"
];

// Define admin routes (require admin/manager role)
const adminRoutes = [
  "/dashboard/admin-dashboard",
  "/dashboard/admin-orders", 
  "/dashboard/admin-products",
  "/dashboard/admin-security",
  "/dashboard/admin-stock",
  "/dashboard/admin-support",
  "/dashboard/admin-users"
];

// Support routes that support agents can access
const supportRoutes = [
  "/dashboard/admin-support"
];

// Admin roles that can access admin pages
const adminRoles = ["ADMIN", "MANAGER"];
const supportRoles = ["ADMIN", "MANAGER", "SUPPORT_AGENT"];

export default async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Run security analysis first
  try {
    const analysis = await middlewareSecurity.analyzeRequest(request);
    
    // Block malicious requests
    if (analysis.isBlocked || analysis.riskScore > 95) {
      return middlewareSecurity.handleBlockedRequest(analysis);
    }
  } catch (error) {
    // Log error but don't block request if security analysis fails
    console.error("Security middleware error:", error);
  }

  // Get session using NextAuth
  const session = await auth();

  // Check route types
  const isProtectedRoute = protectedRoutes.some(route => 
    pathname.startsWith(route)
  );

  const isAuthRoute = authRoutes.some(route => 
    pathname.startsWith(route)
  );

  const isAdminRoute = adminRoutes.some(route => 
    pathname.startsWith(route)
  );

  const isSupportRoute = supportRoutes.some(route => 
    pathname.startsWith(route)
  );

  // RULE 1: Non-authenticated users must not access protected routes (dashboard, checkout)
  if (isProtectedRoute && !session?.user) {
    const signInUrl = new URL("/auth/signin", request.url);
    signInUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(signInUrl);
  }

  // RULE 2: Authenticated users must not access auth pages
  if (isAuthRoute && session?.user) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // RULE 3: Non-admin users must not access admin pages
  if (isAdminRoute && session?.user) {
    const userRole = session.user.role as string;
    
    // Support routes can be accessed by support agents, admins, and managers
    if (isSupportRoute && !supportRoles.includes(userRole)) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
    // Other admin routes require admin/manager roles only
    else if (!isSupportRoute && !adminRoles.includes(userRole)) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
  }

  // RULE 4: Non-authenticated users trying to access admin routes should be redirected to signin
  if (isAdminRoute && !session?.user) {
    const signInUrl = new URL("/auth/signin", request.url);
    signInUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(signInUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (images, etc.)
     */
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"
  ]
}; 