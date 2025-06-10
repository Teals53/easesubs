import Image, { ImageProps } from 'next/image';
import { useState } from 'react';

interface OptimizedImageProps extends Omit<ImageProps, 'alt'> {
  alt: string; // Make alt required
  fallbackSrc?: string;
  loading?: 'eager' | 'lazy';
}

export function OptimizedImage({
  alt,
  fallbackSrc = '/placeholder-image.png',
  loading = 'lazy',
  ...props
}: OptimizedImageProps) {
  const [imageSrc, setImageSrc] = useState(props.src);
  const [imageError, setImageError] = useState(false);

  const handleError = () => {
    if (!imageError && fallbackSrc) {
      setImageSrc(fallbackSrc);
      setImageError(true);
    }
  };

  return (
    <Image
      {...props}
      src={imageSrc}
      alt={alt}
      loading={loading}
      onError={handleError}
      sizes={props.sizes || "(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"}
      quality={85}
      placeholder={props.placeholder || 'blur'}
      blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkqGx0f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyJckliyjqTzSlT54b6bk+h0R//2Q=="
    />
  );
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

