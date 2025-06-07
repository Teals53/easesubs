import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { TRPCError } from "@trpc/server";
import type { Prisma } from "@prisma/client";

export const adminRouter = createTRPCRouter({
  getDashboardStats: protectedProcedure.query(async ({ ctx }) => {
    // Check if user is admin
    if (ctx.session.user.role !== "ADMIN") {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Admin access required",
      });
    }

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

  getRecentActivity: protectedProcedure.query(async ({ ctx }) => {
    // Check if user is admin
    if (ctx.session.user.role !== "ADMIN") {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Admin access required",
      });
    }

    // Recent orders
    const recentOrders = await ctx.db.order.findMany({
      take: 10,
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
      take: 10,
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
      take: 10,
      orderBy: { createdAt: "desc" },
      include: {
        user: { select: { name: true, email: true } },
      },
    });

    return {
      orders: recentOrders,
      users: recentUsers,
      tickets: recentTickets,
    };
  }),

  getUsers: protectedProcedure
    .input(
      z.object({
        search: z.string().optional(),
        role: z.enum(["ADMIN", "USER"]).optional(),
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

      const { page, limit, search, role } = input;
      const skip = (page - 1) * limit;

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

      return {
        users,
        total,
        pages: Math.ceil(total / limit),
        currentPage: page,
      };
    }),

  updateUserRole: protectedProcedure
    .input(
      z.object({
        userId: z.string(),
        role: z.enum(["USER", "ADMIN", "SUPPORT_AGENT", "MANAGER"]),
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

      const user = await ctx.db.user.update({
        where: { id: input.userId },
        data: { role: input.role },
      });

      return user;
    }),

  updateUser: protectedProcedure
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
      // Check if user is admin
      if (ctx.session.user.role !== "ADMIN") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Admin access required",
        });
      }

      const { userId, ...updateData } = input;

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

        // Delete addresses
        await tx.address.deleteMany({
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

        // Delete user profile
        await tx.userProfile.deleteMany({
          where: { userId: input.userId },
        });

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

      return { success: true };
    }),

  getProducts: protectedProcedure
    .input(
      z.object({
        search: z.string().optional(),
        category: z
          .enum([
            "STREAMING_MEDIA",
            "PRODUCTIVITY_TOOLS",
            "CREATIVE_DESIGN",
            "LEARNING_EDUCATION",
            "SOCIAL_COMMUNICATION",
            "GAMING",
            "BUSINESS_FINANCE",
            "HEALTH_FITNESS",
          ])
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

      const { page, limit, search, category } = input;
      const skip = (page - 1) * limit;

      const where: Prisma.ProductWhereInput = {};

      if (search) {
        where.OR = [
          { name: { contains: search, mode: "insensitive" as const } },
          { description: { contains: search, mode: "insensitive" as const } },
        ];
      }

      if (category) {
        where.category = category;
      }

      const [products, total, stats] = await Promise.all([
        ctx.db.product.findMany({
          where,
          skip,
          take: limit,
          include: {
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
        category: z.enum([
          "STREAMING_MEDIA",
          "PRODUCTIVITY_TOOLS",
          "CREATIVE_DESIGN",
          "LEARNING_EDUCATION",
          "SOCIAL_COMMUNICATION",
          "GAMING",
          "BUSINESS_FINANCE",
          "HEALTH_FITNESS",
        ]),
        logoUrl: z.string().optional(),
        logoName: z.string().optional(),
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
              stockQuantity: z.number().nullable().optional(),
              maxSubscriptions: z.number().optional(),
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
        category: z
          .enum([
            "STREAMING_MEDIA",
            "PRODUCTIVITY_TOOLS",
            "CREATIVE_DESIGN",
            "LEARNING_EDUCATION",
            "SOCIAL_COMMUNICATION",
            "GAMING",
            "BUSINESS_FINANCE",
            "HEALTH_FITNESS",
          ])
          .optional(),
        logoUrl: z.string().optional(),
        logoName: z.string().optional(),
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
              stockQuantity: z.number().nullable().optional(),
              maxSubscriptions: z.number().optional(),
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
                  stockQuantity: plan.stockQuantity,
                  maxSubscriptions: plan.maxSubscriptions,
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
                  stockQuantity: plan.stockQuantity,
                  maxSubscriptions: plan.maxSubscriptions,
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

    const categories = [
      { key: "STREAMING_MEDIA", label: "Streaming & Media" },
      { key: "PRODUCTIVITY_TOOLS", label: "Productivity & Tools" },
      { key: "CREATIVE_DESIGN", label: "Creative & Design" },
      { key: "LEARNING_EDUCATION", label: "Learning & Education" },
      { key: "SOCIAL_COMMUNICATION", label: "Social & Communication" },
      { key: "GAMING", label: "Gaming" },
      { key: "BUSINESS_FINANCE", label: "Business & Finance" },
      { key: "HEALTH_FITNESS", label: "Health & Fitness" },
    ];

    // Get product counts per category
    const categoryCounts = await ctx.db.product.groupBy({
      by: ["category"],
      _count: {
        id: true,
      },
    });

    return categories.map((category) => ({
      ...category,
      count:
        categoryCounts.find((c) => c.category === category.key)?._count.id || 0,
    }));
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
        message: z.string().min(1, "Message cannot be empty"),
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
});
