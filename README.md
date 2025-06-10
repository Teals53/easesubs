# EaseSubs - Subscription Management Platform

A modern, secure subscription management platform built with Next.js 15, TypeScript, and PostgreSQL. Features multiple payment providers including cryptocurrency and credit card payments.

## 🚀 Features

### Payment Methods

- **Cryptomus** - Cryptocurrency payments (Bitcoin, Ethereum, USDT, etc.)
- **Weepay** - Credit card payments with 3D verification and secure redirect flow
- **Admin Bypass** - Testing mode for administrators

### Core Features

- User authentication with NextAuth.js v5
- Role-based access control (User, Admin, Support Agent, Manager)
- Product catalog with subscription plans
- Shopping cart functionality
- Order management system
- Automatic digital product delivery
- Support ticket system
- Comprehensive admin dashboard
- Security monitoring and rate limiting
- Email notifications

## 🛠 Tech Stack

- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: NextAuth.js v5
- **Styling**: Tailwind CSS
- **State Management**: Zustand
- **API**: tRPC for type-safe APIs
- **UI Components**: Framer Motion, Lucide Icons
- **Payment Processing**: Cryptomus, Weepay
- **Email**: SMTP integration

## 🔧 Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/your-repo/easesubs.git
   cd easesubs
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Set up environment variables**

   ```bash
   cp .env.example .env
   ```

   Configure the following variables:

   **Database**

   ```env
   DATABASE_URL="postgresql://username:password@host:5432/database"
   DIRECT_URL="postgresql://username:password@host:5432/database"
   ```

   **Authentication**

   ```env
   AUTH_SECRET="your-32-character-secret"
   NEXTAUTH_URL="http://localhost:3000"
   ```

   **Payment Providers**

   ```env
   # Cryptomus (Cryptocurrency)
   CRYPTOMUS_MERCHANT_ID="your-merchant-uuid"
   CRYPTOMUS_PAYMENT_API_KEY="your-payment-api-key"
   CRYPTOMUS_SECRET="your-secret"

   # Weepay (Credit Cards)
   WEEPAY_MERCHANT_ID="your-weepay-merchant-id"
   WEEPAY_API_KEY="your-weepay-api-key"
   WEEPAY_SECRET_KEY="your-weepay-secret-key"
   WEEPAY_IS_SANDBOX="true"
   ```

4. **Set up the database**

   ```bash
   npx prisma generate
   npx prisma db push
   ```

5. **Run the development server**
   ```bash
   npm run dev
   ```

## 💳 Payment Integration

### Weepay Credit Card Payments

The platform integrates with Weepay for secure credit card processing:

- **Secure Redirect Flow**: Users are redirected to Weepay's secure payment page
- **3D Secure Support**: Automatic 3D verification for enhanced security
- **Webhook Processing**: Real-time payment status updates
- **Signature Verification**: MD5-based webhook signature validation
- **Sandbox Support**: Test mode for development

#### Payment Flow

1. User selects Weepay payment method at checkout
2. Order is created with `PENDING` status
3. User is redirected to Weepay's secure payment page
4. After payment, user returns to order confirmation page
5. Weepay sends webhook notification for payment status
6. Order status is updated automatically
7. Digital products are delivered instantly

### Cryptomus Cryptocurrency Payments

Support for major cryptocurrencies:

- Bitcoin (BTC)
- Ethereum (ETH)
- USDT (Tether)
- And many more supported by Cryptomus

## 🏗 Architecture

### API Routes

**Payment Creation**

- `/api/payment/cryptomus/create` - Create cryptocurrency payment
- `/api/payment/weepay/create` - Create credit card payment

**Webhooks**

- `/api/webhooks/cryptomus` - Process crypto payment callbacks
- `/api/webhooks/weepay` - Process credit card payment callbacks

**tRPC Routers**

- `/api/trpc/[trpc]` - Type-safe API endpoints

### Database Schema

The platform uses a normalized PostgreSQL schema with the following key models:

- **Users** - Authentication and profile data
- **Products** - Service catalog
- **ProductPlans** - Subscription plans with pricing
- **Orders** - Purchase records
- **Payments** - Payment transactions
- **StockItems** - Digital product inventory

### Security Features

- Rate limiting on API endpoints
- Webhook signature verification
- CSRF protection
- Secure session management
- Input validation and sanitization
- SQL injection prevention with Prisma

## 🚀 Deployment

### Environment Setup

1. Set up PostgreSQL database
2. Configure environment variables for production
3. Set up payment provider accounts (Cryptomus, Weepay)
4. Configure email SMTP settings

### Build and Deploy

```bash
npm run build
npm start
```

### Docker Deployment (Optional)

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

## 📚 Documentation

- [Payment Architecture](./PAYMENT_ARCHITECTURE.md) - Detailed payment flow documentation
- [Security Guide](./SECURITY_TESTING_GUIDE.md) - Security implementation details
- [Production Deployment](./PRODUCTION_DEPLOYMENT.md) - Production setup guide

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:

- Create an issue in the GitHub repository
- Contact the development team
- Check the documentation files

---

Built with ❤️ using modern web technologies
