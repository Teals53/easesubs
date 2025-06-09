# Payment Architecture Documentation

## Overview
EaseSubs supports cryptocurrency payments through Cryptomus integration, providing a secure and modern payment solution for digital services.

## Payment Methods

### Supported Providers
1. **Cryptomus** - Cryptocurrency payments (Bitcoin, Ethereum, USDT, etc.)
2. **Weepay** - Credit card payments with 3D verification
3. **Admin Bypass** - For testing purposes (admin only)

## Database Schema

### Payment Method Enum
```typescript
enum PaymentMethod {
  CRYPTOMUS
  WEEPAY
  ADMIN_BYPASS
}
```

### Order Model
```typescript
model Order {
  id: string
  orderNumber: string
  userId: string
  total: Decimal
  status: OrderStatus
  paymentMethod: "CRYPTOMUS" | "WEEPAY" | "ADMIN_BYPASS"
  // ... other fields
}
```

### Payment Model
```typescript
model Payment {
  id: string
  orderId: string
  method: "CRYPTOMUS" | "WEEPAY"
  amount: Decimal
  currency: string
  status: PaymentStatus
  // ... other fields
}
```

## API Routes

### Payment Creation
- `/api/payment/cryptomus/create` - Create Cryptomus payment session
- `/api/payment/weepay/create` - Create Weepay payment session

### Webhooks
- `/api/webhooks/cryptomus` - Process Cryptomus payment callbacks
- `/api/webhooks/weepay` - Process Weepay payment callbacks

## Environment Variables

### Cryptomus Configuration
```env
CRYPTOMUS_MERCHANT_ID="your-merchant-uuid"
CRYPTOMUS_PAYMENT_API_KEY="your-payment-api-key"
CRYPTOMUS_PAYOUT_API_KEY="your-payout-api-key"
CRYPTOMUS_SECRET="your-secret"
CRYPTOMUS_WEBHOOK_SECRET="your-webhook-secret"
CRYPTOMUS_BASE_URL="https://api.cryptomus.com/v1"
```

### Weepay Configuration
```env
WEEPAY_MERCHANT_ID="your-weepay-merchant-id"
WEEPAY_API_KEY="your-weepay-api-key"
WEEPAY_SECRET_KEY="your-weepay-secret-key"
WEEPAY_BASE_URL="https://api.weepay.co"
WEEPAY_SANDBOX_URL="https://testapi.weepay.co"
WEEPAY_IS_SANDBOX="true"
```

## Payment Flow

### 1. Order Creation
1. User selects products and proceeds to checkout
2. User chooses payment method (Cryptomus for crypto or Weepay for credit cards)
3. Frontend creates order with selected payment method (`CRYPTOMUS` or `WEEPAY`)
4. Order is stored in database with `PENDING` status

### 2. Payment Processing

#### Cryptomus Flow
1. Frontend calls `/api/payment/cryptomus/create`
2. API creates payment record in database
3. API calls Cryptomus to create payment session
4. User is redirected to Cryptomus payment page

#### Weepay Flow
1. Frontend calls `/api/payment/weepay/create`
2. API creates payment record in database
3. API calls Weepay to create payment session
4. User is redirected to Weepay payment page

### 3. Payment Completion
1. User completes payment on respective payment provider
2. Payment provider sends webhook to respective endpoint:
   - Cryptomus: `/api/webhooks/cryptomus`
   - Weepay: `/api/webhooks/weepay`
3. Webhook validates payment signature and updates database
4. Order status changes to `COMPLETED`
5. Digital products are delivered automatically

## Security Features

- Webhook signature validation
- Rate limiting on payment endpoints
- CSRF protection
- Secure environment variable handling
- Database transaction safety

## Error Handling

- Payment failures are logged and tracked
- Users receive clear error messages
- Failed payments can be retried
- Refund capabilities through Cryptomus API

## Testing

### Development Environment
- Use Cryptomus sandbox environment
- Test with small cryptocurrency amounts
- Verify webhook functionality locally

### Production Checklist
- [ ] Update `CRYPTOMUS_BASE_URL` to production
- [ ] Configure production webhook URLs
- [ ] Test with real cryptocurrency transactions
- [ ] Verify SSL certificates and security headers 