import { Metadata } from "next";
import { notFound } from "next/navigation";
import ProductPageClient from "./product-page-client";
import { generateProductSchema, generateEnhancedMetadata } from "@/components/seo/advanced-seo";

import Script from "next/script";

interface PageProps {
  params: Promise<{ slug: string }>;
}

// Helper function to get product category from slug
function getProductCategory(slug: string): string {
  const categoryMap: Record<string, string> = {
    'netflix-premium': 'streaming',
    'disney-plus': 'streaming',
    'spotify-premium': 'music',
    'apple-music': 'music',
    'adobe-creative-cloud': 'creative',
    'canva-pro': 'creative',
    'notion-pro': 'productivity',
    'chatgpt-plus': 'productivity',
    'github-pro': 'development',
    'coursera-plus': 'education',
  };
  
  return categoryMap[slug] || 'digital-services';
}

// Helper function to get product details
function getProductDetails(slug: string) {
  const productName = slug
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

  const category = getProductCategory(slug);
  const categoryDisplayName = category.charAt(0).toUpperCase() + category.slice(1);
  
  // Mock pricing data - in real implementation, fetch from database
  const pricing = {
    originalPrice: 15.99,
    discountPrice: 4.99,
    currency: 'USD',
    discount: 69,
  };

  return {
    name: productName,
    category,
    categoryDisplayName,
    pricing,
    description: `Get premium ${productName} subscription at ${pricing.discount}% off. Legal regional pricing system with instant activation.`,
    image: `/products/${slug}.jpg`,
    availability: 'InStock',
  };
}

// Server component for SEO
export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = getProductDetails(slug);
  
  const title = `${product.name} - ${product.pricing.discount}% Off Premium Plans | EaseSubs`;
  const description = `${product.description} Save $${(product.pricing.originalPrice - product.pricing.discountPrice).toFixed(2)} on your ${product.name} subscription. Instant delivery, 7-day money-back guarantee.`;
  const canonical = `/product/${slug}`;

  return generateEnhancedMetadata({
    title,
    description,
    canonical,
    keywords: [
      `${product.name.toLowerCase()} discount`,
      `${product.name.toLowerCase()} cheap`,
      `${product.name.toLowerCase()} subscription`,
      `${product.category} subscriptions`,
      'discount subscriptions',
      'subscription deals',
      'regional pricing',
      `save money ${product.name.toLowerCase()}`,
    ],
    type: 'website',
    section: product.categoryDisplayName,
    tags: [product.category, 'subscription', 'discount', 'premium'],
  });
}

export default async function ProductPage({
  params,
}: PageProps) {
  const { slug } = await params;

  if (!slug) {
    notFound();
  }

  const product = getProductDetails(slug);
  
  // Generate structured data
  const productSchema = generateProductSchema({
    name: product.name,
    description: product.description,
    price: product.pricing.discountPrice,
    originalPrice: product.pricing.originalPrice,
    currency: product.pricing.currency,
    image: `https://easesubs.com${product.image}`,
    category: product.categoryDisplayName,
    availability: product.availability,
    slug,
  });



  return (
    <>
      {/* Product Schema */}
      <Script
        id="product-schema"
        type="application/ld+json"
        strategy="beforeInteractive"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(productSchema)
        }}
      />



      {/* Main Product Content */}
      <ProductPageClient slug={slug} />
    </>
  );
}

// Generate static params for popular products (optional optimization)
export async function generateStaticParams() {
  const popularProducts = [
    'netflix-premium',
    'spotify-premium',
    'disney-plus',
    'adobe-creative-cloud',
    'notion-pro',
    'chatgpt-plus',
  ];

  return popularProducts.map((slug) => ({
    slug,
  }));
}
