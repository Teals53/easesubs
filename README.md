# EaseSubs - Subscription Management Platform

A modern, secure e-commerce platform for subscription services built with Next.js 15, TypeScript, and AWS infrastructure.

## 🚀 Features

- **Modern Tech Stack**: Next.js 15, React 19, TypeScript, Tailwind CSS
- **Authentication**: NextAuth.js v5 with Google OAuth and credentials
- **Database**: PostgreSQL with Prisma ORM
- **Payment Processing**: Cryptomus and Stripe integration
- **Security**: Rate limiting, webhook validation, security headers
- **Admin Dashboard**: Comprehensive admin panel with analytics
- **Responsive Design**: Mobile-first responsive UI
- **Real-time Updates**: Live dashboard statistics

## 🏗️ Architecture

### Frontend
- **Framework**: Next.js 15 with App Router
- **UI Library**: Tailwind CSS + Radix UI components
- **State Management**: tRPC with React Query
- **Authentication**: NextAuth.js v5
- **Animations**: Framer Motion

### Backend
- **API**: tRPC with TypeScript
- **Database**: PostgreSQL (AWS RDS)
- **ORM**: Prisma
- **Authentication**: JWT sessions
- **File Storage**: AWS S3 (configured)

### Infrastructure
- **Hosting**: AWS EC2
- **Database**: AWS RDS PostgreSQL
- **CDN**: AWS CloudFront (configured)
- **Storage**: AWS S3 (configured)

## 🔧 Installation

### Prerequisites
- Node.js 18+ 
- PostgreSQL database
- AWS account (for production)

### Local Development

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd easesubs
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   ```bash
   cp .env.example .env.local
   ```
   
   Update `.env.local` with your configuration:
   ```env
   # Database
   DATABASE_URL="postgresql://username:password@localhost:5432/easesubs"
   
   # Authentication
   AUTH_SECRET="your-32-char-secret"
   NEXTAUTH_URL="http://localhost:3000"
   
   # Google OAuth
   GOOGLE_CLIENT_ID="your-google-client-id"
   GOOGLE_CLIENT_SECRET="your-google-client-secret"
   
   # Payment Providers
   CRYPTOMUS_API_KEY="your-cryptomus-api-key"
   CRYPTOMUS_SECRET="your-cryptomus-secret"
   ```

4. **Database Setup**
   ```bash
   npx prisma generate
   npx prisma db push
   npx prisma db seed
   ```

5. **Start Development Server**
   ```bash
   npm run dev
   ```

## 🚀 Production Deployment

### AWS EC2 Deployment

1. **Server Setup**
   ```bash
   # Update system
   sudo apt update && sudo apt upgrade -y
   
   # Install Node.js 18+
   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   sudo apt-get install -y nodejs
   
   # Install PM2 for process management
   sudo npm install -g pm2
   ```

2. **Application Deployment**
   ```bash
   # Clone and setup
   git clone <repository-url>
   cd easesubs
   npm ci --production
   
   # Build application
   npm run build
   
   # Start with PM2
   pm2 start npm --name "easesubs" -- start
   pm2 save
   pm2 startup
   ```

3. **Nginx Configuration**
   ```nginx
   server {
       listen 80;
       server_name yourdomain.com;
       
       location / {
           proxy_pass http://localhost:3000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
           proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
           proxy_set_header X-Forwarded-Proto $scheme;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

4. **SSL Certificate**
   ```bash
   sudo apt install certbot python3-certbot-nginx
   sudo certbot --nginx -d yourdomain.com
   ```

### Environment Variables (Production)

```env
# Production Configuration
NODE_ENV=production
NEXT_PUBLIC_DEBUG=false

# Database (AWS RDS)
DATABASE_URL="postgresql://username:password@your-rds-endpoint:5432/easesubs"

# Authentication
AUTH_SECRET="your-production-secret-32-chars-minimum"
NEXTAUTH_URL="https://yourdomain.com"
AUTH_TRUST_HOST=true

# Payment Providers
CRYPTOMUS_API_KEY="your-production-cryptomus-key"
CRYPTOMUS_SECRET="your-production-cryptomus-secret"
CRYPTOMUS_WEBHOOK_SECRET="your-cryptomus-webhook-secret"

# Security
RATE_LIMIT_MAX=100
CORS_ORIGIN="https://yourdomain.com"

# AWS Configuration
AWS_REGION="us-east-1"
AWS_ACCESS_KEY_ID="your-aws-access-key"
AWS_SECRET_ACCESS_KEY="your-aws-secret-key"
AWS_S3_BUCKET="easesubs-assets"
```

## 🔒 Security Features

### Implemented Security Measures

1. **Rate Limiting**
   - API endpoints: 100 requests/15 minutes
   - Auth endpoints: 5 requests/15 minutes
   - Payment endpoints: 10 requests/hour

2. **Security Headers**
   - Content Security Policy (CSP)
   - X-Frame-Options: DENY
   - X-Content-Type-Options: nosniff
   - Strict-Transport-Security (HSTS)

3. **Webhook Security**
   - Signature validation for all payment providers
   - Timestamp validation for replay attack prevention
   - Rate limiting on webhook endpoints

4. **Authentication Security**
   - JWT sessions with secure configuration
   - Password hashing with bcrypt (12 rounds)
   - OAuth integration with Google

5. **Database Security**
   - Parameterized queries (Prisma ORM)
   - Connection pooling
   - Environment-based configuration

### Security Checklist

- [ ] Update all environment variables with production values
- [ ] Enable HTTPS with valid SSL certificate
- [ ] Configure firewall rules (only ports 80, 443, 22)
- [ ] Set up database backups
- [ ] Configure monitoring and alerting
- [ ] Review and test all webhook endpoints
- [ ] Implement log monitoring
- [ ] Set up error tracking (Sentry recommended)

## 📊 Monitoring & Logging

### Production Monitoring

1. **Application Logs**
   - Structured JSON logging in production
   - Error tracking with context
   - Security event logging

2. **Performance Monitoring**
   - Database query performance
   - API response times
   - Payment processing metrics

3. **Security Monitoring**
   - Failed authentication attempts
   - Rate limit violations
   - Webhook validation failures

### Recommended Tools

- **Error Tracking**: Sentry
- **Performance**: New Relic or DataDog
- **Uptime Monitoring**: Pingdom or UptimeRobot
- **Log Management**: CloudWatch or LogRocket

## 🔧 API Documentation

### Authentication Endpoints

- NextAuth.js handles authentication via `/api/auth/[...nextauth]`
- User registration is handled via tRPC `auth.register` mutation

### Payment Webhooks

- `POST /api/webhooks/cryptomus` - Cryptomus payment notifications

### tRPC Routers

- `auth.*` - Authentication, registration, and password reset
- `user.*` - User management and profiles
- `admin.*` - Admin dashboard and analytics
- `order.*` - Order creation and management
- `payment.*` - Payment processing
- `product.*` - Product catalog
- `cart.*` - Shopping cart management
- `ticket.*` - Support ticket system

## 🚨 Important Security Notes

1. **Never commit sensitive data** to version control
2. **Rotate secrets regularly** in production
3. **Monitor webhook endpoints** for suspicious activity
4. **Keep dependencies updated** for security patches
5. **Use HTTPS only** in production
6. **Implement proper backup strategies**

## 📝 License

This project is proprietary software. All rights reserved.

## 🤝 Support

For technical support or deployment assistance, please contact the development team.

---

**⚠️ Security Notice**: This application handles sensitive payment and user data. Ensure all security measures are properly implemented before production deployment.
