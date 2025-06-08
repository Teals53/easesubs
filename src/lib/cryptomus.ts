import crypto from "crypto";

// Base interfaces
export interface CryptomusConfig {
  merchantId: string;
  paymentApiKey: string;
  payoutApiKey?: string;
}

export interface CryptomusResponse<T> {
  state: number;
  result?: T;
  message?: string;
  errors?: Record<string, string[]>;
}

// Payment interfaces
export interface CreatePaymentRequest {
  amount: string;
  currency: string;
  order_id: string;
  network?: string;
  url_return?: string;
  url_success?: string;
  url_callback?: string;
  is_payment_multiple?: boolean;
  lifetime?: number;
  to_currency?: string;
  subtract?: number;
  accuracy_payment_percent?: number;
  additional_data?: string;
  currencies?: Array<{
    currency: string;
    network?: string;
  }>;
  except_currencies?: Array<{
    currency: string;
    network?: string;
  }>;
  course_source?: "Binance" | "BinanceP2P" | "Exmo" | "Kucoin";
  from_referral_code?: string;
  discount_percent?: number;
  is_refresh?: boolean;
}

export interface PaymentResult {
  uuid: string;
  order_id: string;
  amount: string;
  payment_amount?: string;
  payer_amount?: string;
  discount_percent?: number;
  discount?: string;
  payer_currency?: string;
  currency: string;
  merchant_amount?: string;
  network?: string;
  address?: string;
  from?: string;
  txid?: string;
  payment_status: string;
  url: string;
  expired_at: number;
  status: string;
  is_final: boolean;
  additional_data?: string;
  created_at?: string;
  updated_at?: string;
  currencies?: Array<{
    currency: string;
    network: string;
  }>;
}

export interface PaymentInfoRequest {
  uuid?: string;
  order_id?: string;
}

export interface PaymentHistoryRequest {
  date_from?: string;
  date_to?: string;
  cursor?: string;
}

export interface PaymentHistoryResult {
  items: PaymentResult[];
  paginate: {
    count: number;
    hasPages: boolean;
    nextCursor?: string;
    previousCursor?: string;
    perPage: number;
  };
}

export interface PaymentService {
  network: string;
  currency: string;
  is_available: boolean;
  limit: {
    min_amount: string;
    max_amount: string;
  };
  commission: {
    fee_amount: string;
    percent: string;
  };
}

export interface RefundRequest {
  uuid?: string;
  order_id?: string;
  address: string;
  is_subtract?: boolean;
}

export interface ResendWebhookRequest {
  uuid?: string;
  order_id?: string;
}

// Webhook interfaces
export interface CryptomusWebhook {
  type: "payment" | "wallet";
  uuid: string;
  order_id: string;
  amount: string;
  payment_amount?: string;
  payment_amount_usd?: string;
  merchant_amount?: string;
  commission?: string;
  is_final: boolean;
  status: string;
  from?: string;
  wallet_address_uuid?: string;
  network?: string;
  currency: string;
  payer_currency?: string;
  additional_data?: string;
  convert?: {
    to_currency: string;
    commission?: string;
    rate: string;
    amount: string;
  };
  txid?: string;
  sign: string;
}

// Wallet interfaces
export interface CreateWalletRequest {
  network: string;
  currency: string;
  order_id: string;
  url_callback?: string;
}

export interface WalletResult {
  wallet_uuid: string;
  uuid: string;
  address: string;
  network: string;
  currency: string;
}

export interface BlockWalletRequest {
  uuid?: string;
  order_id?: string;
}

export interface BlockWalletResult {
  uuid: string;
  status: string;
}

// Payout interfaces
export interface CreatePayoutRequest {
  amount: string;
  currency: string;
  network: string;
  order_id: string;
  address: string;
  is_subtract?: boolean;
  priority?: string;
  url_callback?: string;
  additional_data?: string;
}

export interface PayoutResult {
  uuid: string;
  amount: string;
  currency: string;
  network: string;
  address: string;
  txid?: string;
  status: string;
  is_final: boolean;
  balance?: number;
  payer_currency?: string;
  payer_amount?: number;
}

export interface PayoutInfoRequest {
  uuid?: string;
  order_id?: string;
}

export interface PayoutHistoryRequest {
  date_from?: string;
  date_to?: string;
  cursor?: string;
}

export interface PayoutHistoryResult {
  merchant_uuid: string;
  items: PayoutResult[];
  paginate: {
    count: number;
    hasPages: boolean;
    nextCursor?: string;
    previousCursor?: string;
    perPage: number;
  };
}

export interface PayoutService {
  network: string;
  currency: string;
  is_available: boolean;
  limit: {
    min_amount: string;
    max_amount: string;
  };
  commission: {
    fee_amount: string;
    percent: string;
  };
}

// Balance interfaces
export interface BalanceResult {
  balance: {
    merchant: Array<{
      uuid: string;
      balance: string;
      currency_code: string;
    }>;
    user: Array<{
      uuid: string;
      balance: string;
      currency_code: string;
    }>;
  };
}

export interface ExchangeRateResult {
  from: string;
  to: string;
  course: string;
  amount?: string;
}

export class Cryptomus {
  private readonly merchantId: string;
  private readonly paymentApiKey: string;
  private readonly payoutApiKey?: string;
  private readonly baseUrl = "https://api.cryptomus.com";

  constructor(config: CryptomusConfig) {
    this.merchantId = config.merchantId;
    this.paymentApiKey = config.paymentApiKey;
    this.payoutApiKey = config.payoutApiKey;
  }

  // Signature generation
  private createSignature(
    data: Record<string, unknown> | object,
    apiKey: string,
  ): string {
    const jsonString = JSON.stringify(data, null, 0);
    const base64Data = Buffer.from(jsonString).toString("base64");
    return crypto
      .createHash("md5")
      .update(base64Data + apiKey)
      .digest("hex");
  }

  // Generic request method
  private async makeRequest<T>(
    endpoint: string,
    data: Record<string, unknown> | object = {},
    usePayoutKey = false,
  ): Promise<CryptomusResponse<T>> {
    const apiKey = usePayoutKey ? this.payoutApiKey : this.paymentApiKey;

    if (!apiKey) {
      throw new Error(
        `${usePayoutKey ? "Payout" : "Payment"} API key not provided`,
      );
    }

    const signature = this.createSignature(data, apiKey);
    const url = `${this.baseUrl}${endpoint}`;

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        merchant: this.merchantId,
        sign: signature,
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error(
        `Cryptomus API error: ${response.status} ${response.statusText}`,
      );
    }

    return response.json();
  }

  // Payment methods
  async createPayment(
    data: CreatePaymentRequest,
  ): Promise<CryptomusResponse<PaymentResult>> {
    return this.makeRequest<PaymentResult>("/v1/payment", data);
  }

  async getPaymentInfo(
    data: PaymentInfoRequest,
  ): Promise<CryptomusResponse<PaymentResult>> {
    return this.makeRequest<PaymentResult>("/v1/payment/info", data);
  }

  async getPaymentHistory(
    data: PaymentHistoryRequest = {},
  ): Promise<CryptomusResponse<PaymentHistoryResult>> {
    return this.makeRequest<PaymentHistoryResult>("/v1/payment/list", data);
  }

  async getPaymentServices(): Promise<CryptomusResponse<PaymentService[]>> {
    return this.makeRequest<PaymentService[]>("/v1/payment/services", {});
  }

  async refundPayment(data: RefundRequest): Promise<CryptomusResponse<null>> {
    return this.makeRequest<null>("/v1/payment/refund", data);
  }

  async resendWebhook(
    data: ResendWebhookRequest,
  ): Promise<CryptomusResponse<null>> {
    return this.makeRequest<null>("/v1/payment/resend", data);
  }

  async testWebhook(
    data: ResendWebhookRequest,
  ): Promise<CryptomusResponse<null>> {
    return this.makeRequest<null>("/v1/test-webhook/payment", data);
  }

  // Wallet methods
  async createWallet(
    data: CreateWalletRequest,
  ): Promise<CryptomusResponse<WalletResult>> {
    return this.makeRequest<WalletResult>("/v1/wallet", data);
  }

  async blockWallet(
    data: BlockWalletRequest,
  ): Promise<CryptomusResponse<BlockWalletResult>> {
    return this.makeRequest<BlockWalletResult>(
      "/v1/wallet/block-address",
      data,
    );
  }

  // Payout methods
  async createPayout(
    data: CreatePayoutRequest,
  ): Promise<CryptomusResponse<PayoutResult>> {
    return this.makeRequest<PayoutResult>("/v1/payout", data, true);
  }

  async getPayoutInfo(
    data: PayoutInfoRequest,
  ): Promise<CryptomusResponse<PayoutResult>> {
    return this.makeRequest<PayoutResult>("/v1/payout/info", data, true);
  }

  async getPayoutHistory(
    data: PayoutHistoryRequest = {},
  ): Promise<CryptomusResponse<PayoutHistoryResult>> {
    return this.makeRequest<PayoutHistoryResult>("/v1/payout/list", data, true);
  }

  async getPayoutServices(): Promise<CryptomusResponse<PayoutService[]>> {
    return this.makeRequest<PayoutService[]>("/v1/payout/services", {}, true);
  }

  // Balance method
  async getBalance(): Promise<CryptomusResponse<BalanceResult[]>> {
    return this.makeRequest<BalanceResult[]>("/v1/balance", {});
  }

  // Webhook validation
  static validateWebhook(
    body: string,
    signature: string,
    apiKey: string,
  ): boolean {
    try {
      // Parse the webhook data
      const webhookData = JSON.parse(body);

      // Extract sign from webhook data
      const receivedSign = webhookData.sign;
      if (!receivedSign) {
        return false;
      }

      // Remove sign from data for validation
      const dataWithoutSign = { ...webhookData };
      delete dataWithoutSign.sign;

      // Generate expected signature
      const jsonString = JSON.stringify(dataWithoutSign, null, 0);
      const base64Data = Buffer.from(jsonString).toString("base64");
      const expectedSignature = crypto
        .createHash("md5")
        .update(base64Data + apiKey)
        .digest("hex");

      // Compare signatures using timing-safe comparison
      return crypto.timingSafeEqual(
        Buffer.from(receivedSign.toLowerCase()),
        Buffer.from(expectedSignature.toLowerCase()),
      );
    } catch (error) {
      console.error("Webhook validation error:", error);
      return false;
    }
  }

  // Utility methods
  static generateUUID(): string {
    return crypto.randomUUID();
  }

  static generateShortUUID(): string {
    return crypto
      .randomBytes(12)
      .toString("base64")
      .replace(/[+/=]/g, "")
      .substring(0, 12);
  }

  // Exchange rate method
  async getExchangeRate(
    from: string,
    to: string,
    amount?: string,
  ): Promise<CryptomusResponse<ExchangeRateResult>> {
    const data = amount ? { from, to, amount } : { from, to };
    return this.makeRequest("/v1/exchange-rate/calculate", data);
  }
}

export default Cryptomus;
