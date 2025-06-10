import { z } from "zod";
import { createTRPCRouter, protectedProcedure, adminProcedure } from "../trpc";
import { TRPCError } from "@trpc/server";
import type { Prisma } from "@prisma/client";
import { securityMonitor } from "@/lib/security-monitor";

export const adminRouter = createTRPCRouter({
  getDashboardStats: adminProcedure.query(async ({ ctx }) => {

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());

    // User statistics
    const totalUsers = await ctx.db.user.count();
    const adminUsers = await ctx.db.user.count({
      where: { role: "ADMIN" },
    });
    const newUsersThisMonth = await ctx.db.user.count({
      where: {
        createdAt: { gte: startOfMonth },
      },
    });

    // Order statistics
    const totalOrders = await ctx.db.order.count();
    const completedOrders = await ctx.db.order.count({
      where: { status: "COMPLETED" },
    });
    const ordersThisMonth = await ctx.db.order.count({
      where: {
        createdAt: { gte: startOfMonth },
      },
    });

    // Revenue statistics
    const totalRevenue = await ctx.db.order.aggregate({
      where: { status: "COMPLETED" },
      _sum: { total: true },
    });
    const monthlyRevenue = await ctx.db.order.aggregate({
      where: {
        status: "COMPLETED",
        createdAt: { gte: startOfMonth },
      },
      _sum: { total: true },
    });
    const weeklyRevenue = await ctx.db.order.aggregate({
      where: {
        status: "COMPLETED",
        createdAt: { gte: startOfWeek },
      },
      _sum: { total: true },
    });

    // Subscription statistics
    const activeSubscriptions = await ctx.db.userSubscription.count({
      where: { status: "ACTIVE" },
    });
    const totalSubscriptions = await ctx.db.userSubscription.count();
    const newSubscriptionsThisMonth = await ctx.db.userSubscription.count({
      where: {
        createdAt: { gte: startOfMonth },
      },
    });

    // Product statistics
    const totalProducts = await ctx.db.product.count();
    const activeProducts = await ctx.db.product.count({
      where: { isActive: true },
    });

    // Support ticket statistics
    const totalTickets = await ctx.db.supportTicket.count();
    const openTickets = await ctx.db.supportTicket.count({
      where: { status: "OPEN" },
    });
    const inProgressTickets = await ctx.db.supportTicket.count({
      where: { status: "IN_PROGRESS" },
    });

    return {
      users: {
        total: totalUsers,
        admins: adminUsers,
        newThisMonth: newUsersThisMonth,
      },
      orders: {
        total: totalOrders,
        completed: completedOrders,
        thisMonth: ordersThisMonth,
      },
      revenue: {
        total: totalRevenue._sum.total || 0,
        monthly: monthlyRevenue._sum.total || 0,
        weekly: weeklyRevenue._sum.total || 0,
      },
      subscriptions: {
        active: activeSubscriptions,
        total: totalSubscriptions,
        newThisMonth: newSubscriptionsThisMonth,
      },
      products: {
        total: totalProducts,
        active: activeProducts,
      },
      tickets: {
        total: totalTickets,
        open: openTickets,
        inProgress: inProgressTickets,
      },
    };
  }),

  getRecentActivity: adminProcedure.query(async ({ ctx }) => {

    // Recent orders
    const recentOrders = await ctx.db.order.findMany({
      take: 15,
      orderBy: { createdAt: "desc" },
      include: {
        user: { select: { name: true, email: true } },
        items: {
          include: {
            plan: {
              include: { product: true },
            },
          },
        },
      },
    });

    // Recent users
    const recentUsers = await ctx.db.user.findMany({
      take: 15,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
        role: true,
        isActive: true,
      },
    });

    // Recent support tickets
    const recentTickets = await ctx.db.supportTicket.findMany({
      take: 15,
      orderBy: { createdAt: "desc" },
      include: {
        user: { select: { name: true, email: true } },
      },
    });

    // Combine all activities and sort by creation date
    const allActivities = [
      ...recentOrders.map((order) => ({
        type: "order" as const,
        data: order,
        createdAt: order.createdAt,
      })),
      ...recentUsers.map((user) => ({
        type: "user" as const,
        data: user,
        createdAt: user.createdAt,
      })),
      ...recentTickets.map((ticket) => ({
        type: "ticket" as const,
        data: ticket,
        createdAt: ticket.createdAt,
      })),
    ]
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      )
      .slice(0, 10); // Take the 10 most recent activities

    return {
      orders: recentOrders,
      users: recentUsers,
      tickets: recentTickets,
      combinedActivities: allActivities,
    };
  }),

  getUsers: adminProcedure
    .input(
      z.object({
        search: z.string().optional(),
        role: z.enum(["ADMIN", "USER"]).optional(),
        page: z.number().min(1).default(1),
        limit: z.number().min(1).max(100).default(20),
      }),
    )
    .query(async ({ ctx, input }) => {

      const { page, limit, search, role } = input;
      const skip = (page - 1) * limit;

      // Monitor for potential data exfiltration
      if (limit > 50) {
        await securityMonitor.analyzeEvent({
          type: "DATA_EXFILTRATION",
          severity: "HIGH",
          source: "Admin Panel - User Data Access",
          userId: ctx.session.user.id,
          details: {
            action: "bulk_user_data_request",
            requestedLimit: limit,
            page,
            search,
            role,
            adminId: ctx.session.user.id,
            adminEmail: ctx.session.user.email,
            timestamp: new Date().toISOString()
          }
        });
      }

      const where: Prisma.UserWhereInput = {};

      if (search) {
        where.OR = [
          { name: { contains: search, mode: "insensitive" } },
          { email: { contains: search, mode: "insensitive" } },
        ];
      }

      if (role) {
        where.role = role;
      }

      const [users, total] = await Promise.all([
        ctx.db.user.findMany({
          where,
          skip,
          take: limit,
          orderBy: { createdAt: "desc" },
          include: {
            subscriptions: {
              where: { status: "ACTIVE" },
              include: {
                plan: {
                  include: { product: true },
                },
              },
            },
            _count: {
              select: {
                orders: true,
                subscriptions: true,
              },
            },
          },
        }),
        ctx.db.user.count({ where }),
      ]);

      // Log admin action for user data access
      await securityMonitor.analyzeEvent({
        type: "ADMIN_ACTION",
        severity: "LOW",
        source: "Admin Panel - User Data Access",
        userId: ctx.session.user.id,
        details: {
          action: "user_data_access",
          recordsReturned: users.length,
          totalRecords: total,
          page,
          limit,
          search,
          role,
          adminId: ctx.session.user.id
        }
      });

      return {
        users,
        total,
        pages: Math.ceil(total / limit),
        currentPage: page,
      };
    }),

  updateUserRole: adminProcedure
    .input(
      z.object({
        userId: z.string(),
        role: z.enum(["USER", "ADMIN", "SUPPORT_AGENT", "MANAGER"]),
      }),
    )
    .mutation(async ({ ctx, input }) => {

      // Get current user data for logging
      const currentUser = await ctx.db.user.findUnique({
        where: { id: input.userId },
        select: { role: true, email: true }
      });

      const user = await ctx.db.user.update({
        where: { id: input.userId },
        data: { role: input.role },
      });

      // Log admin action
      await securityMonitor.analyzeEvent({
        type: "ADMIN_ACTION",
        severity: input.role === "ADMIN" ? "HIGH" : "MEDIUM",
        source: "Admin Panel - Role Update",
        userId: ctx.session.user.id,
        details: {
          action: "role_change",
          targetUserId: input.userId,
          targetUserEmail: currentUser?.email,
          oldRole: currentUser?.role,
          newRole: input.role,
          adminId: ctx.session.user.id,
          adminEmail: ctx.session.user.email
        }
      });

      // Log privilege escalation if promoting to admin
      if (input.role === "ADMIN" && currentUser?.role !== "ADMIN") {
        await securityMonitor.analyzeEvent({
          type: "PRIVILEGE_ESCALATION",
          severity: "CRITICAL",
          source: "Admin Panel - Privilege Escalation",
          userId: ctx.session.user.id,
          details: {
            action: "admin_promotion",
            targetUserId: input.userId,
            targetUserEmail: currentUser?.email,
            oldRole: currentUser?.role,
            newRole: input.role,
            adminId: ctx.session.user.id
          }
        });
      }

      return user;
    }),

  updateUser: adminProcedure
    .input(
      z.object({
        userId: z.string(),
        name: z.string().min(1, "Name is required").optional(),
        email: z.string().email("Invalid email").optional(),
        role: z.enum(["USER", "ADMIN", "SUPPORT_AGENT", "MANAGER"]).optional(),
        isActive: z.boolean().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {

      const { userId, ...updateData } = input;

      // Get current user data for logging
      const currentUser = await ctx.db.user.findUnique({
        where: { id: userId },
        select: { role: true, email: true, name: true, isActive: true }
      });

      // Check if email is already taken by another user
      if (updateData.email) {
        const existingUser = await ctx.db.user.findFirst({
          where: {
            email: updateData.email,
            NOT: { id: userId },
          },
        });

        if (existingUser) {
          throw new TRPCError({
            code: "CONFLICT",
            message: "Email is already taken by another user",
          });
        }
      }

      const user = await ctx.db.user.update({
        where: { id: userId },
        data: updateData,
      });

      // Log admin action
      await securityMonitor.analyzeEvent({
        type: "ADMIN_ACTION",
        severity: "MEDIUM",
        source: "Admin Panel - User Update",
        userId: ctx.session.user.id,
        details: {
          action: "user_update",
          targetUserId: userId,
          targetUserEmail: currentUser?.email,
          changes: updateData,
          adminId: ctx.session.user.id,
          adminEmail: ctx.session.user.email
        }
      });

      return user;
    }),

  toggleUserStatus: protectedProcedure
    .input(z.object({ userId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // Check if user is admin
      if (ctx.session.user.role !== "ADMIN") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Admin access required",
        });
      }

      const user = await ctx.db.user.findUnique({
        where: { id: input.userId },
      });

      if (!user) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "User not found",
        });
      }

      const updatedUser = await ctx.db.user.update({
        where: { id: input.userId },
        data: { isActive: !user.isActive },
      });

      // Log admin action
      await securityMonitor.analyzeEvent({
        type: "ADMIN_ACTION",
        severity: !user.isActive ? "MEDIUM" : "HIGH", // Deactivating is more severe
        source: "Admin Panel - User Status",
        userId: ctx.session.user.id,
        details: {
          action: user.isActive ? "user_deactivated" : "user_activated",
          targetUserId: input.userId,
          targetUserEmail: user.email,
          oldStatus: user.isActive,
          newStatus: !user.isActive,
          adminId: ctx.session.user.id,
          adminEmail: ctx.session.user.email
        }
      });

      return updatedUser;
    }),

  deleteUser: protectedProcedure
    .input(z.object({ userId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // Check if user is admin
      if (ctx.session.user.role !== "ADMIN") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Admin access required",
        });
      }

      // Prevent admins from deleting themselves
      if (ctx.session.user.id === input.userId) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Cannot delete your own account",
        });
      }

      // Get user data for logging before deletion
      const userToDelete = await ctx.db.user.findUnique({
        where: { id: input.userId },
        select: { email: true, role: true, name: true }
      });

      // Delete user and related data
      await ctx.db.$transaction(async (tx) => {
        // Delete user subscriptions first
        await tx.userSubscription.deleteMany({
          where: { userId: input.userId },
        });

        // Delete cart items
        await tx.cartItem.deleteMany({
          where: { userId: input.userId },
        });

        // Delete support ticket messages
        await tx.supportTicketMessage.deleteMany({
          where: {
            ticket: {
              userId: input.userId,
            },
          },
        });

        // Delete support ticket attachments
        await tx.supportTicketAttachment.deleteMany({
          where: {
            ticket: {
              userId: input.userId,
            },
          },
        });

        // Delete support tickets
        await tx.supportTicket.deleteMany({
          where: { userId: input.userId },
        });

        // Delete reviews
        await tx.review.deleteMany({
          where: { userId: input.userId },
        });

        // Get all orders for this user
        const userOrders = await tx.order.findMany({
          where: { userId: input.userId },
          select: { id: true },
        });

        if (userOrders.length > 0) {
          const orderIds = userOrders.map((order) => order.id);

          // Delete payments for these orders
          await tx.payment.deleteMany({
            where: { orderId: { in: orderIds } },
          });

          // Delete order items
          await tx.orderItem.deleteMany({
            where: { orderId: { in: orderIds } },
          });

          // Delete orders
          await tx.order.deleteMany({
            where: { userId: input.userId },
          });
        }

        // Delete accounts (OAuth accounts)
        await tx.account.deleteMany({
          where: { userId: input.userId },
        });

        // Delete sessions
        await tx.session.deleteMany({
          where: { userId: input.userId },
        });

        // Finally delete the user
        await tx.user.delete({
          where: { id: input.userId },
        });
      });

      // Log critical admin action
      await securityMonitor.analyzeEvent({
        type: "ADMIN_ACTION",
        severity: "CRITICAL",
        source: "Admin Panel - User Deletion",
        userId: ctx.session.user.id,
        details: {
          action: "user_deleted",
          targetUserId: input.userId,
          targetUserEmail: userToDelete?.email,
          targetUserRole: userToDelete?.role,
          targetUserName: userToDelete?.name,
          adminId: ctx.session.user.id,
          adminEmail: ctx.session.user.email,
          deletionTimestamp: new Date().toISOString()
        }
      });

      return { success: true };
    }),

  getProducts: protectedProcedure
    .input(
      z.object({
        search: z.string().optional(),
        categoryId: z.string().optional(),
        page: z.number().min(1).default(1),
        limit: z.number().min(1).max(100).default(20),
      }),
    )
    .query(async ({ ctx, input }) => {
      // Check if user is admin
      if (ctx.session.user.role !== "ADMIN") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Admin access required",
        });
      }

      const { page, limit, search, categoryId } = input;
      const skip = (page - 1) * limit;

      const where: Prisma.ProductWhereInput = {};

      if (search) {
        where.OR = [
          { name: { contains: search, mode: "insensitive" as const } },
          { description: { contains: search, mode: "insensitive" as const } },
          {
            category: {
              name: { contains: search, mode: "insensitive" as const },
            },
          },
        ];
      }

      if (categoryId) {
        where.categoryId = categoryId;
      }

      const [products, total, stats] = await Promise.all([
        ctx.db.product.findMany({
          where,
          skip,
          take: limit,
          include: {
            category: true,
            plans: {
              orderBy: { price: "asc" },
              take: 1, // Get cheapest plan for pricing display
            },
          },
          orderBy: { createdAt: "desc" },
        }),
        ctx.db.product.count({ where }),
        // Get stats for ALL products, not just current page
        Promise.all([
          ctx.db.product.count(), // total products
          ctx.db.product.count({ where: { isActive: true } }), // active products
          ctx.db.product.count({ where: { isActive: false } }), // inactive products
          // Calculate average price across all plans
          ctx.db.productPlan
            .aggregate({
              _avg: { price: true },
            })
            .then((result) => Number(result._avg.price) || 0),
        ]).then(([total, active, inactive, avgPrice]) => ({
          total,
          active,
          inactive,
          avgPrice,
        })),
      ]);

      return {
        products,
        total,
        pages: Math.ceil(total / limit),
        currentPage: page,
        stats,
      };
    }),

  createProduct: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1, "Product name is required"),
        slug: z.string().min(1, "Slug is required"),
        description: z.string().optional(),
        categoryId: z.string().min(1, "Category is required"),
        logoUrl: z.string().optional(),
        borderColor: z.string().optional(),
        isActive: z.boolean().default(true),
        isFeatured: z.boolean().default(false),
        displayOrder: z.number().optional(),
        seoTitle: z.string().optional(),
        seoDescription: z.string().optional(),
        plans: z
          .array(
            z.object({
              name: z.string().min(1, "Plan name is required"),
              planType: z.string().min(1, "Plan type is required"),
              price: z.number().min(0, "Price must be positive"),
              originalPrice: z.number().optional(),
              billingPeriod: z.enum([
                "MONTHLY",
                "YEARLY",
                "LIFETIME",
                "CUSTOM",
              ]),
              duration: z.number().min(1, "Duration must be positive"),
              features: z.array(z.string()).optional(),
              isPopular: z.boolean().default(false),
              isAvailable: z.boolean().default(true),
              maxSubscriptions: z.number().optional(),
              deliveryType: z.enum(["MANUAL", "AUTOMATIC"]).default("MANUAL"),
            }),
          )
          .min(1, "At least one plan is required"),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Check if user is admin
      if (ctx.session.user.role !== "ADMIN") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Admin access required",
        });
      }

      // Check if slug is unique
      const existingProduct = await ctx.db.product.findUnique({
        where: { slug: input.slug },
      });

      if (existingProduct) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Product with this slug already exists",
        });
      }

      const { plans, ...productData } = input;

      const product = await ctx.db.product.create({
        data: {
          ...productData,
          plans: {
            create: plans.map((plan) => ({
              ...plan,
              features: plan.features ? plan.features : undefined,
              deliveryType: plan.deliveryType,
            })),
          },
        },
        include: {
          plans: true,
        },
      });

      return product;
    }),

  updateProduct: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().min(1, "Product name is required").optional(),
        slug: z.string().min(1, "Slug is required").optional(),
        description: z.string().optional(),
        categoryId: z.string().optional(),
        logoUrl: z.string().optional(),
        borderColor: z.string().optional(),
        isActive: z.boolean().optional(),
        isFeatured: z.boolean().optional(),
        displayOrder: z.number().optional(),
        seoTitle: z.string().optional(),
        seoDescription: z.string().optional(),
        plans: z
          .array(
            z.object({
              id: z.string().optional(), // For existing plans
              name: z.string().min(1, "Plan name is required"),
              planType: z.string().min(1, "Plan type is required"),
              price: z.number().min(0, "Price must be positive"),
              originalPrice: z.number().optional(),
              billingPeriod: z.enum([
                "MONTHLY",
                "YEARLY",
                "LIFETIME",
                "CUSTOM",
              ]),
              duration: z.number().min(1, "Duration must be positive"),
              features: z.array(z.string()).optional(),
              isPopular: z.boolean().default(false),
              isAvailable: z.boolean().default(true),
              maxSubscriptions: z.number().optional(),
              deliveryType: z.enum(["MANUAL", "AUTOMATIC"]).optional(),
            }),
          )
          .optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Check if user is admin
      if (ctx.session.user.role !== "ADMIN") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Admin access required",
        });
      }

      const { id, slug, plans, ...updateData } = input;

      // Check if product exists
      const existingProduct = await ctx.db.product.findUnique({
        where: { id },
        include: { plans: true },
      });

      if (!existingProduct) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Product not found",
        });
      }

      // Check if slug is unique (if updating slug)
      if (slug && slug !== existingProduct.slug) {
        const slugExists = await ctx.db.product.findUnique({
          where: { slug },
        });

        if (slugExists) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Product with this slug already exists",
          });
        }
      }

      // Use transaction to update product and plans
      const product = await ctx.db.$transaction(async (tx) => {
        // Update product basic information
        await tx.product.update({
          where: { id },
          data: {
            ...updateData,
            ...(slug && { slug }),
          },
        });

        // Handle plans if provided
        if (plans) {
          // Get existing plan IDs
          const existingPlanIds = existingProduct.plans.map((p) => p.id);
          const updatedPlanIds = plans.filter((p) => p.id).map((p) => p.id!);

          // Delete plans that are no longer included
          const plansToDelete = existingPlanIds.filter(
            (id) => !updatedPlanIds.includes(id),
          );
          if (plansToDelete.length > 0) {
            await tx.productPlan.deleteMany({
              where: {
                id: { in: plansToDelete },
                productId: id,
              },
            });
          }

          // Update existing plans and create new ones
          for (const plan of plans) {
            if (plan.id) {
              // Update existing plan
              await tx.productPlan.update({
                where: { id: plan.id },
                data: {
                  name: plan.name,
                  planType: plan.planType,
                  price: plan.price,
                  originalPrice: plan.originalPrice,
                  billingPeriod: plan.billingPeriod,
                  duration: plan.duration,
                  features: plan.features || [],
                  isPopular: plan.isPopular,
                  isAvailable: plan.isAvailable,
                  maxSubscriptions: plan.maxSubscriptions,
                  deliveryType: plan.deliveryType || "MANUAL",
                },
              });
            } else {
              // Create new plan
              await tx.productPlan.create({
                data: {
                  productId: id,
                  name: plan.name,
                  planType: plan.planType,
                  price: plan.price,
                  originalPrice: plan.originalPrice,
                  billingPeriod: plan.billingPeriod,
                  duration: plan.duration,
                  features: plan.features || [],
                  isPopular: plan.isPopular,
                  isAvailable: plan.isAvailable,
                  maxSubscriptions: plan.maxSubscriptions,
                  deliveryType: "MANUAL",
                },
              });
            }
          }
        }

        // Return updated product with plans
        return await tx.product.findUnique({
          where: { id },
          include: {
            plans: {
              orderBy: { price: "asc" },
            },
          },
        });
      });

      return product;
    }),

  getProductById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      // Check if user is admin
      if (ctx.session.user.role !== "ADMIN") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Admin access required",
        });
      }

      const product = await ctx.db.product.findUnique({
        where: { id: input.id },
        include: {
          plans: {
            orderBy: { price: "asc" },
          },
        },
      });

      if (!product) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Product not found",
        });
      }

      return product;
    }),

  getCategories: protectedProcedure.query(async ({ ctx }) => {
    // Check if user is admin
    if (ctx.session.user.role !== "ADMIN") {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Admin access required",
      });
    }

    const categories = await ctx.db.category.findMany({
      orderBy: [{ displayOrder: "asc" }, { name: "asc" }],
      include: {
        _count: {
          select: {
            products: true,
          },
        },
      },
    });

    return categories.map((category) => ({
      id: category.id,
      name: category.name,
      slug: category.slug,
      description: category.description,
      color: category.color,
      icon: category.icon,
      isActive: category.isActive,
      displayOrder: category.displayOrder,
      createdAt: category.createdAt,
      updatedAt: category.updatedAt,
      count: category._count.products,
    }));
  }),

  createCategory: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1, "Category name is required"),
        slug: z.string().min(1, "Category slug is required"),
        description: z.string().optional(),
        color: z.string().optional(),
        icon: z.string().optional(),
        displayOrder: z.number().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Check if user is admin
      if (ctx.session.user.role !== "ADMIN") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Admin access required",
        });
      }

      // Check if category with this name or slug already exists
      const existingCategory = await ctx.db.category.findFirst({
        where: {
          OR: [{ name: input.name }, { slug: input.slug }],
        },
      });

      if (existingCategory) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "Category with this name or slug already exists",
        });
      }

      const category = await ctx.db.category.create({
        data: input,
      });

      return category;
    }),

  updateCategory: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().min(1, "Category name is required"),
        slug: z.string().min(1, "Category slug is required"),
        description: z.string().optional(),
        color: z.string().optional(),
        icon: z.string().optional(),
        displayOrder: z.number().optional(),
        isActive: z.boolean().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Check if user is admin
      if (ctx.session.user.role !== "ADMIN") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Admin access required",
        });
      }

      const { id, ...updateData } = input;

      // Check if category exists
      const existingCategory = await ctx.db.category.findUnique({
        where: { id },
      });

      if (!existingCategory) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Category not found",
        });
      }

      // Check if another category with this name or slug already exists
      const duplicateCategory = await ctx.db.category.findFirst({
        where: {
          AND: [
            { id: { not: id } },
            {
              OR: [{ name: updateData.name }, { slug: updateData.slug }],
            },
          ],
        },
      });

      if (duplicateCategory) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "Category with this name or slug already exists",
        });
      }

      const updatedCategory = await ctx.db.category.update({
        where: { id },
        data: updateData,
      });

      return updatedCategory;
    }),

  deleteCategory: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // Check if user is admin
      if (ctx.session.user.role !== "ADMIN") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Admin access required",
        });
      }

      // Check if category exists
      const category = await ctx.db.category.findUnique({
        where: { id: input.id },
        include: {
          _count: {
            select: {
              products: true,
            },
          },
        },
      });

      if (!category) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Category not found",
        });
      }

      // Check if category has associated products
      if (category._count.products > 0) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Cannot delete category with associated products",
        });
      }

      await ctx.db.category.delete({
        where: { id: input.id },
      });

      return { success: true };
    }),

  toggleCategoryStatus: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // Check if user is admin
      if (ctx.session.user.role !== "ADMIN") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Admin access required",
        });
      }

      const category = await ctx.db.category.findUnique({
        where: { id: input.id },
      });

      if (!category) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Category not found",
        });
      }

      const updatedCategory = await ctx.db.category.update({
        where: { id: input.id },
        data: { isActive: !category.isActive },
      });

      return updatedCategory;
    }),

  toggleProductStatus: protectedProcedure
    .input(z.object({ productId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // Check if user is admin
      if (ctx.session.user.role !== "ADMIN") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Admin access required",
        });
      }

      const product = await ctx.db.product.findUnique({
        where: { id: input.productId },
      });

      if (!product) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Product not found",
        });
      }

      const updatedProduct = await ctx.db.product.update({
        where: { id: input.productId },
        data: { isActive: !product.isActive },
      });

      return updatedProduct;
    }),

  deleteProduct: protectedProcedure
    .input(z.object({ productId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // Check if user is admin
      if (ctx.session.user.role !== "ADMIN") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Admin access required",
        });
      }

      // Check if product has active subscriptions
      const activeSubscriptions = await ctx.db.userSubscription.count({
        where: {
          plan: {
            productId: input.productId,
          },
          status: "ACTIVE",
        },
      });

      if (activeSubscriptions > 0) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Cannot delete product with active subscriptions",
        });
      }

      // Delete product and related data
      await ctx.db.$transaction(async (tx) => {
        // Get all plan IDs for this product first
        const planIds = await tx.productPlan.findMany({
          where: { productId: input.productId },
          select: { id: true },
        });

        // Delete cart items for this product
        await tx.cartItem.deleteMany({
          where: {
            planId: {
              in: planIds.map((plan: { id: string }) => plan.id),
            },
          },
        });

        // Delete plans
        await tx.productPlan.deleteMany({
          where: { productId: input.productId },
        });

        // Delete product
        await tx.product.delete({
          where: { id: input.productId },
        });
      });

      return { success: true };
    }),

  getOrders: protectedProcedure
    .input(
      z.object({
        search: z.string().optional(),
        status: z
          .enum(["PENDING", "PROCESSING", "COMPLETED", "CANCELLED", "FAILED"])
          .optional(),
        page: z.number().min(1).default(1),
        limit: z.number().min(1).max(100).default(20),
      }),
    )
    .query(async ({ ctx, input }) => {
      // Check if user is admin
      if (ctx.session.user.role !== "ADMIN") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Admin access required",
        });
      }

      const { page, limit, search, status } = input;
      const skip = (page - 1) * limit;

      const where: Prisma.OrderWhereInput = {};

      if (search) {
        where.OR = [
          { orderNumber: { contains: search, mode: "insensitive" } },
          { user: { name: { contains: search, mode: "insensitive" } } },
          { user: { email: { contains: search, mode: "insensitive" } } },
        ];
      }

      if (status) {
        where.status = status;
      }

      const [orders, total] = await Promise.all([
        ctx.db.order.findMany({
          where,
          skip,
          take: limit,
          orderBy: { createdAt: "desc" },
          include: {
            user: { select: { name: true, email: true } },
            items: {
              include: {
                plan: {
                  include: { product: true },
                },
              },
            },
          },
        }),
        ctx.db.order.count({ where }),
      ]);

      return {
        orders,
        total,
        pages: Math.ceil(total / limit),
        currentPage: page,
      };
    }),

  getSupportTickets: protectedProcedure
    .input(
      z.object({
        search: z.string().optional(),
        status: z.enum(["OPEN", "IN_PROGRESS", "CLOSED"]).optional(),
        page: z.number().min(1).default(1),
        limit: z.number().min(1).max(100).default(20),
      }),
    )
    .query(async ({ ctx, input }) => {
      // Check if user is admin
      if (ctx.session.user.role !== "ADMIN") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Admin access required",
        });
      }

      const { page, limit, search, status } = input;
      const skip = (page - 1) * limit;

      const where: Prisma.SupportTicketWhereInput = {};

      if (search) {
        where.OR = [
          { title: { contains: search, mode: "insensitive" } },
          { description: { contains: search, mode: "insensitive" } },
          { user: { name: { contains: search, mode: "insensitive" } } },
          { user: { email: { contains: search, mode: "insensitive" } } },
        ];
      }

      if (status) {
        where.status = status;
      }

      const [tickets, total] = await Promise.all([
        ctx.db.supportTicket.findMany({
          where,
          skip,
          take: limit,
          orderBy: { createdAt: "desc" },
          include: {
            user: { select: { name: true, email: true } },
          },
        }),
        ctx.db.supportTicket.count({ where }),
      ]);

      return {
        tickets,
        total,
        pages: Math.ceil(total / limit),
        currentPage: page,
      };
    }),

  updateTicketStatus: protectedProcedure
    .input(
      z.object({
        ticketId: z.string(),
        status: z.enum(["OPEN", "IN_PROGRESS", "CLOSED"]),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Check if user is admin
      if (ctx.session.user.role !== "ADMIN") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Admin access required",
        });
      }

      const ticket = await ctx.db.supportTicket.update({
        where: { id: input.ticketId },
        data: {
          status: input.status,
          lastActivityAt: new Date(),
          closedAt: input.status === "CLOSED" ? new Date() : undefined,
        },
      });

      return ticket;
    }),

  updateOrderStatus: protectedProcedure
    .input(
      z.object({
        orderId: z.string(),
        status: z.enum([
          "PENDING",
          "PROCESSING",
          "COMPLETED",
          "CANCELLED",
          "FAILED",
        ]),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Check if user is admin
      if (ctx.session.user.role !== "ADMIN") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Admin access required",
        });
      }

      const order = await ctx.db.order.update({
        where: { id: input.orderId },
        data: {
          status: input.status,
          completedAt: input.status === "COMPLETED" ? new Date() : undefined,
        },
      });

      return order;
    }),

  getTicketById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      // Check if user is admin
      if (ctx.session.user.role !== "ADMIN") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Admin access required",
        });
      }

      const ticket = await ctx.db.supportTicket.findFirst({
        where: {
          id: input.id,
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          assignedAgent: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          messages: {
            orderBy: {
              createdAt: "asc",
            },
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  role: true,
                },
              },
            },
          },
          attachments: true,
        },
      });

      if (!ticket) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Ticket not found",
        });
      }

      return ticket;
    }),

  addTicketMessage: protectedProcedure
    .input(
      z.object({
        ticketId: z.string(),
        message: z
          .string()
          .min(1, "Message cannot be empty")
          .max(5000, "Message cannot exceed 5000 characters"),
        isInternal: z.boolean().default(false),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Check if user is admin
      if (ctx.session.user.role !== "ADMIN") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Admin access required",
        });
      }

      // Verify ticket exists
      const ticket = await ctx.db.supportTicket.findFirst({
        where: {
          id: input.ticketId,
        },
      });

      if (!ticket) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Ticket not found",
        });
      }

      // Create message
      const message = await ctx.db.supportTicketMessage.create({
        data: {
          ticketId: input.ticketId,
          userId: ctx.session.user.id,
          message: input.message,
          isInternal: input.isInternal,
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
            },
          },
        },
      });

      // Update ticket last activity and status if needed
      await ctx.db.supportTicket.update({
        where: { id: input.ticketId },
        data: {
          lastActivityAt: new Date(),
          status: ticket.status === "OPEN" ? "IN_PROGRESS" : ticket.status,
        },
      });

      return message;
    }),

  deleteTicket: protectedProcedure
    .input(z.object({ ticketId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // Check if user is admin
      if (ctx.session.user.role !== "ADMIN") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Admin access required",
        });
      }

      // Delete ticket and related data
      await ctx.db.$transaction(async (tx) => {
        // Delete ticket messages first
        await tx.supportTicketMessage.deleteMany({
          where: { ticketId: input.ticketId },
        });

        // Delete ticket attachments if any
        await tx.supportTicketAttachment.deleteMany({
          where: { ticketId: input.ticketId },
        });

        // Finally delete the ticket
        await tx.supportTicket.delete({
          where: { id: input.ticketId },
        });
      });

      return { success: true };
    }),

  getOrderById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      // Check if user is admin
      if (ctx.session.user.role !== "ADMIN") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Admin access required",
        });
      }

      const order = await ctx.db.order.findFirst({
        where: {
          id: input.id,
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          items: {
            include: {
              plan: {
                include: {
                  product: true,
                },
              },
              ticket: {
                select: {
                  id: true,
                  ticketNumber: true,
                  status: true,
                },
              },
              stockItem: {
                select: {
                  id: true,
                  content: true,
                },
              },
            },
          },
          payments: {
            orderBy: {
              createdAt: "desc",
            },
          },
          subscriptions: {
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

      if (!order) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Order not found",
        });
      }

      return order;
    }),

  // Stock management routes
  getStockItems: protectedProcedure
    .input(
      z.object({
        planId: z.string().optional(),
        search: z.string().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      if (ctx.session.user.role !== "ADMIN") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Admin access required",
        });
      }

      const where: Prisma.StockItemWhereInput = {};
      if (input.planId) {
        where.planId = input.planId;
      }
      if (input.search) {
        where.content = {
          contains: input.search,
          mode: "insensitive",
        };
      }

      return await ctx.db.stockItem.findMany({
        where,
        include: {
          plan: {
            include: {
              product: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      });
    }),

  addStockItem: protectedProcedure
    .input(
      z.object({
        planId: z.string(),
        content: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      if (ctx.session.user.role !== "ADMIN") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Admin access required",
        });
      }

      return await ctx.db.stockItem.create({
        data: {
          planId: input.planId,
          content: input.content,
        },
      });
    }),

  deleteStockItem: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.session.user.role !== "ADMIN") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Admin access required",
        });
      }

      const stockItem = await ctx.db.stockItem.findUnique({
        where: { id: input.id },
      });

      if (!stockItem) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Stock item not found",
        });
      }

      if (stockItem.isUsed) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Cannot delete used stock item",
        });
      }

      return await ctx.db.stockItem.delete({
        where: { id: input.id },
      });
    }),

  // Get delivery status for order items
  getOrderItemDeliveryStatus: protectedProcedure
    .input(z.object({ orderItemId: z.string() }))
    .query(async ({ ctx, input }) => {
      const orderItem = await ctx.db.orderItem.findFirst({
        where: { id: input.orderItemId },
        include: {
          plan: {
            include: {
              product: true,
            },
          },
          order: {
            include: {
              user: true,
            },
          },
          stockItem: {
            select: { id: true, content: true },
          },
          ticket: {
            select: { id: true, ticketNumber: true, status: true },
          },
        },
      });

      if (!orderItem) {
        return { status: "NOT_FOUND" };
      }

      if (orderItem.deliveryType === "AUTOMATIC") {
        if (orderItem.deliveredAt && orderItem.stockItem) {
          return {
            status: "DELIVERED",
            type: "AUTOMATIC",
            deliveredAt: orderItem.deliveredAt,
            stockItem: orderItem.stockItem,
          };
        } else {
          return { status: "PENDING", type: "AUTOMATIC" };
        }
      } else {
        if (orderItem.ticket) {
          const isDelivered = orderItem.ticket.status === "CLOSED";
          return {
            status: isDelivered ? "DELIVERED" : "PENDING",
            type: "MANUAL",
            ticket: orderItem.ticket,
            deliveredAt: isDelivered ? orderItem.deliveredAt : null,
          };
        } else {
          return { status: "PENDING", type: "MANUAL" };
        }
      }
    }),

  // Security monitoring endpoints
  getSecurityStats: adminProcedure
    .input(z.object({
      timeRange: z.enum(["1h", "24h", "7d", "30d"]).default("24h")
    }))
    .query(async () => {

      const stats = await securityMonitor.getSecurityStats();
      return {
        totalEvents: stats.totalEvents,
        last24Hours: stats.last24Hours,
        severityDistribution: stats.severityDistribution,
        topThreats: stats.topThreats
      };
    }),

  getSecurityEvents: adminProcedure
    .input(z.object({
      limit: z.number().min(1).max(100).default(50),
      timeRange: z.enum(["1h", "24h", "7d", "30d"]).default("24h"),
      severity: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]).optional()
    }))
    .query(async ({ input }) => {

      // Get real events from database-backed security monitor
      const events = await securityMonitor.getRecentEvents(input.limit, input.severity);

      return events.map((event) => ({
        type: event.type,
        severity: event.severity,
        source: event.source,
        ip: event.ip, // Keep as null if not available
        riskScore: event.riskScore,
        timestamp: event.timestamp
      }));
    }),

  getBlockedIPs: adminProcedure
    .query(async () => {

      // Get real blocked IPs from database
      const blockedIPs = await securityMonitor.getBlockedIPsWithDetails();
      return blockedIPs;
    }),

  unblockIP: adminProcedure
    .input(z.object({
      ip: z.string()
    }))
    .mutation(async ({ input }) => {

      await securityMonitor.unblockIP(input.ip);
      return { success: true };
    }),

  blockIP: adminProcedure
    .input(z.object({
      ip: z.string(),
      reason: z.string(),
      duration: z.number().min(60).max(86400).default(3600)
    }))
    .mutation(async ({ input }) => {

      await securityMonitor.blockIP(input.ip, input.reason, Math.floor(input.duration / 60));
      return { success: true };
    }),
});

