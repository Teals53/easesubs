'use client';

import React, { useState, useEffect } from 'react';
import { Monitor, Smartphone, Tablet, Chrome, Globe, AlertTriangle, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from './button';

interface BrowserInfo {
  name: string;
  version: string;
  engine: string;
  platform: string;
  mobile: boolean;
  supported: boolean;
  features: {
    [key: string]: boolean;
  };
}

interface CompatibilityTest {
  name: string;
  description: string;
  test: () => boolean;
  critical: boolean;
}

const compatibilityTests: CompatibilityTest[] = [
  {
    name: 'CSS Grid',
    description: 'Modern layout system',
    test: () => CSS.supports('display', 'grid'),
    critical: true,
  },
  {
    name: 'CSS Flexbox',
    description: 'Flexible box layout',
    test: () => CSS.supports('display', 'flex'),
    critical: true,
  },
  {
    name: 'CSS Custom Properties',
    description: 'CSS Variables support',
    test: () => CSS.supports('color', 'var(--test)'),
    critical: false,
  },
  {
    name: 'Intersection Observer',
    description: 'For lazy loading and scroll effects',
    test: () => 'IntersectionObserver' in window,
    critical: false,
  },
  {
    name: 'Web Storage',
    description: 'localStorage and sessionStorage',
    test: () => {
      try {
        return typeof Storage !== 'undefined';
      } catch {
        return false;
      }
    },
    critical: true,
  },
  {
    name: 'Fetch API',
    description: 'Modern HTTP requests',
    test: () => 'fetch' in window,
    critical: true,
  },
  {
    name: 'ES6 Classes',
    description: 'Modern JavaScript syntax',
    test: () => {
      try {
        eval('class Test {}');
        return true;
      } catch {
        return false;
      }
    },
    critical: true,
  },
  {
    name: 'Async/Await',
    description: 'Modern asynchronous programming',
    test: () => {
      try {
        eval('async function test() { await Promise.resolve(); }');
        return true;
      } catch {
        return false;
      }
    },
    critical: false,
  },
  {
    name: 'Touch Events',
    description: 'Mobile and tablet support',
    test: () => 'ontouchstart' in window || navigator.maxTouchPoints > 0,
    critical: false,
  },
  {
    name: 'Media Queries',
    description: 'Responsive design support',
    test: () => 'matchMedia' in window,
    critical: true,
  },
];

export function BrowserCompatibility({ className }: { className?: string }) {
  const [browserInfo, setBrowserInfo] = useState<BrowserInfo | null>(null);
  const [testResults, setTestResults] = useState<{ [key: string]: boolean }>({});
  const [isRunning, setIsRunning] = useState(false);

  const detectBrowser = (): BrowserInfo => {
    const userAgent = navigator.userAgent;
    const platform = navigator.platform;
    const mobile = /Mobi|Android/i.test(userAgent);

    let name = 'Unknown';
    let version = 'Unknown';
    let engine = 'Unknown';
    let supported = true;

    // Browser detection
    if (userAgent.indexOf('Chrome') > -1 && userAgent.indexOf('Edg') === -1) {
      name = 'Chrome';
      const match = userAgent.match(/Chrome\/(\d+)/);
      version = match ? match[1] : 'Unknown';
      engine = 'Blink';
      supported = parseInt(version) >= 90; // Chrome 90+
    } else if (userAgent.indexOf('Firefox') > -1) {
      name = 'Firefox';
      const match = userAgent.match(/Firefox\/(\d+)/);
      version = match ? match[1] : 'Unknown';
      engine = 'Gecko';
      supported = parseInt(version) >= 88; // Firefox 88+
    } else if (userAgent.indexOf('Safari') > -1 && userAgent.indexOf('Chrome') === -1) {
      name = 'Safari';
      const match = userAgent.match(/Version\/(\d+)/);
      version = match ? match[1] : 'Unknown';
      engine = 'WebKit';
      supported = parseInt(version) >= 14; // Safari 14+
    } else if (userAgent.indexOf('Edg') > -1) {
      name = 'Edge';
      const match = userAgent.match(/Edg\/(\d+)/);
      version = match ? match[1] : 'Unknown';
      engine = 'Blink';
      supported = parseInt(version) >= 90; // Edge 90+
    }

    const features: { [key: string]: boolean } = {};
    compatibilityTests.forEach(test => {
      features[test.name] = test.test();
    });

    return {
      name,
      version,
      engine,
      platform,
      mobile,
      supported,
      features,
    };
  };

  const runCompatibilityTests = async () => {
    setIsRunning(true);
    
    const results: { [key: string]: boolean } = {};
    
    // Run tests with small delays to show progress
    for (const test of compatibilityTests) {
      await new Promise(resolve => setTimeout(resolve, 100));
      results[test.name] = test.test();
    }
    
    setTestResults(results);
    setIsRunning(false);
  };

  useEffect(() => {
    setBrowserInfo(detectBrowser());
  }, []);

  const getDeviceIcon = () => {
    if (!browserInfo) return <Globe className="w-5 h-5" />;
    
    if (browserInfo.mobile) {
      return <Smartphone className="w-5 h-5" />;
    } else if (browserInfo.platform.includes('iPad')) {
      return <Tablet className="w-5 h-5" />;
    } else {
      return <Monitor className="w-5 h-5" />;
    }
  };

  const getBrowserIcon = () => {
    if (!browserInfo) return <Globe className="w-5 h-5" />;
    
    switch (browserInfo.name) {
      case 'Chrome':
      case 'Edge':
        return <Chrome className="w-5 h-5" />;
      default:
        return <Globe className="w-5 h-5" />;
    }
  };

  const criticalIssues = compatibilityTests.filter(test => 
    test.critical && testResults[test.name] === false
  ).length;

  const supportScore = Object.keys(testResults).length > 0 
    ? Math.round((Object.values(testResults).filter(Boolean).length / Object.keys(testResults).length) * 100)
    : 0;

  return (
    <div className={cn("bg-gray-800 border border-gray-700 rounded-lg p-6", className)}>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <Globe className="w-6 h-6 text-blue-400" />
          <h2 className="text-xl font-semibold text-white">Browser Compatibility</h2>
        </div>
        
        <Button
          onClick={runCompatibilityTests}
          isLoading={isRunning}
          loadingText="Testing..."
          variant="outline"
          size="sm"
        >
          Run Tests
        </Button>
      </div>

      {browserInfo && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* Browser Info */}
          <div className="bg-gray-700/50 rounded-lg p-4">
            <h3 className="font-medium text-white mb-3 flex items-center">
              {getBrowserIcon()}
              <span className="ml-2">Browser Information</span>
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-300">Browser:</span>
                <span className="text-white">{browserInfo.name} {browserInfo.version}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-300">Engine:</span>
                <span className="text-white">{browserInfo.engine}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-300">Platform:</span>
                <span className="text-white">{browserInfo.platform}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-300">Device:</span>
                <div className="flex items-center space-x-2">
                  {getDeviceIcon()}
                  <span className="text-white">
                    {browserInfo.mobile ? 'Mobile' : 'Desktop'}
                  </span>
                </div>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-300">Supported:</span>
                <span className={cn(
                  "font-medium",
                  browserInfo.supported ? "text-green-400" : "text-red-400"
                )}>
                  {browserInfo.supported ? 'Yes' : 'No'}
                </span>
              </div>
            </div>
          </div>

          {/* Compatibility Score */}
          <div className="bg-gray-700/50 rounded-lg p-4">
            <h3 className="font-medium text-white mb-3">Compatibility Score</h3>
            <div className="text-center">
              <div className={cn(
                "text-4xl font-bold mb-2",
                supportScore >= 90 ? "text-green-400" :
                supportScore >= 70 ? "text-yellow-400" : "text-red-400"
              )}>
                {Object.keys(testResults).length > 0 ? `${supportScore}%` : '--'}
              </div>
              <p className="text-sm text-gray-400">
                {Object.values(testResults).filter(Boolean).length} of {Object.keys(testResults).length} tests passed
              </p>
              {criticalIssues > 0 && (
                <div className="mt-2 text-red-400 text-sm flex items-center justify-center">
                  <AlertTriangle className="w-4 h-4 mr-1" />
                  {criticalIssues} critical issue{criticalIssues !== 1 ? 's' : ''}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Test Results */}
      {Object.keys(testResults).length > 0 && (
        <div className="bg-gray-700/50 rounded-lg p-4">
          <h3 className="font-medium text-white mb-3">Feature Support</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {compatibilityTests.map(test => {
              const passed = testResults[test.name];
              return (
                <div
                  key={test.name}
                  className={cn(
                    "flex items-center justify-between p-3 rounded border",
                    passed
                      ? "border-green-500/30 bg-green-500/10"
                      : test.critical
                      ? "border-red-500/30 bg-red-500/10"
                      : "border-yellow-500/30 bg-yellow-500/10"
                  )}
                >
                  <div className="flex items-center space-x-3">
                    {passed ? (
                      <CheckCircle className="w-4 h-4 text-green-400" />
                    ) : (
                      <AlertTriangle className={cn(
                        "w-4 h-4",
                        test.critical ? "text-red-400" : "text-yellow-400"
                      )} />
                    )}
                    <div>
                      <p className="text-sm font-medium text-white">
                        {test.name}
                        {test.critical && (
                          <span className="ml-1 text-xs text-red-400">(Critical)</span>
                        )}
                      </p>
                      <p className="text-xs text-gray-400">{test.description}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Recommendations */}
      {criticalIssues > 0 && (
        <div className="mt-6 bg-red-500/10 border border-red-500/30 rounded-lg p-4">
          <h3 className="font-medium text-red-400 mb-2 flex items-center">
            <AlertTriangle className="w-4 h-4 mr-2" />
            Compatibility Issues Detected
          </h3>
          <p className="text-sm text-red-300 mb-3">
            Your browser doesn&apos;t support some critical features. For the best experience, please consider:
          </p>
          <ul className="text-sm text-red-300 space-y-1 list-disc list-inside">
            <li>Updating to the latest version of your browser</li>
            <li>Using a modern browser like Chrome, Firefox, Safari, or Edge</li>
            <li>Enabling JavaScript if it&apos;s disabled</li>
          </ul>
        </div>
      )}

      {Object.keys(testResults).length === 0 && !isRunning && (
        <div className="text-center py-8">
          <Globe className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <h3 className="text-lg font-medium text-white mb-2">Ready to Test</h3>
          <p className="text-gray-400 mb-4">
            Run compatibility tests to check browser support for modern web features.
          </p>
          <Button onClick={runCompatibilityTests} variant="outline">
            Start Compatibility Test
          </Button>
        </div>
      )}
    </div>
  );
} 