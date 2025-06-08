/**
 * Production Security Configuration
 * 
 * Centralized security settings and configuration for the EaseSubs application.
 * This file contains production-ready security parameters.
 */

export const SECURITY_CONFIG = {
  // Rate limiting configuration
  rateLimit: {
    // Authentication endpoints
    auth: {
      windowMs: 15 * 60 * 1000, // 15 minutes
      maxAttempts: 5, // 5 attempts per window
      blockDuration: 15 * 60 * 1000, // 15 minutes block
    },
    
    // API endpoints
    api: {
      windowMs: 60 * 1000, // 1 minute
      maxAttempts: 100, // 100 requests per minute
      blockDuration: 5 * 60 * 1000, // 5 minutes block
    },
    
    // Payment endpoints
    payment: {
      windowMs: 60 * 1000, // 1 minute
      maxAttempts: 10, // 10 attempts per minute
      blockDuration: 30 * 60 * 1000, // 30 minutes block
    },
    
    // Admin endpoints
    admin: {
      windowMs: 60 * 1000, // 1 minute
      maxAttempts: 50, // 50 requests per minute
      blockDuration: 10 * 60 * 1000, // 10 minutes block
    }
  },

  // IP blocking configuration
  ipBlocking: {
    // Automatic blocking thresholds
    autoBlock: {
      enabled: true,
      scoreThreshold: 75, // Auto-block IPs with score >= 75
      defaultDuration: 60, // Default block duration in minutes
      maxDuration: 24 * 60, // Max block duration in minutes (24 hours)
    },
    
    // Severity scoring
    severityScores: {
      LOW: 10,
      MEDIUM: 25,
      HIGH: 50,
      CRITICAL: 100
    },
    
    // Event type multipliers
    eventMultipliers: {
      INJECTION_ATTEMPT: 1.5,
      BRUTE_FORCE_ATTEMPT: 1.3,
      PRIVILEGE_ESCALATION: 1.4,
      MALICIOUS_PAYLOAD: 1.5,
      UNAUTHORIZED_ACCESS: 1.2,
      SUSPICIOUS_LOGIN: 1.1
    }
  },

  // Session security
  session: {
    maxAge: 24 * 60 * 60, // 24 hours in seconds
    absoluteTimeout: 7 * 24 * 60 * 60, // 7 days maximum
    renewalThreshold: 0.25, // Renew when 25% of session time remains
    sameSite: 'strict' as 'strict' | 'lax' | 'none',
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true
  },

  // Password security
  password: {
    minLength: 12,
    maxLength: 128,
    requireUppercase: true,
    requireLowercase: true,
    requireNumbers: true,
    requireSpecialChars: true,
    bcryptRounds: 14,
    
    // Common passwords to reject
    commonPasswords: [
      'password', '123456', '123456789', 'qwerty', 'abc123',
      'password123', 'admin', 'letmein', 'welcome', 'monkey',
      'login', 'password1', '123123', 'admin123', 'qwerty123'
    ]
  },

  // Data retention
  dataRetention: {
    securityEvents: 30, // Keep security events for 30 days
    blockedIPs: 90, // Keep blocked IP records for 90 days
    auditLogs: 365, // Keep audit logs for 1 year
    sessionLogs: 7 // Keep session logs for 7 days
  },

  // Monitoring and alerting
  monitoring: {
    realTimeUpdates: true,
    dashboardRefreshInterval: 30000, // 30 seconds
    alertThresholds: {
      criticalEvents: 10, // Alert after 10 critical events in 1 hour
      highRiskScore: 80, // Alert when risk score exceeds 80
      blockedIPCount: 50 // Alert when blocked IPs exceed 50
    }
  },

  // Content Security Policy
  csp: {
    development: {
      "default-src": ["'self'"],
      "script-src": ["'self'", "'unsafe-eval'", "'unsafe-inline'"],
      "style-src": ["'self'", "'unsafe-inline'"],
      "img-src": ["'self'", "data:", "https:"],
      "font-src": ["'self'"],
      "connect-src": ["'self'", "ws:", "wss:"],
      "frame-ancestors": ["'none'"]
    },
    production: {
      "default-src": ["'self'"],
      "script-src": ["'self'"],
      "style-src": ["'self'", "'unsafe-inline'"],
      "img-src": ["'self'", "data:", "https:"],
      "font-src": ["'self'"],
      "connect-src": ["'self'"],
      "frame-ancestors": ["'none'"],
      "base-uri": ["'self'"],
      "form-action": ["'self'"],
      "upgrade-insecure-requests": []
    }
  },

  // Security headers
  headers: {
    'X-Frame-Options': 'DENY',
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'X-XSS-Protection': '1; mode=block',
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=()'
  },

  // File upload security
  upload: {
    maxFileSize: 10 * 1024 * 1024, // 10MB
    allowedTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
    virusScanEnabled: false, // Set to true if you have virus scanning service
    quarantineDirectory: '/tmp/quarantine'
  },

  // API security
  api: {
    maxRequestSize: '1mb',
    rateLimitHeaders: true,
    corsOrigins: process.env.NODE_ENV === 'production' 
      ? [process.env.NEXTAUTH_URL || ''] 
      : ['http://localhost:3000'],
    trustProxy: process.env.NODE_ENV === 'production'
  }
};

// Environment-specific overrides
if (process.env.NODE_ENV === 'development') {
  // Reduce security restrictions for development
  SECURITY_CONFIG.rateLimit.auth.maxAttempts = 10;
  SECURITY_CONFIG.ipBlocking.autoBlock.enabled = false;
  SECURITY_CONFIG.session.sameSite = 'lax';
}

// Type exports for TypeScript
export type SecurityConfig = typeof SECURITY_CONFIG;
export type RateLimitConfig = typeof SECURITY_CONFIG.rateLimit;
export type IPBlockingConfig = typeof SECURITY_CONFIG.ipBlocking; 