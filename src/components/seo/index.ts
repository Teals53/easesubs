// Core SEO Components
export { AdvancedSEO, generateEnhancedMetadata } from './advanced-seo';
export { PerformanceSEO, ResourceHints } from './performance-seo';
export { SchemaMarkup } from './schema-markup';

// SEO Utilities
export { 
  generateCanonicalUrl,
  generateMetadata,
  generateTitle,
  generateDescription,
  generateFAQStructuredData,
  generateProductRichSnippet,
  AnalyticsScripts,
  CriticalCSS,
  PerformanceMonitoring,
  SEO_CONFIG
} from './seo-utils';

// Schema Components
export { 
  ECommerceSchema,
  SubscriptionServiceSchema
} from './local-business-schema';

// SEO Types
export interface SEOData {
  title: string;
  description: string;
  keywords?: string[];
  canonical?: string;
  ogImage?: string;
  noindex?: boolean;
  nofollow?: boolean;
}

export interface ProductSEO {
  name: string;
  description: string;
  price: number;
  originalPrice?: number;
  currency: string;
  availability: 'InStock' | 'OutOfStock' | 'PreOrder';
  brand?: string;
  category?: string;
  sku?: string;
  gtin?: string;
}

export interface ArticleSEO {
  title: string;
  description: string;
  author: string;
  publishedTime: string;
  modifiedTime?: string;
  category?: string;
  tags?: string[];
  readingTime?: number;
}

// Enhanced SEO Components
export {
  generateFAQSchema,
  generateArticleSchema,
  organizationSchema,
  websiteSchema,
  serviceSchema,
} from './advanced-seo';

 