import { z } from "zod";
import bcrypt from "bcryptjs";
import {
  createTRPCRouter,
  publicProcedure,
  protectedProcedure,
} from "@/server/api/trpc";
import { TRPCError } from "@trpc/server";
import crypto from "crypto";
import { emailService } from "@/lib/email";
import {
  validatePassword,
  DEFAULT_PASSWORD_POLICY,
} from "@/lib/password-validator";

export const authRouter = createTRPCRouter({
  register: publicProcedure
    .input(
      z.object({
        name: z
          .string()
          .min(2, "Name must be at least 2 characters")
          .max(50, "Name must be less than 50 characters")
          .regex(
            /^[a-zA-Z\s'-]+$/,
            "Name can only contain letters, spaces, hyphens, and apostrophes",
          ),
        email: z
          .string()
          .email("Invalid email address")
          .max(255, "Email must be less than 255 characters"),
        password: z.string().min(8, "Password must be at least 8 characters"),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { name, email, password } = input;

      // Validate password strength
      const passwordValidation = validatePassword(
        password,
        DEFAULT_PASSWORD_POLICY,
        {
          name,
          email,
        },
      );

      if (!passwordValidation.isValid) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Password validation failed: ${passwordValidation.errors.join(", ")}`,
        });
      }

      // Check if user already exists
      const existingUser = await ctx.db.user.findUnique({
        where: { email: email.toLowerCase() },
      });

      if (existingUser) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "User with this email already exists",
        });
      }

      // Hash password with higher cost for better security
      const hashedPassword = await bcrypt.hash(password, 14);

      try {
        // Create user
        const user = await ctx.db.user.create({
          data: {
            name: name.trim(),
            email: email.toLowerCase(),
            password: hashedPassword,
            role: "USER",
            isActive: true,
          },
        });

        // Send welcome email
        await emailService.sendWelcomeEmail(email, name);

        return {
          success: true,
          message: "Account created successfully",
          userId: user.id,
        };
      } catch {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create account",
        });
      }
    }),

  requestPasswordReset: publicProcedure
    .input(
      z.object({
        email: z.string().email("Invalid email address"),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { email } = input;

      // Find user
      const user = await ctx.db.user.findUnique({
        where: { email: email.toLowerCase() },
      });

      if (!user) {
        // Don't reveal if email exists for security
        return {
          success: true,
          message:
            "If an account with this email exists, you will receive a password reset link.",
        };
      }

      // Generate cryptographically secure reset token
      const resetToken = crypto.randomBytes(32).toString("hex");
      const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour from now

      try {
        // Store reset token in database
        await ctx.db.user.update({
          where: { id: user.id },
          data: {
            resetToken,
            resetTokenExpiry,
          },
        });

        // Send password reset email
        await emailService.sendPasswordResetEmail(email, resetToken);

        return {
          success: true,
          message:
            "If an account with this email exists, you will receive a password reset link.",
        };
      } catch {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to process password reset request",
        });
      }
    }),

  resetPassword: publicProcedure
    .input(
      z.object({
        token: z.string().min(1, "Reset token is required"),
        password: z.string().min(8, "Password must be at least 8 characters"),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { token, password } = input;

      // Find user with valid reset token
      const user = await ctx.db.user.findFirst({
        where: {
          resetToken: token,
          resetTokenExpiry: {
            gt: new Date(), // Token must not be expired
          },
        },
      });

      if (!user) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Invalid or expired reset token",
        });
      }

      // Validate new password strength
      const passwordValidation = validatePassword(
        password,
        DEFAULT_PASSWORD_POLICY,
        {
          name: user.name || undefined,
          email: user.email,
        },
      );

      if (!passwordValidation.isValid) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Password validation failed: ${passwordValidation.errors.join(", ")}`,
        });
      }

      // Check if new password is same as current password
      if (user.password && (await bcrypt.compare(password, user.password))) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "New password must be different from your current password",
        });
      }

      // Hash new password with higher cost
      const hashedPassword = await bcrypt.hash(password, 14);

      try {
        // Update password and clear reset token
        await ctx.db.user.update({
          where: { id: user.id },
          data: {
            password: hashedPassword,
            resetToken: null,
            resetTokenExpiry: null,
          },
        });

        return {
          success: true,
          message: "Password has been reset successfully",
        };
      } catch {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to reset password",
        });
      }
    }),

  changePassword: protectedProcedure
    .input(
      z.object({
        currentPassword: z.string().min(1, "Current password is required"),
        newPassword: z
          .string()
          .min(8, "New password must be at least 8 characters"),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { currentPassword, newPassword } = input;
      const userId = ctx.session.user.id;

      // Get user with current password
      const user = await ctx.db.user.findUnique({
        where: { id: userId },
        select: { id: true, email: true, name: true, password: true },
      });

      if (!user || !user.password) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "User not found or no password set",
        });
      }

      // Verify current password
      const isCurrentPasswordValid = await bcrypt.compare(
        currentPassword,
        user.password,
      );
      if (!isCurrentPasswordValid) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Current password is incorrect",
        });
      }

      // Validate new password strength
      const passwordValidation = validatePassword(
        newPassword,
        DEFAULT_PASSWORD_POLICY,
        {
          name: user.name || undefined,
          email: user.email,
        },
      );

      if (!passwordValidation.isValid) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Password validation failed: ${passwordValidation.errors.join(", ")}`,
        });
      }

      // Check if new password is same as current password
      if (await bcrypt.compare(newPassword, user.password)) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "New password must be different from your current password",
        });
      }

      // Hash new password
      const hashedPassword = await bcrypt.hash(newPassword, 14);

      try {
        // Update password
        await ctx.db.user.update({
          where: { id: userId },
          data: { password: hashedPassword },
        });

        return {
          success: true,
          message: "Password changed successfully",
        };
      } catch {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to change password",
        });
      }
    }),

  getSession: protectedProcedure.query(async ({ ctx }) => {
    return {
      user: ctx.session.user,
    };
  }),

  updateProfile: protectedProcedure
    .input(
      z.object({
        name: z.string().min(2).max(50).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Validate name if provided
      if (input.name && !/^[a-zA-Z\s'-]+$/.test(input.name)) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message:
            "Name can only contain letters, spaces, hyphens, and apostrophes",
        });
      }

      // Update user name if provided
      if (input.name) {
        await ctx.db.user.update({
          where: { id: ctx.session.user.id },
          data: { name: input.name.trim() },
        });
      }

      return { success: true };
    }),

  deleteAccount: protectedProcedure
    .input(
      z.object({
        password: z.string().optional(),
        confirmEmail: z.string().email(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Verify email confirmation
      if (input.confirmEmail !== ctx.session.user.email) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Email confirmation does not match",
        });
      }

      // If user has password, verify it
      if (input.password) {
        const user = await ctx.db.user.findUnique({
          where: { id: ctx.session.user.id },
          select: { password: true },
        });

        if (user?.password) {
          const isValid = await bcrypt.compare(input.password, user.password);
          if (!isValid) {
            throw new TRPCError({
              code: "UNAUTHORIZED",
              message: "Password is incorrect",
            });
          }
        }
      }

      // Delete user (cascade will handle related records)
      await ctx.db.user.delete({
        where: { id: ctx.session.user.id },
      });

      return { success: true };
    }),

  validateResetToken: publicProcedure
    .input(
      z.object({
        token: z.string(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { token } = input;

      const user = await ctx.db.user.findFirst({
        where: {
          resetToken: token,
          resetTokenExpiry: {
            gt: new Date(),
          },
        },
      });

      return {
        valid: !!user,
        email: user?.email,
      };
    }),
});
