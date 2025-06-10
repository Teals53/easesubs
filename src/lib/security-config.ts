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
  production: (nonce?: string) => [
    "default-src 'self'",
    // Temporarily allow unsafe-inline for production testing
    `script-src 'self' 'unsafe-inline' 'unsafe-eval' ${nonce ? `'nonce-${nonce}'` : ''} 'sha256-LcsuUMiDkprrt6ZKeiLP4iYNhWo8NqaSbAgtoZxVK3s=' 'sha256-OBTN3RiyCV4Bq7dFqZ5a2pAXjnCcCYeTJMO2I/LYKeo=' 'sha256-wxKnu70XqK2Xh83qYLGR/78fDuLtg8IOCsG4ZOyoFcc=' 'sha256-X4lEEjVMrQS+w1672g6orOKu04/EdzcFrdpUDzRgaRY=' 'sha256-JnZK0Z5vpdT7hkAkR+klOzhoJ65/VxsdIgWVxqK1kmM=' 'sha256-FT4IgZ3EOTHWN9RpN6HPdMU80F9tKOO6ekfgcrT9rfs=' 'sha256-VgJ6ct6AUuOYd/Bd+0biWSJV5lgEHCCFd/fAQTYhVDI=' 'sha256-Z1oigQiRgv02eYf0lQJht7T5RTNKMqB2Z/BSc4aVuC0=' 'sha256-0BAypV9I4g7Tx/GvPzz+Jgp9mG2f21qObOOihJpfD78=' 'sha256-OPF2YK2MMWLa60M5llLcPafYPtBYCAeeNk3Omi0pjec=' 'sha256-5J9nVlQuifdv/JwqaFlYvS4j6DGMjfAPNmYUUG3ab0I=' 'sha256-KEOrb6J+y0RQusqjQ3cBtro23T7t+rUz7lRjQmZqKd4=' 'sha256-bXETW8sllobG0dgLRXlDjStGdfTT0Pk8mBjg8Djs8fg=' https://js.jotform.com https://www.googletagmanager.com https://www.google-analytics.com`,
    // Temporarily allow unsafe-inline for production testing
    `style-src 'self' 'unsafe-inline' ${nonce ? `'nonce-${nonce}'` : ''} 'unsafe-hashes' 'sha256-V3yGFqrDcN7yd4p/gQNJ/AegGt7jO9PZJlHzdR/Xg4c=' 'sha256-tTgjrFAQDNcRW/9ebtwfDewCTgZMFnKpGa9tcHFyvcs=' 'sha256-68ahHyH65aqS202beKyu22MkdAEr0fBCN3eHnbYX+wg=' 'sha256-HGYbL7c7YTMNrtcUQBvASpkCpnhcLdlW/2pKHJ8sJ98=' 'sha256-BeII9jTh6JwgS6+KsPTt8OSlNqSokbiDzWkQo6bj3AM=' 'sha256-47DEQpj8HBSa+/TImW+5JCeuQeRkm5NMpJWZG3hSuFU=' 'sha256-CIxDM5jnsGiKqXs2v7NKCY5MzdR9gu6TtiMJrDw29AY=' https://fonts.googleapis.com`,
    `style-src-elem 'self' 'unsafe-inline' ${nonce ? `'nonce-${nonce}'` : ''} 'unsafe-hashes' 'sha256-47DEQpj8HBSa+/TImW+5JCeuQeRkm5NMpJWZG3hSuFU=' 'sha256-CIxDM5jnsGiKqXs2v7NKCY5MzdR9gu6TtiMJrDw29AY=' https://fonts.googleapis.com`,
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