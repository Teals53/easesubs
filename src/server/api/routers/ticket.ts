import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { TRPCError } from "@trpc/server";

function generateTicketNumber(): string {
  const timestamp = Date.now().toString();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `TKT-${timestamp.slice(-6)}-${random}`;
}

export const ticketRouter = createTRPCRouter({
  create: protectedProcedure
    .input(
      z.object({
        title: z
          .string()
          .min(5, "Title must be at least 5 characters")
          .max(200, "Title cannot exceed 200 characters"),
        description: z
          .string()
          .min(10, "Description must be at least 10 characters")
          .max(5000, "Description cannot exceed 5000 characters"),
        category: z.enum([
          "GENERAL",
          "ORDER_ISSUES",
          "PAYMENT_PROBLEMS",
          "PRODUCT_QUESTIONS",
          "TECHNICAL_SUPPORT",
          "RETURNS_REFUNDS",
          "ACCOUNT_ISSUES",
          "BILLING_INQUIRIES",
        ]),
        priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).default("MEDIUM"),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const ticket = await ctx.db.supportTicket.create({
        data: {
          ticketNumber: generateTicketNumber(),
          userId: ctx.session.user.id,
          title: input.title,
          description: input.description,
          category: input.category,
          priority: input.priority,
          status: "OPEN",
          lastActivityAt: new Date(),
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });

      return ticket;
    }),

  getAll: protectedProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(20),
        cursor: z.string().optional(),
        status: z.enum(["OPEN", "IN_PROGRESS", "CLOSED"]).optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const tickets = await ctx.db.supportTicket.findMany({
        where: {
          userId: ctx.session.user.id,
          ...(input.status && { status: input.status }),
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
          _count: {
            select: {
              messages: true,
            },
          },
          messages: {
            take: 1,
            orderBy: {
              createdAt: "desc",
            },
            select: {
              message: true,
              createdAt: true,
              isInternal: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
        take: input.limit,
        ...(input.cursor && {
          cursor: { id: input.cursor },
          skip: 1,
        }),
      });

      return {
        tickets,
        nextCursor:
          tickets.length === input.limit
            ? tickets[tickets.length - 1]?.id
            : undefined,
      };
    }),

  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const ticket = await ctx.db.supportTicket.findFirst({
        where: {
          id: input.id,
          userId: ctx.session.user.id,
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
            where: {
              isInternal: false, // Only show non-internal messages to customers
            },
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

  addMessage: protectedProcedure
    .input(
      z.object({
        ticketId: z.string(),
        message: z
          .string()
          .min(1, "Message cannot be empty")
          .max(5000, "Message cannot exceed 5000 characters"),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Verify ticket belongs to user
      const ticket = await ctx.db.supportTicket.findFirst({
        where: {
          id: input.ticketId,
          userId: ctx.session.user.id,
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
          isInternal: false,
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

      // Update ticket last activity
      await ctx.db.supportTicket.update({
        where: { id: input.ticketId },
        data: {
          lastActivityAt: new Date(),
          status: ticket.status,
        },
      });

      return message;
    }),

  close: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const ticket = await ctx.db.supportTicket.findFirst({
        where: {
          id: input.id,
          userId: ctx.session.user.id,
          status: { not: "CLOSED" },
        },
      });

      if (!ticket) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Ticket not found or already closed",
        });
      }

      const updatedTicket = await ctx.db.supportTicket.update({
        where: { id: input.id },
        data: {
          status: "CLOSED",
          closedAt: new Date(),
          lastActivityAt: new Date(),
        },
      });

      return updatedTicket;
    }),

  reopen: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const ticket = await ctx.db.supportTicket.findFirst({
        where: {
          id: input.id,
          userId: ctx.session.user.id,
          status: { in: ["CLOSED"] },
        },
      });

      if (!ticket) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Ticket not found or cannot be reopened",
        });
      }

      const updatedTicket = await ctx.db.supportTicket.update({
        where: { id: input.id },
        data: {
          status: "OPEN",
          closedAt: null,
          lastActivityAt: new Date(),
        },
      });

      return updatedTicket;
    }),

  getStats: protectedProcedure.query(async ({ ctx }) => {
    const [totalTickets, openTickets, closedTickets] = await Promise.all([
      ctx.db.supportTicket.count({
        where: { userId: ctx.session.user.id },
      }),
      ctx.db.supportTicket.count({
        where: {
          userId: ctx.session.user.id,
          status: { in: ["OPEN", "IN_PROGRESS"] },
        },
      }),
      ctx.db.supportTicket.count({
        where: {
          userId: ctx.session.user.id,
          status: "CLOSED",
        },
      }),
    ]);

    return {
      totalTickets,
      openTickets,
      closedTickets,
    };
  }),
});
