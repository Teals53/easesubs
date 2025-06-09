import { NextResponse } from "next/server";

export async function GET(): Promise<NextResponse> {
  try {
    const { db } = await import("@/lib/db");
    
    const payments = await db.payment.findMany({
      select: {
        id: true,
        method: true,
        status: true,
        providerPaymentId: true,
        orderId: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 10
    });

    const orders = await db.order.findMany({
      select: {
        id: true,
        orderNumber: true,
        status: true,
        paymentMethod: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 10
    });

    return NextResponse.json({
      success: true,
      data: {
        payments,
        orders,
        totalPayments: await db.payment.count(),
        totalOrders: await db.order.count(),
      }
    });
  } catch (error) {
    console.error("Debug endpoint error:", error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : String(error)
    });
  }
} 