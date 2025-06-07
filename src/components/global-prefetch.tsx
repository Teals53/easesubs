'use client'

import { useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { trpc } from '@/lib/trpc'

export function GlobalPrefetch() {
  const { data: session, status } = useSession()
  const utils = trpc.useUtils()
  
  useEffect(() => {
    // Only proceed if session is fully loaded
    if (status === 'loading') return

    // Prefetch all critical pages immediately
    const criticalPages = [
      '/',
      '/auth/signin',
      '/auth/signup',
      '/dashboard',
      '/dashboard/orders',
      '/dashboard/profile-settings',
      '/dashboard/support',
      '/checkout',
      '/legal/privacy-policy',
      '/legal/terms-of-service',
      '/legal/refund-policy',
    ];

    // Add admin pages only for admin users
    if (session?.user?.role === 'ADMIN') {
      criticalPages.push(
        '/dashboard/admin-dashboard',
        '/dashboard/admin-orders',
        '/dashboard/admin-products',
        '/dashboard/admin-users',
        '/dashboard/admin-support'
      );
    }

    // Prefetch all pages with high priority
    criticalPages.forEach(page => {
      const link = document.createElement('link');
      link.rel = 'prefetch';
      link.href = page;
      link.as = 'document';
      document.head.appendChild(link);
    });

    // Only prefetch TRPC data for authenticated users with complete session
    if (session?.user?.id && utils) {
      // Add a small delay to ensure TRPC client is fully initialized
      const timer = setTimeout(() => {
        try {
          // Prefetch products data (public procedure, should work)
          utils.product.getAll.prefetch({ limit: 50 }).catch((error) => {
            console.warn('Failed to prefetch products:', error);
          });
          
          // Prefetch user-specific data (protected procedures)
          utils.user.getProfile.prefetch().catch((error) => {
            console.warn('Failed to prefetch user profile:', error);
          });
          
          utils.cart.get.prefetch().catch((error) => {
            console.warn('Failed to prefetch cart:', error);
          });
          
          utils.cart.getCount.prefetch().catch((error) => {
            console.warn('Failed to prefetch cart count:', error);
          });
          
          utils.user.getDashboardStats.prefetch().catch((error) => {
            console.warn('Failed to prefetch dashboard stats:', error);
          });
          
          utils.ticket.getStats.prefetch().catch((error) => {
            console.warn('Failed to prefetch ticket stats:', error);
          });
        } catch (error) {
          console.warn('Error during TRPC prefetching:', error);
        }
      }, 100);

      return () => clearTimeout(timer);
    }

    // Only prefetch admin data for admin users with complete session
    if (session?.user?.role === 'ADMIN' && session?.user?.id && utils) {
      const adminTimer = setTimeout(() => {
        try {
          utils.admin.getDashboardStats.prefetch().catch((error) => {
            console.warn('Failed to prefetch admin dashboard stats:', error);
          });
          
          utils.admin.getRecentActivity.prefetch().catch((error) => {
            console.warn('Failed to prefetch admin recent activity:', error);
          });
        } catch (error) {
          console.warn('Error during admin TRPC prefetching:', error);
        }
      }, 200);

      return () => clearTimeout(adminTimer);
    }

    // Preload critical images
    const images = [
      '/favicon.svg',
      '/apple-touch-icon.png',
      '/og-image.jpg',
    ];

    images.forEach(image => {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.href = image;
      link.as = 'image';
      document.head.appendChild(link);
    });

    // Preconnect to external domains for faster loading
    const externalDomains = [
      'https://fonts.googleapis.com',
      'https://fonts.gstatic.com',
    ];

    externalDomains.forEach(domain => {
      const link = document.createElement('link');
      link.rel = 'preconnect';
      link.href = domain;
      link.crossOrigin = 'anonymous';
      document.head.appendChild(link);
    });

    // DNS prefetch for even faster connections
    const dnsPrefetchDomains = [
      'https://www.googletagmanager.com',
      'https://www.google-analytics.com',
    ];

    dnsPrefetchDomains.forEach(domain => {
      const link = document.createElement('link');
      link.rel = 'dns-prefetch';
      link.href = domain;
      document.head.appendChild(link);
    });

  }, [session, status, utils]);

  return null;
} 