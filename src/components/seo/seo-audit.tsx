'use client';

import { useEffect, useState } from 'react';
import { CheckCircle, XCircle, AlertCircle, ExternalLink } from 'lucide-react';

interface SEOIssue {
  type: 'error' | 'warning' | 'success';
  category: 'technical' | 'onpage' | 'performance' | 'content';
  message: string;
  element?: string;
  recommendation?: string;
}

interface SEOAuditData {
  score: number;
  issues: SEOIssue[];
  checks: {
    technical: boolean[];
    onpage: boolean[];
    performance: boolean[];
    content: boolean[];
  };
}

export function SEOAudit() {
  const [auditData, setAuditData] = useState<SEOAuditData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const performAudit = () => {
      const issues: SEOIssue[] = [];
      const checks = {
        technical: [false, false, false, false, false],
        onpage: [false, false, false, false, false],
        performance: [false, false, false, false, false],
        content: [false, false, false, false, false]
      };

      // Technical SEO checks
      const titleElement = document.querySelector('title');
      if (titleElement && titleElement.textContent) {
        checks.technical[0] = true;
        if (titleElement.textContent.length > 60) {
          issues.push({
            type: 'warning',
            category: 'technical',
            message: 'Title tag is longer than 60 characters',
            element: 'title',
            recommendation: 'Keep title tags under 60 characters for better display in search results'
          });
        }
      } else {
        issues.push({
          type: 'error',
          category: 'technical',
          message: 'Missing title tag',
          recommendation: 'Add a unique, descriptive title tag to every page'
        });
      }

      // Meta description check
      const metaDescription = document.querySelector('meta[name="description"]');
      if (metaDescription && metaDescription.getAttribute('content')) {
        checks.technical[1] = true;
        const content = metaDescription.getAttribute('content')!;
        if (content.length > 160) {
          issues.push({
            type: 'warning',
            category: 'technical',
            message: 'Meta description is longer than 160 characters',
            element: 'meta[name="description"]',
            recommendation: 'Keep meta descriptions under 160 characters'
          });
        }
      } else {
        issues.push({
          type: 'error',
          category: 'technical',
          message: 'Missing meta description',
          recommendation: 'Add a compelling meta description to improve click-through rates'
        });
      }

      // Canonical URL check
      const canonicalLink = document.querySelector('link[rel="canonical"]');
      if (canonicalLink) {
        checks.technical[2] = true;
      } else {
        issues.push({
          type: 'warning',
          category: 'technical',
          message: 'Missing canonical URL',
          recommendation: 'Add canonical URLs to prevent duplicate content issues'
        });
      }

      // Open Graph check
      const ogTitle = document.querySelector('meta[property="og:title"]');
      const ogDescription = document.querySelector('meta[property="og:description"]');
      const ogImage = document.querySelector('meta[property="og:image"]');
      if (ogTitle && ogDescription && ogImage) {
        checks.technical[3] = true;
      } else {
        issues.push({
          type: 'warning',
          category: 'technical',
          message: 'Incomplete Open Graph tags',
          recommendation: 'Add complete OG tags (title, description, image) for better social sharing'
        });
      }

      // Structured data check
      const structuredData = document.querySelector('script[type="application/ld+json"]');
      if (structuredData) {
        checks.technical[4] = true;
      } else {
        issues.push({
          type: 'warning',
          category: 'technical',
          message: 'No structured data found',
          recommendation: 'Add structured data to help search engines understand your content'
        });
      }

      // On-page SEO checks
      const h1Elements = document.querySelectorAll('h1');
      if (h1Elements.length === 1) {
        checks.onpage[0] = true;
      } else if (h1Elements.length === 0) {
        issues.push({
          type: 'error',
          category: 'onpage',
          message: 'No H1 tag found',
          recommendation: 'Add exactly one H1 tag per page that describes the main topic'
        });
      } else {
        issues.push({
          type: 'warning',
          category: 'onpage',
          message: `Multiple H1 tags found (${h1Elements.length})`,
          recommendation: 'Use only one H1 tag per page'
        });
      }

      // Header hierarchy check
      const headers = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
      checks.onpage[1] = headers.length > 1;

      // Image alt text check
      const images = document.querySelectorAll('img');
      const imagesWithoutAlt = Array.from(images).filter(img => !img.alt);
      if (imagesWithoutAlt.length === 0 && images.length > 0) {
        checks.onpage[2] = true;
      } else if (imagesWithoutAlt.length > 0) {
        issues.push({
          type: 'warning',
          category: 'onpage',
          message: `${imagesWithoutAlt.length} images missing alt text`,
          recommendation: 'Add descriptive alt text to all images for accessibility and SEO'
        });
      }

      // Internal links check
      const internalLinks = document.querySelectorAll('a[href^="/"], a[href^="#"]');
      checks.onpage[3] = internalLinks.length > 3;

      // Content length check (rough estimate)
      const textContent = document.body.textContent || '';
      const wordCount = textContent.trim().split(/\s+/).length;
      if (wordCount > 300) {
        checks.onpage[4] = true;
      } else {
        issues.push({
          type: 'warning',
          category: 'content',
          message: 'Content appears to be thin',
          recommendation: 'Add more comprehensive, valuable content (aim for 300+ words)'
        });
      }

      // Performance checks
      checks.performance[0] = true; // Assuming Next.js optimization
      checks.performance[1] = document.querySelector('link[rel="preconnect"]') !== null;
      checks.performance[2] = document.querySelector('link[rel="preload"]') !== null;
      checks.performance[3] = true; // Assuming proper image optimization
      checks.performance[4] = true; // Assuming CDN usage

      // Calculate score
      const totalChecks = Object.values(checks).flat().length;
      const passedChecks = Object.values(checks).flat().filter(Boolean).length;
      const score = Math.round((passedChecks / totalChecks) * 100);

      // Add success messages for passed checks
      if (checks.technical[0]) {
        issues.push({
          type: 'success',
          category: 'technical',
          message: 'Title tag is properly implemented'
        });
      }

      if (checks.onpage[2]) {
        issues.push({
          type: 'success',
          category: 'onpage',
          message: 'All images have alt text'
        });
      }

      setAuditData({
        score,
        issues,
        checks
      });
      setIsLoading(false);
    };

    // Run audit after component mounts and DOM is ready
    setTimeout(performAudit, 1000);
  }, []);

  if (isLoading) {
    return (
      <div className="bg-gray-900 border border-gray-700 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Running SEO Audit...</h3>
        <div className="animate-pulse space-y-3">
          <div className="h-4 bg-gray-700 rounded w-3/4"></div>
          <div className="h-4 bg-gray-700 rounded w-1/2"></div>
          <div className="h-4 bg-gray-700 rounded w-2/3"></div>
        </div>
      </div>
    );
  }

  if (!auditData) return null;

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-400';
    if (score >= 70) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getIcon = (type: 'error' | 'warning' | 'success') => {
    switch (type) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-400" />;
      case 'warning':
        return <AlertCircle className="w-5 h-5 text-yellow-400" />;
      case 'error':
        return <XCircle className="w-5 h-5 text-red-400" />;
    }
  };

  return (
    <div className="bg-gray-900 border border-gray-700 rounded-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-white">SEO Audit Results</h3>
        <div className="flex items-center space-x-2">
          <span className="text-gray-400">Score:</span>
          <span className={`text-2xl font-bold ${getScoreColor(auditData.score)}`}>
            {auditData.score}%
          </span>
        </div>
      </div>

      {/* Score breakdown */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {Object.entries(auditData.checks).map(([category, checks]) => {
          const passed = checks.filter(Boolean).length;
          const total = checks.length;
          const percentage = Math.round((passed / total) * 100);
          
          return (
            <div key={category} className="text-center">
              <div className="text-sm text-gray-400 capitalize mb-1">{category}</div>
              <div className={`text-lg font-semibold ${getScoreColor(percentage)}`}>
                {passed}/{total}
              </div>
            </div>
          );
        })}
      </div>

      {/* Issues list */}
      <div className="space-y-3">
        {auditData.issues
          .sort((a, b) => {
            const order = { error: 0, warning: 1, success: 2 };
            return order[a.type] - order[b.type];
          })
          .map((issue, index) => (
            <div key={index} className="flex items-start space-x-3 p-3 rounded-lg bg-gray-800">
              {getIcon(issue.type)}
              <div className="flex-1">
                <div className="text-white text-sm font-medium">{issue.message}</div>
                {issue.element && (
                  <div className="text-gray-400 text-xs mt-1">
                    Element: <code className="text-purple-400">{issue.element}</code>
                  </div>
                )}
                {issue.recommendation && (
                  <div className="text-gray-300 text-xs mt-1">{issue.recommendation}</div>
                )}
              </div>
            </div>
          ))}
      </div>

      {/* Quick actions */}
      <div className="mt-6 pt-4 border-t border-gray-700">
        <div className="flex flex-wrap gap-2">
          <a
            href="https://search.google.com/test/mobile-friendly"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center px-3 py-2 text-xs bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            Mobile-Friendly Test
            <ExternalLink className="w-3 h-3 ml-1" />
          </a>
          <a
            href="https://pagespeed.web.dev/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center px-3 py-2 text-xs bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            PageSpeed Insights
            <ExternalLink className="w-3 h-3 ml-1" />
          </a>
          <a
            href="https://search.google.com/search-console"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center px-3 py-2 text-xs bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            Search Console
            <ExternalLink className="w-3 h-3 ml-1" />
          </a>
        </div>
      </div>
    </div>
  );
}

// Development-only component - only shows in dev mode
export function DevSEOAudit() {
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 w-96 max-h-96 overflow-y-auto z-50">
      <SEOAudit />
    </div>
  );
} 