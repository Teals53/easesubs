import { db } from "@/lib/db";

interface DeliveryOptions {
  orderId: string;
  orderItemId: string;
}

interface OrderItemWithRelations {
  id: string;
  orderId: string;
  planId: string;
  quantity: number;
  deliveryType: "MANUAL" | "AUTOMATIC" | null;
  plan: {
    deliveryType: "MANUAL" | "AUTOMATIC";
    planType: string;
    product: {
      name: string;
    };
  };
  order: {
    userId: string;
  };
}

export class DeliveryService {
  /**
   * Process delivery for a completed order item
   */
  static async processDelivery(options: DeliveryOptions) {
    const { orderId, orderItemId } = options;

    // Get order item with plan details
    const orderItem = await db.orderItem.findFirst({
      where: {
        id: orderItemId,
        orderId: orderId,
      },
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
      },
    });

    if (!orderItem) {
      throw new Error("Order item not found");
    }

    // Set delivery type from plan if not set
    if (!orderItem.deliveryType) {
      await db.orderItem.update({
        where: { id: orderItemId },
        data: {
          deliveryType: orderItem.plan.deliveryType,
        },
      });
    }

    const deliveryType = orderItem.deliveryType || orderItem.plan.deliveryType;

    if (deliveryType === "AUTOMATIC") {
      return await this.processAutomaticDelivery(orderItem);
    } else {
      return await this.processManualDelivery(orderItem);
    }
  }

  /**
   * Handle automatic delivery by assigning stock item
   */
  private static async processAutomaticDelivery(
    orderItem: OrderItemWithRelations,
  ) {
    // Find available stock item
    const stockItem = await db.stockItem.findFirst({
      where: {
        planId: orderItem.planId,
        isUsed: false,
      },
      orderBy: {
        createdAt: "asc", // FIFO
      },
    });

    if (!stockItem) {
      // If no stock available, fail the delivery
      throw new Error(
        `No stock available for automatic delivery of ${orderItem.plan.product.name} - ${orderItem.plan.planType}`,
      );
    }

    // Mark stock item as used and assign to order item
    await db.$transaction([
      db.stockItem.update({
        where: { id: stockItem.id },
        data: {
          isUsed: true,
          usedAt: new Date(),
        },
      }),
      db.orderItem.update({
        where: { id: orderItem.id },
        data: {
          stockItemId: stockItem.id,
          deliveredAt: new Date(),
        },
      }),
    ]);

    return {
      success: true,
      type: "AUTOMATIC",
      stockItem: stockItem,
    };
  }

  /**
   * Handle manual delivery by creating support ticket
   */
  private static async processManualDelivery(
    orderItem: OrderItemWithRelations,
    customDescription?: string,
  ) {
    // Generate ticket number
    const ticketCount = await db.supportTicket.count();
    const ticketNumber = `DELIVERY-${String(ticketCount + 1).padStart(6, "0")}`;

    const description =
      customDescription ||
      `Manual delivery request for ${orderItem.plan.product.name} - ${orderItem.plan.planType} Plan.

Order Details:
- Order ID: ${orderItem.orderId}
- Product: ${orderItem.plan.product.name}
- Plan: ${orderItem.plan.planType}
- Quantity: ${orderItem.quantity}

Please process the delivery for this customer.`;

    // Create support ticket
    const ticket = await db.supportTicket.create({
      data: {
        ticketNumber,
        userId: orderItem.order.userId,
        title: `Delivery Request - ${orderItem.plan.product.name}`,
        description,
        category: "ORDER_ISSUES",
        priority: "MEDIUM",
        isAutoCreated: true,
        tags: ["delivery", "auto-created"],
      },
    });

    // Update order item with ticket reference
    await db.orderItem.update({
      where: { id: orderItem.id },
      data: {
        ticketId: ticket.id,
        deliveredAt: null, // Not delivered yet, pending manual processing
      },
    });

    return {
      success: true,
      type: "MANUAL",
      ticket: ticket,
    };
  }

  /**
   * Check if order item has been delivered
   */
  static async isDelivered(orderItemId: string): Promise<boolean> {
    const orderItem = await db.orderItem.findFirst({
      where: { id: orderItemId },
      select: {
        deliveredAt: true,
        deliveryType: true,
        stockItemId: true,
        ticketId: true,
      },
    });

    if (!orderItem) return false;

    if (orderItem.deliveryType === "AUTOMATIC") {
      return orderItem.deliveredAt !== null && orderItem.stockItemId !== null;
    } else {
      // For manual delivery, check if ticket is resolved
      if (orderItem.ticketId) {
        const ticket = await db.supportTicket.findFirst({
          where: { id: orderItem.ticketId },
          select: { status: true },
        });
        return ticket?.status === "CLOSED";
      }
      return false;
    }
  }

  /**
   * Get delivery status for order item
   */
  static async getDeliveryStatus(orderItemId: string) {
    const orderItem = await db.orderItem.findFirst({
      where: { id: orderItemId },
      include: {
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
  }
}
