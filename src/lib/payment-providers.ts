import { Cryptomus, CreatePaymentRequest } from "./cryptomus";

interface CryptomusPaymentData {
  orderId: string;
  amount: number;
  currency: string;
  returnUrl?: string;
  callbackUrl?: string;
}

export class PaymentProviders {
  // Cryptomus Payment Integration
  static async createCryptomusPayment(data: CryptomusPaymentData): Promise<{
    success: boolean;
    paymentUrl?: string;
    paymentId?: string;
    error?: string;
  }> {
    try {
      const merchantId = process.env.CRYPTOMUS_MERCHANT_ID;
      const paymentApiKey = process.env.CRYPTOMUS_PAYMENT_API_KEY;
      const payoutApiKey = process.env.CRYPTOMUS_PAYOUT_API_KEY;

      if (
        !merchantId ||
        !paymentApiKey ||
        merchantId === "your-merchant-uuid-here"
      ) {
        return {
          success: false,
          error:
            "Payment processing is temporarily unavailable. Please contact support or try again later.",
        };
      }

      const cryptomus = new Cryptomus({
        merchantId,
        paymentApiKey,
        payoutApiKey,
      });

      const paymentRequest: CreatePaymentRequest = {
        amount: data.amount.toString(),
        currency: data.currency,
        order_id: data.orderId,
        url_return: data.returnUrl || `${process.env.NEXTAUTH_URL}/dashboard`,
        url_callback:
          data.callbackUrl ||
          `${process.env.NEXTAUTH_URL}/api/webhooks/cryptomus`,
        is_payment_multiple: false,
        lifetime: 7200, // 2 hours
        accuracy_payment_percent: 5, // Allow 5% payment inaccuracy
      };

      const response = await cryptomus.createPayment(paymentRequest);

      if (response.state === 0 && response.result) {
        // Success
        return {
          success: true,
          paymentUrl: response.result.url,
          paymentId: response.result.uuid,
        };
      } else {
        throw new Error(
          response.message || "Cryptomus payment creation failed",
        );
      }
    } catch (error) {
      console.error("Cryptomus payment creation failed:", error);
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
      console.error("Failed to get Cryptomus payment info:", error);
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
      console.error("Failed to get Cryptomus payment services:", error);
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
        order_id: orderId,
        address,
        is_subtract: isSubtract,
      });

      if (response.state === 0) {
        return { success: true };
      } else {
        throw new Error(response.message || "Refund failed");
      }
    } catch (error) {
      console.error("Cryptomus refund failed:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  // Create static wallet
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
        network,
        currency,
        order_id: orderId,
        url_callback:
          callbackUrl || `${process.env.NEXTAUTH_URL}/api/webhooks/cryptomus`,
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
      console.error("Cryptomus wallet creation failed:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  // Get balance
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
      console.error("Failed to get Cryptomus balance:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }
}
