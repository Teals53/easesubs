// Cryptomus integration
import { Cryptomus, CreatePaymentRequest } from "./cryptomus";
// Weepay integration
import { Weepay, WeepayPaymentRequest, WeepayWebhookData } from "./weepay";

interface CryptomusPaymentData {
  orderId: string;
  amount: number;
  currency: string;
  returnUrl?: string;
  callbackUrl?: string;
}

interface WeepayPaymentData {
  orderId: string;
  amount: number;
  currency: string;
  returnUrl: string;
  notifyUrl: string;
  customerName?: string;
  customerEmail?: string;
  description?: string;
}

export class PaymentProviders {
  // Cryptomus Payment Integration
  // Supported cryptocurrencies include: BTC, ETH, BNB, USDT, USDC, TON, TRX, LTC, DOGE, DAI, DASH, BCH, SOL
  // Users can choose from all available cryptocurrencies on the Cryptomus payment page
  static async createCryptomusPayment(data: CryptomusPaymentData): Promise<{
    success: boolean;
    paymentId?: string;
    paymentUrl?: string;
    error?: string;
  }> {
    try {
      const merchantId = process.env.CRYPTOMUS_MERCHANT_ID;
      const paymentApiKey = process.env.CRYPTOMUS_PAYMENT_API_KEY;

      if (
        !merchantId ||
        !paymentApiKey ||
        merchantId === "your-merchant-uuid-here"
      ) {
        return {
          success: false,
          error: "Payment processing is temporarily unavailable",
        };
      }

      const cryptomus = new Cryptomus({
        merchantId,
        paymentApiKey,
        payoutApiKey: process.env.CRYPTOMUS_PAYOUT_API_KEY,
      });

      // Validate minimum amount (Cryptomus typically requires at least $1 USD equivalent)
      if (data.amount < 1) {
        return {
          success: false,
          error: "Minimum payment amount is $1 USD",
        };
      }

      // Format amount to ensure proper decimal formatting (max 2 decimal places for USD)
      const formattedAmount = data.amount.toFixed(2);
      
      const paymentRequest: CreatePaymentRequest = {
        amount: formattedAmount,
        currency: data.currency, // Keep original currency (USD)
        order_id: data.orderId,
        url_return: data.returnUrl,
        url_callback: data.callbackUrl,
        is_payment_multiple: false,
        lifetime: 7200, // 2 hours (must be between 300-43200 seconds)
        // Don't specify to_currency - let users choose any crypto on payment page
      };

      console.log("Cryptomus payment request:", JSON.stringify(paymentRequest, null, 2));

      const response = await cryptomus.createPayment(paymentRequest);

      if (response.state === 0 && response.result) {
        return {
          success: true,
          paymentId: response.result.uuid,
          paymentUrl: response.result.url,
        };
      } else {
        // Log detailed error information for debugging
        console.error("Cryptomus payment creation failed:", {
          state: response.state,
          message: response.message,
          errors: response.errors,
          paymentRequest
        });
        
        let errorMessage = response.message || "Failed to create payment";
        
        // Check for specific validation errors
        if (response.errors) {
          const errorDetails = Object.entries(response.errors)
            .map(([field, messages]) => `${field}: ${Array.isArray(messages) ? messages.join(", ") : messages}`)
            .join("; ");
          errorMessage = `Validation errors: ${errorDetails}`;
        }
        
        throw new Error(errorMessage);
      }
    } catch (error) {
            return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  // Weepay Payment Integration
  static async createWeepayPayment(data: WeepayPaymentData): Promise<{
    success: boolean;
    paymentId?: string;
    paymentUrl?: string;
    error?: string;
  }> {
    try {
      const merchantId = process.env.WEEPAY_MERCHANT_ID;
      const apiKey = process.env.WEEPAY_API_KEY;
      const secretKey = process.env.WEEPAY_SECRET_KEY;
      const isSandbox = process.env.WEEPAY_IS_SANDBOX === "true";
      const baseUrl = isSandbox 
        ? process.env.WEEPAY_SANDBOX_URL || "https://testapi.weepay.co"
        : process.env.WEEPAY_BASE_URL || "https://api.weepay.co";

      if (!merchantId || !apiKey || !secretKey) {
        return {
          success: false,
          error: "Weepay payment processing is not configured",
        };
      }

      const weepay = new Weepay({
        merchantId,
        apiKey,
        secretKey,
        baseUrl,
        isSandbox,
      });

      const paymentRequest: WeepayPaymentRequest = {
        order_id: data.orderId,
        amount: data.amount,
        currency: data.currency,
        return_url: data.returnUrl,
        notify_url: data.notifyUrl,
        customer_name: data.customerName,
        customer_email: data.customerEmail,
        description: data.description || "Payment for order",
      };

      const response = await weepay.createPayment(paymentRequest);

      if (response.success && response.payment_url) {
        return {
          success: true,
          paymentId: response.payment_id,
          paymentUrl: response.payment_url,
        };
      } else {
        throw new Error(response.error || "Failed to create weepay payment");
      }
    } catch (error) {
            return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  // Verify Cryptomus webhook signature
  static verifyCryptomusWebhook(body: string, apiKey: string): boolean {
    return Cryptomus.validateWebhook(body, "", apiKey);
  }

  // Verify Weepay webhook signature
  static verifyWeepayWebhook(data: WeepayWebhookData, secretKey: string): boolean {
    return Weepay.verifyWebhookSignature(data, secretKey);
  }

  // Get Weepay payment information
  static async getWeepayPaymentInfo(
    paymentId: string,
    orderId?: string,
  ): Promise<{
    success: boolean;
    payment?: unknown;
    error?: string;
  }> {
    try {
      const merchantId = process.env.WEEPAY_MERCHANT_ID;
      const apiKey = process.env.WEEPAY_API_KEY;
      const secretKey = process.env.WEEPAY_SECRET_KEY;
      const isSandbox = process.env.WEEPAY_IS_SANDBOX === "true";
      const baseUrl = isSandbox 
        ? process.env.WEEPAY_SANDBOX_URL || "https://testapi.weepay.co"
        : process.env.WEEPAY_BASE_URL || "https://api.weepay.co";

      if (!merchantId || !apiKey || !secretKey) {
        return {
          success: false,
          error: "Weepay payment processing is not configured",
        };
      }

      const weepay = new Weepay({
        merchantId,
        apiKey,
        secretKey,
        baseUrl,
        isSandbox,
      });

      const response = await weepay.getPaymentStatus(paymentId, orderId);

      if (response.success) {
        return {
          success: true,
          payment: response,
        };
      } else {
        throw new Error(response.error || "Failed to get payment info");
      }
    } catch (error) {
            return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }



  // Get payment information
  static async getCryptomusPaymentInfo(
    paymentId: string,
    orderId?: string,
  ): Promise<{
    success: boolean;
    payment?: unknown;
    error?: string;
  }> {
    try {
      const merchantId = process.env.CRYPTOMUS_MERCHANT_ID;
      const paymentApiKey = process.env.CRYPTOMUS_PAYMENT_API_KEY;

      if (
        !merchantId ||
        !paymentApiKey ||
        merchantId === "your-merchant-uuid-here"
      ) {
        return {
          success: false,
          error: "Payment processing is temporarily unavailable",
        };
      }

      const cryptomus = new Cryptomus({
        merchantId,
        paymentApiKey,
      });

      const response = await cryptomus.getPaymentInfo({
        uuid: paymentId,
        order_id: orderId,
      });

      if (response.state === 0 && response.result) {
        return {
          success: true,
          payment: response.result,
        };
      } else {
        throw new Error(response.message || "Failed to get payment info");
      }
    } catch (error) {
            return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  // Get payment services
  static async getCryptomusPaymentServices(): Promise<{
    success: boolean;
    services?: unknown[];
    error?: string;
  }> {
    try {
      const merchantId = process.env.CRYPTOMUS_MERCHANT_ID;
      const paymentApiKey = process.env.CRYPTOMUS_PAYMENT_API_KEY;

      if (
        !merchantId ||
        !paymentApiKey ||
        merchantId === "your-merchant-uuid-here"
      ) {
        return {
          success: false,
          error: "Payment processing is temporarily unavailable",
        };
      }

      const cryptomus = new Cryptomus({
        merchantId,
        paymentApiKey,
      });

      const response = await cryptomus.getPaymentServices();

      if (response.state === 0 && response.result) {
        return {
          success: true,
          services: response.result,
        };
      } else {
        throw new Error(response.message || "Failed to get payment services");
      }
    } catch (error) {
            return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  // Refund payment
  static async refundCryptomusPayment(
    paymentId: string,
    address: string,
    orderId?: string,
    isSubtract = true,
  ): Promise<{
    success: boolean;
    error?: string;
  }> {
    try {
      const merchantId = process.env.CRYPTOMUS_MERCHANT_ID;
      const paymentApiKey = process.env.CRYPTOMUS_PAYMENT_API_KEY;

      if (
        !merchantId ||
        !paymentApiKey ||
        merchantId === "your-merchant-uuid-here"
      ) {
        return {
          success: false,
          error: "Payment processing is temporarily unavailable",
        };
      }

      const cryptomus = new Cryptomus({
        merchantId,
        paymentApiKey,
      });

      const response = await cryptomus.refundPayment({
        uuid: paymentId,
        address,
        order_id: orderId,
        is_subtract: isSubtract,
      });

      if (response.state === 0) {
        return {
          success: true,
        };
      } else {
        throw new Error(response.message || "Refund failed");
      }
    } catch (error) {
            return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  // Create wallet for payment
  static async createCryptomusWallet(
    currency: string,
    network: string,
    orderId: string,
    callbackUrl?: string,
  ): Promise<{
    success: boolean;
    wallet?: unknown;
    error?: string;
  }> {
    try {
      const merchantId = process.env.CRYPTOMUS_MERCHANT_ID;
      const paymentApiKey = process.env.CRYPTOMUS_PAYMENT_API_KEY;

      if (
        !merchantId ||
        !paymentApiKey ||
        merchantId === "your-merchant-uuid-here"
      ) {
        return {
          success: false,
          error: "Payment processing is temporarily unavailable",
        };
      }

      const cryptomus = new Cryptomus({
        merchantId,
        paymentApiKey,
      });

      const response = await cryptomus.createWallet({
        currency,
        network,
        order_id: orderId,
        url_callback: callbackUrl,
      });

      if (response.state === 0 && response.result) {
        return {
          success: true,
          wallet: response.result,
        };
      } else {
        throw new Error(response.message || "Wallet creation failed");
      }
    } catch (error) {
            return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  // Get account balance
  static async getCryptomusBalance(): Promise<{
    success: boolean;
    balance?: unknown;
    error?: string;
  }> {
    try {
      const merchantId = process.env.CRYPTOMUS_MERCHANT_ID;
      const paymentApiKey = process.env.CRYPTOMUS_PAYMENT_API_KEY;

      if (
        !merchantId ||
        !paymentApiKey ||
        merchantId === "your-merchant-uuid-here"
      ) {
        return {
          success: false,
          error: "Payment processing is temporarily unavailable",
        };
      }

      const cryptomus = new Cryptomus({
        merchantId,
        paymentApiKey,
      });

      const response = await cryptomus.getBalance();

      if (response.state === 0 && response.result) {
        return {
          success: true,
          balance: response.result,
        };
      } else {
        throw new Error(response.message || "Failed to get balance");
      }
    } catch (error) {
            return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }
}

