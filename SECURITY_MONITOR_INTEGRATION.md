# Security Monitor Integration Guide

This guide shows you how to use the Security Monitor system throughout your EaseSubs application to track security events, analyze threats, and monitor your system's security in real-time.

## 🔍 Overview

The Security Monitor provides:
- **Real-time threat detection** - Analyzes incoming requests and user behavior
- **Automated response** - Blocks suspicious IPs and prevents attacks
- **Security dashboard** - Visual monitoring and management interface
- **Comprehensive logging** - Secure audit trails with data sanitization
- **Attack pattern recognition** - Detects brute force, injection attempts, and more

## 📊 Security Dashboard

### Accessing the Dashboard

The Security Dashboard is available at `/dashboard/admin-security` for admin users only.

**Features:**
- **Security Statistics** - Total events, blocked IPs, threat severity distribution
- **Real-time Events** - Live feed of security events with risk scores
- **IP Management** - View and manage blocked IP addresses
- **Time Range Filtering** - View data for different time periods (1h, 24h, 7d, 30d)
- **Threat Analysis** - Top threats and attack patterns

### Dashboard Navigation

The Security Dashboard is automatically added to the admin navigation menu with a shield icon.

## 🔧 Integration Points

### 1. Authentication & Login Forms

**Location**: `src/server/api/routers/auth.ts`

The security monitor is already integrated into:
- **Login attempts** - Tracks failed logins and brute force attempts
- **Account lockouts** - Automatically blocks IPs after repeated failures
- **Suspicious behavior** - Detects unusual login patterns

**Example of current integration:**
```typescript
// Failed login attempt
securityMonitor.analyzeEvent({
  type: "BRUTE_FORCE_ATTEMPT",
  severity: "HIGH",
  source: "Login Form",
  ip: clientIP,
  userAgent: userAgent,
  details: { email, attemptNumber: lockoutData.attempts }
});
```

### 2. API Endpoints

**Usage in any API route:**
```typescript
import { securityMonitor } from "@/lib/security-monitor";

export async function POST(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for") || "unknown";
  const userAgent = request.headers.get("user-agent") || "";
  
  // Log security-sensitive operations
  securityMonitor.analyzeEvent({
    type: "ADMIN_ACTION",
    severity: "MEDIUM",
    source: "Admin API",
    ip,
    userAgent,
    details: { action: "user_modification", targetUserId: userId }
  });
}
```

### 3. Middleware Integration

**Location**: `src/lib/middleware-security.ts`

The middleware security integration automatically:
- **Analyzes all requests** - Scans for suspicious patterns
- **Detects threats** - SQL injection, XSS, path traversal attempts  
- **Calculates risk scores** - Assigns risk levels to requests
- **Blocks malicious traffic** - Prevents attacks in real-time

**To use in middleware** (`middleware.ts`):
```typescript
import { middlewareSecurity } from "@/lib/middleware-security";

export async function middleware(request: NextRequest) {
  // Analyze request for security threats
  const analysis = await middlewareSecurity.analyzeRequest(request);
  
  // Block high-risk requests
  if (analysis.riskScore > 80 || analysis.isBlocked) {
    return middlewareSecurity.handleBlockedRequest(analysis);
  }
  
  // Continue with normal processing
  return NextResponse.next();
}
```

### 4. Payment Processing

**Integration for payment security:**
```typescript
// Before processing payment
securityMonitor.analyzeEvent({
  type: "SUSPICIOUS_LOGIN",
  severity: "HIGH", 
  source: "Payment Processing",
  ip: clientIP,
  userId: user.id,
  details: { 
    amount: paymentData.amount,
    currency: paymentData.currency,
    riskIndicators: ["new_payment_method", "high_amount"]
  }
});
```

### 5. Admin Actions

**Track administrative actions:**
```typescript
// User management actions
securityMonitor.analyzeEvent({
  type: "ADMIN_ACTION",
  severity: "MEDIUM",
  source: "Admin Dashboard",
  userId: admin.id,
  ip: clientIP,
  details: {
    action: "user_role_change",
    targetUser: targetUserId,
    oldRole: "USER",
    newRole: "ADMIN"
  }
});
```

### 6. Support System

**Monitor support interactions:**
```typescript
// Suspicious support requests
securityMonitor.analyzeEvent({
  type: "SUSPICIOUS_LOGIN",
  severity: "LOW",
  source: "Support System",
  userId: user.id,
  ip: clientIP,
  details: {
    ticketType: "password_reset",
    multipleRequests: true
  }
});
```

## 🚨 Event Types & Severity Levels

### Event Types
- `BRUTE_FORCE_ATTEMPT` - Multiple failed login attempts
- `SUSPICIOUS_LOGIN` - Unusual login behavior
- `PRIVILEGE_ESCALATION` - Unauthorized access attempts
- `DATA_EXFILTRATION` - Unusual data access patterns
- `INJECTION_ATTEMPT` - SQL injection, XSS attempts
- `MALICIOUS_PAYLOAD` - Detected malicious content
- `RATE_LIMIT_EXCEEDED` - Too many requests
- `UNAUTHORIZED_ACCESS` - Access to restricted resources
- `SUSPICIOUS_FILE_ACCESS` - Unusual file operations
- `ABNORMAL_TRAFFIC` - Traffic pattern anomalies
- `POTENTIAL_BOT` - Automated/bot behavior
- `ADMIN_ACTION` - Administrative operations

### Severity Levels
- `LOW` - Monitoring/informational events
- `MEDIUM` - Suspicious but not immediately dangerous
- `HIGH` - Probable security threat requiring attention
- `CRITICAL` - Active attack or severe security breach

## 🔄 Real-time Monitoring

### Automatic Response Actions

The security monitor automatically:

1. **IP Blocking** - Blocks IPs with high risk scores
2. **Rate Limiting** - Applies progressive restrictions
3. **Alert Generation** - Sends notifications for critical events
4. **Logging** - Records all events with sanitized data

### Manual Actions

Admins can:
- **Block/Unblock IPs** manually through the dashboard
- **View detailed event logs** with filtering and search
- **Generate security reports** in JSON or CSV format
- **Monitor real-time threats** with live updates

## 📈 Security Analytics

### Available Metrics

- **Total Security Events** - Count of all events in time period
- **Severity Distribution** - Breakdown by threat level
- **Top Threats** - Most common attack types
- **Blocked IPs** - Currently blocked addresses
- **Risk Trends** - Security posture over time

### Time Range Analysis

All metrics support multiple time ranges:
- **1 hour** - Real-time monitoring
- **24 hours** - Daily security summary
- **7 days** - Weekly security trends
- **30 days** - Monthly security overview

## 🔧 Custom Integration Examples

### Custom Event Tracking

```typescript
// Track custom business logic events
securityMonitor.analyzeEvent({
  type: "SUSPICIOUS_LOGIN",
  severity: "MEDIUM",
  source: "Custom Feature",
  userId: user.id,
  ip: clientIP,
  details: {
    feature: "bulk_download",
    fileCount: 100,
    reason: "suspicious_volume"
  }
});
```

### Webhook Security

```typescript
// Monitor webhook endpoints
securityMonitor.analyzeEvent({
  type: "MALICIOUS_PAYLOAD",
  severity: "HIGH",
  source: "Webhook Endpoint",
  ip: clientIP,
  details: {
    webhook: "payment_notification",
    invalidSignature: true,
    payload: sanitizedPayload
  }
});
```

### File Upload Security

```typescript
// Monitor file uploads
securityMonitor.analyzeEvent({
  type: "SUSPICIOUS_FILE_ACCESS",
  severity: "MEDIUM", 
  source: "File Upload",
  userId: user.id,
  ip: clientIP,
  details: {
    fileName: "suspicious.exe",
    fileType: "executable",
    size: fileSizeInBytes
  }
});
```

## 🔒 Best Practices

### 1. Event Classification

- Use appropriate **severity levels** based on actual threat level
- Include **relevant context** in the details object
- Use consistent **source naming** for easier filtering

### 2. Performance Considerations

- The security monitor is **lightweight** and non-blocking
- Events are processed **asynchronously** 
- Memory usage is **automatically managed** with cleanup intervals

### 3. Privacy & Compliance

- **No sensitive data** is logged directly (passwords, credit cards, etc.)
- **IP addresses are masked** in logs for privacy
- **Data sanitization** is applied automatically
- **Retention policies** automatically clean old data

### 4. Monitoring & Alerting

- Check the **Security Dashboard** regularly
- Set up **automated monitoring** for critical events
- Review **blocked IPs** periodically to prevent false positives
- Use **time-based analysis** to identify attack patterns

## 📊 Security Dashboard Features

### Real-time Updates
- Events update every 30 seconds automatically
- Manual refresh option available
- Live event stream with severity highlighting

### IP Management
- View all blocked IPs with block reasons
- Unblock IPs with one-click action
- See block timestamps and auto-expiry times

### Event Analysis  
- Color-coded severity indicators
- Risk score calculation and display
- Source and timestamp information
- Threat type categorization

### Export & Reporting
- Generate security reports in multiple formats
- Export event data for external analysis
- Historical trend analysis

## 🚀 Getting Started

1. **Access the Dashboard**: Navigate to `/dashboard/admin-security` as an admin
2. **Review Current Events**: Check recent security events and their severity
3. **Monitor Blocked IPs**: Review any blocked addresses and reasons
4. **Set Up Monitoring**: Implement custom event tracking in your features
5. **Regular Reviews**: Check the dashboard regularly for security insights

The Security Monitor is now fully integrated and ready to protect your EaseSubs application! 🛡️ 