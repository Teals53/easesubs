'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Loader2, Star, Package } from 'lucide-react'
import { trpc } from '@/lib/trpc'
import Link from 'next/link'
import Image from 'next/image'

// Internal types for display
interface ProductPlan {
  id: string
  name: string
  planType: string
  price: number
  originalPrice?: number
  billingPeriod: string
  duration: number
  features?: string[]
  isPopular?: boolean
  isAvailable: boolean
  stockQuantity?: number
}

interface Product {
  id: string
  name: string
  description?: string | null
  category: string
  borderColor?: string | null
  logoUrl?: string | null
  logoName?: string | null
  plans: ProductPlan[]
  isFeatured?: boolean
  slug: string
  displayOrder?: number | null
}

interface Category {
  key: string
  label: string
  count: number
}

const fadeIn = (direction: string, delay = 0) => ({
  hidden: { 
    opacity: 0, 
    y: direction === 'up' ? 40 : direction === 'down' ? -40 : 0,
    x: direction === 'left' ? 40 : direction === 'right' ? -40 : 0
  },
  show: { 
    opacity: 1, 
    y: 0,
    x: 0,
    transition: { 
      duration: 0.5, 
      delay,
      ease: 'easeOut'
    }
  }
})

export function Products() {
  const [activeCategory, setActiveCategory] = useState<string>('')

  // Fetch categories from database
  const { data: categoriesData, isLoading: categoriesLoading } = trpc.product.getCategories.useQuery()

  // Fetch products from database
  const { data: productsData, isLoading: productsLoading, error } = trpc.product.getAll.useQuery({
    limit: 50,
  })

  // Set the first category as active when categories are loaded
  useEffect(() => {
    if (categoriesData && categoriesData.length > 0 && !activeCategory) {
      setActiveCategory(categoriesData[0].key)
    }
  }, [categoriesData, activeCategory])

  // Filter products by active category and sort by display order
  const filteredProducts = productsData?.products?.filter(
    (product) => product.category === activeCategory
  ).sort((a, b) => {
    // Sort by displayOrder first (lower numbers first), then by name
    const orderA = a.displayOrder ?? 999999
    const orderB = b.displayOrder ?? 999999
    if (orderA !== orderB) {
      return orderA - orderB
    }
    return a.name.localeCompare(b.name)
  }) || []

  // Helper function to convert database product to internal type
  const convertProduct = (dbProduct: typeof filteredProducts[0]): Product => ({
    id: dbProduct.id,
    name: dbProduct.name,
    description: dbProduct.description,
    category: dbProduct.category,
    borderColor: dbProduct.borderColor,
    logoUrl: dbProduct.logoUrl,
    logoName: dbProduct.logoName,
    isFeatured: dbProduct.isFeatured,
    slug: dbProduct.slug,
    displayOrder: dbProduct.displayOrder,
    plans: dbProduct.plans
      .map(plan => ({
        id: plan.id,
        name: plan.name,
        planType: plan.planType,
        price: typeof plan.price === 'string' ? parseFloat(plan.price) : Number(plan.price),
        originalPrice: plan.originalPrice ? (typeof plan.originalPrice === 'string' ? parseFloat(plan.originalPrice) : Number(plan.originalPrice)) : undefined,
        billingPeriod: plan.billingPeriod,
        duration: plan.duration,
        features: Array.isArray(plan.features) ? plan.features as string[] : [],
        isPopular: plan.isPopular,
        isAvailable: plan.isAvailable,
        stockQuantity: plan.stockQuantity || undefined,
      }))
      .sort((a, b) => a.price - b.price) // Sort plans by price (cheapest first)
  })

  if (categoriesLoading || productsLoading) {
    return (
      <section id="products" className="py-20 bg-gray-900">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-purple-500" />
            <p className="text-gray-400 mt-2">Loading products...</p>
          </div>
        </div>
      </section>
    )
  }

  if (error) {
    return (
      <section id="products" className="py-20 bg-gray-900">
        <div className="container mx-auto px-4">
          <div className="text-center text-red-400">
            Error loading products. Please try again later.
          </div>
        </div>
      </section>
    )
  }

  if (!categoriesData || categoriesData.length === 0) {
    return (
      <section id="products" className="py-20 bg-gray-900">
        <div className="container mx-auto px-4">
          <div className="text-center text-gray-400">
            No product categories available.
          </div>
        </div>
      </section>
    )
  }

  const getProductStyle = (borderColor: string | null | undefined) => {
    if (!borderColor) return {}
    return {
      borderColor,
      borderWidth: '3px',
      boxShadow: `0 0 10px ${borderColor}40`,
    }
  }

  return (
    <section id="products" className="py-16 bg-gray-900">
      <div className="container mx-auto px-4">
        <motion.div
          variants={fadeIn('up')}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.1 }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            <span className="bg-gradient-to-r from-purple-400 to-purple-600 bg-clip-text text-transparent">
              Premium
            </span>{' '}
            Products
          </h2>
          <p className="text-gray-400 max-w-2xl mx-auto">
            Browse our selection of premium products at
            significantly reduced prices. All products are 100% authentic
            and backed by our satisfaction guarantee.
          </p>
        </motion.div>

        {/* Category tabs */}
        <div className="flex flex-wrap justify-center mb-8 gap-2">
          {categoriesData.map((category: Category, index: number) => (
            <motion.button
              key={category.key}
              variants={fadeIn('up', 0.1 * index)}
              initial="hidden"
              animate="show"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setActiveCategory(category.key)}
              className={`px-6 py-3 rounded-xl text-sm font-medium transition-colors ${
                activeCategory === category.key
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
              }`}
            >
              {category.label}
              {category.count > 0 && (
                <span className="ml-2 text-xs opacity-75">({category.count})</span>
              )}
            </motion.button>
          ))}
        </div>

        {/* Products grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredProducts.length > 0 ? (
            filteredProducts.map((dbProduct, index: number) => {
              const product = convertProduct(dbProduct)
              // Get the primary plan (prioritize popular plans, then cheapest available plan that is in stock)
              const primaryPlan = product.plans.find(plan => 
                plan.isPopular && plan.isAvailable && (plan.stockQuantity === undefined || plan.stockQuantity === null || plan.stockQuantity > 0)
              ) || product.plans.find(plan => 
                plan.isAvailable && (plan.stockQuantity === undefined || plan.stockQuantity === null || plan.stockQuantity > 0)
              ) || product.plans[0]
              
              if (!primaryPlan) return null

              const isOutOfStock = primaryPlan.stockQuantity !== null && primaryPlan.stockQuantity !== undefined && primaryPlan.stockQuantity <= 0

              return (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    duration: 0.4,
                    delay: index * 0.1,
                    ease: 'easeOut',
                  }}
                  whileHover={{
                    y: -8,
                    boxShadow: product.borderColor 
                      ? `0 10px 25px -5px ${product.borderColor}40`
                      : '0 10px 25px -5px rgba(139, 92, 246, 0.3)',
                  }}
                  className={`bg-gray-800 border-2 rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-all relative cursor-pointer ${
                    'border-gray-700'
                  } ${
                    product.isFeatured
                      ? 'ring-2 ring-offset-2 ring-offset-gray-900 ring-yellow-500'
                      : ''
                  }`}
                  style={getProductStyle(product.borderColor)}
                >
                  {/* Featured badge */}
                  {product.isFeatured && (
                    <div className="absolute top-3 left-3 z-10">
                      <div className="bg-gradient-to-r from-yellow-400 to-yellow-500 text-black text-xs font-bold px-3 py-1.5 rounded-full flex items-center shadow-lg">
                        <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                        FEATURED
                      </div>
                    </div>
                  )}

                  {/* Out of stock overlay */}
                  {isOutOfStock && (
                    <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-20">
                      <div className="bg-red-600 text-white text-sm font-semibold px-4 py-2 rounded-lg">
                        Out of Stock
                      </div>
                    </div>
                  )}

                  <Link href={`/product/${product.slug}`}>
                    <div className="p-6 h-full flex flex-col">
                      {/* Logo */}
                      <div className="flex items-center justify-center mb-4">
                        {product.logoUrl ? (
                          <div className="w-16 h-16 flex items-center justify-center">
                            <Image
                              src={product.logoUrl}
                              alt={product.logoName || product.name}
                              width={64}
                              height={64}
                              className="max-w-full max-h-full object-contain rounded-lg"
                              onError={(e) => {
                                // Fallback to Package icon if logo fails to load
                                const target = e.target as HTMLImageElement
                                target.style.display = 'none'
                                target.parentElement!.innerHTML = '<div class="w-16 h-16 bg-gray-700 rounded-lg flex items-center justify-center"><svg class="h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg></div>'
                              }}
                              unoptimized
                            />
                          </div>
                        ) : (
                          <div 
                            className="w-16 h-16 rounded-lg flex items-center justify-center text-white font-bold text-xl"
                            style={{ 
                              backgroundColor: product.borderColor || '#9333EA'
                            }}
                          >
                            {product.name?.[0] || <Package className="h-8 w-8 text-purple-400" />}
                          </div>
                        )}
                      </div>

                      {/* Product info */}
                      <h3 className="text-lg font-semibold text-white mb-2 text-center">
                        {product.name}
                      </h3>
                      
                      {product.description && (
                        <p className="text-gray-400 text-sm mb-4 text-center line-clamp-2 flex-grow">
                          {product.description}
                        </p>
                      )}

                      {/* Pricing */}
                      <div className="text-center mb-4">
                        <div className="flex items-center justify-center gap-2 mb-2">
                          <span className="text-2xl font-bold text-white">
                            ${primaryPlan.price}
                          </span>
                          {primaryPlan.originalPrice && primaryPlan.originalPrice > primaryPlan.price && (
                            <span className="text-lg text-gray-400 line-through">
                              ${primaryPlan.originalPrice}
                            </span>
                          )}
                        </div>
                        <p className="text-gray-400 text-sm mb-2">
                          {primaryPlan.planType} • {primaryPlan.billingPeriod.toLowerCase()}
                        </p>
                        {primaryPlan.originalPrice && primaryPlan.originalPrice > primaryPlan.price && (
                          <div className="bg-green-500/20 text-green-400 text-sm font-medium px-3 py-1 rounded-full inline-block mb-2">
                            Save {Math.round((1 - Number(primaryPlan.price) / Number(primaryPlan.originalPrice)) * 100)}%
                          </div>
                        )}
                      </div>

                      {/* Plans count and rating */}
                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <div className="text-center">
                          <div className="flex items-center justify-center space-x-1">
                            <Package className="h-4 w-4 text-purple-400" />
                            <span className="text-gray-400 text-xs">Plans</span>
                          </div>
                          <p className="text-lg font-bold text-white">{product.plans.length}</p>
                        </div>
                        <div className="text-center">
                          <div className="flex items-center justify-center space-x-1">
                            <Star className="h-4 w-4 text-yellow-400" />
                            <span className="text-gray-400 text-xs">Rating</span>
                          </div>
                          <p className="text-lg font-bold text-white">4.8</p>
                        </div>
                      </div>

                      {/* View Details button */}
                      <div className="mt-auto">
                        <div className={`w-full font-semibold py-3 px-4 rounded-lg shadow transition-all text-center ${
                          isOutOfStock
                            ? 'bg-gray-600 text-gray-400'
                            : 'bg-purple-600 hover:bg-purple-700 text-white shadow-purple-600/30'
                        }`}>
                          {isOutOfStock ? 'Out of Stock' : 'View Details & Plans'}
                        </div>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              )
            })
          ) : (
            <div className="col-span-full text-center py-12">
              <Package className="h-12 w-12 text-gray-600 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-400 mb-2">
                No products found
              </h3>
              <p className="text-gray-500">
                There are no products available in this category.
              </p>
            </div>
          )}
        </div>
      </div>
    </section>
  )
} 