import crypto from 'crypto';

/**
 * Security Configuration
 * Centralized security settings for CSP, HTTPS enforcement, etc.
 */

export interface SecurityConfig {
  csp: {
    development: string[];
    production: string[];
  };
  httpsEnforcement: {
    enabled: boolean;
    domain: string;
  };
}

/**
 * Generate a random nonce for CSP
 */
export function generateNonce(): string {
  return Buffer.from(crypto.randomUUID()).toString('base64');
}

/**
 * Content Security Policy directives
 */
export const CSP_DIRECTIVES = {
  development: [
    "default-src 'self'",
    // Allow inline scripts and eval for development (hot reload, etc.)
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.jotform.com https://www.googletagmanager.com https://www.google-analytics.com",
    // Allow inline styles for development
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "style-src-elem 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' data: https://fonts.gstatic.com",
    "img-src 'self' data: https: blob: https://www.google-analytics.com https://www.googletagmanager.com",
    // Allow WebSocket connections for hot reload
    "connect-src 'self' ws: wss: https://fonts.googleapis.com https://fonts.gstatic.com https://www.google-analytics.com https://analytics.google.com",
    "form-action 'self'",
    "frame-src 'none'",
    "object-src 'none'",
    "base-uri 'self'",
    "worker-src 'none'",
    "media-src 'none'",
  ],
  production: [
    "default-src 'self'",
    // Stricter script policy for production - remove unsafe-inline and unsafe-eval
    "script-src 'self' https://js.jotform.com https://www.googletagmanager.com https://www.google-analytics.com",
    // Remove unsafe-inline for styles in production
    "style-src 'self' https://fonts.googleapis.com",
    "style-src-elem 'self' https://fonts.googleapis.com",
    "font-src 'self' data: https://fonts.gstatic.com",
    "img-src 'self' data: https: blob: https://www.google-analytics.com https://www.googletagmanager.com",
    "connect-src 'self' https://fonts.googleapis.com https://fonts.gstatic.com https://www.google-analytics.com https://analytics.google.com",
    "form-action 'self'",
    "frame-src 'none'",
    "object-src 'none'",
    "base-uri 'self'",
    "worker-src 'none'",
    "media-src 'none'",
    "upgrade-insecure-requests",
  ]
};

/**
 * Security headers configuration
 */
export const SECURITY_HEADERS = {
  "X-Frame-Options": "DENY",
  "X-Content-Type-Options": "nosniff",
  "X-XSS-Protection": "1; mode=block",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=(), usb=(), serial=(), bluetooth=(), payment=()",
  "Strict-Transport-Security": "max-age=31536000; includeSubDomains; preload",
};

/**
 * HTTPS enforcement configuration
 */
export const HTTPS_CONFIG = {
  enabled: process.env.NODE_ENV === "production",
  domain: process.env.NEXT_PUBLIC_APP_URL?.replace(/^https?:\/\//, '') || "easesubs.com",
  sensitiveRoutes: ['/auth', '/dashboard', '/checkout', '/api'],
};

/**
 * Security redirects for common attack vectors
 */
export const SECURITY_REDIRECTS = [
  // WordPress attacks
  '/wp-admin/:path*',
  '/wp-content/:path*',
  '/wp-includes/:path*',
  
  // Admin panels
  '/admin/:path*',
  '/administrator/:path*',
  '/phpmyadmin/:path*',
  
  // Configuration files
  '/.env',
  '/.env.local',
  '/.env.production',
  '/config/:path*',
  
  // Version control
  '/.git/:path*',
  
  // Backup files
  '/backup/:path*',
]; 