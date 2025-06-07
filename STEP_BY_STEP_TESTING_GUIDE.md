# 🎯 Complete Cryptomus Payment Testing Guide

## ⚠️ CRITICAL SECURITY FIX APPLIED

**I found and fixed a major security vulnerability in your webhook handler!**

**Problem**: The webhook validation was not properly checking signatures, allowing potential security bypasses.
**Fix**: Now properly validates webhook signatures from HTTP headers.

---

## 📊 Understanding Your Payment Flow

### Current Payment Process:

1. **User Creates Order** → Status: `PENDING`
2. **Payment Created** → Status: `PENDING`
3. **User Pays via Cryptomus** → Real money transaction
4. **Cryptomus Sends Webhook** → Your app receives notification
5. **Webhook Validates** → Checks signature for security
6. **Order Updated** → Status: `PENDING` → `COMPLETED`
7. **Subscriptions Created** → User gets access
8. **Email Sent** → Confirmation to user

### What Our Testing Does:

- **Simulates step 4-8** without real money
- **Tests webhook security** validation
- **Verifies database updates** work correctly
- **Checks subscription creation** logic
- **Tests email notifications**

---

## 🚀 Step-by-Step Testing Instructions

### Phase 1: Prepare Your Environment

1. **Start Your Development Server**:

   ```bash
   npm run dev
   ```

2. **Open Browser to Test Page**:

   ```
   http://localhost:3000/test/cryptomus
   ```

3. **Keep Console Open** (Important!):
   - Open Developer Tools (F12)
   - Go to Console tab
   - You'll see detailed logs here

### Phase 2: Create a Test Order (Optional but Recommended)

1. **Go to your product/checkout page**
2. **Create a real order** (don't pay yet!)
3. **Note the Order ID** - you'll use this for testing
4. **Check database** to see the order status is `PENDING`

### Phase 3: Test Successful Payment Flow

1. **On the test page**:

   - **Order ID**: Enter your order ID (or leave empty for auto-generated)
   - **Status**: Select "Paid ✅"
   - **Currency**: USDT
   - **Network**: TRON

2. **Click "Send Test Webhook"**

3. **Watch what happens**:

   - Browser shows success message
   - Console shows webhook processing logs
   - Check your terminal/server logs

4. **Verify Database Updates**:

   ```sql
   -- Check payment status
   SELECT id, status, completedAt FROM Payment WHERE id = 'your-payment-id';

   -- Check order status
   SELECT id, status, completedAt FROM Order WHERE orderNumber = 'your-order-id';

   -- Check subscriptions created
   SELECT * FROM UserSubscription WHERE orderId = 'your-order-id';
   ```

### Phase 4: Test Failure Scenarios

Test each of these statuses to ensure proper error handling:

1. **Failed Payment**:

   - Status: "Failed ❌"
   - Should set order to `FAILED`
   - Should NOT create subscriptions

2. **Wrong Amount**:

   - Status: "Wrong Amount ⚠️"
   - Should set order to `FAILED`
   - Should record failure reason

3. **Cancelled Payment**:
   - Status: "Cancelled 🚫"
   - Should set order to `CANCELLED`

### Phase 5: Test Security Validation

1. **Test Invalid Webhook** (Advanced):

   ```bash
   # This should fail with "Invalid signature"
   curl -X POST http://localhost:3000/api/webhooks/cryptomus \
     -H "Content-Type: application/json" \
     -d '{"order_id": "test", "status": "paid", "uuid": "test"}'
   ```

2. **Verify Security**:
   - Check server logs show "Invalid signature" error
   - Webhook should be rejected
   - Database should NOT be updated

---

## 🔍 What To Monitor During Testing

### 1. Server Console Logs

Look for these messages:

```
✅ Valid Cryptomus webhook received: { order_id: 'test-123', status: 'paid', uuid: 'abc' }
Current payment status: { paymentId: '...', currentStatus: 'PENDING', newWebhookStatus: 'paid' }
✅ Payment status updated: { paymentId: '...', oldStatus: 'PENDING', newStatus: 'COMPLETED' }
Created 1 subscriptions for completed order
✅ Order confirmation email sent
✅ Cryptomus webhook processed successfully: test-123 - paid
```

### 2. Browser Developer Console

Check for:

- Network requests (200 status codes)
- Any JavaScript errors
- Test webhook responses

### 3. Database Changes

Verify these tables update correctly:

- `Payment` table: status, completedAt, webhookData
- `Order` table: status, completedAt
- `UserSubscription` table: new records for completed orders

---

## 🛡️ Security Features Verified

### ✅ What's Secure:

1. **Webhook Signature Validation** - Prevents fake webhooks
2. **Rate Limiting** - Prevents spam attacks
3. **Status Mapping** - Only valid statuses accepted
4. **Database Transactions** - Ensures data consistency
5. **Environment Restrictions** - Test endpoints only work in development

### ❌ Security Bypass Prevention:

1. **Cannot fake payment completion** without valid signature
2. **Cannot replay old webhooks** (each has unique signature)
3. **Cannot access test endpoints** in production
4. **Cannot bypass payment validation**

---

## 🐛 Troubleshooting Common Issues

### Issue 1: "Cryptomus credentials not configured"

**Solution**: Check your `.env` file has:

```env
CRYPTOMUS_MERCHANT_ID=your-merchant-id
CRYPTOMUS_PAYMENT_API_KEY=your-payment-api-key
CRYPTOMUS_SECRET_KEY=your-secret-key
```

### Issue 2: "Payment not found"

**Solution**:

- Use a real order ID from your database, OR
- Leave order ID empty for auto-generated test

### Issue 3: "Invalid signature"

**Solution**: This is GOOD! It means security is working.

- Only use the test interface, not direct curl commands

### Issue 4: Database not updating

**Solution**:

- Check server logs for errors
- Verify database connection
- Ensure order exists with the test order ID

### Issue 5: Test page not loading

**Solution**:

- Only works in development mode
- Ensure `NODE_ENV` is not set to 'production'

---

## 📱 Real-World Testing Workflow

### For Each New Feature:

1. **Create test order** → Check status is `PENDING`
2. **Test successful payment** → Verify `COMPLETED` status
3. **Test failed payment** → Verify `FAILED` status
4. **Test cancelled payment** → Verify `CANCELLED` status
5. **Check subscriptions** → Verify user gets access
6. **Test email notifications** → Check inbox
7. **Test edge cases** → Wrong amounts, duplicates, etc.

### Before Going Live:

1. ✅ All payment statuses tested
2. ✅ Database updates correctly
3. ✅ Subscriptions created properly
4. ✅ Email notifications work
5. ✅ Security validation passes
6. ✅ Error handling works
7. ✅ Rate limiting active

---

## 🔧 Advanced Testing Commands

### Test via Command Line:

```bash
# Test successful payment
node scripts/test-cryptomus-webhook.js --status=paid --order-id=your-order-123

# Test failed payment
node scripts/test-cryptomus-webhook.js --status=fail --order-id=your-order-123

# Test with different currency
node scripts/test-cryptomus-webhook.js --status=paid --currency=BTC --network=ETH
```

### Database Queries for Verification:

```sql
-- Check recent webhook activity
SELECT p.id, p.status, p.completedAt, o.orderNumber, o.status as orderStatus
FROM Payment p
JOIN "Order" o ON p.orderId = o.id
ORDER BY p.updatedAt DESC
LIMIT 10;

-- Check subscriptions created today
SELECT us.*, p.name as planName
FROM UserSubscription us
JOIN Plan p ON us.planId = p.id
WHERE DATE(us.createdAt) = CURRENT_DATE;

-- Check webhook data stored
SELECT id, status, webhookData
FROM Payment
WHERE webhookData IS NOT NULL
ORDER BY updatedAt DESC
LIMIT 5;
```

---

## ✅ Testing Checklist

### Basic Flow Testing:

- [ ] Test successful payment (`paid` status)
- [ ] Test failed payment (`fail` status)
- [ ] Test cancelled payment (`cancel` status)
- [ ] Test wrong amount (`wrong_amount` status)
- [ ] Test overpayment (`paid_over` status)

### Database Verification:

- [ ] Payment status updates correctly
- [ ] Order status updates correctly
- [ ] CompletedAt timestamps set
- [ ] Webhook data stored
- [ ] Subscriptions created for completed orders
- [ ] Failure reasons recorded for failed payments

### Security Testing:

- [ ] Invalid webhooks rejected
- [ ] Signature validation working
- [ ] Rate limiting active
- [ ] Test endpoints disabled in production

### Integration Testing:

- [ ] Email notifications sent
- [ ] User can access purchased content
- [ ] Subscription dates calculated correctly
- [ ] Auto-renewal settings applied

---

## 🎉 You're Ready!

Once all tests pass, your Cryptomus payment integration is:

- ✅ **Secure** - Protected against fake webhooks
- ✅ **Reliable** - Handles all payment scenarios
- ✅ **Complete** - Updates all necessary data
- ✅ **User-friendly** - Sends confirmations
- ✅ **Robust** - Handles errors gracefully

**Now you can accept real payments with confidence!** 🚀
