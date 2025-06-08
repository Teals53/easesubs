#!/usr/bin/env node

/**
 * Rate Limit Management Script
 * Usage: node scripts/clear-rate-limits.js [action] [ip]
 * 
 * Actions:
 * - status: Show current rate limit status
 * - clear-all: Clear all rate limits
 * - clear-ip [ip]: Clear rate limits for specific IP
 */

const https = require('https');
const http = require('http');

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
const ADMIN_SECRET = process.env.ADMIN_SECRET || 'your-super-secret-admin-key-change-this-in-production';

async function makeRequest(action, ip = null) {
  const url = new URL('/api/admin/rate-limits', BASE_URL);
  url.searchParams.set('action', action);
  if (ip) {
    url.searchParams.set('ip', ip);
  }

  const options = {
    method: 'GET',
    headers: {
      'x-admin-key': ADMIN_SECRET,
      'Content-Type': 'application/json',
    },
  };

  return new Promise((resolve, reject) => {
    const client = url.protocol === 'https:' ? https : http;
    
    const req = client.request(url, options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          const result = JSON.parse(data);
          resolve({ status: res.statusCode, data: result });
        } catch (e) {
          resolve({ status: res.statusCode, data: data });
        }
      });
    });

    req.on('error', reject);
    req.end();
  });
}

async function main() {
  const [,, action, ip] = process.argv;

  if (!action) {
    console.log('Rate Limit Management Script');
    console.log('Usage: node scripts/clear-rate-limits.js [action] [ip]');
    console.log('');
    console.log('Actions:');
    console.log('  status     - Show current rate limit status');
    console.log('  clear-all  - Clear all rate limits');
    console.log('  clear-ip   - Clear rate limits for specific IP');
    console.log('');
    console.log('Examples:');
    console.log('  node scripts/clear-rate-limits.js status');
    console.log('  node scripts/clear-rate-limits.js clear-all');
    console.log('  node scripts/clear-rate-limits.js clear-ip 192.168.1.1');
    return;
  }

  try {
    console.log(`Executing action: ${action}${ip ? ` for IP: ${ip}` : ''}`);
    const result = await makeRequest(action, ip);
    
    console.log(`Status: ${result.status}`);
    console.log('Response:', JSON.stringify(result.data, null, 2));
    
    if (result.status === 401) {
      console.log('\n⚠️  Make sure ADMIN_SECRET is set correctly in your .env file');
    }
  } catch (error) {
    console.error('Error:', error.message);
    console.log('\n⚠️  Make sure your server is running and accessible');
  }
}

main().catch(console.error); 