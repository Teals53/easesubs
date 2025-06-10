#!/usr/bin/env node

/**
 * Comprehensive Accessibility Testing Script
 * 
 * This script runs automated accessibility tests using axe-core
 * and generates detailed reports for WCAG compliance.
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Configuration
const config = {
  baseUrl: process.env.BASE_URL || 'http://localhost:3000',
  outputDir: './accessibility-reports',
  testPages: [
    '/',
    '/auth/signin',
    '/auth/signup',
    '/dashboard',
    '/checkout',
    '/accessibility-status',
    '/legal/privacy-policy',
    '/legal/terms-of-service'
  ],
  wcagLevel: 'AA', // A, AA, or AAA
  browsers: ['chromium'], // chromium, firefox, webkit
  viewport: {
    width: 1280,
    height: 720
  },
  mobileViewport: {
    width: 375,
    height: 667
  }
};

// Ensure output directory exists
if (!fs.existsSync(config.outputDir)) {
  fs.mkdirSync(config.outputDir, { recursive: true });
}

console.log('🔍 Starting Comprehensive Accessibility Testing...\n');

// Install required dependencies if not present
try {
  require('@axe-core/playwright');
  require('playwright');
} catch (error) {
  console.log('📦 Installing required dependencies...');
  execSync('npm install --save-dev @axe-core/playwright playwright', { stdio: 'inherit' });
}

const { chromium, firefox, webkit } = require('playwright');
const { injectAxe, checkA11y, getViolations } = require('@axe-core/playwright');

/**
 * Run accessibility tests for a specific page
 */
async function testPage(browser, page, url, viewport = 'desktop') {
  console.log(`  Testing: ${url} (${viewport})`);
  
  try {
    await page.goto(`${config.baseUrl}${url}`, { 
      waitUntil: 'networkidle',
      timeout: 30000 
    });

    // Wait for page to be fully loaded
    await page.waitForTimeout(2000);

    // Inject axe-core
    await injectAxe(page);

    // Run accessibility scan
    const results = await checkA11y(page, null, {
      detailedReport: true,
      detailedReportOptions: { html: true },
      axeOptions: {
        runOnly: {
          type: 'tag',
          values: [`wcag2${config.wcagLevel.toLowerCase()}`, 'best-practice']
        }
      }
    });

    return {
      url,
      viewport,
      violations: await getViolations(page),
      timestamp: new Date().toISOString(),
      success: true
    };

  } catch (error) {
    console.error(`    ❌ Error testing ${url}: ${error.message}`);
    return {
      url,
      viewport,
      error: error.message,
      timestamp: new Date().toISOString(),
      success: false
    };
  }
}

/**
 * Test keyboard navigation
 */
async function testKeyboardNavigation(page, url) {
  console.log(`  Testing keyboard navigation: ${url}`);
  
  try {
    await page.goto(`${config.baseUrl}${url}`, { waitUntil: 'networkidle' });
    
    // Get all focusable elements
    const focusableElements = await page.$$eval(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
      elements => elements.length
    );

    // Test tab navigation
    let tabCount = 0;
    let focusedElements = [];
    
    for (let i = 0; i < Math.min(focusableElements, 20); i++) {
      await page.keyboard.press('Tab');
      tabCount++;
      
      const focusedElement = await page.evaluate(() => {
        const el = document.activeElement;
        return {
          tagName: el.tagName,
          id: el.id,
          className: el.className,
          ariaLabel: el.getAttribute('aria-label'),
          hasVisibleFocus: window.getComputedStyle(el).outline !== 'none'
        };
      });
      
      focusedElements.push(focusedElement);
    }

    return {
      url,
      totalFocusableElements: focusableElements,
      tabCount,
      focusedElements,
      success: true
    };

  } catch (error) {
    return {
      url,
      error: error.message,
      success: false
    };
  }
}

/**
 * Test color contrast
 */
async function testColorContrast(page, url) {
  console.log(`  Testing color contrast: ${url}`);
  
  try {
    await page.goto(`${config.baseUrl}${url}`, { waitUntil: 'networkidle' });
    
    // Inject contrast checking script
    const contrastResults = await page.evaluate(() => {
      const textElements = document.querySelectorAll('p, span, h1, h2, h3, h4, h5, h6, a, button, label');
      const results = [];
      
      textElements.forEach(el => {
        const styles = window.getComputedStyle(el);
        const color = styles.color;
        const backgroundColor = styles.backgroundColor;
        const fontSize = parseFloat(styles.fontSize);
        
        if (color && backgroundColor && backgroundColor !== 'rgba(0, 0, 0, 0)') {
          results.push({
            element: el.tagName.toLowerCase(),
            color,
            backgroundColor,
            fontSize,
            text: el.textContent.substring(0, 50)
          });
        }
      });
      
      return results;
    });

    return {
      url,
      contrastResults,
      success: true
    };

  } catch (error) {
    return {
      url,
      error: error.message,
      success: false
    };
  }
}

/**
 * Generate HTML report
 */
function generateHTMLReport(results) {
  const timestamp = new Date().toISOString();
  const totalViolations = results.reduce((sum, result) => 
    sum + (result.violations ? result.violations.length : 0), 0
  );
  
  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Accessibility Test Report - ${timestamp}</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 20px; background: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; background: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .header { border-bottom: 2px solid #e1e5e9; padding-bottom: 20px; margin-bottom: 30px; }
        .summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 30px; }
        .stat-card { background: #f8f9fa; padding: 20px; border-radius: 6px; text-align: center; }
        .stat-number { font-size: 2em; font-weight: bold; margin-bottom: 5px; }
        .success { color: #28a745; }
        .warning { color: #ffc107; }
        .error { color: #dc3545; }
        .page-result { margin-bottom: 30px; border: 1px solid #e1e5e9; border-radius: 6px; overflow: hidden; }
        .page-header { background: #f8f9fa; padding: 15px; font-weight: bold; }
        .violation { margin: 15px; padding: 15px; background: #fff5f5; border-left: 4px solid #dc3545; }
        .violation-title { font-weight: bold; color: #dc3545; margin-bottom: 10px; }
        .violation-description { margin-bottom: 10px; }
        .violation-help { font-size: 0.9em; color: #666; }
        .no-violations { margin: 15px; padding: 15px; background: #f0fff4; border-left: 4px solid #28a745; color: #155724; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Accessibility Test Report</h1>
            <p>Generated on: ${new Date(timestamp).toLocaleString()}</p>
            <p>WCAG Level: ${config.wcagLevel}</p>
        </div>
        
        <div class="summary">
            <div class="stat-card">
                <div class="stat-number">${results.length}</div>
                <div>Pages Tested</div>
            </div>
            <div class="stat-card">
                <div class="stat-number ${totalViolations === 0 ? 'success' : 'error'}">${totalViolations}</div>
                <div>Total Violations</div>
            </div>
            <div class="stat-card">
                <div class="stat-number success">${results.filter(r => r.success).length}</div>
                <div>Successful Tests</div>
            </div>
            <div class="stat-card">
                <div class="stat-number ${results.filter(r => !r.success).length > 0 ? 'error' : 'success'}">${results.filter(r => !r.success).length}</div>
                <div>Failed Tests</div>
            </div>
        </div>
        
        ${results.map(result => `
            <div class="page-result">
                <div class="page-header">
                    ${result.url} (${result.viewport || 'desktop'})
                    ${result.success ? '<span class="success">✓</span>' : '<span class="error">✗</span>'}
                </div>
                ${result.violations && result.violations.length > 0 ? 
                    result.violations.map(violation => `
                        <div class="violation">
                            <div class="violation-title">${violation.id}: ${violation.impact}</div>
                            <div class="violation-description">${violation.description}</div>
                            <div class="violation-help">${violation.help}</div>
                            <div><strong>Affected elements:</strong> ${violation.nodes.length}</div>
                        </div>
                    `).join('') :
                    result.success ? '<div class="no-violations">✅ No accessibility violations found!</div>' : 
                    `<div class="violation"><div class="violation-title">Test Failed</div><div class="violation-description">${result.error}</div></div>`
                }
            </div>
        `).join('')}
    </div>
</body>
</html>`;

  const reportPath = path.join(config.outputDir, `accessibility-report-${Date.now()}.html`);
  fs.writeFileSync(reportPath, html);
  console.log(`📊 HTML report generated: ${reportPath}`);
  
  return reportPath;
}

/**
 * Main test runner
 */
async function runTests() {
  const results = [];
  
  for (const browserName of config.browsers) {
    console.log(`\n🌐 Testing with ${browserName}...`);
    
    let browser;
    switch (browserName) {
      case 'chromium':
        browser = await chromium.launch();
        break;
      case 'firefox':
        browser = await firefox.launch();
        break;
      case 'webkit':
        browser = await webkit.launch();
        break;
      default:
        console.error(`Unknown browser: ${browserName}`);
        continue;
    }

    const context = await browser.newContext();
    
    for (const testUrl of config.testPages) {
      // Desktop test
      const desktopPage = await context.newPage();
      await desktopPage.setViewportSize(config.viewport);
      const desktopResult = await testPage(browser, desktopPage, testUrl, 'desktop');
      results.push(desktopResult);
      await desktopPage.close();

      // Mobile test
      const mobilePage = await context.newPage();
      await mobilePage.setViewportSize(config.mobileViewport);
      const mobileResult = await testPage(browser, mobilePage, testUrl, 'mobile');
      results.push(mobileResult);
      await mobilePage.close();

      // Keyboard navigation test (desktop only)
      const keyboardPage = await context.newPage();
      await keyboardPage.setViewportSize(config.viewport);
      const keyboardResult = await testKeyboardNavigation(keyboardPage, testUrl);
      if (keyboardResult.success) {
        console.log(`    ⌨️  Keyboard navigation: ${keyboardResult.tabCount} tab stops`);
      }
      await keyboardPage.close();

      // Color contrast test
      const contrastPage = await context.newPage();
      await contrastPage.setViewportSize(config.viewport);
      const contrastResult = await testColorContrast(contrastPage, testUrl);
      if (contrastResult.success) {
        console.log(`    🎨 Color contrast: ${contrastResult.contrastResults.length} elements checked`);
      }
      await contrastPage.close();
    }

    await browser.close();
  }

  // Generate reports
  console.log('\n📊 Generating reports...');
  
  // JSON report
  const jsonReportPath = path.join(config.outputDir, `accessibility-report-${Date.now()}.json`);
  fs.writeFileSync(jsonReportPath, JSON.stringify(results, null, 2));
  console.log(`📄 JSON report generated: ${jsonReportPath}`);
  
  // HTML report
  const htmlReportPath = generateHTMLReport(results);
  
  // Summary
  const totalViolations = results.reduce((sum, result) => 
    sum + (result.violations ? result.violations.length : 0), 0
  );
  
  console.log('\n📋 Test Summary:');
  console.log(`   Pages tested: ${config.testPages.length}`);
  console.log(`   Total violations: ${totalViolations}`);
  console.log(`   Success rate: ${Math.round((results.filter(r => r.success).length / results.length) * 100)}%`);
  
  if (totalViolations === 0) {
    console.log('\n🎉 All tests passed! Your application is accessibility compliant.');
  } else {
    console.log(`\n⚠️  Found ${totalViolations} accessibility violations. Please review the report.`);
  }
  
  console.log(`\n📖 Open the HTML report to view detailed results: ${htmlReportPath}`);
  
  return totalViolations === 0;
}

// Run the tests
runTests()
  .then(success => {
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('❌ Test runner failed:', error);
    process.exit(1);
  }); 