import { useCallback, useEffect, useMemo, useRef, useState } from "react";

// Debounce hook for performance optimization
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

// Throttle hook for performance optimization
export function useThrottle<T extends (...args: unknown[]) => unknown>(
  callback: T,
  delay: number
): T {
  const throttledRef = useRef<boolean>(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const throttledCallback = useCallback(
    (...args: Parameters<T>) => {
      if (!throttledRef.current) {
        callback(...args);
        throttledRef.current = true;

        timeoutRef.current = setTimeout(() => {
          throttledRef.current = false;
        }, delay);
      }
    },
    [callback, delay]
  ) as T;

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return throttledCallback;
}

// Memoized computation hook with explicit dependencies
// Note: For complex memoization, use useMemo directly in components
export function createMemoizedValue<T>(getValue: () => T): () => T {
  let cached: T;
  let hasCached = false;
  
  return () => {
    if (!hasCached) {
      cached = getValue();
      hasCached = true;
    }
    return cached;
  };
}

// Virtual scrolling hook for large lists
export function useVirtualScrolling(
  itemCount: number,
  itemHeight: number,
  containerHeight: number
) {
  const [scrollTop, setScrollTop] = useState(0);

  const visibleRange = useMemo(() => {
    const startIndex = Math.floor(scrollTop / itemHeight);
    const endIndex = Math.min(
      startIndex + Math.ceil(containerHeight / itemHeight) + 1,
      itemCount
    );
    return { startIndex, endIndex };
  }, [scrollTop, itemHeight, containerHeight, itemCount]);

  const totalHeight = itemCount * itemHeight;

  return {
    visibleRange,
    totalHeight,
    setScrollTop,
  };
}

// Image preloader utility
export function preloadImage(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve();
    img.onerror = reject;
    img.src = src;
  });
}

// Batch image preloader
export async function preloadImages(urls: string[]): Promise<void> {
  const batchSize = 3; // Load 3 images at a time
  for (let i = 0; i < urls.length; i += batchSize) {
    const batch = urls.slice(i, i + batchSize);
    await Promise.allSettled(batch.map(preloadImage));
  }
}

// Resource prefetch utility
export function prefetchResource(href: string, as: "style" | "script" | "image" | "font") {
  if (typeof document === "undefined") return;

  const link = document.createElement("link");
  link.rel = "prefetch";
  link.href = href;
  link.as = as;
  document.head.appendChild(link);
}

// DNS prefetch utility
export function prefetchDNS(hostname: string) {
  if (typeof document === "undefined") return;

  const link = document.createElement("link");
  link.rel = "dns-prefetch";
  link.href = `//${hostname}`;
  document.head.appendChild(link);
}

// Performance mark utility
export function performanceMark(name: string) {
  if (typeof performance !== "undefined" && performance.mark) {
    performance.mark(name);
  }
}

// Performance measure utility
export function performanceMeasure(name: string, startMark: string, endMark: string) {
  if (typeof performance !== "undefined" && performance.measure) {
    try {
      performance.measure(name, startMark, endMark);
    } catch {
      // Marks may not exist
    }
  }
}

// Critical resource hints
export function addCriticalResourceHints() {
  if (typeof document === "undefined") return;

  // Preconnect to external domains
  const preconnectDomains = [
    "fonts.googleapis.com",
    "fonts.gstatic.com",
  ];

  preconnectDomains.forEach((domain) => {
    const link = document.createElement("link");
    link.rel = "preconnect";
    link.href = `https://${domain}`;
    link.crossOrigin = "anonymous";
    document.head.appendChild(link);
  });
} 

