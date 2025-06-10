import { createTRPCReact } from "@trpc/react-query";
import type { AppRouter } from "@/server/api/root";

export const trpc = createTRPCReact<AppRouter>();

// Enhanced utility function to invalidate multiple queries at once
export const invalidateQueries = (
  utils: ReturnType<typeof trpc.useUtils>,
  queries: string[],
) => {
  queries.forEach((query) => {
    const queryPath = query.split(".");
    if (queryPath.length === 2) {
      const [router, method] = queryPath;
      // @ts-expect-error - Dynamic query invalidation
      utils[router]?.[method]?.invalidate?.();
    }
  });
};

// Enhanced common query invalidation patterns for immediate dashboard updates
export const invalidatePatterns = {
  // Invalidate all ticket-related queries
  tickets: (utils: ReturnType<typeof trpc.useUtils>) => {
    utils.ticket.getAll.invalidate();
    utils.ticket.getStats.invalidate();
    utils.ticket.getById.invalidate();
    utils.admin.getSupportTickets.invalidate();
    utils.admin.getTicketById.invalidate();
    // Also invalidate dashboard stats since ticket counts affect it
    utils.admin.getDashboardStats.invalidate();
    utils.admin.getRecentActivity.invalidate();
  },

  // Invalidate all user-related queries
  users: (utils: ReturnType<typeof trpc.useUtils>) => {
    utils.admin.getUsers.invalidate();
    utils.user.getProfile.invalidate();
    utils.admin.getDashboardStats.invalidate();
    utils.admin.getRecentActivity.invalidate();
  },

  // Invalidate all order-related queries
  orders: (utils: ReturnType<typeof trpc.useUtils>) => {
    utils.order.getAll.invalidate();
    utils.order.getById.invalidate();
    utils.admin.getDashboardStats.invalidate();
    utils.admin.getRecentActivity.invalidate();
  },

  // Invalidate all product-related queries
  products: (utils: ReturnType<typeof trpc.useUtils>) => {
    utils.admin.getProducts.invalidate();
    utils.product.getAll.invalidate();
    utils.admin.getDashboardStats.invalidate();
  },

  // Invalidate all admin dashboard data - comprehensive refresh
  dashboard: (utils: ReturnType<typeof trpc.useUtils>) => {
    utils.admin.getDashboardStats.invalidate();
    utils.admin.getRecentActivity.invalidate();
    utils.admin.getUsers.invalidate();
    utils.admin.getSupportTickets.invalidate();
    utils.admin.getProducts.invalidate();
    utils.ticket.getStats.invalidate();
    utils.order.getAll.invalidate();
  },

  // New: Invalidate everything for critical operations
  all: (utils: ReturnType<typeof trpc.useUtils>) => {
    // Force a complete cache invalidation
    utils.invalidate();
  },
};

// Helper function to force immediate data refresh
export const forceRefresh = async (
  utils: ReturnType<typeof trpc.useUtils>,
  category: keyof typeof invalidatePatterns,
) => {
  // Invalidate cache
  invalidatePatterns[category](utils);

  // Force immediate refetch of critical queries
  if (category === "dashboard" || category === "all") {
    await Promise.all([
      utils.admin.getDashboardStats.refetch(),
      utils.admin.getRecentActivity.refetch(),
    ]);
  }
};

