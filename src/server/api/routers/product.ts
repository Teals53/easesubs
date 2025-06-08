import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "@/server/api/trpc";
import { TRPCError } from "@trpc/server";

export const productRouter = createTRPCRouter({
  getAll: publicProcedure
    .input(
      z.object({
        category: z.string().optional(),
        featured: z.boolean().optional(),
        limit: z.number().min(1).max(100).default(50),
      }),
    )
    .query(async ({ ctx, input }) => {
      const products = await ctx.db.product.findMany({
        where: {
          isActive: true,
          ...(input.featured !== undefined && { isFeatured: input.featured }),
        },
        include: {
          category: true,
          plans: {
            where: {
              isAvailable: true,
            },
            orderBy: {
              price: "asc",
            },
          },
        },
        orderBy: [{ displayOrder: "asc" }, { createdAt: "desc" }],
        take: input.limit,
      });

      return {
        products,
      };
    }),

  getCategories: publicProcedure.query(async ({ ctx }) => {
    const categories = await ctx.db.category.findMany({
      where: {
        isActive: true,
      },
      include: {
        _count: {
          select: {
            products: {
              where: {
                isActive: true,
              },
            },
          },
        },
      },
      orderBy: [{ displayOrder: "asc" }, { name: "asc" }],
    });

    // Filter to only include categories that have products
    return categories
      .filter((category) => category._count.products > 0)
      .map((category) => ({
        id: category.id,
        key: category.slug,
        label: category.name,
        count: category._count.products,
        color: category.color,
        icon: category.icon,
        description: category.description,
      }));
  }),

  getById: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      return ctx.db.product.findUnique({
        where: {
          id: input.id,
          isActive: true,
        },
        include: {
          category: true,
          plans: {
            where: {
              isAvailable: true,
            },
            orderBy: {
              price: "asc",
            },
          },
        },
      });
    }),

  getBySlug: publicProcedure
    .input(z.object({ slug: z.string() }))
    .query(async ({ ctx, input }) => {
      return ctx.db.product.findUnique({
        where: {
          slug: input.slug,
          isActive: true,
        },
        include: {
          category: true,
          plans: {
            where: {
              isAvailable: true,
            },
            orderBy: {
              price: "asc",
            },
          },
        },
      });
    }),

  getStockAvailability: publicProcedure
    .input(z.object({ planId: z.string() }))
    .query(async ({ ctx, input }) => {
      const plan = await ctx.db.productPlan.findUnique({
        where: { id: input.planId },
        select: { deliveryType: true },
      });

      if (!plan) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Plan not found",
        });
      }

      // For MANUAL delivery, always return unlimited stock
      if (plan.deliveryType === "MANUAL") {
        return {
          available: true,
          count: null, // null means unlimited
          deliveryType: "MANUAL",
        };
      }

      // For AUTOMATIC delivery, check actual stock
      const stockCount = await ctx.db.stockItem.count({
        where: {
          planId: input.planId,
          isUsed: false,
        },
      });

      return {
        available: stockCount > 0,
        count: stockCount,
        deliveryType: "AUTOMATIC",
      };
    }),
});
