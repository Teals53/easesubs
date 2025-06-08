import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { type NextRequest, NextResponse } from "next/server";

import { appRouter } from "@/server/api/root";
import { createTRPCContext } from "@/server/api/trpc";
import { apiRateLimit } from "@/lib/enhanced-rate-limit";

const handler = (req: NextRequest) => {
  // Apply rate limiting to all tRPC requests
  const rateLimitResult = apiRateLimit.check(req);
  if (!rateLimitResult.success) {
    return NextResponse.json(
      { 
        error: "Too many requests", 
        resetTime: rateLimitResult.resetTime,
        remaining: rateLimitResult.remaining 
      },
      { 
        status: 429,
        headers: {
          'X-RateLimit-Limit': rateLimitResult.limit.toString(),
          'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
          'X-RateLimit-Reset': rateLimitResult.resetTime.toString(),
        }
      },
    );
  }

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
};

export { handler as GET, handler as POST };
