# Payment Architecture Documentation

## 🏗️ **Unified Payment System Architecture**

This document outlines the clean, unified payment architecture for both Cryptomus and Iyzico payment providers.

## 📁 **File Structure**

```
src/
├── app/api/payment/
│   ├── cryptomus/
│   │   └── create/
│   │       └── route.ts          # Cryptomus payment creation
│   └── iyzico/
│       ├── create/
│       │   └── route.ts          # Iyzico payment creation
│       └── callback/
│           └── route.ts          # Iyzico payment callback
├── app/api/webhooks/
│   └── cryptomus/
│       └── route.ts              # Cryptomus webhook handler
├── lib/
│   ├── payment-providers.ts     # Unified payment provider class
│   ├── cryptomus.ts             # Cryptomus SDK wrapper
│   └── iyzico-wrapper.ts        # Iyzico SDK wrapper
└── server/api/routers/
    └── payment.ts               # Payment queries and webhook handling
```

## 🔄 **Unified Payment Flow**

### **1. Order Creation**
```typescript
// Frontend: checkout-form.tsx
const orderResult = await createOrderMutation.mutateAsync({
  items: [...],
  paymentMethod: "CRYPTOMUS" | "IYZICO" | "ADMIN_BYPASS"
});
```

### **2. Payment Processing**

Both providers follow the same pattern:

#### **Cryptomus Flow:**
1. `POST /api/payment/cryptomus/create`
2. Creates payment record in database
3. Calls `PaymentProviders.createCryptomusPayment()`
4. Redirects user to Cryptomus payment page
5. User completes payment
6. `POST /api/webhooks/cryptomus` receives callback
7. Updates payment and order status
8. Processes delivery

#### **Iyzico Flow:**
1. `POST /api/payment/iyzico/create`
2. Creates payment record in database
3. Calls `PaymentProviders.createIyzicoCheckout()`
4. Redirects user to Iyzico payment page
5. User completes payment
6. `POST /api/payment/iyzico/callback` receives callback
7. Updates payment and order status
8. Processes delivery

## 🗄️ **Database Schema**

### **Payment Record Structure**
```typescript
payment {
  id: string                    // Internal payment ID
  orderId: string              // Reference to order
  method: "CRYPTOMUS" | "IYZICO"
  amount: number
  currency: string
  status: "PENDING" | "COMPLETED" | "FAILED" | "CANCELLED"
  providerPaymentId: string    // Provider's payment ID
  providerData: JSON           // Provider-specific data
  webhookData: JSON           // Webhook response data
  completedAt: Date?
  failureReason: string?
}
```

## 🔗 **Provider Integration Mapping**

### **Conversation ID Mapping**
- **Cryptomus**: `order_id` = `payment.id` (for tracking)
- **Iyzico**: `conversationId` = `payment.id` (for tracking)

### **Payment ID Mapping**
- **Cryptomus**: `uuid` = `payment.providerPaymentId`
- **Iyzico**: `paymentId` = `payment.providerPaymentId`

## 🎯 **Key Features**

### **✅ Unified Architecture**
- Both providers use identical API route patterns
- Consistent payment record creation
- Unified webhook/callback handling
- Same delivery processing logic

### **✅ Error Handling**
- Comprehensive error logging
- Payment status tracking
- Failed payment recovery
- Stock validation before completion

### **✅ Security**
- Webhook signature validation
- Authentication checks
- Rate limiting
- Input sanitization

### **✅ Delivery Integration**
- Automatic delivery for digital products
- Manual delivery ticket creation
- Stock management
- Subscription creation

## 🔧 **Configuration**

### **Environment Variables**
```env
# Cryptomus
CRYPTOMUS_MERCHANT_ID="your-merchant-id"
CRYPTOMUS_PAYMENT_API_KEY="your-payment-api-key"
CRYPTOMUS_SECRET="your-secret"

# Iyzico
IYZICO_API_KEY="your-api-key"
IYZICO_SECRET_KEY="your-secret-key"
IYZICO_BASE_URL="https://sandbox-api.iyzipay.com"  # or production
```

## 🧪 **Testing**

### **Test Cryptomus Flow**
```bash
curl -X POST http://localhost:3000/api/payment/cryptomus/create \
  -H "Content-Type: application/json" \
  -d '{
    "orderId": "order-id",
    "amount": 10.00,
    "currency": "USD"
  }'
```

### **Test Iyzico Flow**
```bash
curl -X POST http://localhost:3000/api/payment/iyzico/create \
  -H "Content-Type: application/json" \
  -d '{
    "orderId": "order-id",
    "amount": 10.00,
    "currency": "USD",
    "buyer": { ... },
    "billingAddress": { ... },
    "basketItems": [ ... ]
  }'
```

## 🚨 **Error Resolution**

### **Common Issues**

1. **"Payment record not found"**
   - Check conversation ID mapping
   - Verify payment was created before callback
   - Check webhook/callback URL configuration

2. **"Internal server error during callback processing"**
   - Check database connection
   - Verify environment variables
   - Check provider credentials

3. **"Stock validation failed"**
   - Check available stock items
   - Verify automatic delivery configuration
   - Review stock allocation logic

## 📈 **Monitoring**

### **Key Metrics to Monitor**
- Payment success/failure rates
- Callback processing times
- Stock allocation errors
- Delivery processing status

### **Logging Points**
- Payment creation: `payment.create`
- Provider responses: `provider.response`
- Callback processing: `callback.process`
- Delivery status: `delivery.status`

## 🔄 **Migration Notes**

### **From Old Architecture**
- Removed TRPC `createPayment` mutation
- Unified frontend payment handling
- Consistent provider tracking
- Improved error handling

### **Breaking Changes**
- Frontend must use direct API routes
- Payment creation flow changed
- Webhook/callback processing updated

## 📚 **API Reference**

### **POST /api/payment/cryptomus/create**
```typescript
Request: {
  orderId: string;
  amount: number;
  currency: string;
  returnUrl?: string;
  callbackUrl?: string;
}

Response: {
  success: boolean;
  paymentId?: string;
  paymentUrl?: string;
  providerPaymentId?: string;
  error?: string;
}
```

### **POST /api/payment/iyzico/create**
```typescript
Request: {
  orderId: string;
  amount: number;
  currency: string;
  buyer: IyzicoBuyer;
  billingAddress: IyzicoBillingAddress;
  basketItems: IyzicoBasketItem[];
}

Response: {
  success: boolean;
  paymentId?: string;
  paymentUrl?: string;
  token?: string;
  error?: string;
}
```

---

## ✅ **Architecture Benefits**

1. **Consistency**: Both providers follow identical patterns
2. **Maintainability**: Clear separation of concerns
3. **Scalability**: Easy to add new payment providers
4. **Reliability**: Comprehensive error handling and logging
5. **Security**: Unified validation and authentication
6. **Testability**: Clear interfaces and mocking points

This architecture provides a solid foundation for payment processing that can easily accommodate future payment providers and business requirements. 