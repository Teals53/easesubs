import { NextRequest } from "next/server";

interface RateLimitConfig {
  interval: number; // Time window in milliseconds
  maxRequests: number; // Max requests per interval
  identifier?: string; // Custom identifier
  skipSuccessfulRequests?: boolean; // Skip counting successful requests
  skipFailedRequests?: boolean; // Skip counting failed requests
  keyGenerator?: (request: NextRequest) => string; // Custom key generation
}

interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  resetTime: number;
  totalHits: number;
}

interface RateLimitEntry {
  count: number;
  firstRequestTime: number;
  resetTime: number;
  blocked: boolean;
  blockUntil?: number;
}

// In-memory store for rate limiting (use Redis in production)
const rateLimitStore = new Map<string, RateLimitEntry>();
const suspiciousIPs = new Set<string>();

// Cleanup interval to remove expired entries
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore.entries()) {
    if (entry.resetTime < now && (!entry.blockUntil || entry.blockUntil < now)) {
      rateLimitStore.delete(key);
    }
  }
}, 60000); // Clean up every minute

function getClientIdentifier(request: NextRequest): string {
  // Try to get real IP from various headers (for proxies/load balancers)
  const forwarded = request.headers.get("x-forwarded-for");
  const realIp = request.headers.get("x-real-ip");
  const cfConnectingIp = request.headers.get("cf-connecting-ip"); // Cloudflare
  const xRealIp = request.headers.get("x-real-ip");
  
  let ip = "unknown";
  
  if (forwarded) {
    // X-Forwarded-For can contain multiple IPs, take the first one
    ip = forwarded.split(",")[0]?.trim() || "unknown";
  } else if (cfConnectingIp) {
    ip = cfConnectingIp;
  } else if (realIp) {
    ip = realIp;
  } else if (xRealIp) {
    ip = xRealIp;
  }

  // Use only IP for general rate limiting to avoid false positives
  // Only add fingerprinting for sensitive endpoints
  return ip;
}

export function createRateLimit(config: RateLimitConfig) {
  return {
    check: (request: NextRequest): RateLimitResult => {
      const now = Date.now();
      const identifier = config.keyGenerator 
        ? config.keyGenerator(request) 
        : config.identifier || getClientIdentifier(request);

      // Check if IP is marked as suspicious
      const clientIp = getClientIdentifier(request).split(":")[0];
      if (suspiciousIPs.has(clientIp)) {
        return {
          success: false,
          limit: config.maxRequests,
          remaining: 0,
          resetTime: now + config.interval,
          totalHits: config.maxRequests + 1,
        };
      }

      let entry = rateLimitStore.get(identifier);

      // Check if currently blocked
      if (entry?.blockUntil && now < entry.blockUntil) {
        return {
          success: false,
          limit: config.maxRequests,
          remaining: 0,
          resetTime: entry.blockUntil,
          totalHits: entry.count,
        };
      }

      // Initialize or reset if window expired
      if (!entry || entry.resetTime < now) {
        entry = {
          count: 0,
          firstRequestTime: now,
          resetTime: now + config.interval,
          blocked: false,
        };
      }

      // Increment request count
      entry.count++;

      // Check if limit exceeded
      if (entry.count > config.maxRequests) {
        // Mark as blocked
        entry.blocked = true;
        entry.blockUntil = now + config.interval;
        
        // Only mark IP as suspicious for extremely high abuse (5x the limit)
        // and only for a short time to avoid permanent blocking of legitimate users
        if (entry.count > config.maxRequests * 5) {
          suspiciousIPs.add(clientIp);
          // Remove from suspicious list after 30 minutes instead of 1 hour
          setTimeout(() => {
            suspiciousIPs.delete(clientIp);
          }, 30 * 60 * 1000);
        }

        rateLimitStore.set(identifier, entry);
        
        return {
          success: false,
          limit: config.maxRequests,
          remaining: 0,
          resetTime: entry.resetTime,
          totalHits: entry.count,
        };
      }

      rateLimitStore.set(identifier, entry);

      return {
        success: true,
        limit: config.maxRequests,
        remaining: config.maxRequests - entry.count,
        resetTime: entry.resetTime,
        totalHits: entry.count,
      };
    },

    // Method to manually block an identifier
    block: (identifier: string, duration = 3600000): void => {
      const now = Date.now();
      const entry = rateLimitStore.get(identifier) || {
        count: config.maxRequests + 1,
        firstRequestTime: now,
        resetTime: now + config.interval,
        blocked: true,
      };
      
      entry.blocked = true;
      entry.blockUntil = now + duration;
      rateLimitStore.set(identifier, entry);
    },

    // Method to unblock an identifier
    unblock: (identifier: string): void => {
      const entry = rateLimitStore.get(identifier);
      if (entry) {
        delete entry.blockUntil;
        entry.blocked = false;
        rateLimitStore.set(identifier, entry);
      }
    },

    // Get current status without incrementing
    getStatus: (identifier?: string): RateLimitResult | null => {
      const id = identifier || "unknown";
      const entry = rateLimitStore.get(id);
      const now = Date.now();

      if (!entry) return null;

      return {
        success: entry.count <= config.maxRequests && (!entry.blockUntil || now >= entry.blockUntil),
        limit: config.maxRequests,
        remaining: Math.max(0, config.maxRequests - entry.count),
        resetTime: entry.resetTime,
        totalHits: entry.count,
      };
    },
  };
}

// Pre-configured rate limiters with enhanced security
export const apiRateLimit = createRateLimit({
  interval: 15 * 60 * 1000, // 15 minutes
  maxRequests: parseInt(process.env.RATE_LIMIT_MAX || "1000"), // Much higher limit for general API usage
});

export const authRateLimit = createRateLimit({
  interval: 15 * 60 * 1000, // 15 minutes
  maxRequests: 10, // Slightly less strict for auth endpoints
});

export const paymentRateLimit = createRateLimit({
  interval: 60 * 60 * 1000, // 1 hour
  maxRequests: 20, // Allow more payment attempts
});

export const webhookRateLimit = createRateLimit({
  interval: 60 * 1000, // 1 minute
  maxRequests: 100, // Higher limit for webhook retries
  keyGenerator: (req) => {
    // Use custom header for webhook source identification
    const source = req.headers.get("user-agent") || "unknown";
    return `webhook:${source}`;
  },
});

// Enhanced rate limiter for login attempts (per email)
export const loginRateLimit = createRateLimit({
  interval: 15 * 60 * 1000, // 15 minutes
  maxRequests: 10, // Allow more login attempts
  keyGenerator: (req) => {
    // This would need to be implemented in the route handler where email is available
    return `login:${getClientIdentifier(req)}`;
  },
});

// Password reset rate limiter
export const passwordResetRateLimit = createRateLimit({
  interval: 60 * 60 * 1000, // 1 hour
  maxRequests: 5, // Slightly more attempts for password reset
});

// Search rate limiter to prevent scraping
export const searchRateLimit = createRateLimit({
  interval: 60 * 1000, // 1 minute
  maxRequests: 50, // Higher limit for search
});

// Contact form rate limiter
export const contactRateLimit = createRateLimit({
  interval: 60 * 60 * 1000, // 1 hour
  maxRequests: 10, // More contact form submissions allowed
});

// Registration rate limiter
export const registrationRateLimit = createRateLimit({
  interval: 60 * 60 * 1000, // 1 hour
  maxRequests: 5,
}); 