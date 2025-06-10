// Improved test script for account lockout functionality
// This script properly tests through NextAuth endpoints

async function testAccountLockout() {
  const testEmail = "test@example.com";
  const wrongPassword = "wrongpassword123";
  const baseUrl = "http://localhost:3000";
  
  console.log("🔒 Testing Account Lockout Functionality (Improved)");
  console.log("================================================");
  console.log(`Testing with email: ${testEmail}`);
  console.log("Expected behavior: Account should lock after 5 failed attempts\n");

  // First, get CSRF token
  const getCsrfToken = async () => {
    try {
      const response = await fetch(`${baseUrl}/api/auth/csrf`);
      const data = await response.json();
      return data.csrfToken;
    } catch (error) {
      console.log("⚠️  Could not get CSRF token:", error.message);
      return null;
    }
  };

  // Function to attempt login through NextAuth
  const attemptLogin = async (attemptNumber, csrfToken) => {
    try {
      const formData = new URLSearchParams();
      formData.append('email', testEmail);
      formData.append('password', wrongPassword);
      formData.append('redirect', 'false');
      if (csrfToken) {
        formData.append('csrfToken', csrfToken);
      }

      const response = await fetch(`${baseUrl}/api/auth/signin/credentials`, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: formData.toString(),
      });

      console.log(`Attempt ${attemptNumber}:`);
      console.log(`  Status: ${response.status}`);
      console.log(`  Headers: ${JSON.stringify(Object.fromEntries(response.headers.entries()))}`);
      
      const responseText = await response.text();
      console.log(`  Response length: ${responseText.length} chars`);
      
      // Check for common error indicators
      if (responseText.includes('error') || responseText.includes('Error')) {
        console.log(`  ✅ Login failed as expected (contains error)`);
        return { success: false, locked: false };
      } else if (responseText.includes('signin') || response.status === 401) {
        console.log(`  ✅ Login failed as expected (redirected to signin or 401)`);
        return { success: false, locked: false };
      } else if (response.status === 200) {
        console.log(`  ❓ Unclear response - might be success or error`);
        return { success: false, locked: false };
      } else {
        console.log(`  ❓ Unexpected status: ${response.status}`);
        return { success: false, locked: false };
      }
      
    } catch (error) {
      console.log(`Attempt ${attemptNumber}: Network error - ${error.message}`);
      return { success: false, locked: false, error: true };
    }
  };

  // Alternative: Test through the signin page form submission
  const testThroughSigninPage = async () => {
    console.log("\n🌐 Testing through signin page...");
    
    try {
      // First, load the signin page to get any required tokens
      const pageResponse = await fetch(`${baseUrl}/auth/signin`);
      if (pageResponse.ok) {
        console.log("✅ Signin page accessible");
      } else {
        console.log("❌ Could not access signin page");
        return;
      }

      // Test a few login attempts
      for (let i = 1; i <= 3; i++) {
        try {
          const formData = new URLSearchParams();
          formData.append('email', testEmail);
          formData.append('password', wrongPassword);
          
          const response = await fetch(`${baseUrl}/auth/signin`, {
            method: "POST",
            headers: {
              "Content-Type": "application/x-www-form-urlencoded",
            },
            body: formData.toString(),
          });

          console.log(`Page form attempt ${i}: Status ${response.status}`);
          
          // Wait between attempts
          if (i < 3) {
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        } catch (error) {
          console.log(`Page form attempt ${i}: Error - ${error.message}`);
        }
      }
    } catch (error) {
      console.log("Error testing through signin page:", error.message);
    }
  };

  // Get CSRF token first
  console.log("Getting CSRF token...");
  const csrfToken = await getCsrfToken();
  if (csrfToken) {
    console.log("✅ CSRF token obtained");
  } else {
    console.log("⚠️  No CSRF token - proceeding without it");
  }

  console.log("\n📡 Testing through NextAuth API...");
  // Test multiple failed attempts through API
  for (let i = 1; i <= 7; i++) {
    const result = await attemptLogin(i, csrfToken);
    
    if (result.error) {
      console.log("❌ Network error occurred, stopping API test");
      break;
    }
    
    if (i <= 5) {
      console.log(`   Expected: Failed login (attempt ${i}/5)`);
    } else {
      console.log(`   Expected: Account should be locked (attempt ${i} - should fail due to lockout)`);
    }
    
    // Add delay between attempts
    if (i < 7) {
      await new Promise(resolve => setTimeout(resolve, 1500));
    }
  }

  // Test through signin page as well
  await testThroughSigninPage();

  console.log("\n📊 Test Summary:");
  console.log("================");
  console.log("✅ Things to verify manually:");
  console.log("1. Check your Next.js server console for security events");
  console.log("2. Look for 'BRUTE_FORCE_ATTEMPT' and 'SUSPICIOUS_LOGIN' log messages");
  console.log("3. Verify database contains security_events records");
  console.log("4. Try to login with correct credentials - should fail if locked");
  console.log("5. Wait 15 minutes and try again - should work");
  
  console.log("\n🔍 Manual verification steps:");
  console.log("1. Go to http://localhost:3000/auth/signin");
  console.log("2. Try to login with test@example.com and wrong password 5+ times");
  console.log("3. Observe error messages and behavior");
  console.log("4. Check if account becomes locked");
  
  console.log("\n💡 To check security events in database:");
  console.log("SELECT type, severity, details, timestamp FROM security_events ORDER BY timestamp DESC LIMIT 10;");
}

// Check if Next.js is running
async function checkServerHealth() {
  try {
    const response = await fetch("http://localhost:3000/auth/signin");
    if (response.ok) {
      console.log("✅ Next.js server is running on port 3000");
      return true;
    } else {
      console.log("❌ Next.js server responded with error:", response.status);
      return false;
    }
  } catch (error) {
    console.log("❌ Cannot connect to Next.js server:", error.message);
    console.log("💡 Make sure to run 'npm run dev' first");
    return false;
  }
}

// Main execution
async function main() {
  console.log("🚀 Account Lockout Test Suite");
  console.log("=============================\n");
  
  const serverRunning = await checkServerHealth();
  if (!serverRunning) {
    console.log("\n❌ Test aborted - server not accessible");
    process.exit(1);
  }
  
  await testAccountLockout();
}

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { testAccountLockout, checkServerHealth };
}

// Run if executed directly
if (require.main === module) {
  main().catch(console.error);
} 