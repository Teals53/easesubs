import { auth } from '@/lib/auth'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default auth((req: NextRequest & { auth?: any }) => {
  const { pathname, searchParams } = req.nextUrl
  const isAuthenticated = !!req.auth

  // Redirect authenticated users away from auth pages
  if (isAuthenticated && (pathname === '/auth/signin' || pathname === '/auth/signup')) {
    const callbackUrl = searchParams.get('callbackUrl')
    const redirectUrl = callbackUrl || '/dashboard'
    return NextResponse.redirect(new URL(redirectUrl, req.url))
  }

  // Protect checkout page - require authentication
  if (pathname === '/checkout') {
    if (!isAuthenticated) {
      return NextResponse.redirect(new URL('/auth/signin?callbackUrl=' + encodeURIComponent(pathname), req.url))
    }
  }

  // Dashboard protection - including root dashboard path and all sub-paths
  if (pathname === '/dashboard' || pathname.startsWith('/dashboard/')) {
    if (!isAuthenticated) {
      return NextResponse.redirect(new URL('/auth/signin?callbackUrl=' + encodeURIComponent(pathname), req.url))
    }
    
    // Admin routes protection
    if (pathname.startsWith('/dashboard/admin-')) {
      if (req.auth.user?.role !== 'ADMIN') {
        return NextResponse.redirect(new URL('/dashboard', req.url))
      }
    }
  }

  return NextResponse.next()
})

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/auth/signin',
    '/auth/signup',
    '/checkout'
  ]
} 