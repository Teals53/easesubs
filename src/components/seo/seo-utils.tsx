import { Metadata } from 'next';

// SEO Configuration Constants
export const SEO_CONFIG = {
  defaultTitle: 'EaseSubs - Same Subscriptions, Easier Prices | Save up to 80%',
  defaultDescription: 'Get your favorite subscriptions at a fraction of the cost through our legal regional pricing system. Save up to 80% on premium services like Netflix, Spotify, Adobe Creative Cloud, and more.',
  siteUrl: 'https://easesubs.com',
  siteName: 'EaseSubs',
  twitterHandle: '@easesubs',
  defaultImage: '/og-image.jpg',
  defaultKeywords: [
    'cheap subscriptions',
    'discount subscriptions',
    'netflix discount',
    'spotify premium cheap',
    'adobe creative cloud discount',
    'subscription deals',
    'regional pricing',
    'streaming services discount'
  ]
};

// Generate optimized title tags
export function generateTitle(pageTitle?: string, includeDefault = true): string {
  if (!pageTitle) return SEO_CONFIG.defaultTitle;
  
  if (includeDefault) {
    return `${pageTitle} | EaseSubs`;
  }
  
  return pageTitle;
}

// Generate meta description with optimal length
export function generateDescription(description: string, maxLength = 160): string {
  if (description.length <= maxLength) return description;
  
  // Truncate at word boundary
  const truncated = description.substring(0, maxLength);
  const lastSpaceIndex = truncated.lastIndexOf(' ');
  
  return lastSpaceIndex > 0 ? truncated.substring(0, lastSpaceIndex) + '...' : truncated + '...';
}

// Generate canonical URL
export function generateCanonicalUrl(path: string): string {
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${SEO_CONFIG.siteUrl}${cleanPath}`;
}

// FAQ structured data moved to advanced-seo to avoid duplication

// Performance optimization utilities
export function preloadCriticalResources() {
  return (
    <>
      {/* Preload critical fonts */}
      <link
        rel="preload"
        href="/fonts/inter-var.woff2"
        as="font"
        type="font/woff2"
        crossOrigin="anonymous"
      />
      
      {/* Preload critical images */}
      <link rel="preload" href="/og-image.jpg" as="image" type="image/jpeg" />
      
      {/* DNS prefetch for external resources */}
      <link rel="dns-prefetch" href="//fonts.googleapis.com" />
      <link rel="dns-prefetch" href="//fonts.gstatic.com" />
    </>
  );
}

// Generate hreflang tags for internationalization
export function generateHreflangTags(currentPath: string, locales: string[] = ['en']) {
  return locales.map(locale => (
    <link
      key={locale}
      rel="alternate"
      hrefLang={locale}
      href={`${SEO_CONFIG.siteUrl}${locale === 'en' ? '' : `/${locale}`}${currentPath}`}
    />
  ));
}

// Enhanced metadata generator
interface GenerateMetadataProps {
  title?: string;
  description?: string;
  path?: string;
  keywords?: string[];
  image?: string;
  imageAlt?: string;
  type?: 'website' | 'article';
  publishedTime?: string;
  modifiedTime?: string;
  author?: string;
  noIndex?: boolean;
  noFollow?: boolean;
}

export function generateMetadata({
  title,
  description,
  path = '',
  keywords = [],
  image,
  imageAlt,
  type = 'website',
  publishedTime,
  modifiedTime,
  author = 'EaseSubs Team',
  noIndex = false,
  noFollow = false
}: GenerateMetadataProps): Metadata {
  const fullTitle = generateTitle(title);
  const fullDescription = generateDescription(description || SEO_CONFIG.defaultDescription);
  const canonicalUrl = generateCanonicalUrl(path);
  const fullImage = image?.startsWith('http') ? image : `${SEO_CONFIG.siteUrl}${image || SEO_CONFIG.defaultImage}`;
  const allKeywords = [...SEO_CONFIG.defaultKeywords, ...keywords];
  
  // Generate robots directive
  const robotsDirectives = [];
  if (noIndex) robotsDirectives.push('noindex');
  else robotsDirectives.push('index');
  
  if (noFollow) robotsDirectives.push('nofollow');
  else robotsDirectives.push('follow');
  
  return {
    title: fullTitle,
    description: fullDescription,
    keywords: allKeywords,
    authors: [{ name: author }],
    creator: author,
    publisher: SEO_CONFIG.siteName,
    applicationName: SEO_CONFIG.siteName,
    generator: 'Next.js',
    referrer: 'origin-when-cross-origin',
    alternates: {
      canonical: canonicalUrl,
    },
    robots: {
      index: !noIndex,
      follow: !noFollow,
      nocache: false,
      googleBot: {
        index: !noIndex,
        follow: !noFollow,
        noimageindex: false,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
    openGraph: {
      type,
      locale: 'en_US',
      url: canonicalUrl,
      title: fullTitle,
      description: fullDescription,
      siteName: SEO_CONFIG.siteName,
      images: [
        {
          url: fullImage,
          width: 1200,
          height: 630,
          alt: imageAlt || fullTitle,
          type: 'image/jpeg',
        },
      ],
      ...(type === 'article' && publishedTime && {
        publishedTime,
      }),
      ...(type === 'article' && modifiedTime && {
        modifiedTime,
      }),
    },
    twitter: {
      card: 'summary_large_image',
      title: fullTitle,
      description: fullDescription,
      images: [fullImage],
      creator: SEO_CONFIG.twitterHandle,
      site: SEO_CONFIG.twitterHandle,
    },
  };
}

// Analytics, CriticalCSS, and PerformanceMonitoring functions removed - not being used

// Utility to extract text content for meta descriptions from rich content
export function extractTextContent(htmlString: string, maxLength = 160): string {
  // Remove HTML tags
  const text = htmlString.replace(/<[^>]*>/g, ' ');
  // Clean up whitespace
  const cleaned = text.replace(/\s+/g, ' ').trim();
  
  return generateDescription(cleaned, maxLength);
}

// Generate Open Graph image URL with dynamic text
export function generateOGImageUrl(title: string, subtitle?: string): string {
  const params = new URLSearchParams({
    title: title.slice(0, 60), // Limit title length
    ...(subtitle && { subtitle: subtitle.slice(0, 80) }),
  });
  
  return `/api/og?${params.toString()}`;
}

// Product rich snippet function removed - not being used 