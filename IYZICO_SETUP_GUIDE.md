# iyzico Payment Integration Setup Guide

## Overview
This guide will help you set up iyzico credit card payment processing using their **hosted checkout form** in your EaseSubs application. Users will be redirected to iyzico's secure payment page to complete their transactions.

## 1. Get Your iyzico Credentials

### For Testing (Sandbox)
1. **Sign up for iyzico**: Go to [https://sandbox-merchant.iyzipay.com](https://sandbox-merchant.iyzipay.com)
2. **Create a sandbox account** and verify your email
3. **Get your credentials**:
   - Login to your sandbox merchant panel
   - Go to **Settings** → **API Credentials**
   - Copy your **API Key** and **Secret Key**

### For Production (Live)
1. **Sign up for iyzico**: Go to [https://merchant.iyzipay.com](https://merchant.iyzipay.com)
2. **Complete KYC verification** (required for live payments)
3. **Get your credentials** from **Settings** → **API Credentials**

## 2. Configure Environment Variables

### Update your `.env` file:

```bash
# iyzico Configuration
IYZICO_API_KEY="sandbox-VJ02GWR0rZmUHNbvJNOcPBRKfjFSwtBO"  # Your actual API key
IYZICO_SECRET_KEY="sandbox-6TpWKrMYTmWVtMEBT59Wo1xB7UsHyTv8"  # Your actual secret key
IYZICO_BASE_URL="https://sandbox-api.iyzipay.com"  # Use https://api.iyzipay.com for production
```

**✅ Your credentials are already configured!**

## 3. How the NEW Payment Flow Works

### 🔄 **Correct Implementation (Hosted Checkout)**
1. **User selects "Credit Card"** → Order created in database
2. **Clicks payment button** → API creates iyzico checkout session
3. **User redirected to iyzico's secure page** → Completes payment on iyzico
4. **iyzico processes payment** → Returns user to your success/failure page
5. **Order status updated** based on payment result

### ❌ **Previous Implementation (Fixed)**
- ~~Collected card details directly~~ → Security risk
- ~~Processed payments server-side~~ → Complex PCI compliance

### ✅ **New Implementation Benefits**
- **PCI Compliant**: No card data touches your servers
- **3D Secure**: Built-in fraud protection
- **Mobile Optimized**: Works on all devices
- **Turkish Banking**: Supports all Turkish banks
- **Installments**: Automatic installment options

## 4. Payment Flow Details

### Step 1: Checkout Initiation
```javascript
// User clicks "Pay with Credit Card"
// → Creates checkout session with iyzico
// → Returns payment URL
```

### Step 2: Redirect to iyzico
```javascript
// User redirected to: https://sandbox-api.iyzipay.com/payment/...
// → Secure iyzico payment page
// → User enters card details on iyzico
```

### Step 3: Payment Processing
```javascript
// iyzico processes payment
// → 3D Secure authentication
// → Bank authorization
// → Payment completion
```

### Step 4: Return to Your Site
```javascript
// User redirected back with payment result
// → Success: Order completed
// → Failure: Error message shown
```

## 5. Integration Status

### ✅ Completed Features:
- **Hosted checkout integration** (NEW)
- **Secure payment redirect** (NEW)  
- **Payment session creation**
- **Error handling and validation**
- **Order integration**
- **Turkish market compliance**
- **Mobile responsive design**

### 🔧 API Endpoints:
- `POST /api/payment/iyzico/create` - Creates payment session
- `POST /api/payment/iyzico/callback` - Handles payment results
- **No sensitive data** collected or stored

### 📊 Database Integration:
- `IYZICO` payment method in schema
- Order tracking and status updates
- **No card data stored** (PCI compliant)

## 6. Testing Your Integration

### 1. **Start Development Server**:
```bash
npm run dev
```

### 2. **Test Payment Flow**:
1. Add items to cart and proceed to checkout
2. Select "Credit Card" payment method  
3. Click "Complete Order" to create order
4. Click "Pay USD XX.XX" button
5. **You will be redirected to iyzico's payment page**
6. Use test cards on iyzico's page:
   - **Success**: `5528790000000008` (Expiry: 12/25, CVC: 123)
   - **Failure**: `4111111111111129` (Insufficient funds)

### 3. **What You'll See**:
- ✅ **Payment summary** with amount and order details
- ✅ **Security features** highlighted  
- ✅ **"Pay" button** that redirects to iyzico
- ✅ **iyzico's secure payment form** (hosted)
- ✅ **Return to your site** after payment

## 7. Security Features

- ✅ **PCI DSS Compliance**: iyzico handles all card data
- ✅ **SSL Encryption**: All communications encrypted  
- ✅ **3D Secure**: Built-in authentication
- ✅ **Fraud Detection**: iyzico's advanced algorithms
- ✅ **No Card Storage**: Zero card data on your servers
- ✅ **IP Tracking**: For additional security

## 8. Production Checklist

Before going live:

- [ ] Replace sandbox credentials with live credentials
- [ ] Update `IYZICO_BASE_URL` to `https://api.iyzipay.com`
- [ ] Complete iyzico merchant verification
- [ ] Test with real (small amount) transactions
- [ ] Configure success/failure return URLs
- [ ] Set up proper error monitoring
- [ ] Verify SSL certificates on your domain

## 9. Environment Setup

### For Development/Testing:
```bash
IYZICO_API_KEY="sandbox-your-api-key"
IYZICO_SECRET_KEY="sandbox-your-secret-key"  
IYZICO_BASE_URL="https://sandbox-api.iyzipay.com"
```

### For Production:
```bash
IYZICO_API_KEY="your-live-api-key"
IYZICO_SECRET_KEY="your-live-secret-key"
IYZICO_BASE_URL="https://api.iyzipay.com"
```

## 10. Troubleshooting

### Common Issues:

**"Payment credentials not configured"**
- ✅ **Fixed**: Your credentials are already in `.env`
- Restart server after credential changes

**"Failed to create payment session"**  
- Check server logs for detailed error messages
- Verify your iyzico credentials are correct
- Ensure sandbox/production URLs match your credentials

**"Redirect not working"**
- Check browser console for JavaScript errors
- Verify order creation was successful first
- Ensure popup blockers are disabled

**"Module resolution errors"**
- ✅ **Fixed**: Turbopack configuration handles iyzico package
- Dynamic imports prevent build issues

## 11. Support & Documentation

- **iyzico API Docs**: [https://dev.iyzipay.com](https://dev.iyzipay.com)
- **iyzico Support**: [https://www.iyzico.com/destek](https://www.iyzico.com/destek)
- **Merchant Panel**: [https://sandbox-merchant.iyzipay.com](https://sandbox-merchant.iyzipay.com)
- **Test Cards**: Available in iyzico documentation

## 12. Files Modified

The corrected integration includes:
- `src/lib/payment-providers.ts` - **Checkout form API integration**
- `src/components/payment/iyzico-payment-form.tsx` - **Redirect UI component**
- `src/app/api/payment/iyzico/create/route.ts` - **Session creation endpoint**
- `src/app/api/payment/iyzico/callback/route.ts` - **Payment result handler** (NEW)
- `src/lib/iyzico-wrapper.ts` - **Dynamic import wrapper**
- `next.config.ts` - **Turbopack configuration**
- `.env` - **Environment variables** ✅ CONFIGURED

## 🎉 **Ready to Test!**

Your iyzico integration is now properly configured for **hosted checkout**:

1. **Secure**: Uses iyzico's PCI-compliant payment page
2. **Simple**: Just redirects users to complete payment  
3. **Compliant**: No sensitive data on your servers
4. **Mobile-Ready**: Works on all devices

**Test it now by adding items to cart and selecting "Credit Card" payment!** 🚀 