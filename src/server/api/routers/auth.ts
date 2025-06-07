import { z } from 'zod'
import bcrypt from 'bcryptjs'
import { createTRPCRouter, publicProcedure, protectedProcedure } from '@/server/api/trpc'
import { TRPCError } from '@trpc/server'
import crypto from 'crypto'
import { emailService } from '@/lib/email'

export const authRouter = createTRPCRouter({
  register: publicProcedure
    .input(
      z.object({
        name: z.string().min(2, 'Name must be at least 2 characters'),
        email: z.string().email('Invalid email address'),
        password: z.string().min(8, 'Password must be at least 8 characters'),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { name, email, password } = input

      // Check if user already exists
      const existingUser = await ctx.db.user.findUnique({
        where: { email },
      })

      if (existingUser) {
        throw new TRPCError({
          code: 'CONFLICT',
          message: 'User with this email already exists',
        })
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 12)

      try {
        // Create user
        const user = await ctx.db.user.create({
          data: {
            name,
            email,
            password: hashedPassword,
            role: 'USER',
            isActive: true,
          },
        })

        // Send welcome email
        await emailService.sendWelcomeEmail(email, name)

        return {
          success: true,
          message: 'Account created successfully',
          userId: user.id,
        }
      } catch (error) {
        console.error('User registration error:', error)
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to create account',
        })
      }
    }),

  requestPasswordReset: publicProcedure
    .input(
      z.object({
        email: z.string().email('Invalid email address'),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { email } = input

      // Find user
      const user = await ctx.db.user.findUnique({
        where: { email },
      })

      if (!user) {
        // Don't reveal if email exists for security
        return {
          success: true,
          message: 'If an account with this email exists, you will receive a password reset link.',
        }
      }

      // Generate reset token
      const resetToken = crypto.randomBytes(32).toString('hex')
      const resetTokenExpiry = new Date(Date.now() + 3600000) // 1 hour from now

      try {
        // Store reset token in database
        await ctx.db.user.update({
          where: { id: user.id },
          data: {
            // We'll need to add these fields to the User model
            resetToken,
            resetTokenExpiry,
          },
        })

        // Send password reset email
        await emailService.sendPasswordResetEmail(email, resetToken)

        return {
          success: true,
          message: 'If an account with this email exists, you will receive a password reset link.',
        }
      } catch (error) {
        console.error('Password reset request error:', error)
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to process password reset request',
        })
      }
    }),

  resetPassword: publicProcedure
    .input(
      z.object({
        token: z.string(),
        password: z.string().min(8, 'Password must be at least 8 characters'),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { token, password } = input

      // Find user with valid reset token
      const user = await ctx.db.user.findFirst({
        where: {
          resetToken: token,
          resetTokenExpiry: {
            gt: new Date(), // Token must not be expired
          },
        },
      })

      if (!user) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Invalid or expired reset token',
        })
      }

      // Hash new password
      const hashedPassword = await bcrypt.hash(password, 12)

      try {
        // Update password and clear reset token
        await ctx.db.user.update({
          where: { id: user.id },
          data: {
            password: hashedPassword,
            resetToken: null,
            resetTokenExpiry: null,
          },
        })

        return {
          success: true,
          message: 'Password has been reset successfully',
        }
      } catch (error) {
        console.error('Password reset error:', error)
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to reset password',
        })
      }
    }),

  getSession: protectedProcedure.query(async ({ ctx }) => {
    return {
      user: ctx.session.user,
    }
  }),

  updateProfile: protectedProcedure
    .input(
      z.object({
        name: z.string().min(2).optional(),
        bio: z.string().optional(),
        country: z.string().optional(),
        phone: z.string().optional(),
        timezone: z.string().optional(),
        language: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { name, ...profileData } = input

      // Update user name if provided
      if (name) {
        await ctx.db.user.update({
          where: { id: ctx.session.user.id },
          data: { name },
        })
      }

      // Update or create profile
      const profile = await ctx.db.userProfile.upsert({
        where: { userId: ctx.session.user.id },
        update: profileData,
        create: {
          userId: ctx.session.user.id,
          ...profileData,
        },
      })

      return { success: true, profile }
    }),

  changePassword: protectedProcedure
    .input(
      z.object({
        currentPassword: z.string(),
        newPassword: z.string().min(8, 'Password must be at least 8 characters'),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { currentPassword, newPassword } = input

      // Get user with password
      const user = await ctx.db.user.findUnique({
        where: { id: ctx.session.user.id },
      })

      if (!user || !user.password) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'User not found or account uses social login',
        })
      }

      // Verify current password
      const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password)
      if (!isCurrentPasswordValid) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'Current password is incorrect',
        })
      }

      // Hash new password
      const hashedNewPassword = await bcrypt.hash(newPassword, 12)

      try {
        // Update password
        await ctx.db.user.update({
          where: { id: user.id },
          data: {
            password: hashedNewPassword,
          },
        })

        return {
          success: true,
          message: 'Password changed successfully',
        }
      } catch (error) {
        console.error('Password change error:', error)
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to change password',
        })
      }
    }),

  deleteAccount: protectedProcedure
    .input(
      z.object({
        password: z.string().optional(),
        confirmEmail: z.string().email(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Verify email confirmation
      if (input.confirmEmail !== ctx.session.user.email) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Email confirmation does not match',
        })
      }

      // If user has password, verify it
      if (input.password) {
        const user = await ctx.db.user.findUnique({
          where: { id: ctx.session.user.id },
          select: { password: true },
        })

        if (user?.password) {
          const isValid = await bcrypt.compare(input.password, user.password)
          if (!isValid) {
            throw new TRPCError({
              code: 'UNAUTHORIZED',
              message: 'Password is incorrect',
            })
          }
        }
      }

      // Delete user (cascade will handle related records)
      await ctx.db.user.delete({
        where: { id: ctx.session.user.id },
      })

      return { success: true }
    }),

  validateResetToken: publicProcedure
    .input(
      z.object({
        token: z.string(),
      })
    )
    .query(async ({ ctx, input }) => {
      const { token } = input

      const user = await ctx.db.user.findFirst({
        where: {
          resetToken: token,
          resetTokenExpiry: {
            gt: new Date(),
          },
        },
      })

      return {
        valid: !!user,
        email: user?.email,
      }
    }),
}) 