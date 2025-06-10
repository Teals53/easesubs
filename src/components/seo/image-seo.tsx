import Image, { ImageProps } from 'next/image';
import { useState } from 'react';

interface SEOImageProps extends Omit<ImageProps, 'alt'> {
  alt: string;
  title?: string;
  loading?: 'lazy' | 'eager';
  priority?: boolean;
  seoKeywords?: string[];
}

export function SEOImage({ 
  alt, 
  title, 
  loading = 'lazy', 
  priority = false,
  seoKeywords = [],
  ...props 
}: SEOImageProps) {
  const [imageError, setImageError] = useState(false);

  // Enhance alt text with SEO keywords if provided
  const enhancedAlt = seoKeywords.length > 0 
    ? `${alt} - ${seoKeywords.join(', ')}`
    : alt;

  // Fallback for broken images
  if (imageError) {
    return (
      <div 
        className="bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-gray-500 dark:text-gray-400"
        style={{ width: props.width, height: props.height }}
        role="img"
        aria-label={enhancedAlt}
      >
        <span className="text-sm">Image unavailable</span>
      </div>
    );
  }

  return (
    <Image
      {...props}
      alt={enhancedAlt}
      title={title || alt}
      loading={loading}
      priority={priority}
      onError={() => setImageError(true)}
      // SEO optimizations
      sizes={props.sizes || "(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"}
      quality={props.quality || 85}
      placeholder={props.placeholder || "blur"}
      blurDataURL={props.blurDataURL || "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAIAAoDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkqGx0f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyJckliyjqTzSlT54b6bk+h0R//2Q=="}
    />
  );
}

// Product image component with SEO optimization
interface ProductImageProps {
  src: string;
  productName: string;
  category?: string;
  brand?: string;
  width: number;
  height: number;
  priority?: boolean;
  className?: string;
}

export function ProductImage({ 
  src, 
  productName, 
  category, 
  brand, 
  width, 
  height, 
  priority = false,
  className 
}: ProductImageProps) {
  const seoKeywords = [
    productName,
    category && `${category} subscription`,
    brand && `${brand} logo`,
    'discount subscription',
    'premium service'
  ].filter(Boolean) as string[];

  const alt = `${productName} subscription service logo and pricing information`;

  return (
    <SEOImage
      src={src}
      alt={alt}
      title={`Get ${productName} at discounted prices - EaseSubs`}
      width={width}
      height={height}
      priority={priority}
      seoKeywords={seoKeywords}
      className={className}
      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
    />
  );
}

// Hero image component with SEO optimization
interface HeroImageProps {
  src: string;
  alt: string;
  width: number;
  height: number;
  className?: string;
}

export function HeroImage({ src, alt, width, height, className }: HeroImageProps) {
  return (
    <SEOImage
      src={src}
      alt={alt}
      title="EaseSubs - Premium subscriptions at discount prices"
      width={width}
      height={height}
      priority={true}
      loading="eager"
      seoKeywords={['subscription marketplace', 'discount services', 'premium subscriptions']}
      className={className}
      sizes="100vw"
      quality={90}
    />
  );
}

// Icon image component for better SEO
interface IconImageProps {
  src: string;
  serviceName: string;
  size?: number;
  className?: string;
}

export function ServiceIcon({ src, serviceName, size = 24, className }: IconImageProps) {
  return (
    <SEOImage
      src={src}
      alt={`${serviceName} service icon`}
      title={`${serviceName} subscription available on EaseSubs`}
      width={size}
      height={size}
      priority={false}
      className={className}
      seoKeywords={[serviceName, 'subscription service', 'digital service']}
    />
  );
} 