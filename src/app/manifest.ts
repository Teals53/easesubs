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
        src: '/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any'
      },
      {
        src: '/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any'
      },
      {
        src: '/icon-192-maskable.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'maskable'
      },
      {
        src: '/icon-512-maskable.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable'
      },
      {
        src: '/apple-touch-icon.png',
        sizes: '180x180',
        type: 'image/png',
        purpose: 'any'
      }
    ],
    screenshots: [
      {
        src: '/screenshot-wide.png',
        sizes: '1280x720',
        type: 'image/png',
        form_factor: 'wide',
        label: 'EaseSubs desktop interface showing subscription deals'
      },
      {
        src: '/screenshot-narrow.png',
        sizes: '375x812',
        type: 'image/png',
        form_factor: 'narrow',
        label: 'EaseSubs mobile interface for browsing subscriptions'
      }
    ],
    shortcuts: [
      {
        name: 'Browse Deals',
        short_name: 'Deals',
        description: 'Browse current subscription deals',
        url: '/#products',
        icons: [
          {
            src: '/shortcut-deals.png',
            sizes: '96x96',
            type: 'image/png'
          }
        ]
      },
      {
        name: 'My Orders',
        short_name: 'Orders',
        description: 'View your order history',
        url: '/dashboard/orders',
        icons: [
          {
            src: '/shortcut-orders.png',
            sizes: '96x96',
            type: 'image/png'
          }
        ]
      }
    ],
    prefer_related_applications: false,
    related_applications: []
  }
} 

