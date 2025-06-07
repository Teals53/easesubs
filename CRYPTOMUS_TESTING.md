# 🧪 Cryptomus Payment Testing Guide

This guide explains how to test your Cryptomus payment integration **without spending real money**.

## 🔍 Overview

Cryptomus doesn't provide a traditional "sandbox" environment, but they offer **test webhook endpoints** that allow you to simulate different payment scenarios without real transactions. This is perfect for testing your webhook handlers and payment processing logic.

## 🚀 Quick Start

### Option 1: Web Interface (Recommended)

1. Start your development server:
   ```bash
   npm run dev
   ```

2. Navigate to the test page:
   ```
   http://localhost:3000/test/cryptomus
   ```

3. Use the testing interface to simulate different payment statuses

### Option 2: Command Line

1. Use the provided test script:
   ```bash
   node scripts/test-cryptomus-webhook.js
   ```

2. Test specific scenarios:
   ```bash
   # Test successful payment
   node scripts/test-cryptomus-webhook.js --status=paid
   
   # Test failed payment
   node scripts/test-cryptomus-webhook.js --status=fail
   
   # Test wrong amount
   node scripts/test-cryptomus-webhook.js --status=wrong_amount
   
   # Test with custom order ID
   node scripts/test-cryptomus-webhook.js --order-id=my-test-order-123
   ```

### Option 3: Direct API Call

```bash
curl -X POST http://localhost:3000/api/test/cryptomus-webhook \
  -H "Content-Type: application/json" \
  -d '{
    "status": "paid",
    "currency": "USDT",
    "network": "TRON",
    "orderId": "test-123"
  }'
```

## 📋 Test Scenarios

### Essential Test Cases

1. **✅ Successful Payment**
   - Status: `paid`
   - Expected: Order status becomes COMPLETED

2. **❌ Failed Payment**
   - Status: `fail`
   - Expected: Order status becomes FAILED

3. **🚫 Cancelled Payment**
   - Status: `cancel`
   - Expected: Order status becomes CANCELLED

4. **⚠️ Wrong Amount**
   - Status: `wrong_amount`
   - Expected: Payment fails with specific error handling

5. **💰 Overpayment**
   - Status: `paid_over`
   - Expected: Payment succeeds despite amount difference

### All Available Statuses

| Status | Description | Test Purpose |
|--------|-------------|--------------|
| `paid` | Payment completed successfully | ✅ Success flow |
| `paid_over` | Payment amount exceeded expected | 💰 Overpayment handling |
| `process` | Payment is being processed | ⏳ Pending states |
| `check` | Payment under verification | 🔍 Verification flow |
| `fail` | Payment failed | ❌ Failure handling |
| `wrong_amount` | Incorrect payment amount | ⚠️ Amount validation |
| `cancel` | Payment cancelled | 🚫 Cancellation flow |
| `system_fail` | System error occurred | 💥 System error handling |
| `refund_process` | Refund being processed | 🔄 Refund initiation |
| `refund_fail` | Refund failed | ❌ Refund failure |
| `refund_paid` | Refund completed | ↩️ Refund success |

## 🔧 Setup Requirements

### Environment Variables

Ensure these are set in your `.env` file:

```env
CRYPTOMUS_MERCHANT_ID=your-merchant-id
CRYPTOMUS_PAYMENT_API_KEY=your-payment-api-key
CRYPTOMUS_SECRET_KEY=your-secret-key
NEXTAUTH_URL=http://localhost:3000
```

### Database Preparation

1. **Create Test Orders**: Create some test orders in your database
2. **Monitor Changes**: Watch how order/payment statuses change during testing
3. **Clean Up**: Remove test data after testing

## 🕵️ What to Monitor During Testing

### 1. Application Logs
- Check console output for webhook processing
- Look for any errors in signature verification
- Monitor database query execution

### 2. Database Changes
- Verify payment status updates correctly
- Check order status transitions
- Ensure user balances update (if applicable)

### 3. Webhook Handler
- Confirm webhook receives the test data
- Verify signature validation works
- Check error handling for invalid webhooks

## 🐛 Troubleshooting

### Common Issues

1. **"Test endpoints not available in production"**
   - Solution: Only works in development mode

2. **"Cryptomus credentials not configured"**
   - Solution: Check your environment variables

3. **Webhook not triggering**
   - Solution: Ensure your app is running on the correct port
   - Check the callback URL matches your server

4. **Database not updating**
   - Solution: Check your webhook handler logic
   - Verify order exists with the test order ID

### Debug Steps

1. **Check Server Logs**:
   ```bash
   # Watch your development server console
   ```

2. **Verify Webhook Endpoint**:
   ```bash
   curl http://localhost:3000/api/webhooks/cryptomus
   ```

3. **Test Database Connection**:
   - Ensure your database is accessible
   - Check Prisma/database configuration

## 📚 How It Works

### Behind the Scenes

1. **Test Webhook API** (`/api/test/cryptomus-webhook`):
   - Calls Cryptomus test endpoint
   - Uses your real API credentials
   - No money is transferred

2. **Cryptomus Test Endpoint**:
   - `https://api.cryptomus.com/v1/test-webhook/payment`
   - Simulates webhook delivery to your app
   - Uses test data, not real transactions

3. **Your Webhook Handler**:
   - Receives simulated webhook
   - Processes it like a real payment
   - Updates your database accordingly

### Data Flow

```
[Test Interface] → [Your Test API] → [Cryptomus Test API] → [Your Webhook Handler] → [Database Update]
```

## 💡 Best Practices

### Testing Strategy

1. **Start Simple**: Begin with basic `paid` status
2. **Test Edge Cases**: Try all failure scenarios  
3. **Verify Cleanup**: Ensure failed payments don't leave inconsistent state
4. **Check Idempotency**: Test duplicate webhook delivery
5. **Monitor Performance**: Ensure webhook processing is fast

### Code Testing

```javascript
// Example: Test your webhook handler directly
import { POST } from '@/app/api/webhooks/cryptomus/route'

// Create mock webhook data
const testWebhook = {
  type: 'payment',
  uuid: 'test-uuid',
  order_id: 'test-order',
  amount: '10.00',
  status: 'paid',
  // ... other fields
}

// Test the handler
const response = await POST(new Request('http://localhost:3000/api/webhooks/cryptomus', {
  method: 'POST',
  body: JSON.stringify(testWebhook)
}))
```

## 🔐 Security Notes

- Test webhooks use your real API credentials
- No actual money is transferred during testing
- Webhook signatures are validated normally
- Test mode only works in development environment

## 📞 Need Help?

If you encounter issues:

1. Check the [Cryptomus testing webhook documentation](https://doc.cryptomus.com/business/payments/testing-webhook)
2. Review your webhook handler implementation
3. Verify environment variable configuration
4. Check application logs for specific error messages

---

Happy testing! 🎉 