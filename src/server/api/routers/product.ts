import { z } from 'zod'
import { createTRPCRouter, publicProcedure } from '@/server/api/trpc'

export const productRouter = createTRPCRouter({
  getAll: publicProcedure
    .input(
      z.object({
        category: z.string().optional(),
        featured: z.boolean().optional(),
        limit: z.number().min(1).max(100).default(50),
      })
    )
    .query(async ({ ctx, input }) => {
      const products = await ctx.db.product.findMany({
        where: {
          isActive: true,
          ...(input.featured !== undefined && { isFeatured: input.featured }),
        },
        include: {
          plans: {
            where: {
              isAvailable: true,
            },
            orderBy: {
              price: 'asc',
            },
          },
        },
        orderBy: [
          { displayOrder: 'asc' },
          { createdAt: 'desc' },
        ],
        take: input.limit,
      })

      return {
        products,
      }
    }),

  getCategories: publicProcedure.query(async ({ ctx }) => {
    // Define category labels
    const categoryLabels = {
      'STREAMING_MEDIA': 'Streaming & Media',
      'PRODUCTIVITY_TOOLS': 'Productivity & Tools',
      'CREATIVE_DESIGN': 'Creative & Design',
      'LEARNING_EDUCATION': 'Learning & Education',
      'SOCIAL_COMMUNICATION': 'Social & Communication',
      'GAMING': 'Gaming',
      'BUSINESS_FINANCE': 'Business & Finance',
      'HEALTH_FITNESS': 'Health & Fitness',
    }

    // Get product counts per category for active products only
    const categoryCounts = await ctx.db.product.groupBy({
      by: ['category'],
      where: {
        isActive: true,
      },
      _count: {
        id: true,
      },
    })

    // Filter to only include categories that have products
    return categoryCounts
      .filter(categoryCount => categoryCount._count.id > 0)
      .map(categoryCount => ({
        key: categoryCount.category,
        label: categoryLabels[categoryCount.category as keyof typeof categoryLabels] || categoryCount.category,
        count: categoryCount._count.id,
      }))
      .sort((a, b) => a.label.localeCompare(b.label))
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
          plans: {
            where: {
              isAvailable: true,
            },
            orderBy: {
              price: 'asc',
            },
          },
        },
      })
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
          plans: {
            where: {
              isAvailable: true,
            },
            orderBy: {
              price: 'asc',
            },
          },
        },
      })
    }),
}) 