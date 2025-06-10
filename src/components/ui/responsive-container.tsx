'use client';

import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface ResponsiveContainerProps {
  children: React.ReactNode;
  className?: string;
  maxWidth?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
  padding?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  testMode?: boolean; // For displaying current breakpoint
}

interface BreakpointInfo {
  name: string;
  width: number;
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
}

const breakpoints = {
  xs: 0,
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
};

const maxWidthClasses = {
  xs: 'max-w-xs',
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  '2xl': 'max-w-2xl',
  full: 'max-w-full',
};

const paddingClasses = {
  none: '',
  sm: 'px-4 py-2',
  md: 'px-6 py-4',
  lg: 'px-8 py-6',
  xl: 'px-12 py-8',
};

export function ResponsiveContainer({
  children,
  className,
  maxWidth = 'full',
  padding = 'md',
  testMode = false,
}: ResponsiveContainerProps) {
  const [breakpointInfo, setBreakpointInfo] = useState<BreakpointInfo>({
    name: 'xl',
    width: 1280,
    isMobile: false,
    isTablet: false,
    isDesktop: true,
  });

  useEffect(() => {
    const updateBreakpoint = () => {
      const width = window.innerWidth;
      
      let currentBreakpoint = 'xs';
      for (const [name, minWidth] of Object.entries(breakpoints)) {
        if (width >= minWidth) {
          currentBreakpoint = name;
        }
      }
      
      const isMobile = width < breakpoints.md;
      const isTablet = width >= breakpoints.md && width < breakpoints.lg;
      const isDesktop = width >= breakpoints.lg;
      
      setBreakpointInfo({
        name: currentBreakpoint,
        width,
        isMobile,
        isTablet,
        isDesktop,
      });
    };

    updateBreakpoint();
    window.addEventListener('resize', updateBreakpoint);
    
    return () => window.removeEventListener('resize', updateBreakpoint);
  }, []);

  return (
    <div
      className={cn(
        'w-full mx-auto',
        maxWidthClasses[maxWidth],
        paddingClasses[padding],
        className
      )}
    >
      {testMode && (
        <div className="fixed top-4 right-4 z-50 bg-purple-600 text-white px-3 py-2 rounded-lg text-sm font-mono">
          <div>{breakpointInfo.name.toUpperCase()}</div>
          <div>{breakpointInfo.width}px</div>
          <div className="text-xs opacity-75">
            {breakpointInfo.isMobile && 'Mobile'}
            {breakpointInfo.isTablet && 'Tablet'}
            {breakpointInfo.isDesktop && 'Desktop'}
          </div>
        </div>
      )}
      {children}
    </div>
  );
}

// Hook for accessing current breakpoint
export function useBreakpoint() {
  const [breakpointInfo, setBreakpointInfo] = useState<BreakpointInfo>({
    name: 'xl',
    width: 1280,
    isMobile: false,
    isTablet: false,
    isDesktop: true,
  });

  useEffect(() => {
    const updateBreakpoint = () => {
      const width = window.innerWidth;
      
      let currentBreakpoint = 'xs';
      for (const [name, minWidth] of Object.entries(breakpoints)) {
        if (width >= minWidth) {
          currentBreakpoint = name;
        }
      }
      
      const isMobile = width < breakpoints.md;
      const isTablet = width >= breakpoints.md && width < breakpoints.lg;
      const isDesktop = width >= breakpoints.lg;
      
      setBreakpointInfo({
        name: currentBreakpoint,
        width,
        isMobile,
        isTablet,
        isDesktop,
      });
    };

    updateBreakpoint();
    window.addEventListener('resize', updateBreakpoint);
    
    return () => window.removeEventListener('resize', updateBreakpoint);
  }, []);

  return breakpointInfo;
}

// Component for conditional rendering based on breakpoint
interface ShowAtProps {
  breakpoint: 'mobile' | 'tablet' | 'desktop' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function ShowAt({ breakpoint, children, fallback = null }: ShowAtProps) {
  const bp = useBreakpoint();
  
  const shouldShow = (() => {
    switch (breakpoint) {
      case 'mobile':
        return bp.isMobile;
      case 'tablet':
        return bp.isTablet;
      case 'desktop':
        return bp.isDesktop;
      default:
        return bp.width >= breakpoints[breakpoint as keyof typeof breakpoints];
    }
  })();

  return <>{shouldShow ? children : fallback}</>;
}

// Component for hiding content at specific breakpoints
interface HideAtProps {
  breakpoint: 'mobile' | 'tablet' | 'desktop' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function HideAt({ breakpoint, children, fallback = null }: HideAtProps) {
  const bp = useBreakpoint();
  
  const shouldHide = (() => {
    switch (breakpoint) {
      case 'mobile':
        return bp.isMobile;
      case 'tablet':
        return bp.isTablet;
      case 'desktop':
        return bp.isDesktop;
      default:
        return bp.width >= breakpoints[breakpoint as keyof typeof breakpoints];
    }
  })();

  return <>{shouldHide ? fallback : children}</>;
} 