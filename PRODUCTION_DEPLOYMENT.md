# Production Deployment Guide - EaseSubs Security

This guide covers the deployment of the EaseSubs application with enterprise-grade security features.

## 🔒 Security Features Overview

### Database-Backed Security Monitoring
- **Real-time threat detection** stored in PostgreSQL
- **Persistent security event logging** with 30-day retention
- **IP blocking system** with automatic threat scoring
- **Security analytics dashboard** with live updates

### Enhanced Security Systems
- **Advanced rate limiting** with multiple endpoint types
- **Input sanitization** across all forms and APIs
- **Password security** with 12+ character requirements
- **Session management** with 24-hour expiry
- **Content Security Policy** with strict production settings

## 📋 Pre-Deployment Checklist

### 1. Database Setup
```bash
# Ensure PostgreSQL is running and accessible
# Run database migrations
npx prisma db push
npx prisma generate
```

### 2. Environment Variables
```bash
# Critical security variables (must be changed from defaults)
DATABASE_URL="postgresql://user:password@host:port/database"
NEXTAUTH_SECRET="your-secure-random-secret-here"
CRYPTOMUS_API_KEY="your-production-api-key"
CRYPTOMUS_MERCHANT_ID="your-merchant-id"

# Security configuration
NODE_ENV="production"
NEXTAUTH_URL="https://yourdomain.com"
```

### 3. Security Tables Verification
```sql
-- Verify security tables exist
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('security_events', 'blocked_ips');
```

## 🚀 Deployment Steps

### 1. Build Application
```bash
npm run build
```

### 2. Start Production Server
```bash
npm start
```

### 3. Run Security Migration (Optional)
```bash
# Run the security migration script to verify setup
npx tsx scripts/security-migration.ts
```

## 🛡️ Security Features in Production

### Real-time Security Monitoring
- All security events are stored in the `security_events` table
- Automatic threat detection and IP scoring
- Real-time dashboard updates every 30 seconds
- Email notifications for critical security events (if configured)

### IP Blocking System
- Automatic blocking based on threat scores (threshold: 75+)
- Manual IP blocking through admin dashboard
- Temporary blocks with configurable duration
- Persistent storage in `blocked_ips` table

### Data Retention Policies
- **Security Events**: 30 days (automatic cleanup)
- **Blocked IPs**: 90 days for inactive blocks
- **Audit Logs**: 365 days (if enabled)
- **Session Data**: 7 days

## 📊 Security Dashboard Access

### Admin Access
1. Login with admin credentials
2. Navigate to `/dashboard/admin-security`
3. View real-time security metrics:
   - Total security events
   - Last 24-hour activity
   - Severity distribution
   - Top threats
   - Blocked IP management

### Key Metrics
- **Security Events**: Real-time count and severity breakdown
- **Blocked IPs**: Active blocks with reasons and scores
- **Threat Analysis**: Top attack types and sources
- **System Health**: Database connectivity and performance

## 🔧 Maintenance Tasks

### Daily Tasks
```bash
# Check security status
curl -H "Authorization: Bearer <admin-token>" \
     https://yourdomain.com/api/admin/security/status

# Review blocked IPs
# (Done through admin dashboard)
```

### Weekly Tasks
```bash
# Run security cleanup (automatic, but can be triggered manually)
npx tsx scripts/security-migration.ts
```

### Monthly Tasks
- Review security analytics and trends
- Update threat detection rules if needed
- Verify backup and recovery procedures
- Update security documentation

## 🚨 Security Incident Response

### Automatic Responses
1. **High-Risk Events**: Automatically logged and scored
2. **IP Blocking**: Automatic blocks for score ≥ 75
3. **Rate Limiting**: Immediate throttling for suspicious activity
4. **Admin Alerts**: Dashboard notifications for critical events

### Manual Responses
1. **Review Security Dashboard**: Check for unusual patterns
2. **Investigate High-Risk Events**: Examine details and sources
3. **Manual IP Blocking**: Block specific IPs through admin interface
4. **Update Security Rules**: Modify detection patterns if needed

## 📈 Performance Considerations

### Database Optimization
- Security event table is indexed on `timestamp`, `severity`, `type`, and `ip`
- Blocked IP table is indexed on `ip`, `isActive`, and `expiresAt`
- Automatic cleanup prevents table growth beyond retention limits

### Caching Strategy
- Blocked IP checks use 5-minute in-memory cache
- Security statistics cached for 30 seconds
- Dashboard data refreshes every 30 seconds

### Scaling Considerations
- Database-backed storage allows horizontal scaling
- Security monitor can be distributed across multiple instances
- Consider read replicas for high-traffic security dashboards

## 🔍 Monitoring and Alerting

### Built-in Monitoring
- Real-time security event tracking
- IP blocking effectiveness metrics
- System performance indicators
- Database connectivity status

### External Monitoring (Recommended)
- Set up external monitoring for `/api/health` endpoint
- Monitor database performance and storage
- Set up alerts for critical security threshold breaches
- Log aggregation for security event analysis

## 🆘 Troubleshooting

### Common Issues

#### Security Dashboard Shows No Data
1. Check database connectivity
2. Verify security tables exist
3. Run migration script: `npx tsx scripts/security-migration.ts`
4. Check admin user permissions

#### IP Blocking Not Working
1. Verify `blocked_ips` table has records
2. Check middleware configuration
3. Clear IP cache: restart application
4. Review rate limiting configuration

#### High Memory Usage
1. Check security event retention (should be 30 days max)
2. Run cleanup: `securityMonitorDB.cleanupOldEvents()`
3. Monitor blocked IP cache size
4. Consider database connection pooling

### Debug Commands
```bash
# Check security event count
npx prisma studio # Navigate to security_events table

# Test security monitor
node -e "
import('./src/lib/security-monitor-db.js').then(m => 
  m.securityMonitorDB.getSecurityStats().then(console.log)
)"

# Verify database schema
npx prisma db pull
```

## 📚 Additional Resources

- [Security Configuration](./src/lib/security-config.ts) - Centralized security settings
- [Security Monitor](./src/lib/security-monitor-db.ts) - Database-backed monitoring
- [Admin Dashboard](./src/app/dashboard/admin-security/page.tsx) - Security management interface
- [Prisma Schema](./prisma/schema.prisma) - Database security tables

## 🔐 Security Best Practices

1. **Regular Updates**: Keep dependencies and security systems updated
2. **Access Control**: Limit admin dashboard access to trusted personnel
3. **Backup Strategy**: Regular backups of security data and configurations
4. **Incident Documentation**: Document all security incidents and responses
5. **Periodic Reviews**: Regular security audits and penetration testing

---

**Note**: This security system is production-ready and provides enterprise-grade protection. Regular monitoring and maintenance ensure optimal security posture. 