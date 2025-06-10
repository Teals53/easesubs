"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

interface LazyWrapperProps {
  children: React.ReactNode;
  className?: string;
  fallback?: React.ReactNode;
  rootMargin?: string;
  threshold?: number;
  triggerOnce?: boolean;
}

export function LazyWrapper({
  children,
  className,
  fallback = (
    <div className="w-full h-32 bg-gray-700/20 animate-pulse rounded-lg" />
  ),
  rootMargin = "50px",
  threshold = 0.1,
  triggerOnce = true,
}: LazyWrapperProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [hasTriggered, setHasTriggered] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          if (triggerOnce) {
            setHasTriggered(true);
            observer.unobserve(element);
          }
        } else if (!triggerOnce && !hasTriggered) {
          setIsVisible(false);
        }
      },
      {
        rootMargin,
        threshold,
      }
    );

    observer.observe(element);

    return () => {
      observer.unobserve(element);
    };
  }, [rootMargin, threshold, triggerOnce, hasTriggered]);

  return (
    <div ref={ref} className={cn("min-h-[1px]", className)}>
      {isVisible ? children : fallback}
    </div>
  );
} 

