# 🔒 Security Event Testing Guide

This guide provides manual testing instructions for all 12 security event types implemented in the EaseSubs security monitoring system.

## 🚀 Quick Start

1. Start your development server: `npm run dev`
2. Open admin security dashboard: `http://localhost:3000/dashboard/admin-security`
3. Keep this dashboard open in a separate tab to monitor events in real-time
4. Use the testing commands below to trigger each event type

---

## 📋 Security Event Types & Testing

### ✅ 1. BRUTE_FORCE_ATTEMPT

**Status:** ✅ Implemented  
**Triggers:** Multiple failed login attempts  
**Severity:** MEDIUM → HIGH → CRITICAL

**Test Commands:**
```bash
# Test 1: Multiple failed login attempts via API
for i in {1..6}; do
  curl -X POST "http://localhost:3000/api/auth/signin" \
    -H "Content-Type: application/json" \
    -d '{"email":"test@example.com","password":"wrongpassword"}' \
    -H "User-Agent: Mozilla/5.0"
  echo "Attempt $i"
  sleep 1
done
```

**Test via UI:**
1. Go to `http://localhost:3000/auth/signin`
2. Try logging in with wrong password 5+ times
3. Account should get locked after 5 attempts

**Expected Results:**
- Events logged with increasing severity
- Account lockout after 5 attempts
- IP blocking for repeated attempts

---

### ✅ 2. SUSPICIOUS_LOGIN

**Status:** ✅ Implemented  
**Triggers:** Unusual login behavior, suspicious user agents  
**Severity:** MEDIUM

**Test Commands:**
```bash
# Test 1: Suspicious user agent
curl "http://localhost:3000/auth/signin" \
  -H "User-Agent: malicious-bot-scanner-v1.0"

# Test 2: Very short user agent
curl "http://localhost:3000/auth/signin" \
  -H "User-Agent: bot"

# Test 3: No user agent
curl "http://localhost:3000/auth/signin"
```

**Expected Results:**
- Events logged for suspicious user agents
- Risk score calculation based on patterns

---

### ✅ 3. PRIVILEGE_ESCALATION

**Status:** ✅ Implemented  
**Triggers:** Unauthorized admin access attempts, role promotions  
**Severity:** HIGH → CRITICAL

**Test Commands:**
```bash
# Test 1: Try accessing admin endpoint without admin role
curl "http://localhost:3000/api/trpc/admin.getDashboardStats" \
  -H "Cookie: your-session-cookie"

# Test 2: Try to access admin dashboard without permission
curl "http://localhost:3000/dashboard/admin-dashboard"
```

**Test via UI:**
1. Login as regular user
2. Try to access `/dashboard/admin-dashboard`
3. Try to access admin API endpoints

**Admin Role Promotion Test:**
1. Login as admin
2. Go to `/dashboard/admin-users`
3. Promote a user to ADMIN role
4. Check security events for PRIVILEGE_ESCALATION

**Expected Results:**
- UNAUTHORIZED_ACCESS events for non-admin users
- PRIVILEGE_ESCALATION events for admin promotions

---

### ✅ 4. DATA_EXFILTRATION

**Status:** ✅ Implemented  
**Triggers:** Bulk data requests, unusual data access patterns  
**Severity:** HIGH

**Test Commands:**
```bash
# Test 1: Request large amount of user data
curl "http://localhost:3000/api/trpc/admin.getUsers" \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"json":{"limit":100,"page":1}}' \
  -H "Cookie: admin-session-cookie"
```

**Test via UI:**
1. Login as admin
2. Go to `/dashboard/admin-users`
3. Set page limit to 100 users
4. Make multiple rapid requests

**Expected Results:**
- DATA_EXFILTRATION events for bulk requests (limit > 50)
- Monitoring of data access patterns

---

### ✅ 5. INJECTION_ATTEMPT

**Status:** ✅ Implemented  
**Triggers:** SQL injection, XSS attempts  
**Severity:** HIGH

**Test Commands:**
```bash
# Test 1: SQL Injection attempts
curl "http://localhost:3000/search?q=' OR 1=1 --"
curl "http://localhost:3000/api/products?search='; DROP TABLE users; --"
curl "http://localhost:3000/?id=1 UNION SELECT * FROM users"

# Test 2: XSS attempts
curl "http://localhost:3000/search?q=<script>alert('xss')</script>"
curl "http://localhost:3000/?name=<iframe src='javascript:alert(1)'></iframe>"
curl "http://localhost:3000/?redirect=javascript:alert(1)"
```

**Expected Results:**
- INJECTION_ATTEMPT events for SQL injection patterns
- INJECTION_ATTEMPT events for XSS patterns
- Automatic IP blocking for repeated attempts

---

### ✅ 6. MALICIOUS_PAYLOAD

**Status:** ✅ Implemented  
**Triggers:** Malicious function calls, dangerous payloads  
**Severity:** CRITICAL

**Test Commands:**
```bash
# Test 1: Malicious function calls
curl -X POST "http://localhost:3000/api/contact" \
  -H "Content-Type: application/json" \
  -d '{"message":"eval(malicious_code)"}' 

curl "http://localhost:3000/upload?file=exec('rm -rf /')"
curl "http://localhost:3000/?cmd=system('cat /etc/passwd')"
```

**Expected Results:**
- MALICIOUS_PAYLOAD events for dangerous function calls
- Critical severity alerts
- Immediate IP blocking

---

### ✅ 7. RATE_LIMIT_EXCEEDED

**Status:** ✅ Implemented  
**Triggers:** Too many requests in short time  
**Severity:** HIGH

**Test Commands:**
```bash
# Test 1: Rapid requests to same endpoint
for i in {1..150}; do
  curl "http://localhost:3000/api/auth/signin" \
    -X POST \
    -H "Content-Type: application/json" \
    -d '{"email":"test@test.com","password":"test"}' &
done
wait

# Test 2: API endpoint flooding
for i in {1..200}; do
  curl "http://localhost:3000/api/products" &
done
wait
```

**Expected Results:**
- RATE_LIMIT_EXCEEDED events after 100 requests/minute
- Progressive rate limiting
- Temporary IP blocking

---

### ✅ 8. UNAUTHORIZED_ACCESS

**Status:** ✅ Implemented  
**Triggers:** Access to protected resources without auth  
**Severity:** MEDIUM → HIGH

**Test Commands:**
```bash
# Test 1: Access protected API without auth
curl "http://localhost:3000/api/trpc/user.getProfile"
curl "http://localhost:3000/api/trpc/admin.getDashboardStats"

# Test 2: CSRF attempts
curl -X POST "http://localhost:3000/api/auth/signin" \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"test"}' \
  # (without proper referer header)
```

**Test via UI:**
1. Open incognito browser
2. Try to access `/dashboard`
3. Try to access `/dashboard/admin-dashboard`

**Expected Results:**
- UNAUTHORIZED_ACCESS events for unauthenticated requests
- Higher severity for admin endpoint access

---

### ✅ 9. SUSPICIOUS_FILE_ACCESS

**Status:** ✅ Implemented  
**Triggers:** Path traversal attempts  
**Severity:** HIGH

**Test Commands:**
```bash
# Test 1: Path traversal attempts
curl "http://localhost:3000/api/files?path=../../../etc/passwd"
curl "http://localhost:3000/uploads/../../config/database.yml"
curl "http://localhost:3000/static/..%2F..%2F..%2Fetc%2Fpasswd"
curl "http://localhost:3000/download?file=....//....//etc//passwd"
```

**Expected Results:**
- SUSPICIOUS_FILE_ACCESS events for path traversal
- Automatic blocking of malicious requests

---

### ✅ 10. ABNORMAL_TRAFFIC

**Status:** ✅ Implemented  
**Triggers:** High volume requests from single IP  
**Severity:** HIGH

**Test Commands:**
```bash
# Test 1: Generate high volume traffic
for endpoint in "/" "/products" "/auth/signin" "/dashboard" "/api/products"; do
  for i in {1..200}; do
    curl "http://localhost:3000$endpoint" &
  done
done
wait
```

**Expected Results:**
- ABNORMAL_TRAFFIC events when >500 requests from single IP
- Traffic pattern analysis
- Automatic IP monitoring

---

### ✅ 11. POTENTIAL_BOT

**Status:** ✅ Implemented  
**Triggers:** Bot-like user agents, automated behavior  
**Severity:** MEDIUM

**Test Commands:**
```bash
# Test 1: Bot user agents
curl "http://localhost:3000/" -H "User-Agent: curl/7.68.0"
curl "http://localhost:3000/" -H "User-Agent: python-requests/2.25.1"
curl "http://localhost:3000/" -H "User-Agent: wget/1.20.3"
curl "http://localhost:3000/" -H "User-Agent: bot-scanner-v1.0"
curl "http://localhost:3000/" -H "User-Agent: automated-crawler"
curl "http://localhost:3000/" -H "User-Agent: headless-chrome"
```

**Expected Results:**
- POTENTIAL_BOT events for bot-like user agents
- Pattern recognition for automated behavior

---

### ✅ 12. ADMIN_ACTION

**Status:** ✅ Implemented  
**Triggers:** Administrative operations  
**Severity:** LOW → CRITICAL

**Test via UI (requires admin login):**
1. Login as admin
2. Go to `/dashboard/admin-users`
3. Perform these actions:
   - Update user role (MEDIUM severity)
   - Deactivate user (HIGH severity)
   - Delete user (CRITICAL severity)
   - Access user data (LOW severity)

**Expected Results:**
- ADMIN_ACTION events for all administrative operations
- Severity based on action criticality
- Detailed audit trail with admin and target user info

---

## 🔍 Monitoring Results

### Real-time Monitoring
1. Keep `/dashboard/admin-security` open
2. Events appear in real-time (30-second refresh)
3. Check severity distribution charts
4. Monitor blocked IPs list

### Event Details
Each event includes:
- **Type**: Security event category
- **Severity**: LOW/MEDIUM/HIGH/CRITICAL
- **Source**: Where the event originated
- **IP Address**: Client IP (if available)
- **User Agent**: Browser/client info
- **Details**: Specific event data
- **Timestamp**: When event occurred

### Database Verification
Events are stored in the `SecurityEvent` table:
```sql
SELECT type, severity, source, details, timestamp 
FROM SecurityEvent 
ORDER BY timestamp DESC 
LIMIT 50;
```

---

## 🚨 Expected Behavior

### Automatic Responses
- **IP Blocking**: High-risk IPs automatically blocked
- **Rate Limiting**: Progressive restrictions applied
- **Account Lockout**: Brute force protection
- **Alert Generation**: Critical events trigger alerts

### Severity Escalation
- **LOW**: Informational events
- **MEDIUM**: Suspicious activity requiring monitoring
- **HIGH**: Probable threats requiring attention
- **CRITICAL**: Active attacks requiring immediate response

---

## 🛠️ Troubleshooting

### Events Not Appearing
1. Check if security monitor is properly imported
2. Verify database connection
3. Check console for errors
4. Ensure admin role for dashboard access

### False Positives
- Adjust detection thresholds in `middleware-security.ts`
- Whitelist trusted IPs/user agents
- Fine-tune pattern matching

### Performance Issues
- Monitor database query performance
- Consider Redis for caching
- Implement event batching for high volume

---

## 📊 Success Metrics

After testing, you should see:
- ✅ All 12 event types triggering correctly
- ✅ Appropriate severity levels assigned
- ✅ Real-time dashboard updates
- ✅ IP blocking for malicious activity
- ✅ Detailed audit trails for admin actions
- ✅ No false negatives for obvious threats

Your security monitoring system is now fully operational! 🎉 