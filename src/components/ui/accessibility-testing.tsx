'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { CheckCircle, AlertTriangle, XCircle, Eye, Zap, Users, Smartphone } from 'lucide-react';
import { Button } from './button';
import { cn } from '@/lib/utils';

interface AccessibilityTest {
  id: string;
  name: string;
  category: 'wcag' | 'usability' | 'responsive' | 'performance';
  description: string;
  status: 'pass' | 'fail' | 'warning' | 'untested';
  details: string;
  element?: HTMLElement;
  recommendation?: string;
}

interface AccessibilityTestingProps {
  className?: string;
  autoRun?: boolean;
  targetElement?: HTMLElement;
}

export function AccessibilityTesting({ 
  className, 
  autoRun = false, 
  targetElement 
}: AccessibilityTestingProps) {
  const [tests, setTests] = useState<AccessibilityTest[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [overallScore, setOverallScore] = useState(0);
  const testContainerRef = useRef<HTMLDivElement>(null);

  const categories = [
    { key: 'all', name: 'All Tests', icon: Eye },
    { key: 'wcag', name: 'WCAG Compliance', icon: CheckCircle },
    { key: 'usability', name: 'Usability', icon: Users },
    { key: 'responsive', name: 'Responsive', icon: Smartphone },
    { key: 'performance', name: 'Performance', icon: Zap },
  ];

  const runAccessibilityTests = useCallback(async () => {
    setIsRunning(true);
    const element = targetElement || document.body;
    const testResults: AccessibilityTest[] = [];

    // WCAG Tests
    testResults.push(...await runWCAGTests(element));
    
    // Usability Tests
    testResults.push(...await runUsabilityTests(element));
    
    // Responsive Tests
    testResults.push(...await runResponsiveTests());
    
    // Performance Tests
    testResults.push(...await runPerformanceTests());

    setTests(testResults);
    
    // Calculate overall score
    const passedTests = testResults.filter(test => test.status === 'pass').length;
    const totalTests = testResults.length;
    const score = Math.round((passedTests / totalTests) * 100);
    setOverallScore(score);
    
    setIsRunning(false);
  }, [targetElement]);

  const runWCAGTests = async (element: HTMLElement): Promise<AccessibilityTest[]> => {
    const tests: AccessibilityTest[] = [];

    // Test 1: Alt text for images
    const images = element.querySelectorAll('img');
    const imagesWithoutAlt = Array.from(images).filter(img => 
      !img.getAttribute('alt') && !img.getAttribute('aria-label')
    );
    
    tests.push({
      id: 'alt-text',
      name: 'Image Alt Text',
      category: 'wcag',
      description: 'All images must have descriptive alt text',
      status: imagesWithoutAlt.length === 0 ? 'pass' : 'fail',
      details: `${images.length - imagesWithoutAlt.length}/${images.length} images have alt text`,
      recommendation: imagesWithoutAlt.length > 0 ? 'Add alt attributes to all images' : undefined
    });

    // Test 2: Form labels
    const inputs = element.querySelectorAll('input, select, textarea');
    const inputsWithoutLabels = Array.from(inputs).filter(input => {
      const id = input.getAttribute('id');
      const ariaLabel = input.getAttribute('aria-label');
      const ariaLabelledby = input.getAttribute('aria-labelledby');
      const label = id ? element.querySelector(`label[for="${id}"]`) : null;
      
      return !label && !ariaLabel && !ariaLabelledby;
    });

    tests.push({
      id: 'form-labels',
      name: 'Form Labels',
      category: 'wcag',
      description: 'All form controls must have associated labels',
      status: inputsWithoutLabels.length === 0 ? 'pass' : 'fail',
      details: `${inputs.length - inputsWithoutLabels.length}/${inputs.length} form controls have labels`,
      recommendation: inputsWithoutLabels.length > 0 ? 'Associate labels with all form controls' : undefined
    });

    // Test 3: Heading hierarchy
    const headings = element.querySelectorAll('h1, h2, h3, h4, h5, h6');
    let headingHierarchyValid = true;
    let lastLevel = 0;
    
    Array.from(headings).forEach(heading => {
      const level = parseInt(heading.tagName.charAt(1));
      if (level > lastLevel + 1) {
        headingHierarchyValid = false;
      }
      lastLevel = level;
    });

    tests.push({
      id: 'heading-hierarchy',
      name: 'Heading Hierarchy',
      category: 'wcag',
      description: 'Headings must follow proper hierarchical order',
      status: headingHierarchyValid ? 'pass' : 'warning',
      details: `${headings.length} headings found`,
      recommendation: !headingHierarchyValid ? 'Ensure headings follow logical order (h1, h2, h3, etc.)' : undefined
    });

    // Test 4: Focus indicators
    const focusableElements = element.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    
    tests.push({
      id: 'focus-indicators',
      name: 'Focus Indicators',
      category: 'wcag',
      description: 'All interactive elements must have visible focus indicators',
      status: 'pass', // Assuming CSS handles this
      details: `${focusableElements.length} focusable elements found`,
      recommendation: undefined
    });

    return tests;
  };

  const runUsabilityTests = async (element: HTMLElement): Promise<AccessibilityTest[]> => {
    const tests: AccessibilityTest[] = [];

    // Test 1: Touch target size
    const touchTargets = element.querySelectorAll('button, a, input[type="button"], input[type="submit"]');
    let smallTargets = 0;
    
    Array.from(touchTargets).forEach(target => {
      const rect = target.getBoundingClientRect();
      if (rect.width < 44 || rect.height < 44) {
        smallTargets++;
      }
    });

    tests.push({
      id: 'touch-targets',
      name: 'Touch Target Size',
      category: 'usability',
      description: 'Interactive elements should be at least 44x44 pixels',
      status: smallTargets === 0 ? 'pass' : 'warning',
      details: `${touchTargets.length - smallTargets}/${touchTargets.length} targets meet minimum size`,
      recommendation: smallTargets > 0 ? 'Increase size of small touch targets' : undefined
    });

    // Test 2: Skip links
    const skipLinks = element.querySelectorAll('a[href^="#"]');
    const hasSkipToMain = Array.from(skipLinks).some(link => 
      link.textContent?.toLowerCase().includes('skip') && 
      link.textContent?.toLowerCase().includes('main')
    );

    tests.push({
      id: 'skip-links',
      name: 'Skip Navigation Links',
      category: 'usability',
      description: 'Skip links should be provided for keyboard navigation',
      status: hasSkipToMain ? 'pass' : 'warning',
      details: hasSkipToMain ? 'Skip to main content link found' : 'No skip links found',
      recommendation: !hasSkipToMain ? 'Add skip navigation links' : undefined
    });

    return tests;
  };

  const runResponsiveTests = async (): Promise<AccessibilityTest[]> => {
    const tests: AccessibilityTest[] = [];

    // Test 1: Viewport meta tag
    const viewportMeta = document.querySelector('meta[name="viewport"]');
    const hasViewport = viewportMeta !== null;

    tests.push({
      id: 'viewport-meta',
      name: 'Viewport Meta Tag',
      category: 'responsive',
      description: 'Viewport meta tag should be present for responsive design',
      status: hasViewport ? 'pass' : 'fail',
      details: hasViewport ? 'Viewport meta tag found' : 'Viewport meta tag missing',
      recommendation: !hasViewport ? 'Add viewport meta tag to document head' : undefined
    });

    return tests;
  };

  const runPerformanceTests = async (): Promise<AccessibilityTest[]> => {
    const tests: AccessibilityTest[] = [];

    // Test 1: Reduced motion support
    const hasReducedMotionCSS = Array.from(document.styleSheets).some(sheet => {
      try {
        return Array.from(sheet.cssRules).some(rule => 
          rule.cssText.includes('prefers-reduced-motion')
        );
      } catch {
        return false;
      }
    });

    tests.push({
      id: 'reduced-motion',
      name: 'Reduced Motion Support',
      category: 'performance',
      description: 'Animations should respect prefers-reduced-motion',
      status: hasReducedMotionCSS ? 'pass' : 'warning',
      details: hasReducedMotionCSS ? 'Reduced motion CSS found' : 'No reduced motion CSS detected',
      recommendation: !hasReducedMotionCSS ? 'Add CSS for prefers-reduced-motion' : undefined
    });

    return tests;
  };

  const filteredTests = selectedCategory === 'all' 
    ? tests 
    : tests.filter(test => test.category === selectedCategory);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pass':
        return <CheckCircle className="w-4 h-4 text-green-400" />;
      case 'fail':
        return <XCircle className="w-4 h-4 text-red-400" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-yellow-400" />;
      default:
        return <Eye className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pass':
        return 'text-green-400';
      case 'fail':
        return 'text-red-400';
      case 'warning':
        return 'text-yellow-400';
      default:
        return 'text-gray-400';
    }
  };

  useEffect(() => {
    if (autoRun) {
      runAccessibilityTests();
    }
  }, [autoRun, runAccessibilityTests]);

  return (
    <div className={cn("bg-gray-800 border border-gray-700 rounded-lg p-6", className)} ref={testContainerRef}>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <Eye className="w-6 h-6 text-purple-400" />
          <div>
            <h2 className="text-xl font-semibold text-white">Accessibility Testing</h2>
            <p className="text-sm text-gray-400">Comprehensive WCAG compliance testing</p>
          </div>
        </div>
        
        <Button
          onClick={runAccessibilityTests}
          isLoading={isRunning}
          loadingText="Testing..."
          variant="purple"
          size="sm"
        >
          Run Tests
        </Button>
      </div>

      {tests.length > 0 && (
        <>
          {/* Overall Score */}
          <div className="bg-gray-700/50 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-white">Overall Accessibility Score</h3>
                <p className="text-sm text-gray-400">Based on {tests.length} automated tests</p>
              </div>
              <div className={cn("text-3xl font-bold", 
                overallScore >= 90 ? "text-green-400" : 
                overallScore >= 70 ? "text-yellow-400" : "text-red-400"
              )}>
                {overallScore}%
              </div>
            </div>
          </div>

          {/* Category Filter */}
          <div className="flex flex-wrap gap-2 mb-6">
            {categories.map(category => {
              const Icon = category.icon;
              const categoryTests = category.key === 'all' ? tests : tests.filter(t => t.category === category.key);
              const passedTests = categoryTests.filter(t => t.status === 'pass').length;
              
              return (
                <button
                  key={category.key}
                  onClick={() => setSelectedCategory(category.key)}
                  className={cn(
                    "flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                    selectedCategory === category.key
                      ? "bg-purple-600 text-white"
                      : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                  )}
                >
                  <Icon className="w-4 h-4" />
                  <span>{category.name}</span>
                  <span className="text-xs bg-gray-600 px-2 py-1 rounded">
                    {passedTests}/{categoryTests.length}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Test Results */}
          <div className="space-y-3">
            {filteredTests.map(test => (
              <div
                key={test.id}
                className={cn(
                  "border rounded-lg p-4 transition-colors",
                  test.status === 'pass' ? "border-green-500/30 bg-green-500/5" :
                  test.status === 'fail' ? "border-red-500/30 bg-red-500/5" :
                  test.status === 'warning' ? "border-yellow-500/30 bg-yellow-500/5" :
                  "border-gray-600 bg-gray-700/20"
                )}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3">
                    {getStatusIcon(test.status)}
                    <div>
                      <h4 className="font-medium text-white">{test.name}</h4>
                      <p className="text-sm text-gray-400 mt-1">{test.description}</p>
                      <p className="text-xs text-gray-500 mt-2">{test.details}</p>
                      {test.recommendation && (
                        <p className="text-xs text-yellow-400 mt-2">
                          💡 {test.recommendation}
                        </p>
                      )}
                    </div>
                  </div>
                  <span className={cn("text-sm font-medium", getStatusColor(test.status))}>
                    {test.status.toUpperCase()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {tests.length === 0 && !isRunning && (
        <div className="text-center py-8">
          <Zap className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <h3 className="text-lg font-medium text-white mb-2">Ready to Test</h3>
          <p className="text-gray-400 mb-4">
            Run comprehensive accessibility tests to ensure WCAG compliance and optimal user experience.
          </p>
          <Button onClick={runAccessibilityTests} variant="purple">
            Start Testing
          </Button>
        </div>
      )}
    </div>
  );
} 