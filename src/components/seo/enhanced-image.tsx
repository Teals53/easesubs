import Image from 'next/image';
import { useState } from 'react';

interface EnhancedImageProps {
  src: string;
  alt: string;
  width: number;
  height: number;
  className?: string;
  priority?: boolean;
  quality?: number;
  sizes?: string;
  placeholder?: 'blur' | 'empty';
  blurDataURL?: string;
  caption?: string;
  loading?: 'lazy' | 'eager';
  onLoad?: () => void;
  onError?: () => void;
}

export function EnhancedImage({
  src,
  alt,
  width,
  height,
  className = '',
  priority = false,
  quality = 85,
  sizes = '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw',
  placeholder = 'empty',
  blurDataURL,
  caption,
  loading = 'lazy',
  onLoad,
  onError,
}: EnhancedImageProps) {
  const [imageError, setImageError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  const handleImageLoad = () => {
    setImageLoaded(true);
    onLoad?.();
  };

  const handleImageError = () => {
    setImageError(true);
    onError?.();
  };

  if (imageError) {
    return (
      <div 
        className={`flex items-center justify-center bg-gray-800 text-gray-400 ${className}`}
        style={{ width, height }}
        role="img"
        aria-label={alt}
      >
        <span className="text-sm">Image unavailable</span>
      </div>
    );
  }

  return (
    <figure className={caption ? 'space-y-2' : ''}>
      <div className="relative overflow-hidden">
        <Image
          src={src}
          alt={alt}
          width={width}
          height={height}
          className={`transition-opacity duration-300 ${
            imageLoaded ? 'opacity-100' : 'opacity-0'
          } ${className}`}
          priority={priority}
          quality={quality}
          sizes={sizes}
          placeholder={placeholder}
          blurDataURL={blurDataURL}
          loading={loading}
          onLoad={handleImageLoad}
          onError={handleImageError}
          style={{
            objectFit: 'cover',
            width: '100%',
            height: 'auto',
          }}
        />
        
        {/* Loading skeleton */}
        {!imageLoaded && !imageError && (
          <div
            className="absolute inset-0 bg-gray-800 animate-pulse"
            aria-hidden="true"
          />
        )}
      </div>
      
      {caption && (
        <figcaption className="text-sm text-gray-400 text-center mt-2">
          {caption}
        </figcaption>
      )}
    </figure>
  );
}

// Optimized logo component
interface LogoImageProps {
  variant?: 'light' | 'dark';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function LogoImage({ variant = 'light', size = 'md', className = '' }: LogoImageProps) {
  const dimensions = {
    sm: { width: 120, height: 40 },
    md: { width: 180, height: 60 },
    lg: { width: 240, height: 80 },
  };

  const logoSrc = variant === 'light' ? '/logo-light.svg' : '/logo-dark.svg';

  return (
    <EnhancedImage
      src={logoSrc}
      alt="EaseSubs - Premium Subscriptions at Discount Prices"
      width={dimensions[size].width}
      height={dimensions[size].height}
      className={className}
      priority={true}
      quality={100}
      sizes="(max-width: 768px) 120px, (max-width: 1200px) 180px, 240px"
    />
  );
}

// Product image with SEO optimization
interface ProductImageProps {
  productName: string;
  src: string;
  width?: number;
  height?: number;
  className?: string;
  priority?: boolean;
}

export function ProductImage({
  productName,
  src,
  width = 400,
  height = 300,
  className = '',
  priority = false,
}: ProductImageProps) {
  const alt = `${productName} subscription service - Premium plans at discount prices`;

  return (
    <EnhancedImage
      src={src}
      alt={alt}
      width={width}
      height={height}
      className={`rounded-lg ${className}`}
      priority={priority}
      quality={90}
      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 400px"
      placeholder="blur"
      blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k="
      caption={`${productName} - Available at discounted prices`}
    />
  );
}

// Hero image component
interface HeroImageProps {
  title: string;
  description: string;
  src: string;
  className?: string;
}

export function HeroImage({ title, description, src, className = '' }: HeroImageProps) {
  return (
    <EnhancedImage
      src={src}
      alt={`${title} - ${description}`}
      width={1200}
      height={630}
      className={`w-full ${className}`}
      priority={true}
      quality={95}
      sizes="100vw"
      placeholder="blur"
      blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k="
    />
  );
} 