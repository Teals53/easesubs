import Link from 'next/link';
import { ArrowRight, ExternalLink } from 'lucide-react';

// Strategic internal links configuration
export const internalLinks = {
  // Main navigation links
  primary: [
    { href: '/', label: 'Home', priority: 'high' },
    { href: '/#products', label: 'Products', priority: 'high' },
    { href: '/auth/signin', label: 'Sign In', priority: 'medium' },
    { href: '/auth/signup', label: 'Sign Up', priority: 'medium' },
  ],
  
  // Legal/Trust pages
  legal: [
    { href: '/legal/privacy-policy', label: 'Privacy Policy', priority: 'medium' },
    { href: '/legal/terms-of-service', label: 'Terms of Service', priority: 'medium' },
    { href: '/legal/refund-policy', label: 'Refund Policy', priority: 'medium' },
  ],
  
  // Popular products (for internal linking)
  popularProducts: [
    { href: '/product/netflix-premium', label: 'Netflix Premium', category: 'streaming' },
    { href: '/product/spotify-premium', label: 'Spotify Premium', category: 'music' },
    { href: '/product/adobe-creative-cloud', label: 'Adobe Creative Cloud', category: 'creative' },
    { href: '/product/disney-plus', label: 'Disney Plus', category: 'streaming' },
    { href: '/product/youtube-premium', label: 'YouTube Premium', category: 'streaming' },
    { href: '/product/canva-pro', label: 'Canva Pro', category: 'creative' },
    { href: '/product/figma-professional', label: 'Figma Professional', category: 'creative' },
    { href: '/product/notion-pro', label: 'Notion Pro', category: 'productivity' },
  ],
  
  // Category-based grouping
  categories: {
    streaming: ['Netflix Premium', 'Disney Plus', 'YouTube Premium', 'Hulu Premium'],
    music: ['Spotify Premium'],
    creative: ['Adobe Creative Cloud', 'Canva Pro', 'Figma Professional'],
    productivity: ['Notion Pro', 'ChatGPT Plus'],
  }
};

// Strategic internal link component with SEO optimization
interface SEOLinkProps {
  href: string;
  children: React.ReactNode;
  title?: string;
  className?: string;
  external?: boolean;
  nofollow?: boolean;
  prefetch?: boolean;
}

export function SEOLink({ 
  href, 
  children, 
  title, 
  className = '', 
  external = false,
  nofollow = false,
  prefetch = true 
}: SEOLinkProps) {
  const linkProps = {
    title,
    className,
    ...(external && { 
      target: '_blank', 
      rel: nofollow ? 'noopener noreferrer nofollow' : 'noopener noreferrer' 
    }),
    ...(nofollow && !external && { rel: 'nofollow' })
  };

  if (external) {
    return (
      <a href={href} {...linkProps}>
        {children}
        <ExternalLink className="inline w-3 h-3 ml-1" aria-hidden="true" />
      </a>
    );
  }

  return (
    <Link href={href} prefetch={prefetch} {...linkProps}>
      {children}
    </Link>
  );
}

// Product category links for topic clustering
interface CategoryLinksProps {
  currentCategory?: string;
  className?: string;
}

export function CategoryLinks({ currentCategory, className = '' }: CategoryLinksProps) {
  const categories = [
    { name: 'Streaming Services', slug: 'streaming', description: 'Netflix, Disney+, Hulu and more' },
    { name: 'Music Streaming', slug: 'music', description: 'Spotify, Apple Music, YouTube Music' },
    { name: 'Creative Software', slug: 'creative', description: 'Adobe Creative Cloud, Canva Pro, Figma' },
    { name: 'Productivity Tools', slug: 'productivity', description: 'Notion, ChatGPT Plus, Microsoft 365' },
    { name: 'Development Tools', slug: 'development', description: 'GitHub Pro, JetBrains, Visual Studio' },
    { name: 'Education Platforms', slug: 'education', description: 'Coursera, Udemy, MasterClass' },
    { name: 'Gaming Services', slug: 'gaming', description: 'Xbox Game Pass, PlayStation Plus' },
    { name: 'Business Software', slug: 'business', description: 'Salesforce, HubSpot, QuickBooks' }
  ];

  return (
    <nav className={`space-y-2 ${className}`} aria-label="Product categories">
      <h3 className="text-lg font-semibold text-white mb-4">Browse by Category</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {categories.map((category) => (
          <SEOLink
            key={category.slug}
            href={`/#${category.slug}`}
            title={`Browse ${category.name} subscriptions at discount prices`}
            className={`block p-3 rounded-lg border transition-colors ${
              currentCategory === category.slug
                ? 'border-purple-500 bg-purple-500/10 text-purple-300'
                : 'border-gray-700 bg-gray-800 hover:border-gray-600 text-gray-300 hover:text-white'
            }`}
          >
            <div className="font-medium">{category.name}</div>
            <div className="text-sm text-gray-400">{category.description}</div>
          </SEOLink>
        ))}
      </div>
    </nav>
  );
}

// Related products component for internal linking
interface RelatedProductsProps {
  currentProduct?: string;
  category?: string;
  className?: string;
}

export function RelatedProducts({ currentProduct, category, className = '' }: RelatedProductsProps) {
  // This would typically fetch from your database
  const getRelatedProducts = (category?: string) => {
    const allProducts = {
      streaming: [
        { name: 'Netflix Premium', slug: 'netflix-premium', price: '$4.99' },
        { name: 'Disney Plus', slug: 'disney-plus', price: '$2.99' },
        { name: 'Hulu Premium', slug: 'hulu-premium', price: '$3.99' },
        { name: 'YouTube Premium', slug: 'youtube-premium', price: '$3.49' }
      ],
      music: [
        { name: 'Spotify Premium', slug: 'spotify-premium', price: '$2.99' },
        { name: 'Apple Music', slug: 'apple-music', price: '$2.49' },
        { name: 'YouTube Music', slug: 'youtube-music', price: '$2.99' }
      ],
      creative: [
        { name: 'Adobe Creative Cloud', slug: 'adobe-creative-cloud', price: '$14.99' },
        { name: 'Canva Pro', slug: 'canva-pro', price: '$3.99' },
        { name: 'Figma Professional', slug: 'figma-professional', price: '$4.99' }
      ]
    };

    if (category && allProducts[category as keyof typeof allProducts]) {
      return allProducts[category as keyof typeof allProducts];
    }

    // Return popular products if no category
    return [
      ...allProducts.streaming.slice(0, 2),
      ...allProducts.music.slice(0, 1),
      ...allProducts.creative.slice(0, 1)
    ];
  };

  const relatedProducts = getRelatedProducts(category)
    .filter(product => product.slug !== currentProduct)
    .slice(0, 4);

  if (relatedProducts.length === 0) return null;

  return (
    <section className={`${className}`} aria-labelledby="related-products">
      <h3 id="related-products" className="text-lg font-semibold text-white mb-4">
        Related Subscriptions
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {relatedProducts.map((product) => (
          <SEOLink
            key={product.slug}
            href={`/product/${product.slug}`}
            title={`Get ${product.name} subscription at ${product.price}/month - Save up to 80%`}
            className="block p-4 bg-gray-800 border border-gray-700 rounded-lg hover:border-purple-500 transition-colors group"
          >
            <div className="font-medium text-white group-hover:text-purple-300 transition-colors">
              {product.name}
            </div>
            <div className="text-purple-400 font-semibold mt-1">
              {product.price}/month
            </div>
            <div className="flex items-center text-sm text-gray-400 mt-2 group-hover:text-purple-300 transition-colors">
              View Details
              <ArrowRight className="w-3 h-3 ml-1" />
            </div>
          </SEOLink>
        ))}
      </div>
    </section>
  );
}

// Breadcrumb navigation for better internal linking
interface BreadcrumbProps {
  items: Array<{
    label: string;
    href?: string;
  }>;
  className?: string;
}

export function Breadcrumb({ items, className = '' }: BreadcrumbProps) {
  return (
    <nav className={`flex items-center space-x-2 text-sm ${className}`} aria-label="Breadcrumb">
      {items.map((item, index) => (
        <div key={index} className="flex items-center">
          {index > 0 && (
            <span className="text-gray-500 mx-2" aria-hidden="true">/</span>
          )}
          {item.href ? (
            <SEOLink
              href={item.href}
              className="text-purple-400 hover:text-purple-300 transition-colors"
              title={`Navigate to ${item.label}`}
            >
              {item.label}
            </SEOLink>
          ) : (
            <span className="text-gray-300">{item.label}</span>
          )}
        </div>
      ))}
    </nav>
  );
}

// Footer links for comprehensive internal linking
export function FooterLinks() {
  const linkSections = [
    {
      title: 'Popular Categories',
      links: [
        { label: 'Streaming Services', href: '/#streaming' },
        { label: 'Music Streaming', href: '/#music' },
        { label: 'Creative Software', href: '/#creative' },
        { label: 'Productivity Tools', href: '/#productivity' }
      ]
    },
    {
      title: 'Top Services',
      links: [
        { label: 'Netflix Premium', href: '/product/netflix-premium' },
        { label: 'Spotify Premium', href: '/product/spotify-premium' },
        { label: 'Adobe Creative Cloud', href: '/product/adobe-creative-cloud' },
        { label: 'ChatGPT Plus', href: '/product/chatgpt-plus' }
      ]
    },
    {
      title: 'Support',
      links: [
        { label: 'FAQ', href: '/dashboard/support/faq' },
        { label: 'Contact Support', href: '/dashboard/support' },
        { label: 'How It Works', href: '/#how-it-works' },
        { label: 'Pricing Guide', href: '/#pricing' }
      ]
    },
    {
      title: 'Legal',
      links: [
        { label: 'Privacy Policy', href: '/legal/privacy-policy' },
        { label: 'Terms of Service', href: '/legal/terms-of-service' },
        { label: 'Refund Policy', href: '/legal/refund-policy' }
      ]
    }
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
      {linkSections.map((section) => (
        <div key={section.title}>
          <h4 className="font-semibold text-white mb-3">{section.title}</h4>
          <ul className="space-y-2">
            {section.links.map((link) => (
              <li key={link.href}>
                <SEOLink
                  href={link.href}
                  className="text-gray-400 hover:text-purple-300 transition-colors text-sm"
                  title={`Learn more about ${link.label}`}
                >
                  {link.label}
                </SEOLink>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

// Contextual content links component
interface ContextualLinksProps {
  context: 'product' | 'category' | 'checkout' | 'support';
  data?: Record<string, unknown>;
  className?: string;
}

export function ContextualLinks({ context, className = '' }: ContextualLinksProps) {
  const getContextualLinks = () => {
    switch (context) {
      case 'product':
        return [
          { label: 'How to activate your subscription', href: '/dashboard/support/faq#activation' },
          { label: 'Subscription management guide', href: '/dashboard/support/faq#management' },
          { label: 'Refund policy', href: '/legal/refund-policy' }
        ];
      case 'category':
        return [
          { label: 'Compare all subscriptions', href: '/#products' },
          { label: 'Pricing guide', href: '/#pricing' },
          { label: 'How our service works', href: '/#how-it-works' }
        ];
      case 'checkout':
        return [
          { label: 'Payment security', href: '/legal/privacy-policy#payment-security' },
          { label: 'Delivery information', href: '/dashboard/support/faq#delivery' },
          { label: 'Need help?', href: '/dashboard/support' }
        ];
      case 'support':
        return [
          { label: 'Browse all products', href: '/#products' },
          { label: 'Account settings', href: '/dashboard/profile-settings' },
          { label: 'Order history', href: '/dashboard/orders' }
        ];
      default:
        return [];
    }
  };

  const links = getContextualLinks();

  if (links.length === 0) return null;

  return (
    <div className={`bg-gray-800 border border-gray-700 rounded-lg p-4 ${className}`}>
      <h4 className="font-medium text-white mb-3">Helpful Links</h4>
      <ul className="space-y-2">
        {links.map((link) => (
          <li key={link.href}>
            <SEOLink
              href={link.href}
              className="text-purple-400 hover:text-purple-300 transition-colors text-sm flex items-center"
            >
              {link.label}
              <ArrowRight className="w-3 h-3 ml-1" />
            </SEOLink>
          </li>
        ))}
      </ul>
    </div>
  );
}

// Breadcrumb navigation for SEO and UX
interface SEOBreadcrumbsProps {
  items: Array<{ name: string; href?: string }>;
  className?: string;
}

export function SEOBreadcrumbs({ items, className = '' }: SEOBreadcrumbsProps) {
  if (items.length <= 1) return null;
  
  return (
    <nav aria-label="Breadcrumb" className={`mb-6 ${className}`}>
      <ol className="flex items-center space-x-2 text-sm">
        {items.map((item, index) => (
          <li key={index} className="flex items-center">
            {index > 0 && (
              <ArrowRight className="w-4 h-4 text-gray-500 mx-2" aria-hidden="true" />
            )}
            {item.href && index < items.length - 1 ? (
              <Link
                href={item.href}
                className="text-purple-400 hover:text-purple-300 transition-colors"
              >
                {item.name}
              </Link>
            ) : (
              <span 
                className={index === items.length - 1 ? 'text-white font-medium' : 'text-gray-400'}
                aria-current={index === items.length - 1 ? 'page' : undefined}
              >
                {item.name}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
} 
