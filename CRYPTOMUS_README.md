# Cryptomus Integration Guide

This document provides a complete guide for the Cryptomus payment gateway integration based on the official [Cryptomus API documentation](https://doc.cryptomus.com/business).

## 🚀 Features

- ✅ **Payment Creation** - Create invoices with various currencies and networks
- ✅ **Static Wallets** - Generate permanent wallet addresses for receiving payments
- ✅ **Webhook Validation** - Secure webhook signature verification
- ✅ **Payment Information** - Retrieve payment status and details
- ✅ **Refunds** - Process payment refunds
- ✅ **Payouts** - Send cryptocurrency to external wallets
- ✅ **Balance Management** - Check merchant and user balances
- ✅ **Payment Services** - Get available currencies and networks
- ✅ **Payment History** - Retrieve payment transaction history
- ✅ **Exchange Rates** - Get current cryptocurrency exchange rates
- ✅ **Full TypeScript Support** - Complete type definitions for all API responses

## 📋 Prerequisites

1. A Cryptomus merchant account
2. API keys from your Cryptomus dashboard
3. Node.js and npm/yarn installed
4. Next.js application (for webhook handling)

## 🔧 Setup

### 1. Environment Variables

Add the following environment variables to your `.env` file:

```env
# Required
CRYPTOMUS_MERCHANT_ID=your-merchant-uuid-here
CRYPTOMUS_PAYMENT_API_KEY=your-payment-api-key-here

# Optional (for payouts)
CRYPTOMUS_PAYOUT_API_KEY=your-payout-api-key-here

# Application URLs
NEXTAUTH_URL=https://yourdomain.com
```

### 2. Getting API Keys

1. Log in to your [Cryptomus merchant dashboard](https://cryptomus.com/)
2. Go to **Settings** → **API Keys**
3. Generate your **Payment API Key** and **Payout API Key**
4. Copy your **Merchant UUID** from the settings

### 3. Webhook Setup

Configure your webhook URL in the Cryptomus dashboard:
- Webhook URL: `https://yourdomain.com/api/webhooks/cryptomus`
- Enable webhook notifications for payment status changes

## 💻 Usage Examples

### Basic Payment Creation

```typescript
import { Cryptomus } from '@/lib/cryptomus'

const cryptomus = new Cryptomus({
  merchantId: process.env.CRYPTOMUS_MERCHANT_ID!,
  paymentApiKey: process.env.CRYPTOMUS_PAYMENT_API_KEY!,
  payoutApiKey: process.env.CRYPTOMUS_PAYOUT_API_KEY
})

// Create a payment
const payment = await cryptomus.createPayment({
  amount: '10.00',
  currency: 'USD',
  order_id: Cryptomus.generateUUID(),
  url_return: 'https://yoursite.com/return',
  url_callback: 'https://yoursite.com/webhook',
  lifetime: 3600, // 1 hour
  to_currency: 'USDT', // Convert USD to USDT
  network: 'tron' // Use Tron network
})

if (payment.state === 0 && payment.result) {
  console.log('Payment URL:', payment.result.url)
  console.log('Payment ID:', payment.result.uuid)
}
```

### Using the PaymentProviders Wrapper

```typescript
import { PaymentProviders } from '@/lib/payment-providers'

const result = await PaymentProviders.createCryptomusPayment({
  orderId: 'order-123',
  amount: 25.00,
  currency: 'USD',
  returnUrl: 'https://yoursite.com/return',
  callbackUrl: 'https://yoursite.com/webhook'
})

if (result.success) {
  console.log('Payment URL:', result.paymentUrl)
  console.log('Payment ID:', result.paymentId)
}
```

### Creating a Static Wallet

```typescript
const wallet = await cryptomus.createWallet({
  network: 'tron',
  currency: 'USDT',
  order_id: Cryptomus.generateShortUUID(),
  url_callback: 'https://yoursite.com/webhook'
})

if (wallet.state === 0 && wallet.result) {
  console.log('Wallet Address:', wallet.result.address)
  console.log('Wallet UUID:', wallet.result.wallet_uuid)
}
```

### Payment Information

```typescript
const paymentInfo = await cryptomus.getPaymentInfo({
  uuid: 'payment-uuid-here'
})

if (paymentInfo.state === 0 && paymentInfo.result) {
  console.log('Payment Status:', paymentInfo.result.payment_status)
  console.log('Amount Paid:', paymentInfo.result.payment_amount)
}
```

### Creating a Payout

```typescript
const payout = await cryptomus.createPayout({
  amount: '5.00',
  currency: 'USDT',
  network: 'tron',
  order_id: Cryptomus.generateShortUUID(),
  address: 'TYourWalletAddressHere...',
  is_subtract: true // Merchant pays the fee
})

if (payout.state === 0 && payout.result) {
  console.log('Payout UUID:', payout.result.uuid)
  console.log('Status:', payout.result.status)
}
```

### Webhook Validation

```typescript
import { Cryptomus } from '@/lib/cryptomus'

// In your webhook handler
const isValid = Cryptomus.validateWebhook(
  webhookBody, 
  '', 
  process.env.CRYPTOMUS_PAYMENT_API_KEY!
)

if (isValid) {
  // Process the webhook
  const webhookData = JSON.parse(webhookBody)
  console.log('Payment status:', webhookData.status)
}
```

## 🔐 Webhook Handling

The webhook handler at `/api/webhooks/cryptomus/route.ts` automatically:

1. **Validates webhook signatures** using the API key
2. **Maps Cryptomus statuses** to your application statuses
3. **Updates payment and order records** in the database
4. **Creates user subscriptions** for completed payments
5. **Sends email notifications** for successful orders

### Supported Payment Statuses

| Cryptomus Status | App Status | Description |
|-----------------|------------|-------------|
| `paid` | `COMPLETED` | Payment successfully completed |
| `paid_over` | `COMPLETED` | Payment completed with overpayment |
| `confirm_check` | `COMPLETED` | Payment confirmed and being processed |
| `fail` | `FAILED` | Payment failed |
| `system_fail` | `FAILED` | System error occurred |
| `wrong_amount` | `FAILED` | Incorrect payment amount |
| `cancel` | `CANCELLED` | Payment cancelled |
| `refund_paid` | `CANCELLED` | Refund completed |

## 🛠️ API Methods

### Payment Methods

- `createPayment(data)` - Create a new payment invoice
- `getPaymentInfo(data)` - Get payment information by UUID or order ID
- `getPaymentHistory(data)` - Get payment transaction history
- `getPaymentServices()` - Get available payment currencies and networks
- `refundPayment(data)` - Process a payment refund
- `resendWebhook(data)` - Resend webhook notification
- `testWebhook(data)` - Test webhook delivery

### Wallet Methods

- `createWallet(data)` - Create a static wallet address
- `blockWallet(data)` - Block a static wallet

### Payout Methods

- `createPayout(data)` - Create a cryptocurrency payout
- `getPayoutInfo(data)` - Get payout information
- `getPayoutHistory(data)` - Get payout transaction history
- `getPayoutServices()` - Get available payout currencies and networks

### Utility Methods

- `getBalance()` - Get merchant and user balances
- `getExchangeRate(from, to, amount?)` - Get exchange rates
- `Cryptomus.generateUUID()` - Generate a standard UUID
- `Cryptomus.generateShortUUID()` - Generate a short UUID (for wallets/payouts)
- `Cryptomus.validateWebhook(body, signature, apiKey)` - Validate webhook signatures

## 🔍 Error Handling

All API methods return a standardized response format:

```typescript
interface CryptomusResponse<T> {
  state: number        // 0 = success, 1 = error
  result?: T          // Response data (on success)
  message?: string    // Error message (on failure)
  errors?: Record<string, string[]> // Validation errors
}
```

Example error handling:

```typescript
try {
  const payment = await cryptomus.createPayment(paymentData)
  
  if (payment.state === 0 && payment.result) {
    // Success
    console.log('Payment created:', payment.result.url)
  } else {
    // API error
    console.error('Payment failed:', payment.message)
  }
} catch (error) {
  // Network/system error
  console.error('Request failed:', error)
}
```

## 🌍 Supported Currencies

Popular cryptocurrencies supported by Cryptomus:

- **Bitcoin (BTC)** - Bitcoin network
- **Ethereum (ETH)** - Ethereum network
- **USDT** - Tron (TRC-20) and Ethereum (ERC-20) networks
- **USDC** - Multiple networks
- **BNB** - Binance Smart Chain
- **And many more...**

Use `getPaymentServices()` to get the complete list of available currencies and networks.

## 📚 TypeScript Support

The implementation includes comprehensive TypeScript interfaces for all API requests and responses:

- `CreatePaymentRequest` - Payment creation parameters
- `PaymentResult` - Payment response data
- `CryptomusWebhook` - Webhook data structure
- `PaymentService` - Available payment services
- `WalletResult` - Wallet creation response
- `PayoutResult` - Payout response data
- And many more...

## 🛡️ Security Features

1. **Signature Validation** - All webhooks are validated using MD5 hash signatures
2. **Rate Limiting** - Webhook endpoints include rate limiting protection
3. **Environment Variables** - Sensitive data stored securely in environment variables
4. **Timing-Safe Comparison** - Webhook signatures compared using timing-safe methods

## 🐛 Troubleshooting

### Common Issues

1. **Invalid Signature Errors**
   - Ensure `CRYPTOMUS_PAYMENT_API_KEY` is correctly set
   - Check that webhook URL is accessible from the internet
   - Verify merchant UUID is correct

2. **Payment Creation Fails**
   - Check that all required parameters are provided
   - Verify API keys have sufficient permissions
   - Ensure amounts meet minimum/maximum limits

3. **Webhook Not Received**
   - Verify webhook URL in Cryptomus dashboard
   - Check server logs for processing errors
   - Test webhook endpoint manually

### Debug Mode

Enable detailed logging by setting:

```env
NODE_ENV=development
```

This will log all API requests and responses for debugging purposes.

## 📞 Support

For technical support:

1. Check the [official Cryptomus documentation](https://doc.cryptomus.com/business)
2. Contact Cryptomus support through their dashboard
3. Review the implementation in `src/lib/cryptomus.ts` for detailed code examples

## 🔄 Migration from Old Implementation

If upgrading from the previous implementation:

1. Replace `CRYPTOMUS_API_KEY` and `CRYPTOMUS_SECRET_KEY` with `CRYPTOMUS_PAYMENT_API_KEY`
2. Update webhook validation calls to use the new method
3. Replace direct API calls with the new SDK methods
4. Update payment status mapping to use the new status values

The new implementation provides better error handling, complete TypeScript support, and follows the official API documentation exactly. 