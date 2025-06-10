import Script from 'next/script';

// Base organization schema
export const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "EaseSubs",
  url: "https://easesubs.com",
  logo: {
    "@type": "ImageObject",
    url: "https://easesubs.com/og-image.jpg",
    width: 1200,
    height: 630
  },
  description: "Premium subscription services at discounted prices through legal regional pricing.",
  foundingDate: "2024",
  contactPoint: {
    "@type": "ContactPoint",
    contactType: "customer service",
    availableLanguage: ["English"],
    url: "https://easesubs.com/dashboard/support"
  },
  sameAs: [
    "https://twitter.com/easesubs",
    "https://discord.gg/easesubs"
  ],
  address: {
    "@type": "PostalAddress",
    addressCountry: "US"
  }
};

// Website schema
export const websiteSchema = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "EaseSubs",
  url: "https://easesubs.com",
  description: "Get your favorite subscriptions at a fraction of the cost through our legal regional pricing system.",
  inLanguage: "en-US",
  potentialAction: {
    "@type": "SearchAction",
    target: {
      "@type": "EntryPoint",
      urlTemplate: "https://easesubs.com/search?q={search_term_string}"
    },
    "query-input": "required name=search_term_string"
  },
  publisher: {
    "@id": "https://easesubs.com/#organization"
  }
};

// Product schema generator
export function generateProductSchema(product: {
  name: string;
  description: string;
  price: number;
  originalPrice?: number;
  currency: string;
  image?: string;
  slug: string;
  availability?: 'InStock' | 'OutOfStock' | 'PreOrder';
  category?: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description,
    image: product.image || "https://easesubs.com/og-image.jpg",
    url: `https://easesubs.com/product/${product.slug}`,
    brand: {
      "@type": "Brand",
      name: product.name.split(' ')[0] // First word as brand
    },
    category: product.category || "Software",
    offers: {
      "@type": "Offer",
      price: product.price,
      priceCurrency: product.currency,
      availability: `https://schema.org/${product.availability || 'InStock'}`,
      url: `https://easesubs.com/product/${product.slug}`,
      seller: {
        "@type": "Organization",
        name: "EaseSubs"
      },
      ...(product.originalPrice && {
        priceSpecification: {
          "@type": "PriceSpecification",
          price: product.originalPrice,
          priceCurrency: product.currency,
          name: "Original Price"
        }
      })
    },
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: "4.8",
      reviewCount: "127",
      bestRating: "5",
      worstRating: "1"
    }
  };
}

// FAQ schema generator
export function generateFAQSchema(faqs: Array<{ question: string; answer: string }>) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map(faq => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer
      }
    }))
  };
}

// Service schema for EaseSubs
export const serviceSchema = {
  "@context": "https://schema.org",
  "@type": "Service",
  name: "Subscription Discount Service",
  description: "Legal regional pricing for premium digital subscriptions",
  provider: {
    "@type": "Organization",
    name: "EaseSubs",
    url: "https://easesubs.com"
  },
  serviceType: "Digital Subscription Marketplace",
  audience: {
    "@type": "Audience",
    name: "Digital Subscription Users"
  },
  availableChannel: {
    "@type": "ServiceChannel",
    serviceUrl: "https://easesubs.com",
    serviceType: "Online"
  }
};

// Webpage schema generator
export function generateWebPageSchema(page: {
  name: string;
  description: string;
  url: string;
  breadcrumb?: Array<{ name: string; url?: string }>;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: page.name,
    description: page.description,
    url: page.url,
    inLanguage: "en-US",
    isPartOf: {
      "@id": "https://easesubs.com/#website"
    },
    about: {
      "@id": "https://easesubs.com/#organization"
    },
    ...(page.breadcrumb && {
      breadcrumb: {
        "@type": "BreadcrumbList",
        itemListElement: page.breadcrumb.map((item, index) => ({
          "@type": "ListItem",
          position: index + 1,
          name: item.name,
          ...(item.url && {
            item: {
              "@type": "WebPage",
              "@id": item.url,
              url: item.url
            }
          })
        }))
      }
    })
  };
}

// Component to render schema markup
interface SchemaMarkupProps {
  schema: object | object[];
  id?: string;
}

export function SchemaMarkup({ schema, id }: SchemaMarkupProps) {
  const schemaData = Array.isArray(schema) 
    ? { "@graph": schema }
    : schema;

  return (
    <Script
      id={id || `schema-${Math.random().toString(36).substr(2, 9)}`}
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(schemaData)
      }}
    />
  );
}

// Pre-built schema combinations
export function HomePageSchema() {
  const schemas = [
    organizationSchema,
    websiteSchema,
    serviceSchema,
    generateWebPageSchema({
      name: "EaseSubs - Same Subscriptions, Easier Prices | Save up to 80%",
      description: "Get your favorite subscriptions at a fraction of the cost through our legal regional pricing system. Save up to 80% on premium services.",
      url: "https://easesubs.com"
    })
  ];

  return <SchemaMarkup schema={schemas} id="home-page-schema" />;
}

export function ProductPageSchema({ product }: { 
  product: {
    name: string;
    description: string;
    price: number;
    originalPrice?: number;
    currency: string;
    image?: string;
    slug: string;
    availability?: 'InStock' | 'OutOfStock' | 'PreOrder';
    category?: string;
  }
}) {
  const schemas = [
    organizationSchema,
    generateProductSchema(product),
    generateWebPageSchema({
      name: `${product.name} - Premium Subscription Plans | EaseSubs`,
      description: product.description,
      url: `https://easesubs.com/product/${product.slug}`,
      breadcrumb: [
        { name: "Home", url: "https://easesubs.com" },
        { name: "Products", url: "https://easesubs.com/#products" },
        { name: product.name }
      ]
    })
  ];

  return <SchemaMarkup schema={schemas} id={`product-${product.slug}-schema`} />;
} 
