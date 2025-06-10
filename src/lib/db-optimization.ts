import { db } from "@/lib/db";

// Query cache implementation
const queryCache = new Map<string, { data: unknown; timestamp: number; ttl: number }>();

// Cache TTL constants (in milliseconds)
export const CACHE_TTL = {
  SHORT: 1000 * 60 * 5,      // 5 minutes
  MEDIUM: 1000 * 60 * 15,    // 15 minutes
  LONG: 1000 * 60 * 60,      // 1 hour
  VERY_LONG: 1000 * 60 * 60 * 24, // 24 hours
} as const;

// Generic cache key generator
export function generateCacheKey(prefix: string, params: Record<string, unknown>): string {
  const sortedParams = Object.keys(params)
    .sort()
    .map(key => `${key}:${JSON.stringify(params[key])}`)
    .join('|');
  return `${prefix}:${sortedParams}`;
}

// Cache utilities
export function setCache<T>(key: string, data: T, ttl: number): void {
  queryCache.set(key, {
    data,
    timestamp: Date.now(),
    ttl,
  });
}

export function getCache<T>(key: string): T | null {
  const cached = queryCache.get(key);
  if (!cached) return null;
  
  if (Date.now() - cached.timestamp > cached.ttl) {
    queryCache.delete(key);
    return null;
  }
  
  return cached.data as T;
}

export function clearCache(pattern?: string): void {
  if (!pattern) {
    queryCache.clear();
    return;
  }
  
  for (const key of queryCache.keys()) {
    if (key.includes(pattern)) {
      queryCache.delete(key);
    }
  }
}

// Optimized pagination interface
export interface PaginationOptions {
  page: number;
  limit: number;
  orderBy?: string;
  orderDirection?: "asc" | "desc";
}

export interface PaginatedResult<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// Efficient cursor-based pagination
export interface CursorPaginationOptions {
  limit: number;
  cursor?: string;
  orderBy: string;
  orderDirection?: "asc" | "desc";
}

// Optimized product queries with caching
export async function getProductsOptimized(options: {
  categoryId?: string;
  isActive?: boolean;
  isFeatured?: boolean;
  limit?: number;
  offset?: number;
}): Promise<unknown[]> {
  const cacheKey = generateCacheKey('products', options);
  const cached = getCache(cacheKey);
  
  if (cached) {
    return cached as unknown[];
  }
  
  const products = await db.product.findMany({
    where: {
      ...(options.categoryId && { categoryId: options.categoryId }),
      ...(options.isActive !== undefined && { isActive: options.isActive }),
      ...(options.isFeatured !== undefined && { isFeatured: options.isFeatured }),
    },
    include: {
      category: {
        select: {
          id: true,
          name: true,
          slug: true,
        },
      },
      plans: {
        where: { isAvailable: true },
        select: {
          id: true,
          name: true,
          planType: true,
          price: true,
          originalPrice: true,
          currency: true,
          billingPeriod: true,
          duration: true,
          isPopular: true,
          isAvailable: true,
          deliveryType: true,
        },
        orderBy: [
          { isPopular: "desc" },
          { price: "asc" },
        ],
      },
      _count: {
        select: {
          reviews: {
            where: { isVerified: true },
          },
        },
      },
    },
    orderBy: [
      { displayOrder: "asc" },
      { isFeatured: "desc" },
      { createdAt: "desc" },
    ],
    ...(options.limit && { take: options.limit }),
    ...(options.offset && { skip: options.offset }),
  });
  
  setCache(cacheKey, products, CACHE_TTL.MEDIUM);
  return products;
}

// Optimized user orders with pagination
export async function getUserOrdersOptimized(
  userId: string,
  pagination: PaginationOptions
): Promise<PaginatedResult<unknown>> {
  const cacheKey = generateCacheKey('user_orders', { userId, ...pagination });
  const cached = getCache<PaginatedResult<unknown>>(cacheKey);
  
  if (cached) {
    return cached;
  }
  
  const [orders, total] = await Promise.all([
    db.order.findMany({
      where: { userId },
      include: {
        items: {
          include: {
            plan: {
              include: {
                product: {
                  select: {
                    id: true,
                    name: true,
                    logoUrl: true,
                    slug: true,
                  },
                },
              },
            },
          },
        },
        payments: {
          select: {
            id: true,
            status: true,
            method: true,
            amount: true,
            createdAt: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: pagination.limit,
      skip: (pagination.page - 1) * pagination.limit,
    }),
    db.order.count({
      where: { userId },
    }),
  ]);
  
  const totalPages = Math.ceil(total / pagination.limit);
  const result: PaginatedResult<unknown> = {
    data: orders,
    pagination: {
      page: pagination.page,
      limit: pagination.limit,
      total,
      totalPages,
      hasNext: pagination.page < totalPages,
      hasPrev: pagination.page > 1,
    },
  };
  
  setCache(cacheKey, result, CACHE_TTL.SHORT);
  return result;
}

// Optimized dashboard analytics
export async function getDashboardAnalyticsOptimized(userId: string): Promise<unknown> {
  const cacheKey = generateCacheKey('dashboard_analytics', { userId });
  const cached = getCache(cacheKey);
  
  if (cached) {
    return cached;
  }
  
  const [
    totalOrders,
    totalSpent,
    activeSubscriptions,
    recentOrders,
    expiringSubscriptions,
  ] = await Promise.all([
    db.order.count({
      where: { 
        userId,
        status: "COMPLETED",
      },
    }),
    db.order.aggregate({
      where: { 
        userId,
        status: "COMPLETED",
      },
      _sum: { total: true },
    }),
    db.userSubscription.count({
      where: { 
        userId,
        status: "ACTIVE",
      },
    }),
    db.order.findMany({
      where: { userId },
      include: {
        items: {
          include: {
            plan: {
              include: {
                product: {
                  select: {
                    id: true,
                    name: true,
                    logoUrl: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
    db.userSubscription.findMany({
      where: {
        userId,
        status: "ACTIVE",
        endDate: {
          lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // Next 30 days
        },
      },
      include: {
        plan: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                logoUrl: true,
              },
            },
          },
        },
      },
      orderBy: { endDate: "asc" },
      take: 5,
    }),
  ]);
  
  const analytics = {
    totalOrders,
    totalSpent: totalSpent._sum.total || 0,
    activeSubscriptions,
    recentOrders,
    expiringSubscriptions,
  };
  
  setCache(cacheKey, analytics, CACHE_TTL.SHORT);
  return analytics;
}

// Batch operations for better performance
export async function batchMarkStockItemsAsUsed(stockItemIds: string[]) {
  const batchSize = 100; // Process in batches of 100
  const results = [];
  
  for (let i = 0; i < stockItemIds.length; i += batchSize) {
    const batch = stockItemIds.slice(i, i + batchSize);
    const batchPromises = batch.map(id =>
      db.stockItem.update({
        where: { id },
        data: { 
          isUsed: true,
          usedAt: new Date(),
        },
      })
    );
    
    const batchResults = await Promise.allSettled(batchPromises);
    results.push(...batchResults);
  }
  
  // Clear related caches
  clearCache('stock');
  clearCache('products');
  
  return results;
}

// Database connection health check
export async function checkDatabaseHealth(): Promise<boolean> {
  try {
    await db.$queryRaw`SELECT 1`;
    return true;
  } catch {
    return false;
  }
} 

