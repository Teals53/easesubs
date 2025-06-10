import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import Script from 'next/script';

export interface BreadcrumbItem {
  name: string;
  href?: string;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
  className?: string;
}

export function Breadcrumbs({ items, className = '' }: BreadcrumbsProps) {
  // Generate JSON-LD structured data for breadcrumbs
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": items.map((item, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "name": item.name,
      ...(item.href && {
        "item": {
          "@type": "WebPage",
          "@id": `https://easesubs.com${item.href}`,
          "url": `https://easesubs.com${item.href}`
        }
      })
    }))
  };

  return (
    <>
      <Script
        id="breadcrumb-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(breadcrumbSchema),
        }}
      />
      
      <nav aria-label="Breadcrumb" className={`flex items-center space-x-2 text-sm ${className}`}>
        {items.map((item, index) => (
          <div key={index} className="flex items-center">
            {index > 0 && (
              <ChevronRight 
                className="h-4 w-4 text-gray-500 mx-2" 
                aria-hidden="true"
              />
            )}
            
            {item.href && index < items.length - 1 ? (
              <Link
                href={item.href}
                className="text-gray-400 hover:text-white transition-colors"
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
          </div>
        ))}
      </nav>
    </>
  );
}

// Pre-defined breadcrumb configurations for common pages
export const breadcrumbConfigs = {
  home: [{ name: 'Home', href: '/' }],
  products: [
    { name: 'Home', href: '/' },
    { name: 'Products' }
  ],
  product: (productName: string) => [
    { name: 'Home', href: '/' },
    { name: 'Products', href: '/#products' },
    { name: productName }
  ],
  legal: [
    { name: 'Home', href: '/' },
    { name: 'Legal' }
  ],
  privacy: [
    { name: 'Home', href: '/' },
    { name: 'Legal', href: '/legal' },
    { name: 'Privacy Policy' }
  ],
  terms: [
    { name: 'Home', href: '/' },
    { name: 'Legal', href: '/legal' },
    { name: 'Terms of Service' }
  ],
  refund: [
    { name: 'Home', href: '/' },
    { name: 'Legal', href: '/legal' },
    { name: 'Refund Policy' }
  ],
  auth: (pageName: string) => [
    { name: 'Home', href: '/' },
    { name: pageName }
  ],
  dashboard: [
    { name: 'Home', href: '/' },
    { name: 'Dashboard' }
  ]
}; 

