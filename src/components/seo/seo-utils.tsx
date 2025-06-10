import { Metadata } from 'next';
import Script from 'next/script';

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

// Generate structured data for FAQ sections
export function generateFAQStructuredData(faqs: Array<{ question: string; answer: string }>) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": faqs.map(faq => ({
      "@type": "Question",
      "name": faq.question,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": faq.answer
      }
    }))
  };
}

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

// Component for adding Google Analytics and other tracking
interface AnalyticsScriptsProps {
  googleAnalyticsId?: string;
  gtmId?: string;
  nonce?: string;
}

export function AnalyticsScripts({ googleAnalyticsId, gtmId, nonce }: AnalyticsScriptsProps) {
  return (
    <>
      {/* Google Analytics */}
      {googleAnalyticsId && (
        <>
          <Script
            src={`https://www.googletagmanager.com/gtag/js?id=${googleAnalyticsId}`}
            strategy="afterInteractive"
            nonce={nonce}
          />
          <Script id="google-analytics" strategy="afterInteractive" nonce={nonce}>
            {`
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', '${googleAnalyticsId}', {
                page_title: document.title,
                page_location: window.location.href,
                anonymize_ip: true,
                cookie_flags: 'SameSite=None;Secure'
              });
            `}
          </Script>
        </>
      )}

      {/* Google Tag Manager */}
      {gtmId && (
        <>
          <Script id="google-tag-manager" strategy="afterInteractive" nonce={nonce}>
            {`
              (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
              new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
              j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
              'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
              })(window,document,'script','dataLayer','${gtmId}');
            `}
          </Script>
          <noscript>
            <iframe
              src={`https://www.googletagmanager.com/ns.html?id=${gtmId}`}
              height="0"
              width="0"
              style={{ display: 'none', visibility: 'hidden' }}
            />
          </noscript>
        </>
      )}
    </>
  );
}

// Component for critical CSS inlining
interface CriticalCSSProps {
  css: string;
  nonce?: string;
}

export function CriticalCSS({ css, nonce }: CriticalCSSProps) {
  return (
    <style
      nonce={nonce}
      dangerouslySetInnerHTML={{
        __html: css,
      }}
    />
  );
}

// Performance monitoring script
export function PerformanceMonitoring({ nonce }: { nonce?: string }) {
  return (
    <Script id="performance-monitoring" strategy="afterInteractive" nonce={nonce}>
      {`
        // Core Web Vitals monitoring
        function sendToAnalytics(metric) {
          if (typeof gtag !== 'undefined') {
            gtag('event', metric.name, {
              event_category: 'Web Vitals',
              event_label: metric.id,
              value: Math.round(metric.name === 'CLS' ? metric.value * 1000 : metric.value),
              non_interaction: true,
            });
          }
        }

        // Load web-vitals library and measure
        if ('web-vitals' in window) {
          const { getCLS, getFID, getFCP, getLCP, getTTFB } = window['web-vitals'];
          getCLS(sendToAnalytics);
          getFID(sendToAnalytics);
          getFCP(sendToAnalytics);
          getLCP(sendToAnalytics);
          getTTFB(sendToAnalytics);
        }
      `}
    </Script>
  );
}

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

// Helper to generate rich snippets for products
export function generateProductRichSnippet(product: {
  name: string;
  description: string;
  price: number;
  originalPrice?: number;
  currency: string;
  image?: string;
  rating?: number;
  reviewCount?: number;
  availability?: 'InStock' | 'OutOfStock' | 'PreOrder';
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    "name": product.name,
    "description": product.description,
    "image": product.image || `${SEO_CONFIG.siteUrl}/og-image.jpg`,
    "offers": {
      "@type": "Offer",
      "price": product.price,
      "priceCurrency": product.currency,
      "availability": `https://schema.org/${product.availability || 'InStock'}`,
      "url": window.location.href,
      "seller": {
        "@type": "Organization",
        "name": SEO_CONFIG.siteName
      },
      ...(product.originalPrice && {
        "priceSpecification": {
          "@type": "PriceSpecification",
          "price": product.originalPrice,
          "priceCurrency": product.currency
        }
      })
    },
    ...(product.rating && product.reviewCount && {
      "aggregateRating": {
        "@type": "AggregateRating",
        "ratingValue": product.rating,
        "reviewCount": product.reviewCount,
        "bestRating": 5,
        "worstRating": 1
      }
    })
  };
} 