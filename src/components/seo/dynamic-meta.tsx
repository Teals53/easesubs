import { Metadata } from 'next'

interface SEOConfig {
  title: string
  description: string
  keywords?: string[]
  canonical?: string
  ogImage?: string
  ogType?: 'website' | 'article'
  author?: string
  publishedTime?: string
  modifiedTime?: string
  category?: string
  tags?: string[]
  price?: number
  currency?: string
  availability?: 'InStock' | 'OutOfStock' | 'PreOrder'
  brand?: string
  schemaType?: 'WebPage' | 'Product' | 'Article' | 'FAQPage' | 'Organization'
}

export function generateDynamicMetadata(config: SEOConfig): Metadata {
  const baseUrl = 'https://easesubs.com'
  const {
    title,
    description,
    keywords = [],
    canonical,
    ogImage = '/og-image.jpg',
    ogType = 'website',
    author = 'EaseSubs Team',
    publishedTime,
    modifiedTime,
    category,
    tags = [],
  } = config

  const fullTitle = title.includes('EaseSubs') ? title : `${title} | EaseSubs`
  const canonicalUrl = canonical ? `${baseUrl}${canonical}` : baseUrl
  
  // Enhanced keyword generation
  const baseKeywords = [
    'discount subscriptions',
    'cheap subscriptions', 
    'subscription deals',
    'regional pricing',
    'premium accounts',
    'easesubs'
  ]
  
  const allKeywords = [...new Set([...keywords, ...baseKeywords, ...(tags || [])])]

  return {
    title: fullTitle,
    description,
    keywords: allKeywords,
    authors: [{ name: author, url: baseUrl }],
    creator: author,
    publisher: 'EaseSubs',
    robots: {
      index: true,
      follow: true,
      nocache: false,
      googleBot: {
        index: true,
        follow: true,
        noimageindex: false,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
    alternates: {
      canonical: canonicalUrl,
      languages: {
        'en-US': canonicalUrl,
        'en': canonicalUrl,
      },
    },
    openGraph: {
      type: ogType,
      locale: 'en_US',
      url: canonicalUrl,
      title: fullTitle,
      description,
      siteName: 'EaseSubs',
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: `${title} - EaseSubs`,
          type: 'image/jpeg',
        },
      ],
      ...(publishedTime && { publishedTime }),
      ...(modifiedTime && { modifiedTime }),
      ...(author && { authors: [author] }),
      ...(category && { section: category }),
      ...(tags && tags.length > 0 && { tags }),
    },
    twitter: {
      card: 'summary_large_image',
      title: fullTitle,
      description,
      images: [
        {
          url: ogImage,
          alt: `${title} - EaseSubs`,
        },
      ],
      creator: '@easesubs',
      site: '@easesubs',
    },
    other: {
      'article:author': author,
      ...(category && { 'article:section': category }),
      ...(tags && tags.length > 0 && { 'article:tag': tags.join(', ') }),
    },
  }
}

// Preset configurations for common page types
export const seoPresets = {
  homepage: {
    title: 'EaseSubs - Same Subscriptions, Easier Prices | Save up to 80%',
    description: 'Get your favorite subscriptions at a fraction of the cost through our legal regional pricing system. Save up to 80% on premium services like Netflix, Spotify, Adobe Creative Cloud, and more.',
    keywords: ['subscription marketplace', 'streaming deals', 'software discounts', 'netflix discount', 'spotify premium cheap'],
    canonical: '/',
    ogType: 'website' as const,
  },
  
  productPage: (productName: string, price: number, originalPrice: number) => ({
    title: `${productName} Subscription - Save ${Math.round(((originalPrice - price) / originalPrice) * 100)}%`,
    description: `Get ${productName} subscription at just $${price} instead of $${originalPrice}. Instant delivery, lifetime support, and premium features included.`,
    keywords: [
      `${productName.toLowerCase()}`,
      `${productName.toLowerCase()} discount`,
      `${productName.toLowerCase()} cheap`,
      `${productName.toLowerCase()} deal`,
      'subscription discount',
    ],
    ogType: 'website' as const,
    schemaType: 'Product' as const,
  }),
  
  categoryPage: (category: string) => ({
    title: `${category.charAt(0).toUpperCase() + category.slice(1)} Subscriptions - Best Deals`,
    description: `Discover the best ${category} subscription deals. Save up to 80% on premium ${category} services with instant delivery and lifetime support.`,
    keywords: [
      `${category} subscriptions`,
      `${category} deals`, 
      `discount ${category}`,
      `cheap ${category} subscriptions`,
    ],
    canonical: `/#${category}`,
    category,
  }),
  
  authPage: (type: 'signin' | 'signup') => ({
    title: type === 'signin' ? 'Sign In to EaseSubs' : 'Join EaseSubs - Start Saving Today',
    description: type === 'signin' 
      ? 'Sign in to your EaseSubs account to access your subscriptions and exclusive deals.'
      : 'Join thousands of users saving money on premium subscriptions. Sign up for free and start saving today.',
    keywords: type === 'signin' 
      ? ['sign in', 'login', 'account access']
      : ['sign up', 'register', 'create account', 'join'],
    canonical: `/auth/${type}`,
    robots: {
      index: false,
      follow: true,
    },
  }),
  
  legalPage: (type: 'privacy-policy' | 'terms-of-service' | 'refund-policy') => {
    const titles = {
      'privacy-policy': 'Privacy Policy',
      'terms-of-service': 'Terms of Service', 
      'refund-policy': 'Refund Policy'
    }
    
    const descriptions = {
      'privacy-policy': 'Learn how EaseSubs collects, uses, and protects your personal information. Your privacy is our priority.',
      'terms-of-service': 'Read our terms of service to understand your rights and responsibilities when using EaseSubs.',
      'refund-policy': 'Understand our refund policy and how to request refunds for EaseSubs purchases.'
    }
    
    return {
      title: titles[type],
      description: descriptions[type],
      canonical: `/legal/${type}`,
      robots: {
        index: true,
        follow: true,
      },
    }
  },
  
  blogPost: (title: string, description: string, slug: string, publishedTime: string) => ({
    title: `${title} | EaseSubs Blog`,
    description,
    keywords: ['subscription tips', 'money saving', 'streaming guides', 'tech deals'],
    canonical: `/blog/${slug}`,
    ogType: 'article' as const,
    publishedTime,
    modifiedTime: publishedTime,
    schemaType: 'Article' as const,
  }),
  
  dashboardPage: (pageName: string) => ({
    title: `${pageName} - Dashboard`,
    description: `Manage your ${pageName.toLowerCase()} on EaseSubs dashboard.`,
    canonical: `/dashboard/${pageName.toLowerCase().replace(' ', '-')}`,
    robots: {
      index: false,
      follow: false,
    },
  }),
}

// Helper function to generate structured data
export function generateStructuredData(config: SEOConfig & { url?: string }) {
  const baseUrl = 'https://easesubs.com'
  const url = config.url || baseUrl
  
  switch (config.schemaType) {
    case 'Product':
      return {
        '@context': 'https://schema.org',
        '@type': 'Product',
        name: config.title,
        description: config.description,
        brand: {
          '@type': 'Brand',
          name: config.brand || 'EaseSubs'
        },
        offers: {
          '@type': 'Offer',
          price: config.price || 0,
          priceCurrency: config.currency || 'USD',
          availability: `https://schema.org/${config.availability || 'InStock'}`,
          seller: {
            '@type': 'Organization',
            name: 'EaseSubs'
          }
        }
      }
    
    case 'Article':
      return {
        '@context': 'https://schema.org',
        '@type': 'Article',
        headline: config.title,
        description: config.description,
        author: {
          '@type': 'Person',
          name: config.author || 'EaseSubs Team'
        },
        publisher: {
          '@type': 'Organization',
          name: 'EaseSubs',
          logo: {
            '@type': 'ImageObject',
            url: `${baseUrl}/logo.png`
          }
        },
        datePublished: config.publishedTime,
        dateModified: config.modifiedTime || config.publishedTime,
        mainEntityOfPage: {
          '@type': 'WebPage',
          '@id': url
        }
      }
    
    default:
      return {
        '@context': 'https://schema.org',
        '@type': 'WebPage',
        name: config.title,
        description: config.description,
        url,
        isPartOf: {
          '@type': 'WebSite',
          name: 'EaseSubs',
          url: baseUrl
        }
      }
  }
}

// Component for injecting structured data
export function StructuredData({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(data, null, 2)
      }}
    />
  )
} 