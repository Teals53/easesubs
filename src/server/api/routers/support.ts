import { z } from "zod";
import { createTRPCRouter, supportProcedure } from "../trpc";
import { TRPCError } from "@trpc/server";
import type { Prisma } from "@prisma/client";

export const supportRouter = createTRPCRouter({
  // Get tickets assigned to the current support agent
  getMyAssignedTickets: supportProcedure
    .input(
      z.object({
        status: z.enum(["OPEN", "IN_PROGRESS", "CLOSED"]).optional(),
        page: z.number().min(1).default(1),
        limit: z.number().min(1).max(100).default(20),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { page, limit, status } = input;
      const skip = (page - 1) * limit;

      const where: Prisma.SupportTicketWhereInput = {
        assignedAgentId: ctx.session.user.id,
        ...(status && { status }),
      };

      const [tickets, total] = await Promise.all([
        ctx.db.supportTicket.findMany({
          where,
          skip,
          take: limit,
          orderBy: { createdAt: "desc" },
          include: {
            user: {
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

  // Assign a ticket to yourself (for support agents)
  assignTicketToSelf: supportProcedure
    .input(z.object({ ticketId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // Verify ticket exists and is not already assigned
      const ticket = await ctx.db.supportTicket.findUnique({
        where: { id: input.ticketId },
        select: { assignedAgentId: true, status: true },
      });

      if (!ticket) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Ticket not found",
        });
      }

      if (
        ticket.assignedAgentId &&
        ticket.assignedAgentId !== ctx.session.user.id
      ) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "Ticket is already assigned to another agent",
        });
      }

      const updatedTicket = await ctx.db.supportTicket.update({
        where: { id: input.ticketId },
        data: {
          assignedAgentId: ctx.session.user.id,
          status: "IN_PROGRESS",
          lastActivityAt: new Date(),
          firstResponseAt: ticket.status === "OPEN" ? new Date() : undefined,
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
        },
      });

      return updatedTicket;
    }),

  // Get all available support agents (for ticket assignment)
  getSupportAgents: supportProcedure.query(async ({ ctx }) => {
    const agents = await ctx.db.user.findMany({
      where: {
        role: {
          in: ["SUPPORT_AGENT", "ADMIN", "MANAGER"],
        },
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        _count: {
          select: {
            assignedTickets: {
              where: {
                status: {
                  in: ["OPEN", "IN_PROGRESS"],
                },
              },
            },
          },
        },
      },
      orderBy: {
        name: "asc",
      },
    });

    return agents.map((agent) => ({
      ...agent,
      activeTicketsCount: agent._count.assignedTickets,
    }));
  }),

  // Assign ticket to a specific agent (admin/manager only)
  assignTicket: supportProcedure
    .input(
      z.object({
        ticketId: z.string(),
        agentId: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Only ADMIN and MANAGER can assign tickets to others
      if (ctx.session.user.role === "SUPPORT_AGENT") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message:
            "Only administrators and managers can assign tickets to other agents",
        });
      }

      // Verify agent exists and has appropriate role
      const agent = await ctx.db.user.findUnique({
        where: { id: input.agentId },
        select: { role: true, isActive: true },
      });

      if (!agent || !agent.isActive) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Agent not found or inactive",
        });
      }

      if (!["SUPPORT_AGENT", "ADMIN", "MANAGER"].includes(agent.role)) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "User is not a support agent",
        });
      }

      const updatedTicket = await ctx.db.supportTicket.update({
        where: { id: input.ticketId },
        data: {
          assignedAgentId: input.agentId,
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
          assignedAgent: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });

      return updatedTicket;
    }),

  // Get support dashboard stats for support agents
  getSupportStats: supportProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.user.id;
    const userRole = ctx.session.user.role;

    // Base where clause for assigned tickets
    const assignedWhere: Prisma.SupportTicketWhereInput =
      userRole === "SUPPORT_AGENT" ? { assignedAgentId: userId } : {}; // ADMIN and MANAGER can see all tickets

    const [
      myOpenTickets,
      myInProgressTickets,
      myClosedTicketsToday,
      allOpenTickets,
      allInProgressTickets,
    ] = await Promise.all([
      ctx.db.supportTicket.count({
        where: {
          ...assignedWhere,
          status: "OPEN",
        },
      }),
      ctx.db.supportTicket.count({
        where: {
          ...assignedWhere,
          status: "IN_PROGRESS",
        },
      }),
      ctx.db.supportTicket.count({
        where: {
          ...assignedWhere,
          status: "CLOSED",
          closedAt: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
          },
        },
      }),
      // All tickets stats for context
      ctx.db.supportTicket.count({
        where: { status: "OPEN" },
      }),
      ctx.db.supportTicket.count({
        where: { status: "IN_PROGRESS" },
      }),
    ]);

    return {
      assigned: {
        open: myOpenTickets,
        inProgress: myInProgressTickets,
        closedToday: myClosedTicketsToday,
      },
      overall: {
        open: allOpenTickets,
        inProgress: allInProgressTickets,
      },
    };
  }),
});
