import Head from 'next/head';

export interface MetaTagsProps {
  title: string;
  description: string;
  canonical?: string;
  keywords?: string[];
  ogImage?: string;
  ogImageAlt?: string;
  ogType?: 'website' | 'article' | 'product';
  twitterCard?: 'summary' | 'summary_large_image' | 'app' | 'player';
  robots?: string;
  author?: string;
  publishedTime?: string;
  modifiedTime?: string;
  siteName?: string;
  locale?: string;
  alternateLocales?: string[];
  additionalTags?: React.ReactNode;
}

export function MetaTags({
  title,
  description,
  canonical,
  keywords = [],
  ogImage = '/og-image.jpg',
  ogImageAlt,
  ogType = 'website',
  twitterCard = 'summary_large_image',
  robots = 'index,follow',
  author = 'EaseSubs Team',
  publishedTime,
  modifiedTime,
  siteName = 'EaseSubs',
  locale = 'en_US',
  alternateLocales = [],
  additionalTags,
}: MetaTagsProps) {
  const fullCanonical = canonical?.startsWith('http') 
    ? canonical 
    : `https://easesubs.com${canonical || ''}`;

  const fullOgImage = ogImage?.startsWith('http') 
    ? ogImage 
    : `https://easesubs.com${ogImage}`;

  return (
    <Head>
      {/* Basic Meta Tags */}
      <title>{title}</title>
      <meta name="description" content={description} />
      <meta name="author" content={author} />
      
      {/* Keywords */}
      {keywords.length > 0 && (
        <meta name="keywords" content={keywords.join(', ')} />
      )}
      
      {/* Robots */}
      <meta name="robots" content={robots} />
      <meta name="googlebot" content="index,follow,max-video-preview:-1,max-image-preview:large,max-snippet:-1" />
      
      {/* Canonical URL */}
      {canonical && <link rel="canonical" href={fullCanonical} />}
      
      {/* Open Graph Tags */}
      <meta property="og:type" content={ogType} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={fullOgImage} />
      {ogImageAlt && <meta property="og:image:alt" content={ogImageAlt} />}
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:url" content={fullCanonical} />
      <meta property="og:site_name" content={siteName} />
      <meta property="og:locale" content={locale} />
      
      {/* Alternate Locales */}
      {alternateLocales.map((altLocale) => (
        <meta key={altLocale} property="og:locale:alternate" content={altLocale} />
      ))}
      
      {/* Article specific tags */}
      {ogType === 'article' && publishedTime && (
        <meta property="article:published_time" content={publishedTime} />
      )}
      {ogType === 'article' && modifiedTime && (
        <meta property="article:modified_time" content={modifiedTime} />
      )}
      {ogType === 'article' && (
        <meta property="article:author" content={author} />
      )}
      
      {/* Twitter Card Tags */}
      <meta name="twitter:card" content={twitterCard} />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={fullOgImage} />
      {ogImageAlt && <meta name="twitter:image:alt" content={ogImageAlt} />}
      <meta name="twitter:site" content="@easesubs" />
      <meta name="twitter:creator" content="@easesubs" />
      
      {/* Additional SEO Tags */}
      <meta name="format-detection" content="telephone=no" />
      <meta name="theme-color" content="#9333EA" />
      <meta name="msapplication-TileColor" content="#9333EA" />
      
      {/* Language and Region */}
      <meta httpEquiv="content-language" content="en-US" />
      
      {/* Additional custom tags */}
      {additionalTags}
    </Head>
  );
}

// Pre-configured meta tags for common pages
export const commonMetaTags = {
  home: {
    title: "EaseSubs - Same Subscriptions, Easier Prices | Save up to 80%",
    description: "Get your favorite subscriptions at a fraction of the cost through our legal regional pricing system. Save up to 80% on premium services like Netflix, Spotify, Adobe Creative Cloud, and more.",
    keywords: [
      "cheap subscriptions",
      "discount subscriptions", 
      "netflix discount",
      "spotify premium cheap",
      "adobe creative cloud discount",
      "subscription deals",
      "regional pricing",
      "streaming services discount"
    ],
    canonical: "/",
    ogImageAlt: "EaseSubs - Discount Subscriptions Platform"
  },
  
  signin: {
    title: "Sign In | EaseSubs",
    description: "Sign in to your EaseSubs account to access premium subscriptions at discounted prices.",
    keywords: ["login", "sign in", "account access"],
    canonical: "/auth/signin",
    robots: "noindex,follow"
  },
  
  signup: {
    title: "Create Account | EaseSubs", 
    description: "Join EaseSubs today and start saving up to 80% on your favorite subscription services.",
    keywords: ["register", "sign up", "create account", "join"],
    canonical: "/auth/signup",
    robots: "noindex,follow"
  },
  
  privacy: {
    title: "Privacy Policy | EaseSubs",
    description: "Learn how EaseSubs protects your privacy and handles your personal information.",
    keywords: ["privacy policy", "data protection", "user privacy"],
    canonical: "/legal/privacy-policy"
  },
  
  terms: {
    title: "Terms of Service | EaseSubs",
    description: "Read EaseSubs terms of service and understand our policies for using our platform.",
    keywords: ["terms of service", "user agreement", "terms and conditions"],
    canonical: "/legal/terms-of-service"
  },
  
  refund: {
    title: "Refund Policy | EaseSubs",
    description: "Learn about EaseSubs refund policy and how to request refunds for your purchases.",
    keywords: ["refund policy", "money back guarantee", "returns"],
    canonical: "/legal/refund-policy"
  }
};

// Helper function to generate product meta tags
export function generateProductMetaTags(product: {
  name: string;
  description: string;
  slug: string;
  price?: number;
  currency?: string;
  image?: string;
}) {
  const priceText = product.price ? ` from $${product.price}` : '';
  
  return {
    title: `${product.name} - Premium Subscription Plans${priceText} | EaseSubs`,
    description: `Get premium ${product.name} subscription at discounted prices. ${product.description} Save up to 80% with our legal regional pricing system.`,
    keywords: [
      `${product.name.toLowerCase()} discount`,
      `${product.name.toLowerCase()} cheap`, 
      `${product.name.toLowerCase()} subscription`,
      `${product.name.toLowerCase()} premium`,
      'discount subscriptions',
      'subscription deals'
    ],
    canonical: `/product/${product.slug}`,
    ogImage: product.image || '/og-image.jpg',
    ogImageAlt: `${product.name} subscription plans on EaseSubs`,
    ogType: 'product' as const
  };
} 
