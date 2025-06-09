import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url);
    const paymentId = searchParams.get('id');
    
    if (!paymentId) {
      return NextResponse.json({
        success: false,
        error: "Payment ID required"
      });
    }

    const { db } = await import("@/lib/db");
    
    const payment = await db.payment.findUnique({
      where: {
        id: paymentId
      },
      include: {
        order: true
      }
    });

    if (!payment) {
      return NextResponse.json({
        success: false,
        error: "Payment not found"
      });
    }

    return NextResponse.json({
      success: true,
      payment: {
        id: payment.id,
        method: payment.method,
        status: payment.status,
        amount: payment.amount,
        currency: payment.currency,
        providerPaymentId: payment.providerPaymentId,
        providerData: payment.providerData,
        orderId: payment.orderId,
        createdAt: payment.createdAt,
        order: payment.order ? {
          id: payment.order.id,
          orderNumber: payment.order.orderNumber,
          status: payment.order.status,
        } : null
      }
    });
  } catch (error) {
    console.error("Debug payment detail error:", error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : String(error)
    });
  }
} 