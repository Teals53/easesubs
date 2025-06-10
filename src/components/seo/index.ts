// Core SEO Components
export { AdvancedSEO, generateEnhancedMetadata } from './advanced-seo';
export { PerformanceSEO, ResourceHints } from './performance-seo';
export { MetaTags } from './meta-tags';
export { SchemaMarkup } from './schema-markup';

// Enhanced Image Components
export { OptimizedImage } from './optimized-image';
export { EnhancedImage } from './enhanced-image';

// SEO Utilities
export { 
  generateCanonicalUrl
} from './seo-utils';

// Dynamic Meta Generation
export { 
  generateDynamicMetadata,
  generateStructuredData,
  StructuredData,
  seoPresets 
} from './dynamic-meta';

// Structure and Navigation
export { Breadcrumbs } from './breadcrumbs';

// Schema Components
export { 
  ECommerceSchema,
  SubscriptionServiceSchema
} from './local-business-schema';

// SEO Audit and Analytics
export { SEOAudit, DevSEOAudit } from './seo-audit';
export { SEOChecklist } from './seo-checklist';

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

// Image Components
export {
  LogoImage,
  ProductImage,
  HeroImage,
} from './enhanced-image';

// Header Structure Components
export {
  H1,
  H2,
  H3,
  H4,
  H5,
  H6,
  PageTitle,
  SectionHeader,
  TableOfContents,
  validateHeaderStructure,
} from './header-structure';

// Internal linking components
export {
  RelatedProducts,
  FooterLinks,
  ContextualLinks,
  SEOBreadcrumbs,
  internalLinks,
} from './internal-linking';

// Performance and audit components
export {
  CriticalCSS,
} from './performance-seo';

// Image optimization
export { ImageSchema } from './optimized-image';

// SEO utilities from lib
export {
  performSEOAudit,
  generateSEORecommendations,
  logSEOAudit,
  checkMetaTitle,
  checkMetaDescription,
  checkCanonicalURL,
  checkHeaderStructure,
  checkImageAltText,
  checkInternalLinks,
  checkPageLoadSpeed,
  checkStructuredData,
  checkOpenGraph,
} from '../../lib/seo-checker';

// Master SEO checklist component
export { SEOMasterChecklist } from './seo-master-checklist';

 