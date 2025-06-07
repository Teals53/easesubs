import { NextRequest } from 'next/server'

interface RateLimitOptions {
  interval: number // Time window in milliseconds
  uniqueTokenPerInterval: number // Max requests per interval
}

interface RateLimitResult {
  success: boolean
  limit: number
  remaining: number
  reset: number
}

// In-memory store for rate limiting (use Redis in production)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>()

export function rateLimit(options: RateLimitOptions) {
  return {
    check: (request: NextRequest, identifier?: string): RateLimitResult => {
      const now = Date.now()
      const id = identifier || getClientIdentifier(request)
      
      // Clean up expired entries
      for (const [key, value] of rateLimitStore.entries()) {
        if (value.resetTime < now) {
          rateLimitStore.delete(key)
        }
      }
      
      const tokenData = rateLimitStore.get(id)
      const resetTime = now + options.interval
      
      if (!tokenData || tokenData.resetTime < now) {
        // First request or expired window
        rateLimitStore.set(id, { count: 1, resetTime })
        return {
          success: true,
          limit: options.uniqueTokenPerInterval,
          remaining: options.uniqueTokenPerInterval - 1,
          reset: resetTime,
        }
      }
      
      if (tokenData.count >= options.uniqueTokenPerInterval) {
        // Rate limit exceeded
        return {
          success: false,
          limit: options.uniqueTokenPerInterval,
          remaining: 0,
          reset: tokenData.resetTime,
        }
      }
      
      // Increment count
      tokenData.count++
      rateLimitStore.set(id, tokenData)
      
      return {
        success: true,
        limit: options.uniqueTokenPerInterval,
        remaining: options.uniqueTokenPerInterval - tokenData.count,
        reset: tokenData.resetTime,
      }
    },
  }
}

function getClientIdentifier(request: NextRequest): string {
  // Try to get IP from various headers (for proxies/load balancers)
  const forwarded = request.headers.get('x-forwarded-for')
  const realIp = request.headers.get('x-real-ip')
  const ip = forwarded?.split(',')[0] || realIp || 'unknown'
  
  return ip
}

// Pre-configured rate limiters
export const apiRateLimit = rateLimit({
  interval: 15 * 60 * 1000, // 15 minutes
  uniqueTokenPerInterval: parseInt(process.env.RATE_LIMIT_MAX || '100'),
})

export const authRateLimit = rateLimit({
  interval: 15 * 60 * 1000, // 15 minutes
  uniqueTokenPerInterval: 5, // Stricter for auth endpoints
})

export const paymentRateLimit = rateLimit({
  interval: 60 * 60 * 1000, // 1 hour
  uniqueTokenPerInterval: 10, // Very strict for payment endpoints
}) 