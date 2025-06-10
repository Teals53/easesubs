/**
 * Development utilities for CSP debugging and hash generation
 */

/**
 * Generate SHA256 hash for CSP
 */
export async function generateCSPHash(content: string): Promise<string> {
  if (typeof window === 'undefined') {
    // Server-side (Node.js)
    try {
      const crypto = await import('crypto');
      const hash = crypto.createHash('sha256').update(content, 'utf8').digest('base64');
      return `sha256-${hash}`;
    } catch {
      console.warn('Crypto module not available');
      return '';
    }
  } else {
    // Client-side fallback (development only)
    console.warn('CSP hash generation not available in browser');
    return '';
  }
}

/**
 * Debug CSP violations in development
 */
export function debugCSPViolations(): void {
  if (process.env.NODE_ENV !== 'development' || typeof window === 'undefined') {
    return;
  }

  // Listen for CSP violations
  document.addEventListener('securitypolicyviolation', (e) => {
    console.group('🚨 CSP Violation Detected');
    console.error('Blocked URI:', e.blockedURI);
    console.error('Violated Directive:', e.violatedDirective);
    console.error('Original Policy:', e.originalPolicy);
    console.error('Source File:', e.sourceFile);
    console.error('Line Number:', e.lineNumber);
    console.error('Column Number:', e.columnNumber);
    
    // Generate hash for inline content if available
    if (e.violatedDirective.includes('script-src') || e.violatedDirective.includes('style-src')) {
      console.warn('💡 To allow this inline content, add the following hash to your CSP:');
      console.log(`'sha256-<CONTENT_HASH>'`);
      console.log('Use the generateCSPHash() function to generate the hash for your content.');
    }
    
    console.groupEnd();
  });

  console.log('🔒 CSP Violation Debugging Enabled');
}

/**
 * Extract and log all inline scripts and styles for hash generation
 */
export function extractInlineContentForCSP(): void {
  if (process.env.NODE_ENV !== 'development' || typeof window === 'undefined') {
    return;
  }

  setTimeout(() => {
    console.group('📊 CSP Inline Content Analysis');
    
    // Find all inline scripts
    const inlineScripts = document.querySelectorAll('script:not([src])');
    if (inlineScripts.length > 0) {
      console.log('📝 Inline Scripts Found:');
      inlineScripts.forEach((script, index) => {
        const content = script.textContent || script.innerHTML;
        if (content.trim()) {
          console.log(`Script ${index + 1}:`, content.substring(0, 100) + '...');
          console.log(`Hash: ${generateCSPHash(content.trim())}`);
        }
      });
    }

    // Find all inline styles
    const inlineStyles = document.querySelectorAll('style');
    if (inlineStyles.length > 0) {
      console.log('🎨 Inline Styles Found:');
      inlineStyles.forEach((style, index) => {
        const content = style.textContent || style.innerHTML;
        if (content.trim()) {
          console.log(`Style ${index + 1}:`, content.substring(0, 100) + '...');
          console.log(`Hash: ${generateCSPHash(content.trim())}`);
        }
      });
    }

    // Find elements with style attributes
    const elementsWithStyle = document.querySelectorAll('[style]');
    if (elementsWithStyle.length > 0) {
      console.log('🎯 Elements with style attributes:');
      elementsWithStyle.forEach((element, index) => {
        const styleContent = element.getAttribute('style');
        if (styleContent) {
          console.log(`Element ${index + 1} (${element.tagName}):`, styleContent);
          console.log(`Hash: ${generateCSPHash(styleContent)}`);
        }
      });
    }

    console.groupEnd();
  }, 2000); // Wait for all content to load
}

/**
 * Initialize CSP debugging in development
 */
export function initCSPDebugging(): void {
  if (process.env.NODE_ENV !== 'development') {
    return;
  }

  debugCSPViolations();
  extractInlineContentForCSP();
  
  // Add global function for manual hash generation
  if (typeof window !== 'undefined') {
    (window as typeof window & { generateCSPHash: typeof generateCSPHash }).generateCSPHash = generateCSPHash;
    console.log('🔧 Use window.generateCSPHash(content) to generate CSP hashes manually');
  }
} 