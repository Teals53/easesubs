/**
 * YOU PROBABLY DON'T NEED TO EDIT THIS FILE, UNLESS:
 * 1. You want to modify request context (see Part 1).
 * 2. You want to create a new middleware or type of procedure (see Part 3).
 *
 * TL;DR - This is where all the tRPC server stuff is created and plugged in. The pieces you will
 * need to use are documented accordingly near the end.
 */

import { initTRPC, TRPCError } from "@trpc/server";
import { type Session } from "next-auth";
import superjson from "superjson";
import { ZodError } from "zod";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { securityMonitor } from "@/lib/security-monitor";
import { dataSanitizer } from "@/lib/data-sanitizer";
import { secureLogger } from "@/lib/secure-logger";

/**
 * 1. CONTEXT
 *
 * This section defines the "contexts" that are available in the backend API.
 *
 * These allow you to access things when processing a request, like the database, the session, etc.
 */

interface CreateContextOptions {
  session: Session | null;
}

/**
 * This helper generates the "internals" for a tRPC context. If you need to use it, you can export
 * it from here.
 *
 * Examples of things you may need it for:
 * - testing, so we don't have to mock Next.js' req/res
 * - tRPC's `createSSGHelpers`, where we don't have req/res
 *
 * @see https://create.t3.gg/en/usage/trpc#-serverapitrpcts
 */
const createInnerTRPCContext = (opts: CreateContextOptions) => {
  return {
    session: opts.session,
    db,
  };
};

/**
 * This is the actual context you will use in your router. It will be used to process every request
 * that goes through your tRPC endpoint.
 *
 * @see https://trpc.io/docs/context
 */
export const createTRPCContext = async () => {
  // Get the session from the server using the getServerSession wrapper function
  const session = await auth();

  return createInnerTRPCContext({
    session,
  });
};

/**
 * 2. INITIALIZATION
 *
 * This is where the tRPC API is initialized, connecting the context and transformer. We also parse
 * ZodErrors so that you get typesafety on the frontend if your procedure fails due to validation
 * errors on the backend.
 */

const t = initTRPC.context<typeof createTRPCContext>().create({
  transformer: superjson,
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        zodError:
          error.cause instanceof ZodError ? error.cause.flatten() : null,
      },
    };
  },
});

/**
 * 3. ROUTER & PROCEDURE (THE IMPORTANT BIT)
 *
 * These are the pieces you use to build your tRPC API. You should import these a lot in the
 * "/src/server/api/routers" directory.
 */

/**
 * This is how you create new routers and sub-routers in your tRPC API.
 *
 * @see https://trpc.io/docs/router
 */
export const createTRPCRouter = t.router;

/**
 * Public (unauthenticated) procedure
 *
 * This is the base piece you use to build new queries and mutations on your tRPC API. It does not
 * guarantee that a user querying is authorized, but you can still access user session data if they
 * are logged in.
 */
export const publicProcedure = t.procedure;

/**
 * Reusable middleware that enforces users are logged in before running the procedure.
 */
const enforceUserIsAuthed = t.middleware(({ ctx, next }) => {
  if (!ctx.session || !ctx.session.user) {
    // Log unauthorized access attempt
    securityMonitor.analyzeEvent({
      type: "UNAUTHORIZED_ACCESS",
      severity: "MEDIUM",
      source: "tRPC - Authentication Required",
      details: {
        reason: "no_session",
        timestamp: new Date().toISOString()
      }
    });
    
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }
  return next({
    ctx: {
      // infers the `session` as non-nullable
      session: { ...ctx.session, user: ctx.session.user },
    },
  });
});

/**
 * Enhanced middleware that validates user is active (with caching)
 */
const enforceUserIsActive = t.middleware(async ({ ctx, next }) => {
  if (!ctx.session || !ctx.session.user) {
    // Log unauthorized access attempt
    await securityMonitor.analyzeEvent({
      type: "UNAUTHORIZED_ACCESS",
      severity: "MEDIUM",
      source: "tRPC - Active User Required",
      details: {
        reason: "no_session",
        timestamp: new Date().toISOString()
      }
    });
    
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }

  // Only check user status for critical operations
  // This reduces database queries while maintaining security
  const userId = ctx.session.user.id;

  try {
    const user = await ctx.db.user.findUnique({
      where: { id: userId },
      select: { id: true, isActive: true },
    });

    if (!user || !user.isActive) {
      // Log unauthorized access attempt for inactive user
      await securityMonitor.analyzeEvent({
        type: "UNAUTHORIZED_ACCESS",
        severity: "HIGH",
        source: "tRPC - Inactive User Access",
        userId,
        details: {
          reason: user ? "inactive_user" : "user_not_found",
          userId,
          timestamp: new Date().toISOString()
        }
      });
      
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Account is inactive or not found",
      });
    }

    return next({
      ctx: {
        session: { ...ctx.session, user: ctx.session.user },
      },
    });
  } catch (error) {
    if (error instanceof TRPCError) {
      throw error;
    }
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Failed to validate user status",
    });
  }
});

/**
 * Reusable middleware that enforces users are admins before running the procedure.
 */
const enforceUserIsAdmin = t.middleware(({ ctx, next }) => {
  if (!ctx.session || !ctx.session.user) {
    // Log unauthorized access attempt
    securityMonitor.analyzeEvent({
      type: "UNAUTHORIZED_ACCESS",
      severity: "HIGH",
      source: "tRPC - Admin Access Required",
      details: {
        reason: "no_session_admin_required",
        timestamp: new Date().toISOString()
      }
    });
    
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }

  // Check if user has admin role
  if (ctx.session.user.role !== "ADMIN") {
    // Log privilege escalation attempt
    securityMonitor.analyzeEvent({
      type: "PRIVILEGE_ESCALATION",
      severity: "HIGH",
      source: "tRPC - Admin Access Denied",
      userId: ctx.session.user.id,
      details: {
        reason: "insufficient_privileges",
        userRole: ctx.session.user.role,
        requiredRole: "ADMIN",
        userId: ctx.session.user.id,
        userEmail: ctx.session.user.email,
        timestamp: new Date().toISOString()
      }
    });
    
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Admin access required",
    });
  }

  return next({
    ctx: {
      session: { ...ctx.session, user: ctx.session.user },
    },
  });
});

/**
 * Protected (authenticated) procedure
 *
 * If you want a query or mutation to ONLY be accessible to logged in users, use this. It verifies
 * the session is valid and guarantees `ctx.session.user` is not null.
 *
 * @see https://trpc.io/docs/procedures
 */
export const protectedProcedure = t.procedure.use(enforceUserIsAuthed);

/**
 * Protected procedure with user active status validation
 * Use this for critical operations that require active user validation
 */
export const activeUserProcedure = t.procedure.use(enforceUserIsActive);

/**
 * Response sanitization middleware
 * Automatically sanitizes sensitive data in API responses
 */
const sanitizeResponse = t.middleware(async ({ ctx, next, path }) => {
  const result = await next();
  
  // Only sanitize successful responses with data
  if (result.ok && result.data && typeof result.data === 'object') {
    let sanitizedData = result.data;
    
    try {
      // Determine sanitization strategy based on the API path and user role
      const userRole = ctx.session?.user?.role as string;
      const isOwner = path.includes('me') || path.includes('profile');
      const isAdmin = userRole === 'ADMIN' || userRole === 'MANAGER';
      
      if (path.includes('user') || path.includes('profile') || path.includes('me')) {
        // User data sanitization
        if (Array.isArray(sanitizedData)) {
          sanitizedData = sanitizedData.map(item => 
            dataSanitizer.sanitizeUser(item as Record<string, unknown>, isOwner)
          );
        } else {
          sanitizedData = dataSanitizer.sanitizeUser(
            sanitizedData as Record<string, unknown>, 
            isOwner
          );
        }
      } else if (path.includes('payment')) {
        // Payment data sanitization
        if (Array.isArray(sanitizedData)) {
          sanitizedData = sanitizedData.map(item => 
            dataSanitizer.sanitizePayment(item as Record<string, unknown>)
          );
        } else {
          sanitizedData = dataSanitizer.sanitizePayment(sanitizedData as Record<string, unknown>);
        }
      } else if (path.includes('order')) {
        // Order data sanitization
        if (Array.isArray(sanitizedData)) {
          sanitizedData = sanitizedData.map(item => 
            dataSanitizer.sanitizeOrder(item as Record<string, unknown>, isOwner)
          );
        } else {
          sanitizedData = dataSanitizer.sanitizeOrder(
            sanitizedData as Record<string, unknown>, 
            isOwner
          );
        }
      } else if (path.includes('admin') && isAdmin) {
        // Admin data sanitization (less restrictive but still secure)
        if (Array.isArray(sanitizedData)) {
          sanitizedData = sanitizedData.map(item => 
            dataSanitizer.sanitizeAdminData(item as Record<string, unknown>)
          );
        } else {
          sanitizedData = dataSanitizer.sanitizeAdminData(sanitizedData as Record<string, unknown>);
        }
      }
      // For other endpoints, apply general sanitization by removing metadata
      else if (sanitizedData && typeof sanitizedData === 'object') {
        if (Array.isArray(sanitizedData)) {
          sanitizedData = sanitizedData.map(item => 
            dataSanitizer.removeMetadata(item as Record<string, unknown>)
          );
        } else {
          sanitizedData = dataSanitizer.removeMetadata(sanitizedData as Record<string, unknown>);
        }
      }
      
    } catch (error) {
      // Log sanitization errors but don't fail the request
      secureLogger.error('Data sanitization failed', error, {
        action: 'response_sanitization'
      });
      // Remove basic sensitive fields as fallback
      if (sanitizedData && typeof sanitizedData === 'object') {
        const sensitiveFields = ['password', 'passwordHash', 'resetToken', 'verificationToken'];
        sensitiveFields.forEach(field => {
          if (field in sanitizedData) {
            delete (sanitizedData as Record<string, unknown>)[field];
          }
        });
      }
    }
    
    return {
      ...result,
      data: sanitizedData
    };
  }
  
  return result;
});

/**
 * Admin-only procedure
 */
export const adminProcedure = t.procedure.use(enforceUserIsAdmin);

/**
 * Sanitized procedures - automatically sanitize response data
 */
export const sanitizedPublicProcedure = t.procedure.use(sanitizeResponse);
export const sanitizedProtectedProcedure = t.procedure.use(enforceUserIsAuthed).use(sanitizeResponse);
export const sanitizedActiveUserProcedure = t.procedure.use(enforceUserIsActive).use(sanitizeResponse);
export const sanitizedAdminProcedure = t.procedure.use(enforceUserIsAdmin).use(sanitizeResponse);
