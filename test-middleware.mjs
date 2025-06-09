import http from 'http';

function testMiddleware() {
  const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/',
    method: 'GET'
  };

  const req = http.request(options, (res) => {
    console.log(`STATUS: ${res.statusCode}`);
    console.log(`HEADERS: ${JSON.stringify(res.headers, null, 2)}`);
    
    // Check for our custom middleware headers
    if (res.headers['x-request-id']) {
      console.log('✓ Middleware X-Request-ID header found:', res.headers['x-request-id']);
    } else {
      console.log('✗ Middleware X-Request-ID header NOT found');
    }
    
    if (res.headers['x-powered-by'] === '') {
      console.log('✓ X-Powered-By header successfully removed');
    } else {
      console.log('✗ X-Powered-By header not removed:', res.headers['x-powered-by']);
    }
    
    // Check security headers from next.config.ts
    const securityHeaders = [
      'x-frame-options',
      'x-content-type-options', 
      'x-xss-protection',
      'referrer-policy'
    ];
    
    securityHeaders.forEach(header => {
      if (res.headers[header]) {
        console.log(`✓ Security header ${header}:`, res.headers[header]);
      } else {
        console.log(`✗ Security header ${header} missing`);
      }
    });
  });

  req.on('error', (e) => {
    console.error(`Problem with request: ${e.message}`);
  });

  req.end();
}

// Test normal request
console.log('Testing normal request...');
testMiddleware();

// Test with suspicious patterns (should trigger higher risk score)
setTimeout(() => {
  console.log('\nTesting suspicious request...');
  const suspiciousOptions = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/test?id=1 OR 1=1',
    method: 'GET',
    headers: {
      'User-Agent': 'bot-scanner-v1.0'
    }
  };

  const suspiciousReq = http.request(suspiciousOptions, (res) => {
    console.log(`Suspicious request STATUS: ${res.statusCode}`);
    
    if (res.headers['x-rate-limit-warning']) {
      console.log('✓ Rate limit warning header found:', res.headers['x-rate-limit-warning']);
    } else {
      console.log('Rate limit warning header not found (risk score may be < 50)');
    }
  });

  suspiciousReq.on('error', (e) => {
    console.error(`Problem with suspicious request: ${e.message}`);
  });

  suspiciousReq.end();
}, 1000); 