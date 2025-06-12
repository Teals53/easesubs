import Script from "next/script";
import { Metadata } from "next";

// Enhanced Organization Schema
export const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "EaseSubs",
  alternateName: ["Ease Subs", "EaseSubscriptions"],
  url: "https://easesubs.com",
  logo: {
    "@type": "ImageObject",
    url: "https://easesubs.com/logo.png",
    width: 512,
    height: 512,
  },
      image: "https://easesubs.com/og-image.png",
  description:
    "Get your favorite subscriptions at a fraction of the cost through our legal regional pricing system. Save up to 80% on premium services.",
  sameAs: [
    "https://twitter.com/easesubs",
    "https://facebook.com/easesubs",
    "https://linkedin.com/company/easesubs",
  ],
  contactPoint: {
    "@type": "ContactPoint",
    contactType: "customer service",
    email: "support@easesubs.com",
    availableLanguage: ["English"],
    areaServed: "Worldwide",
  },
  address: {
    "@type": "PostalAddress",
    addressCountry: "US",
    addressRegion: "Worldwide",
  },
  founder: {
    "@type": "Person",
    name: "EaseSubs Team",
  },
  foundingDate: "2024",
  numberOfEmployees: "10-50",
  slogan: "Same Subscriptions, Easier Prices",
  knowsAbout: [
    "Subscription Services",
    "Digital Products",
    "Regional Pricing",
    "E-commerce",
    "Software Licensing",
  ],
};

// Website Schema
export const websiteSchema = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "EaseSubs",
  url: "https://easesubs.com",
  description:
    "Premium subscription services at discounted prices through legal regional pricing",
  publisher: {
    "@type": "Organization",
    name: "EaseSubs",
  },
  potentialAction: {
    "@type": "SearchAction",
    target: {
      "@type": "EntryPoint",
      urlTemplate: "https://easesubs.com/search?q={search_term_string}",
    },
    "query-input": "required name=search_term_string",
  },
  mainEntity: {
    "@type": "ItemList",
    name: "Subscription Services",
    description: "Premium subscription services at discount prices",
  },
};

// Product Schema Generator
export function generateProductSchema(product: {
  name: string;
  description: string;
  price: number;
  originalPrice: number;
  currency: string;
  image: string;
  category: string;
  availability: string;
  slug: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description,
    image: [product.image],
    brand: {
      "@type": "Brand",
      name: product.name.split(" ")[0],
    },
    category: product.category,
    url: `https://easesubs.com/product/${product.slug}`,
    offers: {
      "@type": "Offer",
      price: product.price,
      priceCurrency: product.currency,
      availability: `https://schema.org/${product.availability}`,
      seller: {
        "@type": "Organization",
        name: "EaseSubs",
      },
      priceValidUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split("T")[0], // 30 days
      hasMerchantReturnPolicy: {
        "@type": "MerchantReturnPolicy",
        returnPolicyCategory:
          "https://schema.org/MerchantReturnFiniteReturnWindow",
        merchantReturnDays: 7,
      },
    },
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: "4.8",
      reviewCount: "150",
      bestRating: "5",
      worstRating: "1",
    },
    review: [
      {
        "@type": "Review",
        reviewRating: {
          "@type": "Rating",
          ratingValue: "5",
          bestRating: "5",
        },
        author: {
          "@type": "Person",
          name: "Verified Customer",
        },
        reviewBody:
          "Great service, significant savings on premium subscriptions!",
      },
    ],
  };
}

// FAQ Schema Generator
export function generateFAQSchema(
  faqs: Array<{ question: string; answer: string }>,
) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  };
}

// Article Schema Generator
export function generateArticleSchema(article: {
  title: string;
  description: string;
  author: string;
  publishDate: string;
  modifiedDate?: string;
  image: string;
  url: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: article.title,
    description: article.description,
    image: [article.image],
    author: {
      "@type": "Person",
      name: article.author,
    },
    publisher: {
      "@type": "Organization",
      name: "EaseSubs",
      logo: {
        "@type": "ImageObject",
        url: "https://easesubs.com/logo.png",
      },
    },
    datePublished: article.publishDate,
    dateModified: article.modifiedDate || article.publishDate,
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": article.url,
    },
  };
}

// Service Schema
export const serviceSchema = {
  "@context": "https://schema.org",
  "@type": "Service",
  name: "Discount Subscription Services",
  description: "Legal regional pricing for premium subscription services",
  provider: {
    "@type": "Organization",
    name: "EaseSubs",
  },
  serviceType: "E-commerce Platform",
  areaServed: "Worldwide",
  hasOfferCatalog: {
    "@type": "OfferCatalog",
    name: "Subscription Services",
    itemListElement: [
      {
        "@type": "OfferCatalog",
        name: "Streaming Services",
        itemListElement: [
          {
            "@type": "Offer",
            itemOffered: {
              "@type": "Service",
              name: "Netflix Premium Subscription",
            },
          },
          {
            "@type": "Offer",
            itemOffered: {
              "@type": "Service",
              name: "Disney Plus Subscription",
            },
          },
        ],
      },
    ],
  },
};

// Enhanced Metadata Generator
export function generateEnhancedMetadata({
  title,
  description,
  canonical,
  keywords = [],
  ogImage = "https://easesubs.com/og-image.png",
  type = "website",
  publishedTime,
  modifiedTime,
  author = "EaseSubs Team",
  section,
  tags = [],
}: {
  title: string;
  description: string;
  canonical: string;
  keywords?: string[];
  ogImage?: string;
  type?: string;
  publishedTime?: string;
  modifiedTime?: string;
  author?: string;
  section?: string;
  tags?: string[];
}): Metadata {
  const fullCanonical = canonical.startsWith("http")
    ? canonical
    : `https://easesubs.com${canonical}`;
  const fullOgImage = ogImage.startsWith("http")
    ? ogImage
    : `https://easesubs.com${ogImage}`;

  return {
    title,
    description,
    keywords: [
      ...keywords,
      "discount subscriptions",
      "cheap subscriptions",
      "subscription deals",
      "regional pricing",
    ].slice(0, 20),
    authors: [{ name: author }],
    creator: author,
    publisher: "EaseSubs",
    alternates: {
      canonical: fullCanonical,
    },
    openGraph: {
      type: type as "website" | "article",
      title,
      description,
      url: fullCanonical,
      siteName: "EaseSubs",
      images: [
        {
          url: fullOgImage,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
      locale: "en_US",
      ...(publishedTime && { publishedTime }),
      ...(modifiedTime && { modifiedTime }),
      ...(author && { authors: [author] }),
      ...(section && { section }),
      ...(tags.length > 0 && { tags }),
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [fullOgImage],
      creator: "@easesubs",
      site: "@easesubs",
    },
    robots: {
      index: true,
      follow: true,
      nocache: false,
      googleBot: {
        index: true,
        follow: true,
        noimageindex: false,
        "max-video-preview": -1,
        "max-image-preview": "large",
        "max-snippet": -1,
      },
    },
  };
}

// Combined Schema Component
interface AdvancedSEOProps {
  schemas?: Array<Record<string, unknown>>;
  children?: React.ReactNode;
}

export function AdvancedSEO({ schemas = [], children }: AdvancedSEOProps) {
  const combinedSchemas = [
    organizationSchema,
    websiteSchema,
    serviceSchema,
    ...schemas,
  ];

  return (
    <>
      <Script
        id="structured-data-main"
        type="application/ld+json"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@graph": combinedSchemas,
          }),
        }}
      />
      {children}
    </>
  );
}
