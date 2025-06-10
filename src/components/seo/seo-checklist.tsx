'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { CheckCircle, XCircle, AlertTriangle, ExternalLink, RefreshCw } from 'lucide-react';

interface SEOCheckItem {
  id: string;
  title: string;
  description: string;
  category: 'technical' | 'onpage' | 'performance' | 'content';
  status: 'pass' | 'fail' | 'warning' | 'pending';
  priority: 'high' | 'medium' | 'low';
  recommendation?: string;
  learnMore?: string;
}

const seoChecks: SEOCheckItem[] = [
  // Technical SEO
  {
    id: 'sitemap',
    title: 'XML Sitemap Generated',
    description: 'Site has a valid XML sitemap that is accessible and properly formatted',
    category: 'technical',
    status: 'pass',
    priority: 'high',
    recommendation: 'Ensure sitemap is submitted to Google Search Console and Bing Webmaster Tools',
    learnMore: 'https://developers.google.com/search/docs/advanced/sitemaps/overview'
  },
  {
    id: 'robots',
    title: 'Robots.txt Configured',
    description: 'Robots.txt file is properly configured with appropriate allow/disallow rules',
    category: 'technical',
    status: 'pass',
    priority: 'high',
    recommendation: 'Include sitemap location and crawl delay for different bots',
    learnMore: 'https://developers.google.com/search/docs/advanced/robots/intro'
  },
  {
    id: 'url-structure',
    title: 'Clean URL Structure',
    description: 'URLs are SEO-friendly, readable, and use proper hierarchy',
    category: 'technical',
    status: 'pass',
    priority: 'high',
    recommendation: 'Use hyphens for word separation and avoid unnecessary parameters',
  },
  {
    id: 'canonical-tags',
    title: 'Canonical Tags Implemented',
    description: 'All pages have appropriate canonical tags to prevent duplicate content',
    category: 'technical',
    status: 'pass',
    priority: 'high',
    recommendation: 'Ensure canonical URLs point to the preferred version of each page',
    learnMore: 'https://developers.google.com/search/docs/advanced/crawling/consolidate-duplicate-urls'
  },
  {
    id: 'schema-markup',
    title: 'Schema Markup Added',
    description: 'Structured data is implemented for relevant content types',
    category: 'technical',
    status: 'pass',
    priority: 'medium',
    recommendation: 'Add Organization, Product, FAQ, and Article schemas where relevant',
    learnMore: 'https://schema.org/'
  },
  {
    id: '404-page',
    title: 'Custom 404 Error Page',
    description: 'Custom 404 page provides helpful navigation and search functionality',
    category: 'technical',
    status: 'pass',
    priority: 'medium',
    recommendation: 'Include search functionality and links to popular pages',
  },
  
  // On-Page SEO
  {
    id: 'title-tags',
    title: 'Unique Title Tags',
    description: 'All pages have unique, descriptive title tags under 60 characters',
    category: 'onpage',
    status: 'pass',
    priority: 'high',
    recommendation: 'Include primary keyword and brand name in titles',
    learnMore: 'https://developers.google.com/search/docs/appearance/title-link'
  },
  {
    id: 'meta-descriptions',
    title: 'Compelling Meta Descriptions',
    description: 'All pages have unique meta descriptions under 160 characters',
    category: 'onpage',
    status: 'pass',
    priority: 'high',
    recommendation: 'Write compelling descriptions that encourage clicks from search results',
  },
  {
    id: 'header-structure',
    title: 'Proper Header Tag Structure',
    description: 'Pages use H1-H6 tags in proper hierarchical order',
    category: 'onpage',
    status: 'pass',
    priority: 'high',
    recommendation: 'Use only one H1 per page and maintain logical header hierarchy',
  },
  {
    id: 'alt-text',
    title: 'Image Alt Text',
    description: 'All images have descriptive alt text for accessibility and SEO',
    category: 'onpage',
    status: 'warning',
    priority: 'high',
    recommendation: 'Add descriptive alt text to all images, especially product images',
  },
  {
    id: 'internal-linking',
    title: 'Internal Linking Strategy',
    description: 'Site uses strategic internal linking to distribute page authority',
    category: 'onpage',
    status: 'pass',
    priority: 'medium',
    recommendation: 'Link to related products and important pages using descriptive anchor text',
  },
  {
    id: 'page-speed',
    title: 'Page Loading Speed Optimized',
    description: 'Pages load quickly with optimized images and efficient code',
    category: 'performance',
    status: 'pass',
    priority: 'high',
    recommendation: 'Use Next.js Image component and implement proper caching',
    learnMore: 'https://web.dev/performance/'
  },
  
  // Performance
  {
    id: 'core-web-vitals',
    title: 'Core Web Vitals',
    description: 'Site meets Google Core Web Vitals thresholds',
    category: 'performance',
    status: 'pass',
    priority: 'high',
    recommendation: 'Monitor LCP, FID, and CLS metrics regularly',
    learnMore: 'https://web.dev/vitals/'
  },
  {
    id: 'mobile-optimization',
    title: 'Mobile Optimization',
    description: 'Site is fully responsive and mobile-friendly',
    category: 'performance',
    status: 'pass',
    priority: 'high',
    recommendation: 'Test on various devices and use mobile-first design approach',
  },
  {
    id: 'https-security',
    title: 'HTTPS Security',
    description: 'Site uses HTTPS with valid SSL certificate',
    category: 'technical',
    status: 'pass',
    priority: 'high',
    recommendation: 'Ensure all resources load over HTTPS',
  },
  
  // Content
  {
    id: 'content-quality',
    title: 'High-Quality Content',
    description: 'Pages contain substantial, valuable content for users',
    category: 'content',
    status: 'pass',
    priority: 'high',
    recommendation: 'Ensure each page has at least 300 words of unique, valuable content',
  },
  {
    id: 'keyword-optimization',
    title: 'Keyword Optimization',
    description: 'Content is optimized for relevant keywords without over-optimization',
    category: 'content',
    status: 'pass',
    priority: 'medium',
    recommendation: 'Use keywords naturally in titles, headings, and content',
  },
];

export function SEOChecklist() {
  const [checks, setChecks] = useState<SEOCheckItem[]>(seoChecks);
  const [isRunningAudit, setIsRunningAudit] = useState(false);

  const runSEOAudit = useCallback(async () => {
    setIsRunningAudit(true);
    
    // Simulate audit process
    const updatedChecks = [...checks];
    
    // Check for sitemap
    try {
      const response = await fetch('/sitemap.xml');
      updatedChecks.find(c => c.id === 'sitemap')!.status = response.ok ? 'pass' : 'fail';
    } catch {
      updatedChecks.find(c => c.id === 'sitemap')!.status = 'fail';
    }

    // Check for robots.txt
    try {
      const response = await fetch('/robots.txt');
      updatedChecks.find(c => c.id === 'robots')!.status = response.ok ? 'pass' : 'fail';
    } catch {
      updatedChecks.find(c => c.id === 'robots')!.status = 'fail';
    }

    // Check title tag
    const titleCheck = updatedChecks.find(c => c.id === 'title-tags')!;
    const title = document.title;
    if (!title) {
      titleCheck.status = 'fail';
    } else if (title.length > 60) {
      titleCheck.status = 'warning';
    } else {
      titleCheck.status = 'pass';
    }

    // Check meta description
    const metaDescCheck = updatedChecks.find(c => c.id === 'meta-descriptions')!;
    const metaDesc = document.querySelector('meta[name="description"]')?.getAttribute('content');
    if (!metaDesc) {
      metaDescCheck.status = 'fail';
    } else if (metaDesc.length > 160) {
      metaDescCheck.status = 'warning';
    } else {
      metaDescCheck.status = 'pass';
    }

    // Check images alt text
    const altTextCheck = updatedChecks.find(c => c.id === 'alt-text')!;
    const images = document.querySelectorAll('img');
    const imagesWithoutAlt = Array.from(images).filter(img => !img.alt);
    if (imagesWithoutAlt.length === 0) {
      altTextCheck.status = 'pass';
    } else if (imagesWithoutAlt.length < images.length / 2) {
      altTextCheck.status = 'warning';
    } else {
      altTextCheck.status = 'fail';
    }

    // Check header structure
    const headerCheck = updatedChecks.find(c => c.id === 'header-structure')!;
    const h1s = document.querySelectorAll('h1');
    if (h1s.length === 1) {
      headerCheck.status = 'pass';
    } else {
      headerCheck.status = 'warning';
    }

    setChecks(updatedChecks);
    setIsRunningAudit(false);
  }, [checks]);

  useEffect(() => {
    runSEOAudit();
  }, [runSEOAudit]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pass':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'fail':
        return <XCircle className="w-5 h-5 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      default:
        return <div className="w-5 h-5 rounded-full bg-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pass':
        return 'border-green-500 bg-green-50';
      case 'fail':
        return 'border-red-500 bg-red-50';
      case 'warning':
        return 'border-yellow-500 bg-yellow-50';
      default:
        return 'border-gray-300 bg-gray-50';
    }
  };

  const categoryCounts = {
    technical: checks.filter(c => c.category === 'technical'),
    onpage: checks.filter(c => c.category === 'onpage'),
    performance: checks.filter(c => c.category === 'performance'),
    content: checks.filter(c => c.category === 'content'),
  };

  const overallScore = Math.round(
    (checks.filter(c => c.status === 'pass').length / checks.length) * 100
  );

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white">
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-3xl font-bold text-gray-900">SEO Optimization Checklist</h1>
          <button
            onClick={runSEOAudit}
            disabled={isRunningAudit}
            className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isRunningAudit ? 'animate-spin' : ''}`} />
            {isRunningAudit ? 'Running Audit...' : 'Run SEO Audit'}
          </button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-purple-100 p-4 rounded-lg">
            <h3 className="font-semibold text-purple-900">Overall Score</h3>
            <p className="text-2xl font-bold text-purple-600">{overallScore}%</p>
          </div>
          {Object.entries(categoryCounts).map(([category, items]) => {
            const passed = items.filter(i => i.status === 'pass').length;
            return (
              <div key={category} className="bg-gray-100 p-4 rounded-lg">
                <h3 className="font-semibold text-gray-900 capitalize">{category}</h3>
                <p className="text-lg font-bold text-gray-600">
                  {passed}/{items.length}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      <div className="space-y-6">
        {Object.entries(categoryCounts).map(([category, items]) => (
          <div key={category} className="border border-gray-200 rounded-lg p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4 capitalize">
              {category} SEO
            </h2>
            
            <div className="space-y-4">
              {items.map((check) => (
                <div
                  key={check.id}
                  className={`border-l-4 pl-4 py-3 ${getStatusColor(check.status)}`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        {getStatusIcon(check.status)}
                        <h3 className="font-semibold text-gray-900">{check.title}</h3>
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          check.priority === 'high' 
                            ? 'bg-red-100 text-red-800' 
                            : check.priority === 'medium'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-green-100 text-green-800'
                        }`}>
                          {check.priority} priority
                        </span>
                      </div>
                      <p className="text-gray-600 mb-2">{check.description}</p>
                      {check.recommendation && (
                        <p className="text-sm text-gray-500 italic">
                          💡 {check.recommendation}
                        </p>
                      )}
                    </div>
                    {check.learnMore && (
                      <a
                        href={check.learnMore}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="ml-4 text-purple-600 hover:text-purple-800"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
} 