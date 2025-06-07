import { z } from 'zod'
import { createTRPCRouter, protectedProcedure } from '@/server/api/trpc'
import { TRPCError } from '@trpc/server'

export const orderRouter = createTRPCRouter({
  create: protectedProcedure
    .input(
      z.object({
        items: z.array(
          z.object({
            planId: z.string(),
            quantity: z.number().positive().default(1),
          })
        ).min(1),
        paymentMethod: z.enum(['CRYPTOMUS', 'ADMIN_BYPASS']),
        billingAddress: z.object({
          firstName: z.string().min(1, 'First name is required'),
          lastName: z.string().min(1, 'Last name is required'),
          address1: z.string().min(1, 'Address is required'),
          city: z.string().min(1, 'City is required'),
          country: z.string().min(1, 'Country is required'),
          postalCode: z.string().min(1, 'Postal code is required'),
        }).optional(),
        redirectUrl: z.string().url().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id

      // Check if user is admin for ADMIN_BYPASS
      if (input.paymentMethod === 'ADMIN_BYPASS' && ctx.session.user.role !== 'ADMIN') {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Admin bypass payment method requires admin privileges',
        })
      }

      try {
        // Get plan details and validate
        const planIds = input.items.map(item => item.planId)
        const plans = await ctx.db.productPlan.findMany({
          where: {
            id: { in: planIds },
            isAvailable: true,
          },
          include: {
            product: true,
          },
        })

        if (plans.length !== planIds.length) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'One or more plans are not available',
          })
        }

        // Check stock availability
        for (const item of input.items) {
          const plan = plans.find(p => p.id === item.planId)
          if (!plan) {
            throw new TRPCError({
              code: 'BAD_REQUEST',
              message: 'Invalid plan selected',
            })
          }
          
          if (plan.stockQuantity !== null && plan.stockQuantity < item.quantity) {
            throw new TRPCError({
              code: 'BAD_REQUEST',
              message: `Insufficient stock for ${plan.product.name}. Available: ${plan.stockQuantity}, Requested: ${item.quantity}`,
            })
          }
        }

        // Calculate totals
        let subtotal = 0
        const orderItems = input.items.map(item => {
          const plan = plans.find(p => p.id === item.planId)
          if (!plan) {
            throw new TRPCError({
              code: 'BAD_REQUEST',
              message: 'Invalid plan selected',
            })
          }
          const itemTotal = Number(plan.price) * item.quantity
          subtotal += itemTotal
          return {
            planId: item.planId,
            quantity: item.quantity,
            price: plan.price,
            currency: plan.currency,
          }
        })

        // Tax is permanently set to 0
        const tax = 0
        const total = subtotal + tax

        // Generate order number
        const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 5).toUpperCase()}`

        // Update stock quantities for non-admin orders
        if (input.paymentMethod !== 'ADMIN_BYPASS') {
          for (const item of input.items) {
            const plan = plans.find(p => p.id === item.planId)
            if (plan && plan.stockQuantity !== null) {
              await ctx.db.productPlan.update({
                where: { id: item.planId },
                data: {
                  stockQuantity: {
                    decrement: item.quantity,
                  },
                },
              })
            }
          }
        }

        // Create order
        const order = await ctx.db.order.create({
          data: {
            userId,
            orderNumber,
            status: input.paymentMethod === 'ADMIN_BYPASS' ? 'COMPLETED' : 'PENDING',
            paymentMethod: input.paymentMethod,
            subtotal,
            tax,
            total,
            currency: 'USD',
            billingAddress: input.billingAddress,
            completedAt: input.paymentMethod === 'ADMIN_BYPASS' ? new Date() : undefined,
            items: {
              create: orderItems,
            },
          },
        })

        // Get the created order with items for subscription creation
        const orderWithItems = await ctx.db.order.findUnique({
          where: { id: order.id },
          include: {
            items: {
              include: {
                plan: true,
              },
            },
          },
        })

        // If ADMIN_BYPASS, create subscriptions immediately
        if (input.paymentMethod === 'ADMIN_BYPASS' && orderWithItems) {
          for (const item of orderWithItems.items) {
            const startDate = new Date()
            const endDate = new Date(startDate.getTime() + (item.plan.duration * 24 * 60 * 60 * 1000))
            
            await ctx.db.userSubscription.create({
              data: {
                userId,
                planId: item.planId,
                orderId: order.id,
                status: 'ACTIVE',
                startDate,
                endDate,
                renewalDate: endDate,
                price: item.price,
                currency: item.currency,
                billingPeriod: item.plan.billingPeriod,
                autoRenew: true,
              },
            })
          }
        }

        return {
          orderId: order.id,
          orderNumber: order.orderNumber,
          status: order.status,
          total: order.total,
          redirectUrl: input.paymentMethod === 'ADMIN_BYPASS' ? 
            `/dashboard/orders/${order.id}` : 
            `/checkout/payment/${order.id}`,
        }
      } catch (error) {
        console.error('Order creation error:', error)
        
        if (error instanceof TRPCError) {
          throw error
        }
        
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to create order. Please try again.',
        })
      }
    }),

  getAll: protectedProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(20),
        cursor: z.string().optional(),
        status: z.enum(['PENDING', 'PROCESSING', 'COMPLETED', 'CANCELLED', 'REFUNDED', 'FAILED']).optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const orders = await ctx.db.order.findMany({
        where: {
          userId: ctx.session.user.id,
          ...(input.status && { status: input.status }),
        },
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
          payments: {
            orderBy: {
              createdAt: 'desc',
            },
            take: 1,
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: input.limit,
        ...(input.cursor && {
          cursor: { id: input.cursor },
          skip: 1,
        }),
      })

      return {
        orders,
        nextCursor: orders.length === input.limit ? orders[orders.length - 1]?.id : undefined,
      }
    }),

  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const order = await ctx.db.order.findFirst({
        where: {
          id: input.id,
          userId: ctx.session.user.id,
        },
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
          payments: {
            orderBy: {
              createdAt: 'desc',
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
      })

      if (!order) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Order not found',
        })
      }

      return order
    }),

  cancel: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const order = await ctx.db.order.findFirst({
        where: {
          id: input.id,
          userId: ctx.session.user.id,
          status: { in: ['PENDING', 'PROCESSING'] },
        },
        include: {
          items: true,
        },
      })

      if (!order) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Order not found or cannot be cancelled',
        })
      }

      // Update order status
      const updatedOrder = await ctx.db.order.update({
        where: { id: input.id },
        data: { status: 'CANCELLED' },
      })

      // Restore stock quantities
      for (const item of order.items) {
        await ctx.db.productPlan.update({
          where: { id: item.planId },
          data: {
            stockQuantity: {
              increment: item.quantity,
            },
          },
        })
      }

      return updatedOrder
    }),

  getStats: protectedProcedure.query(async ({ ctx }) => {
    const [totalOrders, pendingOrders, completedOrders, totalSpent] = await Promise.all([
      ctx.db.order.count({
        where: { userId: ctx.session.user.id },
      }),
      ctx.db.order.count({
        where: { 
          userId: ctx.session.user.id,
          status: { in: ['PENDING', 'PROCESSING'] },
        },
      }),
      ctx.db.order.count({
        where: { 
          userId: ctx.session.user.id,
          status: 'COMPLETED',
        },
      }),
      ctx.db.order.aggregate({
        where: { 
          userId: ctx.session.user.id,
          status: 'COMPLETED',
        },
        _sum: { total: true },
      }),
    ])

    return {
      totalOrders,
      pendingOrders,
      completedOrders,
      totalSpent: totalSpent._sum.total || 0,
    }
  }),
}) 