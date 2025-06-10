"use client";

import { useState } from "react";
import { 
  CheckCircle, 
  AlertCircle, 
  Clock, 
  Search,
  ExternalLink,
  BarChart3
} from "lucide-react";

interface SEOCheckItem {
  id: string;
  title: string;
  description: string;
  status: 'completed' | 'in-progress' | 'pending';
  priority: 'high' | 'medium' | 'low';
  category: 'technical' | 'content' | 'performance' | 'analytics';
  implementation?: string;
  nextSteps?: string[];
}

const seoChecklist: SEOCheckItem[] = [
  // Technical SEO
  {
    id: 'xml-sitemap',
    title: 'XML Sitemap Generated',
    description: 'Dynamic sitemap with all pages and products',
    status: 'completed',
    priority: 'high',
    category: 'technical',
    implementation: 'src/app/sitemap.ts - Dynamic generation with product categories',
    nextSteps: ['Submit to Google Search Console', 'Monitor indexing status']
  },
  {
    id: 'robots-txt',
    title: 'Robots.txt Configured',
    description: 'Comprehensive crawling rules for search engines',
    status: 'completed',
    priority: 'high',
    category: 'technical',
    implementation: 'src/app/robots.ts - Multi-bot configuration with AI bot blocking',
    nextSteps: ['Verify with Google Search Console', 'Monitor crawl stats']
  },
  {
    id: 'url-structure',
    title: 'Clean URL Structure',
    description: 'SEO-friendly URLs without trailing slashes',
    status: 'completed',
    priority: 'high',
    category: 'technical',
    implementation: 'next.config.ts - trailingSlash: false configuration',
    nextSteps: ['Monitor URL performance in GSC']
  },
  {
    id: 'custom-404',
    title: 'Custom 404 Pages',
    description: 'Professional error pages with structured data',
    status: 'completed',
    priority: 'medium',
    category: 'technical',
    implementation: 'src/app/not-found.tsx - Animated 404 with navigation',
    nextSteps: ['Track 404 errors in analytics', 'Optimize internal linking']
  },
  {
    id: 'canonical-urls',
    title: 'Canonical URLs',
    description: 'Proper canonical tags to prevent duplicate content',
    status: 'completed',
    priority: 'high',
    category: 'technical',
    implementation: 'src/app/layout.tsx - Metadata base and alternates',
    nextSteps: ['Audit for duplicate content issues']
  },
  {
    id: 'schema-markup',
    title: 'Schema Markup',
    description: 'Rich structured data for better search results',
    status: 'completed',
    priority: 'high',
    category: 'technical',
    implementation: 'src/components/seo/ - E-commerce, Organization, and Service schemas',
    nextSteps: ['Test with Google Rich Results Tool', 'Monitor rich snippets']
  },
  {
    id: 'site-speed',
    title: 'Site Speed Optimization',
    description: 'Performance optimizations for better rankings',
    status: 'completed',
    priority: 'high',
    category: 'performance',
    implementation: 'next.config.ts - Image optimization, compression, caching',
    nextSteps: ['Monitor Core Web Vitals', 'Optimize further based on real data']
  },

  // Content & Meta Data
  {
    id: 'title-tags',
    title: 'Unique Title Tags',
    description: 'Descriptive titles with template system',
    status: 'completed',
    priority: 'high',
    category: 'content',
    implementation: 'src/app/layout.tsx - Dynamic title template',
    nextSteps: ['A/B test title variations', 'Monitor CTR in GSC']
  },
  {
    id: 'meta-descriptions',
    title: 'Compelling Meta Descriptions',
    description: 'Under 160 characters with keywords',
    status: 'completed',
    priority: 'high',
    category: 'content',
    implementation: 'src/components/seo/meta-tags.tsx - Dynamic descriptions',
    nextSteps: ['Optimize for higher CTR', 'Test description variations']
  },
  {
    id: 'header-structure',
    title: 'Proper Header Tags',
    description: 'H1-H6 hierarchy for content structure',
    status: 'completed',
    priority: 'medium',
    category: 'content',
    implementation: 'src/components/seo/header-structure.tsx - Semantic components',
    nextSteps: ['Audit header hierarchy on all pages']
  },
  {
    id: 'image-alt-text',
    title: 'Image Alt Text',
    description: 'Descriptive alt text for all images',
    status: 'completed',
    priority: 'medium',
    category: 'content',
    implementation: 'src/components/seo/enhanced-image.tsx - SEO-optimized images',
    nextSteps: ['Audit all images for descriptive alt text']
  },
  {
    id: 'internal-linking',
    title: 'Internal Linking Strategy',
    description: 'Strategic links for better crawling and UX',
    status: 'completed',
    priority: 'medium',
    category: 'content',
    implementation: 'src/components/seo/internal-linking.tsx - Contextual links',
    nextSteps: ['Expand internal linking opportunities', 'Monitor link equity flow']
  },
  {
    id: 'content-quality',
    title: 'Content Quality',
    description: 'Original, valuable content with proper keyword density',
    status: 'completed',
    priority: 'high',
    category: 'content',
    implementation: 'High-quality product descriptions and marketing content',
    nextSteps: ['Create content calendar', 'Add blog section for SEO content']
  },

  // Analytics & Monitoring
  {
    id: 'google-analytics',
    title: 'Google Analytics 4',
    description: 'E-commerce tracking and conversion monitoring',
    status: 'pending',
    priority: 'high',
    category: 'analytics',
    nextSteps: ['Set up GA4 property', 'Configure e-commerce events', 'Set up conversion goals']
  },
  {
    id: 'search-console',
    title: 'Google Search Console',
    description: 'Monitor search performance and indexing',
    status: 'pending',
    priority: 'high',
    category: 'analytics',
    nextSteps: ['Verify domain ownership', 'Submit sitemap', 'Monitor search performance']
  },
  {
    id: 'core-web-vitals',
    title: 'Core Web Vitals Monitoring',
    description: 'Track LCP, FID, and CLS metrics',
    status: 'in-progress',
    priority: 'high',
    category: 'performance',
    implementation: 'package.json - web-vitals dependency',
    nextSteps: ['Set up real user monitoring', 'Optimize based on field data']
  }
];

export function SEOMasterChecklist() {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  const categories = [
    { id: 'all', label: 'All Items', icon: BarChart3 },
    { id: 'technical', label: 'Technical SEO', icon: Search },
    { id: 'content', label: 'Content & Meta', icon: ExternalLink },
    { id: 'performance', label: 'Performance', icon: BarChart3 },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 }
  ];

  const filteredItems = seoChecklist.filter(item => {
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    const matchesSearch = item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'in-progress':
        return <Clock className="w-5 h-5 text-yellow-500" />;
      case 'pending':
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      default:
        return <AlertCircle className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'border-green-500 bg-green-500/10';
      case 'in-progress':
        return 'border-yellow-500 bg-yellow-500/10';
      case 'pending':
        return 'border-red-500 bg-red-500/10';
      default:
        return 'border-gray-500 bg-gray-500/10';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-500/20 text-red-300 border-red-500/30';
      case 'medium':
        return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30';
      case 'low':
        return 'bg-green-500/20 text-green-300 border-green-500/30';
      default:
        return 'bg-gray-500/20 text-gray-300 border-gray-500/30';
    }
  };

  const stats = {
    total: seoChecklist.length,
    completed: seoChecklist.filter(item => item.status === 'completed').length,
    inProgress: seoChecklist.filter(item => item.status === 'in-progress').length,
    pending: seoChecklist.filter(item => item.status === 'pending').length
  };

  const completionPercentage = Math.round((stats.completed / stats.total) * 100);

  return (
    <div className="max-w-6xl mx-auto p-6 bg-gray-900 rounded-lg">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-4">
          SEO Master Checklist
        </h1>
        
        {/* Progress Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-gray-800 p-4 rounded-lg">
            <div className="text-2xl font-bold text-green-400">{completionPercentage}%</div>
            <div className="text-gray-400">Completion Rate</div>
          </div>
          <div className="bg-gray-800 p-4 rounded-lg">
            <div className="text-2xl font-bold text-green-400">{stats.completed}</div>
            <div className="text-gray-400">Completed</div>
          </div>
          <div className="bg-gray-800 p-4 rounded-lg">
            <div className="text-2xl font-bold text-yellow-400">{stats.inProgress}</div>
            <div className="text-gray-400">In Progress</div>
          </div>
          <div className="bg-gray-800 p-4 rounded-lg">
            <div className="text-2xl font-bold text-red-400">{stats.pending}</div>
            <div className="text-gray-400">Pending</div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-gray-700 rounded-full h-3 mb-6">
          <div 
            className="bg-gradient-to-r from-green-500 to-green-400 h-3 rounded-full transition-all duration-500"
            style={{ width: `${completionPercentage}%` }}
          />
        </div>
      </header>

      {/* Filters */}
      <div className="mb-6 space-y-4">
        <div className="flex flex-wrap gap-2">
          {categories.map(category => {
            const Icon = category.icon;
            return (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                  selectedCategory === category.id
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                }`}
              >
                <Icon className="w-4 h-4" />
                {category.label}
              </button>
            );
          })}
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search SEO items..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>
      </div>

      {/* Checklist Items */}
      <div className="space-y-4">
        {filteredItems.map(item => (
          <div
            key={item.id}
            className={`border rounded-lg p-6 transition-all hover:shadow-lg ${getStatusColor(item.status)}`}
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                {getStatusIcon(item.status)}
                <h3 className="text-lg font-semibold text-white">{item.title}</h3>
                <span className={`px-2 py-1 text-xs rounded border ${getPriorityColor(item.priority)}`}>
                  {item.priority.toUpperCase()}
                </span>
              </div>
              <span className="text-xs text-gray-400 capitalize">
                {item.category}
              </span>
            </div>

            <p className="text-gray-300 mb-4">{item.description}</p>

            {item.implementation && (
              <div className="mb-4">
                <h4 className="text-sm font-medium text-gray-400 mb-2">Implementation:</h4>
                <code className="text-sm bg-gray-800 px-3 py-1 rounded text-green-400">
                  {item.implementation}
                </code>
              </div>
            )}

            {item.nextSteps && item.nextSteps.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-gray-400 mb-2">Next Steps:</h4>
                <ul className="space-y-1">
                  {item.nextSteps.map((step, index) => (
                    <li key={index} className="text-sm text-gray-300 flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-purple-500 rounded-full" />
                      {step}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ))}
      </div>

      {filteredItems.length === 0 && (
        <div className="text-center py-12">
          <Search className="w-12 h-12 text-gray-500 mx-auto mb-4" />
          <p className="text-gray-400">No items found matching your criteria.</p>
        </div>
      )}
    </div>
  );
} 