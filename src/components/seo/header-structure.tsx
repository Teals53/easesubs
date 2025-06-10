import { ReactNode } from 'react';

interface HeaderProps {
  children: ReactNode;
  className?: string;
  id?: string;
}

// Semantic header components with proper hierarchy
export function H1({ children, className = '', id }: HeaderProps) {
  return (
    <h1 
      className={`text-4xl md:text-5xl lg:text-6xl font-bold mb-6 ${className}`}
      id={id}
    >
      {children}
    </h1>
  );
}

export function H2({ children, className = '', id }: HeaderProps) {
  return (
    <h2 
      className={`text-3xl md:text-4xl font-bold mb-4 ${className}`}
      id={id}
    >
      {children}
    </h2>
  );
}

export function H3({ children, className = '', id }: HeaderProps) {
  return (
    <h3 
      className={`text-2xl md:text-3xl font-semibold mb-3 ${className}`}
      id={id}
    >
      {children}
    </h3>
  );
}

export function H4({ children, className = '', id }: HeaderProps) {
  return (
    <h4 
      className={`text-xl md:text-2xl font-semibold mb-2 ${className}`}
      id={id}
    >
      {children}
    </h4>
  );
}

export function H5({ children, className = '', id }: HeaderProps) {
  return (
    <h5 
      className={`text-lg md:text-xl font-medium mb-2 ${className}`}
      id={id}
    >
      {children}
    </h5>
  );
}

export function H6({ children, className = '', id }: HeaderProps) {
  return (
    <h6 
      className={`text-base md:text-lg font-medium mb-1 ${className}`}
      id={id}
    >
      {children}
    </h6>
  );
}

// SEO-optimized page title component
interface PageTitleProps {
  title: string;
  subtitle?: string;
  description?: string;
  gradient?: boolean;
  centered?: boolean;
  className?: string;
}

export function PageTitle({ 
  title, 
  subtitle, 
  description, 
  gradient = true,
  centered = true,
  className = '' 
}: PageTitleProps) {
  const titleClasses = `
    text-4xl md:text-5xl lg:text-6xl font-bold mb-4
    ${gradient ? 'bg-gradient-to-r from-purple-400 to-purple-600 bg-clip-text text-transparent' : 'text-white'}
    ${centered ? 'text-center' : ''}
    ${className}
  `.trim();

  return (
    <header className={centered ? 'text-center' : ''}>
      <H1 className={titleClasses}>
        {title}
      </H1>
      
      {subtitle && (
        <H2 className={`text-xl md:text-2xl text-gray-300 mb-4 font-medium ${centered ? 'text-center' : ''}`}>
          {subtitle}
        </H2>
      )}
      
      {description && (
        <p className={`text-lg text-gray-400 max-w-2xl ${centered ? 'mx-auto text-center' : ''}`}>
          {description}
        </p>
      )}
    </header>
  );
}

// Section header component
interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  level?: 2 | 3 | 4 | 5 | 6;
  className?: string;
  id?: string;
}

export function SectionHeader({ 
  title, 
  subtitle, 
  level = 2, 
  className = '',
  id 
}: SectionHeaderProps) {
  const HeaderComponent = {
    2: H2,
    3: H3,
    4: H4,
    5: H5,
    6: H6,
  }[level];

  return (
    <header>
      <HeaderComponent 
        className={`text-white ${className}`}
        id={id}
      >
        {title}
      </HeaderComponent>
      
      {subtitle && (
        <p className="text-gray-400 text-lg mb-4">
          {subtitle}
        </p>
      )}
    </header>
  );
}

// Table of contents generator
interface TOCItem {
  id: string;
  title: string;
  level: number;
}

interface TableOfContentsProps {
  items: TOCItem[];
  className?: string;
}

export function TableOfContents({ items, className = '' }: TableOfContentsProps) {
  if (items.length === 0) return null;

  return (
    <nav 
      className={`bg-gray-900 rounded-lg p-6 ${className}`}
      aria-labelledby="toc-heading"
    >
      <H3 id="toc-heading" className="text-white mb-4">
        Table of Contents
      </H3>
      
      <ol className="space-y-2">
        {items.map((item, index) => (
          <li 
            key={item.id}
            style={{ paddingLeft: `${(item.level - 1) * 1}rem` }}
          >
            <a
              href={`#${item.id}`}
              className="text-purple-400 hover:text-purple-300 transition-colors"
            >
              {index + 1}. {item.title}
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
}

// Header hierarchy validator (development helper)
export function validateHeaderStructure() {
  if (process.env.NODE_ENV === 'development') {
    const headers = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
    const levels: number[] = [];
    
    headers.forEach(header => {
      const level = parseInt(header.tagName.charAt(1));
      levels.push(level);
    });

    // Check for proper hierarchy
    let hasH1 = false;
    let previousLevel = 0;
    
    for (const level of levels) {
      if (level === 1) {
        hasH1 = true;
      }
      
      if (level > previousLevel + 1) {
        if (process.env.NODE_ENV === 'development') {
          // console.warn(`SEO Warning: Header level ${level} follows level ${previousLevel}. Consider using proper hierarchy.`);
        }
      }
      
      previousLevel = level;
    }

    if (!hasH1) {
      if (process.env.NODE_ENV === 'development') {
        // console.warn('SEO Warning: No H1 tag found on this page.');
      }
    }
    
    const h1Count = levels.filter(level => level === 1).length;
    if (h1Count > 1) {
      if (process.env.NODE_ENV === 'development') {
        // console.warn(`SEO Warning: Multiple H1 tags found (${h1Count}). Use only one H1 per page.`);
      }
    }
  }
} 