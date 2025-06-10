'use client';

import React, { useState } from 'react';
import { CheckCircle, AlertTriangle, XCircle, Eye, Smartphone, Monitor, Users, Shield, Zap, Play } from 'lucide-react';
import { ResponsiveContainer } from '@/components/ui/responsive-container';
import { AccessibilityChecker } from '@/components/ui/accessibility-checker';
import { AccessibilityTesting } from '@/components/ui/accessibility-testing';
import { MobileResponsiveness } from '@/components/ui/mobile-responsiveness';
import { BrowserCompatibility } from '@/components/ui/browser-compatibility';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface AccessibilityFeature {
  category: 'wcag' | 'ux' | 'responsive' | 'performance';
  name: string;
  description: string;
  status: 'complete' | 'partial' | 'pending';
  priority: 'high' | 'medium' | 'low';
  details?: string;
}

const accessibilityFeatures: AccessibilityFeature[] = [
  // WCAG Compliance
  {
    category: 'wcag',
    name: 'Screen Reader Compatibility',
    description: 'Proper ARIA labels, semantic HTML, and screen reader testing',
    status: 'complete',
    priority: 'high',
    details: 'All interactive elements have proper labels and descriptions'
  },
  {
    category: 'wcag',
    name: 'Color Contrast Standards',
    description: 'WCAG AA/AAA color contrast ratios',
    status: 'complete',
    priority: 'high',
    details: 'All text meets WCAG AA standards (4.5:1 ratio)'
  },
  {
    category: 'wcag',
    name: 'Alt Text for Images',
    description: 'Descriptive alt text for all images',
    status: 'complete',
    priority: 'high',
    details: 'All images include meaningful alt text or are marked as decorative'
  },
  {
    category: 'wcag',
    name: 'Form Labels Association',
    description: 'Proper form labels and error handling',
    status: 'complete',
    priority: 'high',
    details: 'All form controls have associated labels and error states'
  },
  {
    category: 'wcag',
    name: 'Focus Indicators',
    description: 'Visible focus indicators for keyboard navigation',
    status: 'complete',
    priority: 'high',
    details: 'All interactive elements have clear focus indicators'
  },
  {
    category: 'wcag',
    name: 'Text Scaling Support',
    description: 'Text scalable to 200% without horizontal scrolling',
    status: 'complete',
    priority: 'medium',
    details: 'Layout adapts properly to text scaling up to 200%'
  },
  {
    category: 'wcag',
    name: 'Keyboard Navigation',
    description: 'Full keyboard accessibility with logical tab order',
    status: 'complete',
    priority: 'high',
    details: 'All functionality accessible via keyboard with skip links'
  },
  {
    category: 'wcag',
    name: 'Heading Hierarchy',
    description: 'Proper heading structure for screen readers',
    status: 'complete',
    priority: 'medium',
    details: 'Logical heading order (h1, h2, h3, etc.) maintained'
  },

  // User Experience
  {
    category: 'ux',
    name: 'Mobile Responsiveness',
    description: 'Optimized for mobile devices and touch interfaces',
    status: 'complete',
    priority: 'high',
    details: 'Responsive design tested on multiple device sizes'
  },
  {
    category: 'ux',
    name: 'Cross-browser Compatibility',
    description: 'Consistent experience across modern browsers',
    status: 'complete',
    priority: 'high',
    details: 'Tested on Chrome, Firefox, Safari, and Edge'
  },
  {
    category: 'ux',
    name: 'Intuitive Navigation',
    description: 'Clear and consistent navigation patterns',
    status: 'complete',
    priority: 'medium',
    details: 'Skip links, breadcrumbs, and logical tab order implemented'
  },
  {
    category: 'ux',
    name: 'User-friendly Forms',
    description: 'Clear validation and helpful error messages',
    status: 'complete',
    priority: 'high',
    details: 'Real-time validation with clear error messaging'
  },
  {
    category: 'ux',
    name: 'Loading States',
    description: 'Clear loading indicators and progress feedback',
    status: 'complete',
    priority: 'medium',
    details: 'Loading states announced to screen readers'
  },
  {
    category: 'ux',
    name: 'Contact Information',
    description: 'Easy access to support and contact details',
    status: 'complete',
    priority: 'low',
    details: 'Support links available in footer and help sections'
  },
  {
    category: 'ux',
    name: 'Error Recovery',
    description: 'Clear error messages with recovery suggestions',
    status: 'complete',
    priority: 'high',
    details: 'Comprehensive error handling with actionable feedback'
  },

  // Responsive Design
  {
    category: 'responsive',
    name: 'Multiple Device Testing',
    description: 'Tested across phones, tablets, and desktops',
    status: 'complete',
    priority: 'high',
    details: 'Comprehensive testing on various screen sizes'
  },
  {
    category: 'responsive',
    name: 'Touch-friendly Interface',
    description: 'Appropriate touch targets and gestures',
    status: 'complete',
    priority: 'high',
    details: 'Minimum 44px touch targets implemented'
  },
  {
    category: 'responsive',
    name: 'Flexible Layouts',
    description: 'Layouts adapt to different screen orientations',
    status: 'complete',
    priority: 'medium',
    details: 'CSS Grid and Flexbox used for flexible layouts'
  },
  {
    category: 'responsive',
    name: 'Viewport Configuration',
    description: 'Proper viewport meta tag for mobile optimization',
    status: 'complete',
    priority: 'high',
    details: 'Viewport meta tag configured for optimal mobile experience'
  },

  // Performance & Technical
  {
    category: 'performance',
    name: 'Fast Loading Times',
    description: 'Optimized for quick page loads',
    status: 'complete',
    priority: 'high',
    details: 'Images optimized, code splitting implemented'
  },
  {
    category: 'performance',
    name: 'Reduced Motion Support',
    description: 'Respects user preference for reduced motion',
    status: 'complete',
    priority: 'medium',
    details: 'Animations respect prefers-reduced-motion setting'
  },
  {
    category: 'performance',
    name: 'High Contrast Support',
    description: 'Works with high contrast mode',
    status: 'complete',
    priority: 'medium',
    details: 'Design adapts to high contrast preferences'
  },
  {
    category: 'performance',
    name: 'Progressive Enhancement',
    description: 'Core functionality works without JavaScript',
    status: 'complete',
    priority: 'medium',
    details: 'Basic functionality available even if JavaScript fails'
  },
];

export default function AccessibilityStatusPage() {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [activeTab, setActiveTab] = useState<'overview' | 'testing' | 'mobile' | 'compatibility'>('overview');

  const categories = [
    { key: 'all', name: 'All Features', icon: Eye },
    { key: 'wcag', name: 'WCAG Compliance', icon: Shield },
    { key: 'ux', name: 'User Experience', icon: Users },
    { key: 'responsive', name: 'Responsive Design', icon: Smartphone },
    { key: 'performance', name: 'Performance', icon: Zap },
  ];

  const tabs = [
    { key: 'overview', name: 'Overview', icon: Eye },
    { key: 'testing', name: 'Accessibility Testing', icon: Play },
    { key: 'mobile', name: 'Mobile Testing', icon: Smartphone },
    { key: 'compatibility', name: 'Browser Compatibility', icon: Monitor },
  ];

  const filteredFeatures = selectedCategory === 'all' 
    ? accessibilityFeatures 
    : accessibilityFeatures.filter(f => f.category === selectedCategory);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'complete':
        return <CheckCircle className="w-5 h-5 text-green-400" />;
      case 'partial':
        return <AlertTriangle className="w-5 h-5 text-yellow-400" />;
      case 'pending':
        return <XCircle className="w-5 h-5 text-red-400" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'complete':
        return 'border-green-500/30 bg-green-500/5';
      case 'partial':
        return 'border-yellow-500/30 bg-yellow-500/5';
      case 'pending':
        return 'border-red-500/30 bg-red-500/5';
      default:
        return 'border-gray-600 bg-gray-700/20';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'text-red-400';
      case 'medium':
        return 'text-yellow-400';
      case 'low':
        return 'text-green-400';
      default:
        return 'text-gray-400';
    }
  };

  // Calculate overall statistics
  const totalFeatures = accessibilityFeatures.length;
  const completedFeatures = accessibilityFeatures.filter(f => f.status === 'complete').length;
  const partialFeatures = accessibilityFeatures.filter(f => f.status === 'partial').length;
  const pendingFeatures = accessibilityFeatures.filter(f => f.status === 'pending').length;
  const overallScore = Math.round((completedFeatures / totalFeatures) * 100);

  return (
    <ResponsiveContainer className="py-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-4">
            Accessibility & Usability Status
          </h1>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Comprehensive accessibility compliance and usability testing dashboard
          </p>
        </div>

        {/* Overall Score */}
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-green-400 mb-2">{overallScore}%</div>
              <div className="text-sm text-gray-400">Overall Score</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-400 mb-2">{completedFeatures}</div>
              <div className="text-sm text-gray-400">Completed</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-yellow-400 mb-2">{partialFeatures}</div>
              <div className="text-sm text-gray-400">Partial</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-red-400 mb-2">{pendingFeatures}</div>
              <div className="text-sm text-gray-400">Pending</div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex flex-wrap gap-2 mb-8 border-b border-gray-700">
          {tabs.map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as typeof activeTab)}
                className={cn(
                  "flex items-center space-x-2 px-4 py-3 rounded-t-lg text-sm font-medium transition-colors border-b-2",
                  activeTab === tab.key
                    ? "bg-purple-600/20 text-purple-300 border-purple-500"
                    : "text-gray-400 hover:text-gray-300 border-transparent hover:border-gray-600"
                )}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.name}</span>
              </button>
            );
          })}
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* Category Filter */}
            <div className="flex flex-wrap gap-2">
              {categories.map(category => {
                const Icon = category.icon;
                const categoryFeatures = category.key === 'all' ? accessibilityFeatures : accessibilityFeatures.filter(f => f.category === category.key);
                const completedInCategory = categoryFeatures.filter(f => f.status === 'complete').length;
                
                return (
                  <button
                    key={category.key}
                    onClick={() => setSelectedCategory(category.key)}
                    className={cn(
                      "flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                      selectedCategory === category.key
                        ? "bg-purple-600 text-white"
                        : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                    )}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{category.name}</span>
                    <span className="text-xs bg-gray-600 px-2 py-1 rounded">
                      {completedInCategory}/{categoryFeatures.length}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Features Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredFeatures.map((feature, index) => (
                <div
                  key={index}
                  className={cn(
                    "border rounded-lg p-6 transition-colors",
                    getStatusColor(feature.status)
                  )}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      {getStatusIcon(feature.status)}
                      <div>
                        <h3 className="font-semibold text-white">{feature.name}</h3>
                        <span className={cn("text-xs font-medium", getPriorityColor(feature.priority))}>
                          {feature.priority.toUpperCase()} PRIORITY
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <p className="text-sm text-gray-400 mb-3">{feature.description}</p>
                  
                  {feature.details && (
                    <p className="text-xs text-gray-500">{feature.details}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'testing' && (
          <div className="space-y-8">
            <AccessibilityTesting autoRun={false} />
            <AccessibilityChecker autoCheck={false} showUserPreferences={true} />
          </div>
        )}

        {activeTab === 'mobile' && (
          <div className="space-y-8">
            <MobileResponsiveness />
          </div>
        )}

        {activeTab === 'compatibility' && (
          <div className="space-y-8">
            <BrowserCompatibility />
          </div>
        )}

        {/* Quick Actions */}
        <div className="mt-12 bg-gray-800 border border-gray-700 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-white mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button
              onClick={() => setActiveTab('testing')}
              variant="purple"
              className="flex items-center space-x-2"
            >
              <Play className="w-4 h-4" />
              <span>Run Accessibility Tests</span>
            </Button>
            <Button
              onClick={() => setActiveTab('mobile')}
              variant="outline"
              className="flex items-center space-x-2"
            >
              <Smartphone className="w-4 h-4" />
              <span>Test Mobile Responsiveness</span>
            </Button>
            <Button
              onClick={() => setActiveTab('compatibility')}
              variant="outline"
              className="flex items-center space-x-2"
            >
              <Monitor className="w-4 h-4" />
              <span>Check Browser Compatibility</span>
            </Button>
          </div>
        </div>

        {/* Accessibility Statement */}
        <div className="mt-12 bg-gray-800 border border-gray-700 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-white mb-4">Accessibility Statement</h2>
          <div className="prose prose-gray max-w-none">
            <p className="text-gray-300 mb-4">
              EaseSubs is committed to ensuring digital accessibility for people with disabilities. 
              We are continually improving the user experience for everyone and applying the relevant 
              accessibility standards.
            </p>
            
            <h3 className="text-lg font-semibold text-white mb-3">Conformance Status</h3>
            <p className="text-gray-300 mb-4">
              The Web Content Accessibility Guidelines (WCAG) defines requirements for designers and 
              developers to improve accessibility for people with disabilities. It defines three levels 
              of conformance: Level A, Level AA, and Level AAA. EaseSubs is fully conformant with WCAG 2.1 
              level AA.
            </p>
            
            <h3 className="text-lg font-semibold text-white mb-3">Feedback</h3>
            <p className="text-gray-300 mb-4">
              We welcome your feedback on the accessibility of EaseSubs. Please let us know if you 
              encounter accessibility barriers on our website or if you have suggestions for improvement.
            </p>
            
            <div className="flex flex-wrap gap-4 mt-6">
              <Button variant="outline" size="sm">
                Report Accessibility Issue
              </Button>
              <Button variant="outline" size="sm">
                Contact Support
              </Button>
            </div>
          </div>
        </div>
      </div>
    </ResponsiveContainer>
  );
} 