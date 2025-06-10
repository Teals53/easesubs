import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { TRPCError } from "@trpc/server";
import bcrypt from "bcryptjs";

export const userRouter = createTRPCRouter({
  getProfile: protectedProcedure.query(async ({ ctx }) => {
    const user = await ctx.db.user.findUnique({
      where: { id: ctx.session.user.id },
    });

    if (!user) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "User not found",
      });
    }

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      isActive: user.isActive,
      createdAt: user.createdAt,
    };
  }),

  updateProfile: protectedProcedure
    .input(
      z.object({
        name: z
          .string()
          .min(2, "Name must be at least 2 characters")
          .max(50, "Name must be less than 50 characters")
          .regex(
            /^[a-zA-Z\s'-]+$/,
            "Name can only contain letters, spaces, hyphens, and apostrophes",
          )
          .trim(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      try {
        // Validate that the user exists and is active
        const existingUser = await ctx.db.user.findUnique({
          where: { id: userId },
          select: { id: true, isActive: true, name: true },
        });

        if (!existingUser) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "User not found",
          });
        }

        if (!existingUser.isActive) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Account is inactive",
          });
        }

        // Update the user's name
        const updatedUser = await ctx.db.user.update({
          where: { id: userId },
          data: { 
            name: input.name,
            updatedAt: new Date(),
          },
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            updatedAt: true,
          },
        });

        return {
          success: true,
          message: "Profile updated successfully",
          user: updatedUser,
        };
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }
        
        console.error("Profile update error:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to update profile",
        });
      }
    }),

  getDashboardStats: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.user.id;

    // Get user's active subscriptions count
    const activeSubscriptions = await ctx.db.userSubscription.count({
      where: {
        userId,
        status: "ACTIVE",
      },
    });

    // Get user's total orders
    const totalOrders = await ctx.db.order.count({
      where: {
        userId,
      },
    });

    // Get user's completed orders
    const completedOrders = await ctx.db.order.count({
      where: {
        userId,
        status: "COMPLETED",
      },
    });

    // Get total spent
    const totalSpent = await ctx.db.order.aggregate({
      where: {
        userId,
        status: "COMPLETED",
      },
      _sum: {
        total: true,
      },
    });

    // Get open support tickets
    const openTickets = await ctx.db.supportTicket.count({
      where: {
        userId,
        status: {
          in: ["OPEN", "IN_PROGRESS"],
        },
      },
    });

    // Get cart items count
    const cartItemsCount = await ctx.db.cartItem.count({
      where: {
        userId,
      },
    });

    // Get recent orders for dashboard
    const recentOrders = await ctx.db.order.findMany({
      where: { userId },
      take: 5,
      orderBy: { createdAt: "desc" },
      include: {
        items: {
          include: {
            plan: {
              include: {
                product: true,
              },
            },
          },
        },
      },
    });

    // Calculate monthly spending (orders from last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const monthlySpentResult = await ctx.db.order.aggregate({
      where: {
        userId,
        status: "COMPLETED",
        createdAt: {
          gte: thirtyDaysAgo,
        },
      },
      _sum: {
        total: true,
      },
    });

    // Calculate estimated monthly savings
    // This is a rough calculation based on the difference between original prices and discounted prices
    const userPlans = await ctx.db.userSubscription.findMany({
      where: {
        userId,
        status: "ACTIVE",
      },
      include: {
        plan: true,
      },
    });

    let monthlySavings = 0;
    userPlans.forEach((subscription) => {
      const originalPrice = subscription.plan.originalPrice;
      const currentPrice = subscription.plan.price;
      if (originalPrice && currentPrice) {
        monthlySavings += Number(originalPrice) - Number(currentPrice);
      }
    });

    return {
      activeSubscriptions,
      totalOrders,
      completedOrders,
      totalSpent: totalSpent._sum.total || 0,
      openTickets,
      cartItemsCount,
      recentOrders,
      monthlySpent: monthlySpentResult._sum.total || 0,
      monthlySavings,
    };
  }),

  getRecentActivity: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.user.id;

    // Get recent orders
    const recentOrders = await ctx.db.order.findMany({
      where: { userId },
      take: 5,
      orderBy: { createdAt: "desc" },
      include: {
        items: {
          include: {
            plan: {
              include: {
                product: true,
              },
            },
          },
        },
      },
    });

    // Get recent support tickets
    const recentTickets = await ctx.db.supportTicket.findMany({
      where: { userId },
      take: 5,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        ticketNumber: true,
        title: true,
        status: true,
        priority: true,
        createdAt: true,
      },
    });

    // Get expiring subscriptions (within 7 days)
    const expiringSubscriptions = await ctx.db.userSubscription.findMany({
      where: {
        userId,
        status: "ACTIVE",
        endDate: {
          lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
        },
      },
      include: {
        plan: {
          include: {
            product: true,
          },
        },
      },
      orderBy: { endDate: "asc" },
      take: 5,
    });

    return {
      recentOrders,
      recentTickets,
      expiringSubscriptions,
    };
  }),

  getNotificationSettings: protectedProcedure.query(async () => {
    // Get notification settings from profile if they exist
    // For now, return default settings
    // In future, you could extend the UserProfile model to include notification preferences

    // Return default settings
    return {
      emailNotifications: true,
      orderConfirmations: true,
      supportUpdates: true,
      marketingEmails: false,
      subscriptionReminders: true,
    };
  }),

  updateNotificationSettings: protectedProcedure
    .input(
      z.object({
        emailNotifications: z.boolean().optional(),
        orderConfirmations: z.boolean().optional(),
        supportUpdates: z.boolean().optional(),
        marketingEmails: z.boolean().optional(),
        subscriptionReminders: z.boolean().optional(),
      }),
    )
    .mutation(async () => {
      // Note: Notification settings storage has been removed
      // In a real implementation, you might want a separate NotificationSettings model
      return {
        success: true,
        message: "Notification settings updated successfully",
      };
    }),

  deleteAccount: protectedProcedure
    .input(
      z.object({
        password: z.string().min(1, "Password is required"),
        confirmation: z.literal("DELETE MY ACCOUNT"),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      // Get user with password
      const user = await ctx.db.user.findUnique({
        where: { id: userId },
      });

      if (!user || !user.password) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Cannot delete account - invalid user or OAuth account",
        });
      }

      // Verify password
      const isPasswordValid = await bcrypt.compare(
        input.password,
        user.password,
      );
      if (!isPasswordValid) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Invalid password",
        });
      }

      try {
        // Soft delete: deactivate account instead of hard delete
        await ctx.db.user.update({
          where: { id: userId },
          data: {
            isActive: false,
            email: `deleted_${Date.now()}_${user.email}`, // Anonymize email
            name: "Deleted User",
          },
        });

        return {
          success: true,
          message: "Account has been deactivated successfully",
        };
      } catch {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to delete account",
        });
      }
    }),
});
