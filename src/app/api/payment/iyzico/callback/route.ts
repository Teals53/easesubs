import { NextRequest, NextResponse } from "next/server";
import { getIyzico } from "@/lib/iyzico-wrapper";

interface IyzicoCallbackResult {
  status: string;
  paymentStatus?: string;
  paymentId?: string;
  conversationId?: string;
  price?: string | number;
  currency?: string;
  errorCode?: string;
  errorMessage?: string;
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body: { token?: string } = await request.json();
    const { token } = body;

    if (!token) {
      return NextResponse.json(
        { success: false, error: "Missing payment token" },
        { status: 400 }
      );
    }

    const apiKey = process.env.IYZICO_API_KEY;
    const secretKey = process.env.IYZICO_SECRET_KEY;
    const baseUrl = process.env.IYZICO_BASE_URL || "https://sandbox-api.iyzipay.com";

    if (!apiKey || !secretKey) {
      return NextResponse.json(
        { success: false, error: "Payment configuration error" },
        { status: 500 }
      );
    }

    const Iyzipay = await getIyzico();
    const iyzipay = new Iyzipay({
      apiKey,
      secretKey,
      uri: baseUrl,
    });

    // Retrieve checkout form result
    const retrieveRequest = {
      locale: "TR" as const,
      token: token,
    };

    return new Promise<NextResponse>((resolve) => {
      iyzipay.checkoutForm.retrieve(retrieveRequest, (err: unknown, result: IyzicoCallbackResult) => {
        if (err) {
          console.error("iyzico callback error:", err);
          resolve(NextResponse.json(
            { success: false, error: "Payment verification failed" },
            { status: 400 }
          ));
          return;
        }

        console.log("iyzico callback result:", result);
        
        // TODO: Update order status in database based on payment result
        // You should implement order status update logic here:
        // - If result.paymentStatus === "SUCCESS": mark order as paid
        // - If result.paymentStatus === "FAILURE": mark order as failed
        // - Update payment record with result.paymentId and providerData
        // - Update order status and completedAt timestamp
        
        resolve(NextResponse.json({
          success: true,
          paymentStatus: result.paymentStatus,
          paymentId: result.paymentId,
          orderId: result.conversationId,
        }));
      });
    });

  } catch (error) {
    console.error("iyzico callback API error:", error);
    
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error during callback processing",
      },
      { status: 500 }
    );
  }
} 