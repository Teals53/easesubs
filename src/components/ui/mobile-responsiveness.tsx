'use client';

import React, { useState, useEffect } from 'react';
import { Smartphone, Tablet, Monitor, RotateCcw, Zap, CheckCircle, AlertTriangle } from 'lucide-react';
import { Button } from './button';
import { cn } from '@/lib/utils';

interface DevicePreset {
  name: string;
  width: number;
  height: number;
  icon: React.ComponentType<{ className?: string }>;
  category: 'mobile' | 'tablet' | 'desktop';
}

interface ResponsivenessTest {
  id: string;
  name: string;
  description: string;
  status: 'pass' | 'fail' | 'warning';
  details: string;
  recommendation?: string;
}

const devicePresets: DevicePreset[] = [
  // Mobile devices
  { name: 'iPhone SE', width: 375, height: 667, icon: Smartphone, category: 'mobile' },
  { name: 'iPhone 12', width: 390, height: 844, icon: Smartphone, category: 'mobile' },
  { name: 'iPhone 14 Pro Max', width: 430, height: 932, icon: Smartphone, category: 'mobile' },
  { name: 'Samsung Galaxy S21', width: 384, height: 854, icon: Smartphone, category: 'mobile' },
  { name: 'Google Pixel 6', width: 393, height: 851, icon: Smartphone, category: 'mobile' },
  
  // Tablets
  { name: 'iPad Mini', width: 768, height: 1024, icon: Tablet, category: 'tablet' },
  { name: 'iPad Pro 11"', width: 834, height: 1194, icon: Tablet, category: 'tablet' },
  { name: 'iPad Pro 12.9"', width: 1024, height: 1366, icon: Tablet, category: 'tablet' },
  { name: 'Samsung Galaxy Tab', width: 800, height: 1280, icon: Tablet, category: 'tablet' },
  
  // Desktop
  { name: 'Small Desktop', width: 1366, height: 768, icon: Monitor, category: 'desktop' },
  { name: 'Large Desktop', width: 1920, height: 1080, icon: Monitor, category: 'desktop' },
  { name: 'Ultra Wide', width: 2560, height: 1440, icon: Monitor, category: 'desktop' },
];

interface MobileResponsivenessProps {
  className?: string;
  targetUrl?: string;
}

export function MobileResponsiveness({ className, targetUrl }: MobileResponsivenessProps) {
  const [selectedDevice, setSelectedDevice] = useState<DevicePreset>(devicePresets[0]);
  const [isPortrait, setIsPortrait] = useState(true);
  const [tests, setTests] = useState<ResponsivenessTest[]>([]);
  const [isRunningTests, setIsRunningTests] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const categories = [
    { key: 'all', name: 'All Devices', icon: Monitor },
    { key: 'mobile', name: 'Mobile', icon: Smartphone },
    { key: 'tablet', name: 'Tablet', icon: Tablet },
    { key: 'desktop', name: 'Desktop', icon: Monitor },
  ];

  const currentWidth = isPortrait ? selectedDevice.width : selectedDevice.height;
  const currentHeight = isPortrait ? selectedDevice.height : selectedDevice.width;

  const runResponsivenessTests = async () => {
    setIsRunningTests(true);
    const testResults: ResponsivenessTest[] = [];

    // Test 1: Viewport meta tag
    const viewportMeta = document.querySelector('meta[name="viewport"]');
    testResults.push({
      id: 'viewport-meta',
      name: 'Viewport Meta Tag',
      description: 'Proper viewport configuration for mobile devices',
      status: viewportMeta ? 'pass' : 'fail',
      details: viewportMeta 
        ? `Found: ${viewportMeta.getAttribute('content')}` 
        : 'Viewport meta tag is missing',
      recommendation: !viewportMeta ? 'Add <meta name="viewport" content="width=device-width, initial-scale=1">' : undefined
    });

    // Test 2: Touch target sizes
    const touchTargets = document.querySelectorAll('button, a, input[type="button"], input[type="submit"], [role="button"]');
    let smallTargets = 0;
    
    touchTargets.forEach(target => {
      const rect = target.getBoundingClientRect();
      if (rect.width < 44 || rect.height < 44) {
        smallTargets++;
      }
    });

    testResults.push({
      id: 'touch-targets',
      name: 'Touch Target Size',
      description: 'Interactive elements should be at least 44x44 pixels',
      status: smallTargets === 0 ? 'pass' : 'warning',
      details: `${touchTargets.length - smallTargets}/${touchTargets.length} targets meet minimum size`,
      recommendation: smallTargets > 0 ? 'Increase size of small touch targets to at least 44x44 pixels' : undefined
    });

    // Test 3: Horizontal scrolling
    const hasHorizontalScroll = document.documentElement.scrollWidth > window.innerWidth;
    testResults.push({
      id: 'horizontal-scroll',
      name: 'Horizontal Scrolling',
      description: 'Content should not require horizontal scrolling',
      status: hasHorizontalScroll ? 'warning' : 'pass',
      details: hasHorizontalScroll 
        ? `Page width: ${document.documentElement.scrollWidth}px, Viewport: ${window.innerWidth}px`
        : 'No horizontal scrolling detected',
      recommendation: hasHorizontalScroll ? 'Ensure content fits within viewport width' : undefined
    });

    // Test 4: Text readability
    const textElements = document.querySelectorAll('p, span, div, li');
    let smallTextElements = 0;
    
    textElements.forEach(element => {
      const styles = window.getComputedStyle(element);
      const fontSize = parseFloat(styles.fontSize);
      if (fontSize < 16) {
        smallTextElements++;
      }
    });

    testResults.push({
      id: 'text-readability',
      name: 'Text Readability',
      description: 'Text should be at least 16px for mobile readability',
      status: smallTextElements === 0 ? 'pass' : 'warning',
      details: `${textElements.length - smallTextElements}/${textElements.length} text elements meet minimum size`,
      recommendation: smallTextElements > 0 ? 'Increase font size to at least 16px for mobile devices' : undefined
    });

    // Test 5: Image responsiveness
    const images = document.querySelectorAll('img');
    let nonResponsiveImages = 0;
    
    images.forEach(img => {
      const styles = window.getComputedStyle(img);
      const maxWidth = styles.maxWidth;
      const width = styles.width;
      
      if (maxWidth !== '100%' && !width.includes('%') && !width.includes('vw')) {
        nonResponsiveImages++;
      }
    });

    testResults.push({
      id: 'image-responsiveness',
      name: 'Image Responsiveness',
      description: 'Images should be responsive and scale with viewport',
      status: nonResponsiveImages === 0 ? 'pass' : 'warning',
      details: `${images.length - nonResponsiveImages}/${images.length} images are responsive`,
      recommendation: nonResponsiveImages > 0 ? 'Add max-width: 100% to images for responsiveness' : undefined
    });

    // Test 6: Form usability
    const formInputs = document.querySelectorAll('input, select, textarea');
    let smallInputs = 0;
    
    formInputs.forEach(input => {
      const rect = input.getBoundingClientRect();
      if (rect.height < 44) {
        smallInputs++;
      }
    });

    testResults.push({
      id: 'form-usability',
      name: 'Form Input Size',
      description: 'Form inputs should be large enough for touch interaction',
      status: smallInputs === 0 ? 'pass' : 'warning',
      details: `${formInputs.length - smallInputs}/${formInputs.length} inputs meet minimum height`,
      recommendation: smallInputs > 0 ? 'Increase form input height to at least 44px' : undefined
    });

    setTests(testResults);
    setIsRunningTests(false);
  };

  const filteredDevices = selectedCategory === 'all' 
    ? devicePresets 
    : devicePresets.filter(device => device.category === selectedCategory);

  const getTestStatusIcon = (status: string) => {
    switch (status) {
      case 'pass':
        return <CheckCircle className="w-4 h-4 text-green-400" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-yellow-400" />;
      case 'fail':
        return <AlertTriangle className="w-4 h-4 text-red-400" />;
      default:
        return null;
    }
  };

  const getTestStatusColor = (status: string) => {
    switch (status) {
      case 'pass':
        return 'border-green-500/30 bg-green-500/5';
      case 'warning':
        return 'border-yellow-500/30 bg-yellow-500/5';
      case 'fail':
        return 'border-red-500/30 bg-red-500/5';
      default:
        return 'border-gray-600 bg-gray-700/20';
    }
  };

  useEffect(() => {
    // Run initial tests
    runResponsivenessTests();
  }, []);

  return (
    <div className={cn("bg-gray-800 border border-gray-700 rounded-lg p-6", className)}>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <Smartphone className="w-6 h-6 text-purple-400" />
          <div>
            <h2 className="text-xl font-semibold text-white">Mobile Responsiveness</h2>
            <p className="text-sm text-gray-400">Test your site across different devices</p>
          </div>
        </div>
        
        <Button
          onClick={runResponsivenessTests}
          isLoading={isRunningTests}
          loadingText="Testing..."
          variant="purple"
          size="sm"
        >
          Run Tests
        </Button>
      </div>

      {/* Device Category Filter */}
      <div className="flex flex-wrap gap-2 mb-6">
        {categories.map(category => {
          const Icon = category.icon;
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
            </button>
          );
        })}
      </div>

      {/* Device Selection */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 mb-6">
        {filteredDevices.map(device => {
          const Icon = device.icon;
          return (
            <button
              key={device.name}
              onClick={() => setSelectedDevice(device)}
              className={cn(
                "flex flex-col items-center p-3 rounded-lg border transition-colors",
                selectedDevice.name === device.name
                  ? "border-purple-500 bg-purple-500/10 text-purple-300"
                  : "border-gray-600 bg-gray-700/30 text-gray-300 hover:border-gray-500"
              )}
            >
              <Icon className="w-5 h-5 mb-2" />
              <span className="text-xs font-medium">{device.name}</span>
              <span className="text-xs text-gray-400">
                {device.width} × {device.height}
              </span>
            </button>
          );
        })}
      </div>

      {/* Device Preview Controls */}
      <div className="flex items-center justify-between mb-6 p-4 bg-gray-700/30 rounded-lg">
        <div className="flex items-center space-x-4">
          <div className="text-sm text-gray-300">
            <span className="font-medium">{selectedDevice.name}</span>
            <span className="text-gray-400 ml-2">
              {currentWidth} × {currentHeight}px
            </span>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button
            onClick={() => setIsPortrait(!isPortrait)}
            variant="ghost"
            size="sm"
            className="flex items-center space-x-2"
          >
            <RotateCcw className="w-4 h-4" />
            <span>{isPortrait ? 'Portrait' : 'Landscape'}</span>
          </Button>
        </div>
      </div>

      {/* Device Preview Frame */}
      <div className="mb-6 p-4 bg-gray-900 rounded-lg">
        <div className="mx-auto bg-gray-800 rounded-lg p-2" style={{ width: 'fit-content' }}>
          <div 
            className="bg-white rounded border-2 border-gray-600 overflow-hidden"
            style={{ 
              width: `${Math.min(currentWidth, 800)}px`, 
              height: `${Math.min(currentHeight, 600)}px`,
              transform: currentWidth > 800 ? `scale(${800/currentWidth})` : 'none',
              transformOrigin: 'top left'
            }}
          >
            <iframe
              src={targetUrl || window.location.href}
              className="w-full h-full border-0"
              title={`${selectedDevice.name} preview`}
            />
          </div>
        </div>
        <div className="text-center mt-2 text-xs text-gray-400">
          {currentWidth > 800 && `Scaled to fit (actual: ${currentWidth}×${currentHeight}px)`}
        </div>
      </div>

      {/* Test Results */}
      {tests.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-white flex items-center">
            <Zap className="w-5 h-5 mr-2 text-purple-400" />
            Responsiveness Test Results
          </h3>
          
          <div className="space-y-3">
            {tests.map(test => (
              <div
                key={test.id}
                className={cn("border rounded-lg p-4", getTestStatusColor(test.status))}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3">
                    {getTestStatusIcon(test.status)}
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
                  <span className={cn("text-sm font-medium",
                    test.status === 'pass' ? "text-green-400" :
                    test.status === 'warning' ? "text-yellow-400" : "text-red-400"
                  )}>
                    {test.status.toUpperCase()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
} 