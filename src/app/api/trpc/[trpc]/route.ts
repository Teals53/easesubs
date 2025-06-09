import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { type NextRequest, NextResponse } from "next/server";

import { appRouter } from "@/server/api/root";
import { createTRPCContext } from "@/server/api/trpc";
import { apiRateLimit, authRateLimit } from "@/lib/enhanced-rate-limit";
import { secureLogger } from "@/lib/secure-logger";

const handler = (req: NextRequest) => {
  // Only apply strict rate limiting to sensitive operations
  // Check if this is an auth-related request
  const isAuthRequest = req.url.includes('auth') || 
                       req.url.includes('login') || 
                       req.url.includes('register') ||
                       req.url.includes('password');
  
  // Apply different rate limits based on request type
  const rateLimiter = isAuthRequest ? authRateLimit : apiRateLimit;
  const rateLimitResult = rateLimiter.check(req);
  
  if (!rateLimitResult.success) {
    return NextResponse.json(
      { 
        error: "Too many requests", 
        resetTime: rateLimitResult.resetTime,
        remaining: rateLimitResult.remaining,
        retryAfter: Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000)
      },
      { 
        status: 429,
        headers: {
          'X-RateLimit-Limit': rateLimitResult.limit.toString(),
          'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
          'X-RateLimit-Reset': rateLimitResult.resetTime.toString(),
          'Retry-After': Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000).toString(),
        }
      },
    );
  }

  try {
    return fetchRequestHandler({
      endpoint: "/api/trpc",
      req,
      router: appRouter,
      createContext: createTRPCContext,
      onError:
        process.env.NODE_ENV === "development"
          ? ({ path, error }) => {
              console.error(
                `❌ tRPC failed on ${path ?? "<no-path>"}: ${error.message}`,
              );
            }
          : ({ path, error }) => {
              // In production, log errors securely without exposing sensitive info
              console.error(`tRPC error on ${path ?? "unknown"}:`, {
                code: error.code,
                message: error.message,
                timestamp: new Date().toISOString(),
              });
            },
    });
  } catch (error) {
    secureLogger.error("tRPC handler error", error, {
      action: "trpc_request_handler"
    });

    // Additional structured error logging for tRPC issues
    secureLogger.error("tRPC request failed", error, {
      action: "trpc_request_processing"
    });

    return new Response("Internal server error", { status: 500 });
  }
};

export { handler as GET, handler as POST };
