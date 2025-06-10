import { useEffect, useRef, useState } from 'react';

// WCAG Color Contrast Utilities
export const calculateContrastRatio = (color1: string, color2: string): number => {
  const getLuminance = (hex: string): number => {
    // Remove # if present
    hex = hex.replace('#', '');
    
    // Convert hex to RGB
    const r = parseInt(hex.substr(0, 2), 16) / 255;
    const g = parseInt(hex.substr(2, 2), 16) / 255;
    const b = parseInt(hex.substr(4, 2), 16) / 255;
    
    // Calculate relative luminance
    const sRGB = [r, g, b].map(val => {
      return val <= 0.03928 ? val / 12.92 : Math.pow((val + 0.055) / 1.055, 2.4);
    });
    
    return 0.2126 * sRGB[0] + 0.7152 * sRGB[1] + 0.0722 * sRGB[2];
  };
  
  const lum1 = getLuminance(color1);
  const lum2 = getLuminance(color2);
  
  const lighter = Math.max(lum1, lum2);
  const darker = Math.min(lum1, lum2);
  
  return (lighter + 0.05) / (darker + 0.05);
};

export const checkWCAGCompliance = (
  foreground: string, 
  background: string, 
  level: 'AA' | 'AAA' = 'AA',
  size: 'normal' | 'large' = 'normal'
): { 
  ratio: number; 
  passes: boolean; 
  level: string;
  recommendation?: string;
} => {
  const ratio = calculateContrastRatio(foreground, background);
  
  let requiredRatio: number;
  if (level === 'AAA') {
    requiredRatio = size === 'large' ? 4.5 : 7;
  } else {
    requiredRatio = size === 'large' ? 3 : 4.5;
  }
  
  const passes = ratio >= requiredRatio;
  
  let recommendation: string | undefined;
  if (!passes) {
    if (ratio < 3) {
      recommendation = 'Poor contrast - text may be unreadable for many users';
    } else if (ratio < 4.5) {
      recommendation = 'Below WCAG AA standard - consider improving contrast';
    } else {
      recommendation = 'Below WCAG AAA standard but meets AA requirements';
    }
  }
  
  return {
    ratio: Math.round(ratio * 100) / 100,
    passes,
    level: `WCAG ${level} ${size}`,
    recommendation
  };
};

// Screen Reader Utilities
export const announceToScreenReader = (message: string, priority: 'polite' | 'assertive' = 'polite') => {
  const announcement = document.createElement('div');
  announcement.setAttribute('aria-live', priority);
  announcement.setAttribute('aria-atomic', 'true');
  announcement.setAttribute('class', 'sr-only');
  announcement.textContent = message;
  
  document.body.appendChild(announcement);
  
  // Remove after announcement
  setTimeout(() => {
    document.body.removeChild(announcement);
  }, 1000);
};

// Focus Management
export const useFocusTrap = (isActive: boolean) => {
  const containerRef = useRef<HTMLElement>(null);
  
  useEffect(() => {
    if (!isActive || !containerRef.current) return;
    
    const container = containerRef.current;
    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    
    const firstElement = focusableElements[0] as HTMLElement;
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;
    
    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;
      
      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement?.focus();
        }
      } else {
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement?.focus();
        }
      }
    };
    
    const handleEscapeKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        // You can customize this behavior
        (document.activeElement as HTMLElement)?.blur();
      }
    };
    
    container.addEventListener('keydown', handleTabKey);
    container.addEventListener('keydown', handleEscapeKey);
    
    // Focus first element when trap activates
    firstElement?.focus();
    
    return () => {
      container.removeEventListener('keydown', handleTabKey);
      container.removeEventListener('keydown', handleEscapeKey);
    };
  }, [isActive]);
  
  return containerRef;
};

// Keyboard Navigation Helper
export const useKeyboardNavigation = (
  onEnter?: () => void,
  onSpace?: () => void,
  onEscape?: () => void,
  onArrowUp?: () => void,
  onArrowDown?: () => void,
  onArrowLeft?: () => void,
  onArrowRight?: () => void
) => {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'Enter':
        onEnter?.();
        break;
      case ' ':
        e.preventDefault(); // Prevent scrolling
        onSpace?.();
        break;
      case 'Escape':
        onEscape?.();
        break;
      case 'ArrowUp':
        e.preventDefault();
        onArrowUp?.();
        break;
      case 'ArrowDown':
        e.preventDefault();
        onArrowDown?.();
        break;
      case 'ArrowLeft':
        onArrowLeft?.();
        break;
      case 'ArrowRight':
        onArrowRight?.();
        break;
    }
  };
  
  return { handleKeyDown };
};

// Accessible Loading State
export const useLoadingAnnouncement = (isLoading: boolean, loadingMessage = 'Loading', completeMessage = 'Loading complete') => {
  useEffect(() => {
    if (isLoading) {
      announceToScreenReader(loadingMessage);
    } else {
      announceToScreenReader(completeMessage);
    }
  }, [isLoading, loadingMessage, completeMessage]);
};

// Text Scaling Detection
export const useTextScaling = () => {
  const [scaleFactor, setScaleFactor] = useState(1);
  
  useEffect(() => {
    const detectTextScaling = () => {
      // Create a hidden element with known font size
      const testElement = document.createElement('div');
      testElement.style.cssText = `
        position: absolute;
        visibility: hidden;
        font-size: 16px;
        font-family: Arial, sans-serif;
        width: auto;
        height: auto;
      `;
      testElement.textContent = 'M';
      document.body.appendChild(testElement);
      
      const computedSize = window.getComputedStyle(testElement).fontSize;
      const actualSize = parseFloat(computedSize);
      const factor = actualSize / 16; // 16px is our baseline
      
      document.body.removeChild(testElement);
      setScaleFactor(factor);
    };
    
    detectTextScaling();
    window.addEventListener('resize', detectTextScaling);
    
    return () => window.removeEventListener('resize', detectTextScaling);
  }, []);
  
  return scaleFactor;
};

// Reduced Motion Detection
export const useReducedMotion = () => {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);
    
    const handleChange = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches);
    };
    
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);
  
  return prefersReducedMotion;
};

// High Contrast Detection
export const useHighContrast = () => {
  const [prefersHighContrast, setPrefersHighContrast] = useState(false);
  
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-contrast: high)');
    setPrefersHighContrast(mediaQuery.matches);
    
    const handleChange = (e: MediaQueryListEvent) => {
      setPrefersHighContrast(e.matches);
    };
    
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);
  
  return prefersHighContrast;
};

// ARIA Utilities
export const generateAriaLabel = (
  baseLabel: string,
  state?: {
    isSelected?: boolean;
    isExpanded?: boolean;
    isDisabled?: boolean;
    hasError?: boolean;
    isRequired?: boolean;
    position?: { current: number; total: number };
  }
): string => {
  let label = baseLabel;
  
  if (state?.position) {
    label += `, ${state.position.current} of ${state.position.total}`;
  }
  
  if (state?.isSelected) label += ', selected';
  if (state?.isExpanded !== undefined) {
    label += state.isExpanded ? ', expanded' : ', collapsed';
  }
  if (state?.isDisabled) label += ', disabled';
  if (state?.hasError) label += ', has error';
  if (state?.isRequired) label += ', required';
  
  return label;
};

// Form Validation Helpers
export const validateAccessibility = (element: HTMLElement): {
  issues: Array<{
    type: 'error' | 'warning';
    message: string;
    element: HTMLElement;
  }>;
  score: number;
} => {
  const issues: Array<{
    type: 'error' | 'warning';
    message: string;
    element: HTMLElement;
  }> = [];
  
  // Check images for alt text
  const images = element.querySelectorAll('img');
  images.forEach(img => {
    if (!img.alt && img.alt !== '') {
      issues.push({
        type: 'error',
        message: 'Image missing alt text',
        element: img
      });
    }
  });
  
  // Check form inputs for labels
  const inputs = element.querySelectorAll('input, select, textarea');
  inputs.forEach(input => {
    const htmlInput = input as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;
    const hasLabel = htmlInput.labels && htmlInput.labels.length > 0;
    const hasAriaLabel = input.getAttribute('aria-label');
    const hasAriaLabelledBy = input.getAttribute('aria-labelledby');
    
    if (!hasLabel && !hasAriaLabel && !hasAriaLabelledBy) {
      issues.push({
        type: 'error',
        message: 'Form control missing label',
        element: input as HTMLElement
      });
    }
  });
  
  // Check heading structure
  const headings = Array.from(element.querySelectorAll('h1, h2, h3, h4, h5, h6'));
  let previousLevel = 0;
  headings.forEach(heading => {
    const currentLevel = parseInt(heading.tagName.charAt(1));
    if (currentLevel > previousLevel + 1) {
      issues.push({
        type: 'warning',
        message: `Heading level ${currentLevel} follows ${previousLevel}, skipping levels`,
        element: heading as HTMLElement
      });
    }
    previousLevel = currentLevel;
  });
  
  // Calculate score
  const totalChecks = images.length + inputs.length + headings.length;
  const passedChecks = totalChecks - issues.filter(i => i.type === 'error').length;
  const score = totalChecks > 0 ? Math.round((passedChecks / totalChecks) * 100) : 100;
  
  return { issues, score };
}; 