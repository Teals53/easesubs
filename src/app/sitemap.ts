import { MetadataRoute } from 'next'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://easesubs.com'
  const currentDate = new Date()
  const lastWeek = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
  const lastMonth = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
  
  // Static pages with their priorities and change frequencies
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: currentDate,
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${baseUrl}/legal/privacy-policy`,
      lastModified: lastMonth,
      changeFrequency: 'monthly',
      priority: 0.3,
    },
    {
      url: `${baseUrl}/legal/terms-of-service`,
      lastModified: lastMonth,
      changeFrequency: 'monthly',
      priority: 0.3,
    },
    {
      url: `${baseUrl}/legal/refund-policy`,
      lastModified: lastMonth,
      changeFrequency: 'monthly',
      priority: 0.3,
    },
    {
      url: `${baseUrl}/auth/signin`,
      lastModified: lastWeek,
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: `${baseUrl}/auth/signup`,
      lastModified: lastWeek,
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: `${baseUrl}/dashboard/support/faq`,
      lastModified: lastWeek,
      changeFrequency: 'weekly',
      priority: 0.7,
    },
  ]

  // Generate dynamic product pages with better SEO optimization
  const dynamicPages: MetadataRoute.Sitemap = []
  
  try {
    // Comprehensive list of subscription services organized by category
    const productCategories = {
      streaming: {
        priority: 0.9,
        products: [
          'netflix-premium',
          'disney-plus',
          'hulu-premium', 
          'youtube-premium',
          'paramount-plus',
          'amazon-prime-video',
          'hbo-max',
          'apple-tv-plus',
          'peacock-premium',
          'discovery-plus',
          'crunchyroll-premium',
          'funimation',
          'starz',
          'showtime'
        ]
      },
      music: {
        priority: 0.9,
        products: [
          'spotify-premium',
          'apple-music',
          'youtube-music',
          'amazon-music-unlimited',
          'tidal-premium',
          'deezer-premium',
          'pandora-plus',
          'soundcloud-go'
        ]
      },
      creative: {
        priority: 0.8,
        products: [
          'adobe-creative-cloud',
          'canva-pro',
          'figma-professional',
          'sketch',
          'adobe-photoshop',
          'adobe-premiere-pro',
          'after-effects',
          'illustrator',
          'indesign',
          'lightroom',
          'audition',
          'xd'
        ]
      },
      productivity: {
        priority: 0.8,
        products: [
          'notion-pro',
          'chatgpt-plus',
          'microsoft-office-365',
          'google-workspace',
          'dropbox-plus',
          'evernote-premium',
          'todoist-premium',
          'slack-premium',
          'asana-premium',
          'trello-business',
          'monday-pro',
          'airtable-pro'
        ]
      },
      development: {
        priority: 0.7,
        products: [
          'github-pro',
          'jetbrains-all-products',
          'visual-studio-professional',
          'postman-premium',
          'figma-dev-mode',
          'vercel-pro',
          'netlify-pro',
          'aws-developer',
          'docker-pro',
          'tableau-desktop'
        ]
      },
      education: {
        priority: 0.7,
        products: [
          'coursera-plus',
          'udemy-business',
          'linkedin-learning',
          'skillshare-premium',
          'masterclass',
          'pluralsight',
          'brilliant-premium',
          'duolingo-plus',
          'grammarly-premium'
        ]
      },
      gaming: {
        priority: 0.8,
        products: [
          'xbox-game-pass',
          'playstation-plus',
          'nintendo-switch-online',
          'steam-deck',
          'epic-games-store',
          'origin-access',
          'ubisoft-plus',
          'ea-play'
        ]
      },
      business: {
        priority: 0.6,
        products: [
          'salesforce-essentials',
          'hubspot-starter',
          'mailchimp-standard',
          'constant-contact',
          'quickbooks-online',
          'freshbooks',
          'zoom-pro',
          'teams-essentials'
        ]
      }
    }
    
    // Add category pages with high priority for SEO
    Object.keys(productCategories).forEach((category) => {
      staticPages.push({
        url: `${baseUrl}/#${category}`,
        lastModified: currentDate,
        changeFrequency: 'weekly',
        priority: 0.8,
      })
    })
    
    // Add individual product pages
    Object.entries(productCategories).forEach(([, data]) => {
      data.products.forEach(product => {
        dynamicPages.push({
          url: `${baseUrl}/product/${product}`,
          lastModified: lastWeek,
          changeFrequency: 'weekly',
          priority: data.priority,
        })
      })
    })

    // Add popular search and filter pages
    const popularSearchPages = [
      { path: '/search?category=streaming', priority: 0.7 },
      { path: '/search?category=music', priority: 0.7 },
      { path: '/search?category=creative', priority: 0.6 },
      { path: '/search?category=productivity', priority: 0.6 },
      { path: '/search?sort=price-low', priority: 0.5 },
      { path: '/search?sort=popularity', priority: 0.5 },
    ]

    popularSearchPages.forEach(page => {
      staticPages.push({
        url: `${baseUrl}${page.path}`,
        lastModified: currentDate,
        changeFrequency: 'daily',
        priority: page.priority,
      })
    })

    // Add blog/content pages if they exist
    const contentPages = [
      'how-to-save-on-subscriptions',
      'best-streaming-deals-2024',
      'netflix-vs-competitors',
      'adobe-creative-cloud-alternatives',
      'subscription-management-tips',
    ]

    contentPages.forEach(slug => {
      dynamicPages.push({
        url: `${baseUrl}/blog/${slug}`,
        lastModified: lastWeek,
        changeFrequency: 'monthly',
        priority: 0.6,
      })
    })

  } catch (error) {
    console.error('Error generating dynamic sitemap entries:', error)
  }

  // Combine all pages and sort by priority (highest first)
  const allPages = [...staticPages, ...dynamicPages].sort((a, b) => (b.priority || 0) - (a.priority || 0))

  return allPages
} 

