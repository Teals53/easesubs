import { NextRequest, NextResponse } from "next/server";
import { PaymentProviders } from "@/lib/payment-providers";
import { auth } from "@/lib/auth";

interface IyzicoCheckoutRequest {
  orderId: string;
  amount: number;
  currency: string;
  buyer: {
    id: string;
    name: string;
    surname: string;
    gsmNumber: string;
    email: string;
    identityNumber: string;
    registrationAddress: string;
    ip: string;
    city: string;
    country: string;
    zipCode: string;
  };
  billingAddress: {
    contactName: string;
    city: string;
    country: string;
    address: string;
    zipCode: string;
  };
  basketItems: Array<{
    id: string;
    name: string;
    category1: string;
    category2?: string;
    itemType: "PHYSICAL" | "VIRTUAL";
    price: string;
  }>;
}

export async function POST(request: NextRequest) {
  try {
    // Get the session to verify authentication
    const session = await auth();
    
    if (!session) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Parse the request body
    const body: IyzicoCheckoutRequest = await request.json();

    // Validate required fields
    if (!body.orderId || !body.amount || !body.buyer) {
      return NextResponse.json(
        { success: false, error: "Missing required payment information" },
        { status: 400 }
      );
    }

    // Validate amount
    if (body.amount <= 0) {
      return NextResponse.json(
        { success: false, error: "Invalid amount" },
        { status: 400 }
      );
    }

    // Get client IP for fraud detection
    const clientIP = request.headers.get("x-forwarded-for") || 
                    request.headers.get("x-real-ip") || 
                    "127.0.0.1";

    // Update buyer info with real IP
    const checkoutData = {
      ...body,
      buyer: {
        ...body.buyer,
        ip: clientIP.split(',')[0].trim(), // Take the first IP if multiple
      },
    };

    // Create iyzico checkout form (hosted payment page)
    const result = await PaymentProviders.createIyzicoCheckout(checkoutData);

    if (result.success) {
      return NextResponse.json({
        success: true,
        paymentUrl: result.paymentUrl,
        token: result.token,
        checkoutFormContent: result.checkoutFormContent,
      });
    } else {
      return NextResponse.json(
        {
          success: false,
          error: result.error,
        },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error("iyzico checkout API error:", error);
    
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error during checkout creation",
      },
      { status: 500 }
    );
  }
} 