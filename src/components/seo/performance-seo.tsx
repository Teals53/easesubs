'use client';

import Script from 'next/script';
import { useEffect } from 'react';

// Performance API type extensions
// interface LayoutShift extends PerformanceEntry {
//   value: number;
//   hadRecentInput: boolean;
// }

// Core Web Vitals tracking for SEO
export function PerformanceSEO({ nonce }: { nonce?: string }) {
  useEffect(() => {
    // Track Core Web Vitals
    if (typeof window !== 'undefined' && 'performance' in window && 'PerformanceObserver' in window) {
      try {
        // LCP - Largest Contentful Paint
        if ('PerformanceObserver' in window) {
          new PerformanceObserver((entryList) => {
            for (const entry of entryList.getEntries()) {
              console.log('LCP:', entry.startTime);
              // Send to analytics
            }
          }).observe({ entryTypes: ['largest-contentful-paint'] });
        }

        // FID - First Input Delay
        if ('PerformanceObserver' in window) {
          new PerformanceObserver((entryList) => {
            for (const entry of entryList.getEntries()) {
              const fidEntry = entry as PerformanceEventTiming;
              console.log('FID:', fidEntry.processingStart - fidEntry.startTime);
              // Send to analytics
            }
          }).observe({ entryTypes: ['first-input'] });
        }
      } catch (error) {
        console.warn('PerformanceObserver not fully supported:', error);
      }

      // CLS - Cumulative Layout Shift (disabled to prevent dev tools conflicts)
      // Layout shift observation can interfere with browser dev tools element inspection
      // new PerformanceObserver((entryList) => {
      //   for (const entry of entryList.getEntries()) {
      //     const clsEntry = entry as LayoutShift;
      //     if (!clsEntry.hadRecentInput) {
      //       console.log('CLS:', clsEntry.value);
      //       // Send to analytics
      //     }
      //   }
      // }).observe({ entryTypes: ['layout-shift'], buffered: true });
    }
  }, []);

  return (
    <>
      {/* Preconnect to important domains for faster loading */}
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
      <link rel="preconnect" href="https://api.easesubs.com" />
      
      {/* DNS prefetch for external resources */}
      <link rel="dns-prefetch" href="//www.google-analytics.com" />
      <link rel="dns-prefetch" href="//connect.facebook.net" />
      
      {/* Prefetch critical resources */}
      <link rel="prefetch" href="/auth/signin" />
      
      {/* Critical CSS inlined for faster FCP */}
      <style jsx>{`
        .hero-section {
          font-display: swap;
        }
        
        .product-grid {
          /* Layout containment removed to prevent dev tools conflicts */
        }
      `}</style>

      {/* Performance monitoring script */}
      <Script
        id="performance-monitoring"
        strategy="afterInteractive"
        nonce={nonce}
        dangerouslySetInnerHTML={{
          __html: `
            // Monitor page load performance
            window.addEventListener('load', function() {
              setTimeout(function() {
                const perfData = performance.timing;
                const pageLoadTime = perfData.loadEventEnd - perfData.navigationStart;
                const domContentLoaded = perfData.domContentLoadedEventEnd - perfData.navigationStart;
                
                // Send performance data to analytics
                if (window.gtag) {
                  gtag('event', 'timing_complete', {
                    name: 'load',
                    value: pageLoadTime
                  });
                  gtag('event', 'timing_complete', {
                    name: 'dom_content_loaded',
                    value: domContentLoaded
                  });
                }
              }, 0);
            });
          `,
        }}
      />
    </>
  );
}

// Resource hints component for better loading performance
export function ResourceHints() {
  return (
    <>
      {/* Prefetch likely next pages */}
      <link rel="prefetch" href="/product/netflix-premium" />
      <link rel="prefetch" href="/product/spotify-premium" />
      <link rel="prefetch" href="/auth/signup" />
    </>
  );
}

// Critical rendering path optimization
export function CriticalCSS() {
  return (
    <style jsx>{`
      /* Critical above-the-fold styles */
      .header {
        position: fixed;
        top: 0;
        width: 100%;
        z-index: 50;
        backdrop-filter: blur(8px);
      }
      
      .hero {
        min-height: 100vh;
        display: flex;
        align-items: center;
        justify-content: center;
        padding-top: 4rem;
      }
      
      .cta-button {
        background: #9333ea;
        color: white;
        padding: 0.75rem 2rem;
        border-radius: 0.5rem;
        font-weight: 600;
        transition: background-color 0.2s;
      }
      
      .cta-button:hover {
        background: #7c3aed;
      }
      
      /* Optimize font rendering */
      html {
        font-display: swap;
      }
      
      /* Prevent layout shift */
      img {
        max-width: 100%;
        height: auto;
      }
      
      .loading-skeleton {
        background: linear-gradient(90deg, #374151 25%, #4b5563 50%, #374151 75%);
        background-size: 200% 100%;
        animation: loading 1.5s infinite;
      }
      
      @keyframes loading {
        0% { background-position: 200% 0; }
        100% { background-position: -200% 0; }
      }
    `}</style>
  );
} 