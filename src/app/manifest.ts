import { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'EaseSubs - Premium Subscriptions at Discount Prices',
    short_name: 'EaseSubs',
    description: 'Get your favorite subscriptions at a fraction of the cost through our legal regional pricing system. Save up to 80% on premium services like Netflix, Spotify, Adobe Creative Cloud, and more.',
    start_url: '/',
    display: 'standalone',
    background_color: '#0f1629',
    theme_color: '#9333ea',
    orientation: 'portrait',
    scope: '/',
    categories: ['shopping', 'utilities', 'productivity'],
    lang: 'en',
    dir: 'ltr',
    icons: [
      {
        src: '/favicon.svg',
        sizes: 'any',
        type: 'image/svg+xml',
        purpose: 'any'
      }
    ],
    prefer_related_applications: false,
    related_applications: []
  }
} 

