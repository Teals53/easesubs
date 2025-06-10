interface SEOCheckResult {
  passed: boolean;
  message: string;
  severity: 'error' | 'warning' | 'info';
}

interface SEOAuditResult {
  score: number;
  checks: SEOCheckResult[];
  summary: {
    errors: number;
    warnings: number;
    passed: number;
  };
}

// SEO Validation Functions
export function checkMetaTitle(title?: string): SEOCheckResult {
  if (!title) {
    return { passed: false, message: 'Missing page title', severity: 'error' };
  }
  
  if (title.length < 30) {
    return { passed: false, message: 'Title too short (< 30 characters)', severity: 'warning' };
  }
  
  if (title.length > 60) {
    return { passed: false, message: 'Title too long (> 60 characters)', severity: 'warning' };
  }
  
  return { passed: true, message: 'Title length is optimal', severity: 'info' };
}

export function checkMetaDescription(description?: string): SEOCheckResult {
  if (!description) {
    return { passed: false, message: 'Missing meta description', severity: 'error' };
  }
  
  if (description.length < 120) {
    return { passed: false, message: 'Description too short (< 120 characters)', severity: 'warning' };
  }
  
  if (description.length > 160) {
    return { passed: false, message: 'Description too long (> 160 characters)', severity: 'warning' };
  }
  
  return { passed: true, message: 'Description length is optimal', severity: 'info' };
}

export function checkCanonicalURL(canonical?: string): SEOCheckResult {
  if (!canonical) {
    return { passed: false, message: 'Missing canonical URL', severity: 'error' };
  }
  
  try {
    new URL(canonical);
    return { passed: true, message: 'Canonical URL is valid', severity: 'info' };
  } catch {
    return { passed: false, message: 'Invalid canonical URL format', severity: 'error' };
  }
}

export function checkHeaderStructure(): SEOCheckResult {
  if (typeof window === 'undefined') {
    return { passed: true, message: 'Header structure check skipped (SSR)', severity: 'info' };
  }
  
  const headers = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
  const h1Count = document.querySelectorAll('h1').length;
  
  if (h1Count === 0) {
    return { passed: false, message: 'No H1 tag found', severity: 'error' };
  }
  
  if (h1Count > 1) {
    return { passed: false, message: `Multiple H1 tags found (${h1Count})`, severity: 'error' };
  }
  
  // Check for proper hierarchy
  let previousLevel = 0;
  let hierarchyValid = true;
  
  headers.forEach(header => {
    const level = parseInt(header.tagName.charAt(1));
    if (level > previousLevel + 1 && previousLevel !== 0) {
      hierarchyValid = false;
    }
    previousLevel = level;
  });
  
  if (!hierarchyValid) {
    return { passed: false, message: 'Header hierarchy is not properly structured', severity: 'warning' };
  }
  
  return { passed: true, message: 'Header structure is valid', severity: 'info' };
}

export function checkImageAltText(): SEOCheckResult {
  if (typeof window === 'undefined') {
    return { passed: true, message: 'Image alt text check skipped (SSR)', severity: 'info' };
  }
  
  const images = document.querySelectorAll('img');
  const imagesWithoutAlt = Array.from(images).filter(img => !img.alt || img.alt.trim() === '');
  
  if (imagesWithoutAlt.length > 0) {
    return { 
      passed: false, 
      message: `${imagesWithoutAlt.length} images missing alt text`, 
      severity: 'error' 
    };
  }
  
  return { passed: true, message: 'All images have alt text', severity: 'info' };
}

export function checkInternalLinks(): SEOCheckResult {
  if (typeof window === 'undefined') {
    return { passed: true, message: 'Internal links check skipped (SSR)', severity: 'info' };
  }
  
  const links = document.querySelectorAll('a[href^="/"], a[href^="https://easesubs.com"]');
  
  if (links.length < 3) {
    return { 
      passed: false, 
      message: 'Too few internal links for good SEO', 
      severity: 'warning' 
    };
  }
  
  return { passed: true, message: `Found ${links.length} internal links`, severity: 'info' };
}

export function checkPageLoadSpeed(): SEOCheckResult {
  if (typeof window === 'undefined' || !window.performance) {
    return { passed: true, message: 'Page load speed check skipped', severity: 'info' };
  }
  
  const loadTime = window.performance.timing.loadEventEnd - window.performance.timing.navigationStart;
  
  if (loadTime > 3000) {
    return { 
      passed: false, 
      message: `Page load time is slow (${Math.round(loadTime)}ms)`, 
      severity: 'warning' 
    };
  }
  
  if (loadTime > 1500) {
    return { 
      passed: false, 
      message: `Page load time could be improved (${Math.round(loadTime)}ms)`, 
      severity: 'warning' 
    };
  }
  
  return { passed: true, message: `Page load time is good (${Math.round(loadTime)}ms)`, severity: 'info' };
}

export function checkStructuredData(): SEOCheckResult {
  if (typeof window === 'undefined') {
    return { passed: true, message: 'Structured data check skipped (SSR)', severity: 'info' };
  }
  
  const jsonLdScripts = document.querySelectorAll('script[type="application/ld+json"]');
  
  if (jsonLdScripts.length === 0) {
    return { passed: false, message: 'No structured data found', severity: 'warning' };
  }
  
  let validStructuredData = 0;
  
  jsonLdScripts.forEach(script => {
    try {
      JSON.parse(script.textContent || '');
      validStructuredData++;
    } catch {
      // Invalid JSON
    }
  });
  
  if (validStructuredData === 0) {
    return { passed: false, message: 'No valid structured data found', severity: 'error' };
  }
  
  return { 
    passed: true, 
    message: `Found ${validStructuredData} valid structured data blocks`, 
    severity: 'info' 
  };
}

export function checkOpenGraph(): SEOCheckResult {
  if (typeof window === 'undefined') {
    return { passed: true, message: 'Open Graph check skipped (SSR)', severity: 'info' };
  }
  
  const ogTitle = document.querySelector('meta[property="og:title"]');
  const ogDescription = document.querySelector('meta[property="og:description"]');
  const ogImage = document.querySelector('meta[property="og:image"]');
  const ogUrl = document.querySelector('meta[property="og:url"]');
  
  const missing = [];
  if (!ogTitle) missing.push('og:title');
  if (!ogDescription) missing.push('og:description');
  if (!ogImage) missing.push('og:image');
  if (!ogUrl) missing.push('og:url');
  
  if (missing.length > 0) {
    return { 
      passed: false, 
      message: `Missing Open Graph tags: ${missing.join(', ')}`, 
      severity: 'warning' 
    };
  }
  
  return { passed: true, message: 'All essential Open Graph tags present', severity: 'info' };
}

// Main SEO Audit Function
export function performSEOAudit(metadata?: {
  title?: string;
  description?: string;
  canonical?: string;
}): SEOAuditResult {
  const checks: SEOCheckResult[] = [
    checkMetaTitle(metadata?.title),
    checkMetaDescription(metadata?.description),
    checkCanonicalURL(metadata?.canonical),
    checkHeaderStructure(),
    checkImageAltText(),
    checkInternalLinks(),
    checkPageLoadSpeed(),
    checkStructuredData(),
    checkOpenGraph(),
  ];
  
  const summary = {
    errors: checks.filter(check => !check.passed && check.severity === 'error').length,
    warnings: checks.filter(check => !check.passed && check.severity === 'warning').length,
    passed: checks.filter(check => check.passed).length,
  };
  
  // Calculate score (0-100)
  const totalChecks = checks.length;
  const score = Math.round((summary.passed / totalChecks) * 100);
  
  return {
    score,
    checks,
    summary,
  };
}

// SEO Recommendations Generator
export function generateSEORecommendations(auditResult: SEOAuditResult): string[] {
  const recommendations: string[] = [];
  
  auditResult.checks.forEach(check => {
    if (!check.passed) {
      switch (check.message) {
        case 'Missing page title':
          recommendations.push('Add a unique, descriptive title tag to your page');
          break;
        case 'Missing meta description':
          recommendations.push('Add a compelling meta description (120-160 characters)');
          break;
        case 'Missing canonical URL':
          recommendations.push('Add a canonical URL to prevent duplicate content issues');
          break;
        case 'No H1 tag found':
          recommendations.push('Add an H1 tag with your main keyword');
          break;
        case 'Multiple H1 tags found':
          recommendations.push('Use only one H1 tag per page');
          break;
        default:
          recommendations.push(`Fix: ${check.message}`);
      }
    }
  });
  
  // General recommendations based on score
  if (auditResult.score < 70) {
    recommendations.push('Consider implementing structured data markup');
    recommendations.push('Optimize page loading speed');
    recommendations.push('Add more internal links to improve site navigation');
  }
  
  return [...new Set(recommendations)]; // Remove duplicates
}

// Development helper for logging SEO issues - removed console logs for production
export function logSEOAudit(metadata?: { title?: string; description?: string; canonical?: string }) {
  if (process.env.NODE_ENV === 'development') {
    // SEO audit can be performed here for development debugging
    // but console logs are removed for production build
    performSEOAudit(metadata);
  }
} 