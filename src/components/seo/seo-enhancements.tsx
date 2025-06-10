import Script from 'next/script';
import { Metadata } from 'next';

// Enhanced meta tags generator for different page types
export function generatePageMetadata({
  title,
  description,
  keywords = [],
  canonical,
  ogImage = '/og-image.jpg',
  ogType = 'website',
  publishedTime,
  modifiedTime,
  author = 'EaseSubs Team',
  section,
  tags = [],
  noindex = false,
  nofollow = false
}: {
  title: string;
  description: string;
  keywords?: string[];
  canonical: string;
  ogImage?: string;
  ogType?: string;
  publishedTime?: string;
  modifiedTime?: string;
  author?: string;
  section?: string;
  tags?: string[];
  noindex?: boolean;
  nofollow?: boolean;
}): Metadata {
  const baseUrl = 'https://easesubs.com';
  const fullCanonical = canonical.startsWith('http') ? canonical : `${baseUrl}${canonical}`;
  
  // Ensure description is under 160 characters
  const optimizedDescription = description.length > 160 
    ? `${description.substring(0, 157)}...`
    : description;

  // Ensure title is under 60 characters
  const optimizedTitle = title.length > 60 
    ? `${title.substring(0, 57)}...`
    : title;

  return {
    title: optimizedTitle,
    description: optimizedDescription,
    keywords: keywords.join(', '),
    alternates: {
      canonical: fullCanonical,
    },
    openGraph: {
      title: optimizedTitle,
      description: optimizedDescription,
      url: fullCanonical,
      siteName: 'EaseSubs',
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: `${title} - EaseSubs`,
        },
      ],
      locale: 'en_US',
      type: ogType as 'website' | 'article',
      ...(publishedTime && { publishedTime }),
      ...(modifiedTime && { modifiedTime }),
      ...(section && { section }),
      ...(tags.length > 0 && { tags }),
    },
    twitter: {
      card: 'summary_large_image',
      title: optimizedTitle,
      description: optimizedDescription,
      images: [ogImage],
      creator: '@easesubs',
      site: '@easesubs',
    },
    authors: [{ name: author }],
    robots: {
      index: !noindex,
      follow: !nofollow,
      nocache: false,
      googleBot: {
        index: !noindex,
        follow: !nofollow,
        noimageindex: false,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
    other: {
      'article:author': author,
      ...(section && { 'article:section': section }),
      ...(tags.length > 0 && { 'article:tag': tags.join(', ') }),
    },
  };
}

// JSON-LD structured data for different page types
export function ProductPageStructuredData({ 
  product 
}: { 
  product: {
    name: string;
    description: string;
    price: number;
    originalPrice?: number;
    currency: string;
    image?: string;
    slug: string;
    category?: string;
    brand?: string;
    availability?: 'InStock' | 'OutOfStock' | 'PreOrder';
    rating?: number;
    reviewCount?: number;
  }
}) {
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.description,
    image: product.image || '/og-image.jpg',
    url: `https://easesubs.com/product/${product.slug}`,
    brand: {
      '@type': 'Brand',
      name: product.brand || product.name.split(' ')[0]
    },
    category: product.category || 'Software',
    offers: {
      '@type': 'Offer',
      price: product.price,
      priceCurrency: product.currency,
      availability: `https://schema.org/${product.availability || 'InStock'}`,
      url: `https://easesubs.com/product/${product.slug}`,
      seller: {
        '@type': 'Organization',
        name: 'EaseSubs',
        url: 'https://easesubs.com'
      },
      priceValidUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      ...(product.originalPrice && {
        priceSpecification: {
          '@type': 'PriceSpecification',
          price: product.originalPrice,
          priceCurrency: product.currency,
          name: 'Original Price'
        }
      })
    },
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: product.rating || 4.8,
      reviewCount: product.reviewCount || 127,
      bestRating: 5,
      worstRating: 1
    }
  };

  return (
    <Script
      id="product-structured-data"
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(structuredData),
      }}
    />
  );
}

// Breadcrumb structured data
export function BreadcrumbStructuredData({ 
  items 
}: { 
  items: Array<{ name: string; url?: string }> 
}) {
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      ...(item.url && {
        item: {
          '@type': 'WebPage',
          '@id': item.url.startsWith('http') ? item.url : `https://easesubs.com${item.url}`,
          url: item.url.startsWith('http') ? item.url : `https://easesubs.com${item.url}`
        }
      })
    }))
  };

  return (
    <Script
      id="breadcrumb-structured-data"
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(structuredData),
      }}
    />
  );
}

// FAQ structured data
export function FAQStructuredData({ 
  faqs 
}: { 
  faqs: Array<{ question: string; answer: string }> 
}) {
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map(faq => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer
      }
    }))
  };

  return (
    <Script
      id="faq-structured-data"
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(structuredData),
      }}
    />
  );
}

// Article structured data for blog posts
export function ArticleStructuredData({ 
  article 
}: { 
  article: {
    title: string;
    description: string;
    author: string;
    publishDate: string;
    modifiedDate?: string;
    image: string;
    url: string;
    category?: string;
    tags?: string[];
  }
}) {
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: article.title,
    description: article.description,
    image: [article.image],
    author: {
      '@type': 'Person',
      name: article.author
    },
    publisher: {
      '@type': 'Organization',
      name: 'EaseSubs',
      logo: {
        '@type': 'ImageObject',
        url: 'https://easesubs.com/logo.png'
      }
    },
    datePublished: article.publishDate,
    dateModified: article.modifiedDate || article.publishDate,
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': article.url
    },
    ...(article.category && { articleSection: article.category }),
    ...(article.tags && { keywords: article.tags.join(', ') })
  };

  return (
    <Script
      id="article-structured-data"
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(structuredData),
      }}
    />
  );
}

// Local Business structured data for contact pages
export function LocalBusinessStructuredData() {
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: 'EaseSubs',
    description: 'Premium subscription services at discounted prices through legal regional pricing',
    url: 'https://easesubs.com',
    logo: 'https://easesubs.com/logo.png',
    image: 'https://easesubs.com/og-image.jpg',
    telephone: '+1-555-EASESUBS',
    email: 'support@easesubs.com',
    address: {
      '@type': 'PostalAddress',
      addressCountry: 'US'
    },
    openingHours: 'Mo-Su 00:00-23:59',
    sameAs: [
      'https://twitter.com/easesubs',
      'https://discord.gg/easesubs'
    ],
    priceRange: '$2.99-$19.99',
    paymentAccepted: 'Credit Card, PayPal, Cryptocurrency',
    currenciesAccepted: 'USD, EUR, GBP'
  };

  return (
    <Script
      id="local-business-structured-data"
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(structuredData),
      }}
    />
  );
}

// SEO monitoring and analytics
export function SEOAnalytics() {
  return (
    <>
      {/* Google Analytics 4 */}
      <Script
        src="https://www.googletagmanager.com/gtag/js?id=GA_MEASUREMENT_ID"
        strategy="afterInteractive"
      />
      <Script id="google-analytics" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', 'GA_MEASUREMENT_ID', {
            page_title: document.title,
            page_location: window.location.href,
            content_group1: 'Subscription Marketplace'
          });
        `}
      </Script>

      {/* Search Console verification */}
      <meta name="google-site-verification" content="your-google-verification-code" />
      
      {/* Bing Webmaster Tools */}
      <meta name="msvalidate.01" content="your-bing-verification-code" />
      
      {/* Yandex verification */}
      <meta name="yandex-verification" content="your-yandex-verification-code" />
    </>
  );
}

// Core Web Vitals monitoring
export function CoreWebVitalsMonitoring() {
  return (
    <Script
      id="core-web-vitals"
      strategy="afterInteractive"
      dangerouslySetInnerHTML={{
        __html: `
          function sendToAnalytics(metric) {
            if (window.gtag) {
              gtag('event', metric.name, {
                event_category: 'Web Vitals',
                event_label: metric.id,
                value: Math.round(metric.name === 'CLS' ? metric.value * 1000 : metric.value),
                non_interaction: true,
              });
            }
          }

          // Import and use web-vitals library
          import('https://unpkg.com/web-vitals@3/dist/web-vitals.js').then(({ getCLS, getFID, getFCP, getLCP, getTTFB }) => {
            getCLS(sendToAnalytics);
            getFID(sendToAnalytics);
            getFCP(sendToAnalytics);
            getLCP(sendToAnalytics);
            getTTFB(sendToAnalytics);
          });
        `,
      }}
    />
  );
}

// Hreflang tags for international SEO
export function HreflangTags({ 
  currentPath,
  languages = ['en', 'es', 'fr', 'de'] 
}: { 
  currentPath: string;
  languages?: string[];
}) {
  return (
    <>
      {languages.map((lang) => (
        <link
          key={lang}
          rel="alternate"
          hrefLang={lang}
          href={`https://easesubs.com/${lang}${currentPath}`}
        />
      ))}
      <link
        rel="alternate"
        hrefLang="x-default"
        href={`https://easesubs.com${currentPath}`}
      />
    </>
  );
}

// Social media meta tags
export function SocialMediaTags({
  title,
  description,
  image = '/og-image.jpg',
  url,
  type = 'website'
}: {
  title: string;
  description: string;
  image?: string;
  url: string;
  type?: string;
}) {
  return (
    <>
      {/* Facebook Open Graph */}
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={image} />
      <meta property="og:url" content={url} />
      <meta property="og:type" content={type} />
      <meta property="og:site_name" content="EaseSubs" />
      
      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:site" content="@easesubs" />
      <meta name="twitter:creator" content="@easesubs" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />
      
      {/* LinkedIn */}
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={image} />
      <meta property="og:url" content={url} />
    </>
  );
} 