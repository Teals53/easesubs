import Script from "next/script";

// Enhanced e-commerce and service provider schema
export function ECommerceSchema() {
  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": ["Organization", "OnlineStore"],
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
      "Premium subscription services at discounted prices through legal regional pricing system. Save up to 80% on Netflix, Spotify, Adobe Creative Cloud, and more.",
    foundingDate: "2024",
    slogan: "Same Subscriptions, Easier Prices",
    email: "support@easesubs.com",
    telephone: "+1-555-EASESUBS",
    areaServed: {
      "@type": "GeoTargeting",
      geo: "Worldwide",
    },
    serviceArea: {
      "@type": "GeoTargeting",
      geo: "Worldwide",
    },
    currenciesAccepted: ["USD", "EUR", "GBP", "CAD", "AUD"],
    paymentAccepted: ["Credit Card", "Debit Card", "PayPal", "Cryptocurrency"],
    priceRange: "$1 - $50",
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
                "@type": "Product",
                name: "Netflix Premium",
                category: "Streaming Service",
              },
            },
            {
              "@type": "Offer",
              itemOffered: {
                "@type": "Product",
                name: "Disney Plus",
                category: "Streaming Service",
              },
            },
          ],
        },
        {
          "@type": "OfferCatalog",
          name: "Productivity Software",
          itemListElement: [
            {
              "@type": "Offer",
              itemOffered: {
                "@type": "SoftwareApplication",
                name: "Adobe Creative Cloud",
                category: "Design Software",
              },
            },
            {
              "@type": "Offer",
              itemOffered: {
                "@type": "SoftwareApplication",
                name: "Microsoft Office 365",
                category: "Productivity Software",
              },
            },
          ],
        },
      ],
    },
    knowsAbout: [
      "Subscription Services",
      "Digital Products",
      "Regional Pricing",
      "E-commerce",
      "Software Licensing",
      "Streaming Services",
      "Productivity Software",
      "Creative Tools",
    ],
    sameAs: [
      "https://twitter.com/easesubs",
      "https://facebook.com/easesubs",
      "https://linkedin.com/company/easesubs",
      "https://instagram.com/easesubs",
    ],
    contactPoint: [
      {
        "@type": "ContactPoint",
        contactType: "customer service",
        email: "support@easesubs.com",
        availableLanguage: ["English"],
        areaServed: "Worldwide",
        hoursAvailable: {
          "@type": "OpeningHoursSpecification",
          dayOfWeek: [
            "Monday",
            "Tuesday",
            "Wednesday",
            "Thursday",
            "Friday",
            "Saturday",
            "Sunday",
          ],
          opens: "00:00",
          closes: "23:59",
        },
      },
      {
        "@type": "ContactPoint",
        contactType: "sales",
        email: "sales@easesubs.com",
        availableLanguage: ["English"],
        areaServed: "Worldwide",
      },
    ],
    address: {
      "@type": "PostalAddress",
      addressCountry: "US",
      addressRegion: "Worldwide",
    },
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: "4.8",
      reviewCount: "1250",
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
          name: "Sarah Johnson",
        },
        reviewBody:
          "Amazing service! Saved over 60% on my Netflix and Spotify subscriptions. Customer support is excellent and the process is very straightforward.",
        datePublished: "2024-01-15",
      },
      {
        "@type": "Review",
        reviewRating: {
          "@type": "Rating",
          ratingValue: "5",
          bestRating: "5",
        },
        author: {
          "@type": "Person",
          name: "Mike Chen",
        },
        reviewBody:
          "Been using EaseSubs for 6 months now. Great savings on Adobe Creative Cloud and other software. Highly recommend!",
        datePublished: "2024-01-10",
      },
    ],
  };

  return (
    <Script
      id="ecommerce-schema"
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(organizationSchema),
      }}
    />
  );
}

// Service-specific schema for subscription services
export function SubscriptionServiceSchema() {
  const serviceSchema = {
    "@context": "https://schema.org",
    "@type": "Service",
    name: "Discount Subscription Services",
    provider: {
      "@type": "Organization",
      name: "EaseSubs",
    },
    serviceType: "Digital Subscription Marketplace",
    description:
      "Legal regional pricing system for premium subscription services. Access Netflix, Spotify, Adobe Creative Cloud, and more at up to 80% off regular prices.",
    areaServed: {
      "@type": "GeoTargeting",
      geo: "Worldwide",
    },
    availableChannel: {
      "@type": "ServiceChannel",
      serviceUrl: "https://easesubs.com",
      serviceSmsNumber: "+1-555-EASESUBS",
      servicePhone: "+1-555-EASESUBS",
    },
    category: [
      "Software",
      "Entertainment",
      "Productivity",
      "Creative Tools",
      "Streaming Services",
    ],
    offers: {
      "@type": "AggregateOffer",
      lowPrice: "1",
      highPrice: "50",
      priceCurrency: "USD",
      availability: "https://schema.org/InStock",
      validFrom: "2024-01-01",
      priceValidUntil: "2024-12-31",
    },
    hasOfferCatalog: {
      "@type": "OfferCatalog",
      name: "Premium Subscriptions at Discount Prices",
      itemListElement: [
        {
          "@type": "Offer",
          name: "Streaming Services Bundle",
          price: "15.99",
          priceCurrency: "USD",
        },
        {
          "@type": "Offer",
          name: "Productivity Software Package",
          price: "25.99",
          priceCurrency: "USD",
        },
      ],
    },
  };

  return (
    <Script
      id="service-schema"
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(serviceSchema),
      }}
    />
  );
}

// Software application schema for digital products
export function SoftwareApplicationSchema({
  product,
}: {
  product: {
    name: string;
    description: string;
    category: string;
    price: number;
    currency: string;
    applicationCategory: string;
    operatingSystem: string[];
  };
}) {
  const softwareSchema = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: product.name,
    description: product.description,
    applicationCategory: product.applicationCategory,
    operatingSystem: product.operatingSystem,
    offers: {
      "@type": "Offer",
      price: product.price,
      priceCurrency: product.currency,
      availability: "https://schema.org/InStock",
      seller: {
        "@type": "Organization",
        name: "EaseSubs",
      },
    },
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: "4.7",
      reviewCount: "89",
      bestRating: "5",
      worstRating: "1",
    },
    screenshot: `https://easesubs.com/images/${product.name.toLowerCase().replace(/\s+/g, "-")}-screenshot.jpg`,
    downloadUrl: "https://easesubs.com/dashboard",
    fileSize: "Varies by application",
    installUrl:
      "https://easesubs.com/product/" +
      product.name.toLowerCase().replace(/\s+/g, "-"),
    permissions: "Access to premium features",
    releaseNotes:
      "Access to latest version with all premium features included.",
  };

  return (
    <Script
      id={`software-schema-${product.name.toLowerCase().replace(/\s+/g, "-")}`}
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(softwareSchema),
      }}
    />
  );
}

// Product collection schema for category pages
export function ProductCollectionSchema({
  category,
  products,
}: {
  category: string;
  products: Array<{
    name: string;
    price: number;
    currency: string;
    description: string;
  }>;
}) {
  const collectionSchema = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: `${category} Subscriptions - Discounted Prices`,
    description: `Browse premium ${category.toLowerCase()} subscriptions at discounted prices. Save up to 80% on popular services.`,
    url: `https://easesubs.com/#${category.toLowerCase()}`,
    mainEntity: {
      "@type": "ItemList",
      name: `${category} Services`,
      description: `Premium ${category.toLowerCase()} subscription services`,
      numberOfItems: products.length,
      itemListElement: products.map((product, index) => ({
        "@type": "ListItem",
        position: index + 1,
        item: {
          "@type": "Product",
          name: product.name,
          description: product.description,
          offers: {
            "@type": "Offer",
            price: product.price,
            priceCurrency: product.currency,
            availability: "https://schema.org/InStock",
          },
        },
      })),
    },
    breadcrumb: {
      "@type": "BreadcrumbList",
      itemListElement: [
        {
          "@type": "ListItem",
          position: 1,
          name: "Home",
          item: "https://easesubs.com",
        },
        {
          "@type": "ListItem",
          position: 2,
          name: category,
          item: `https://easesubs.com/#${category.toLowerCase()}`,
        },
      ],
    },
  };

  return (
    <Script
      id={`collection-schema-${category.toLowerCase()}`}
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(collectionSchema),
      }}
    />
  );
}
