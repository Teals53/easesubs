import Image from "next/image";
import { useState } from "react";
import { Package } from "lucide-react";
import { cn } from "@/lib/utils";

interface OptimizedImageProps {
  src: string;
  alt: string;
  width: number;
  height: number;
  className?: string;
  fallbackIcon?: React.ReactNode;
  fallbackSrc?: string;
  priority?: boolean;
  quality?: number;
  sizes?: string;
  fill?: boolean;
  placeholder?: "blur" | "empty";
  blurDataURL?: string;
  caption?: string;
  loading?: 'lazy' | 'eager';
  // SEO enhancements
  title?: string;
  seoKeywords?: string[];
}

export function OptimizedImage({
  src,
  alt,
  width,
  height,
  className,
  fallbackIcon,
  fallbackSrc,
  priority = false,
  quality = 85,
  sizes,
  fill = false,
  placeholder = "empty",
  blurDataURL,
  caption,
  loading = 'lazy',
  title,
  seoKeywords = [],
}: OptimizedImageProps) {
  const [imageSrc, setImageSrc] = useState(src);
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Enhance alt text with SEO keywords if provided
  const enhancedAlt = seoKeywords.length > 0 
    ? `${alt} - ${seoKeywords.join(', ')}`
    : alt;

  const handleError = () => {
    if (!hasError && fallbackSrc) {
      setImageSrc(fallbackSrc);
      setHasError(true);
    } else {
      setHasError(true);
    }
    setIsLoading(false);
  };

  const handleLoad = () => {
    setIsLoading(false);
  };

  if (hasError && !fallbackSrc) {
    return (
      <div 
        className={cn(
          "flex items-center justify-center bg-gray-700/30 rounded-lg",
          className
        )}
        style={{ width, height }}
        role="img"
        aria-label={enhancedAlt}
      >
        {fallbackIcon || <Package className="w-6 h-6 text-gray-400" />}
        <span className="sr-only">Image unavailable</span>
      </div>
    );
  }

  const imageContent = (
    <div className={cn("relative overflow-hidden", className)}>
      {isLoading && (
        <div 
          className="absolute inset-0 bg-gray-700/20 animate-pulse rounded-lg"
          style={{ width, height }}
          aria-hidden="true"
        />
      )}
      <Image
        src={imageSrc}
        alt={enhancedAlt}
        title={title || alt}
        width={fill ? undefined : width}
        height={fill ? undefined : height}
        fill={fill}
        priority={priority}
        quality={quality}
        sizes={sizes || `(max-width: 768px) 100vw, (max-width: 1200px) 50vw, ${width}px`}
        placeholder={placeholder}
        blurDataURL={blurDataURL || "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkqGx0f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyJckliyjqTzSlT54b6bk+h0R//2Q=="}
        loading={loading}
        onError={handleError}
        onLoad={handleLoad}
        className={cn(
          "transition-opacity duration-300",
          isLoading ? "opacity-0" : "opacity-100",
          fill ? "object-contain" : "max-w-full max-h-full object-contain"
        )}
      />
    </div>
  );

  // If caption is provided, wrap in figure element
  if (caption) {
    return (
      <figure className="space-y-2">
        {imageContent}
        <figcaption className="text-sm text-gray-400 text-center">
          {caption}
        </figcaption>
      </figure>
    );
  }

  return imageContent;
}

// Schema markup component for images
export function ImageSchema({
  src,
  alt,
  width,
  height,
  caption,
}: {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  caption?: string;
}) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "ImageObject",
    url: src,
    name: alt,
    description: caption || alt,
    ...(width && height && {
      width: width,
      height: height,
    }),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
} 

