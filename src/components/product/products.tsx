"use client";

import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { Loader2, Package, ChevronRight, Star } from "lucide-react";
import { trpc } from "@/lib/trpc";
import Link from "next/link";
import Image from "next/image";
import ProductRating from "./ProductRating";
import { fadeIn, slideIn } from "@/lib/animations";
import type { Product, ExtendedCategory } from "@/types/product";
import { DynamicIcon } from "@/components/ui/dynamic-icon";

// Animation utilities moved to @/lib/animations

export function Products() {
  const [activeCategory, setActiveCategory] = useState<string>("");

  // Fetch categories from database with full details
  const { data: categoriesData, isLoading: categoriesLoading } =
    trpc.product.getCategories.useQuery();

  // Fetch products from database
  const {
    data: productsData,
    isLoading: productsLoading,
    error,
  } = trpc.product.getAll.useQuery({
    limit: 50,
  });

  // Transform categories data to include full details
  const extendedCategories: ExtendedCategory[] = useMemo(() => {
    return (
      categoriesData
        ?.filter((cat) => cat.count > 0)
        .map((cat) => ({
          key: cat.key,
          label: cat.label,
          count: cat.count,
          color: cat.color || "#8B5CF6",
          icon: cat.icon || "Package",
          description:
            cat.description || `Explore ${cat.label.toLowerCase()} products`,
        })) || []
    );
  }, [categoriesData]);

  // Set the first category as active when categories are loaded
  useEffect(() => {
    if (extendedCategories.length > 0 && !activeCategory) {
      setActiveCategory(extendedCategories[0].key);
    }
  }, [extendedCategories, activeCategory]);

  // Filter products by active category and sort by display order
  const filteredProducts =
    productsData?.products
      ?.filter((product) => product.category.slug === activeCategory)
      .sort((a, b) => {
        // Sort by displayOrder first (lower numbers first), then by name
        const orderA = a.displayOrder ?? 999999;
        const orderB = b.displayOrder ?? 999999;
        if (orderA !== orderB) {
          return orderA - orderB;
        }
        return a.name.localeCompare(b.name);
      }) || [];

  // Helper function to convert database product to internal type
  const convertProduct = (
    dbProduct: (typeof filteredProducts)[0],
  ): Product => ({
    id: dbProduct.id,
    name: dbProduct.name,
    description: dbProduct.description,
    category: {
      id: dbProduct.category.id,
      name: dbProduct.category.name,
      slug: dbProduct.category.slug,
    },
    borderColor: dbProduct.borderColor,
    logoUrl: dbProduct.logoUrl,

    isFeatured: dbProduct.isFeatured,
    slug: dbProduct.slug,
    displayOrder: dbProduct.displayOrder,
    plans: dbProduct.plans
      .map((plan) => ({
        id: plan.id,
        name: plan.name,
        planType: plan.planType,
        price:
          typeof plan.price === "string"
            ? parseFloat(plan.price)
            : Number(plan.price),
        originalPrice: plan.originalPrice
          ? typeof plan.originalPrice === "string"
            ? parseFloat(plan.originalPrice)
            : Number(plan.originalPrice)
          : undefined,
        billingPeriod: plan.billingPeriod,
        duration: plan.duration,
        features: Array.isArray(plan.features)
          ? (plan.features as string[])
          : [],
        isPopular: plan.isPopular,
        isAvailable: plan.isAvailable,
      }))
      .sort((a, b) => a.price - b.price), // Sort plans by price (cheapest first)
  });

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
    );
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
    );
  }

  if (!extendedCategories || extendedCategories.length === 0) {
    return (
      <section id="products" className="py-20 bg-gray-900">
        <div className="container mx-auto px-4">
          <div className="text-center text-gray-400">
            No product categories available.
          </div>
        </div>
      </section>
    );
  }

  const getProductStyle = (borderColor: string | null | undefined) => {
    if (!borderColor) return {};
    return {
      borderColor,
      boxShadow: `0 0 20px ${borderColor}20`,
    };
  };

  const activeExtendedCategory = extendedCategories.find(
    (cat) => cat.key === activeCategory,
  );

  return (
    <section
      id="products"
      className="py-16 bg-gray-900 min-h-screen overflow-x-hidden"
    >
      <div className="container mx-auto px-4">
        {/* Header */}
        <motion.div
          variants={fadeIn("up")}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.1 }}
          className="text-center mb-12"
        >
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
            <span className="bg-gradient-to-r from-purple-400 to-purple-600 bg-clip-text text-transparent">
              Premium
            </span>{" "}
            Products
          </h2>
          <p className="text-gray-400 max-w-3xl mx-auto text-lg">
            Browse our selection of premium products at significantly reduced
            prices. All products are 100% authentic and backed by our
            satisfaction guarantee.
          </p>
        </motion.div>

        {/* Main Content Layout */}
        <div className="flex flex-col lg:flex-row gap-8 overflow-x-hidden">
          {/* Categories Sidebar */}
          <motion.div
            variants={slideIn("left")}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.1 }}
            className="lg:w-80 flex-shrink-0"
          >
            <div className="bg-gray-800/50 backdrop-blur-lg rounded-2xl border border-gray-700 p-6 sticky top-6">
              <h3 className="text-xl font-bold text-white mb-6 flex items-center">
                <Package className="h-5 w-5 mr-2 text-purple-400" />
                Categories
              </h3>

              <div className="space-y-3">
                {extendedCategories.map((category, index) => (
                  <motion.button
                    key={category.key}
                    variants={fadeIn("up", 0.1 * index)}
                    initial="hidden"
                    animate="show"
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    onClick={() => setActiveCategory(category.key)}
                    className={`w-full p-4 rounded-xl text-left transition-all duration-300 group focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-gray-900 ${
                      activeCategory === category.key
                        ? "bg-gradient-to-r from-purple-600/20 to-purple-500/20 border-2 border-purple-500/50 shadow-lg shadow-purple-500/20"
                        : "bg-gray-700/50 border-2 border-transparent hover:bg-gray-700/70 hover:border-gray-600"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div
                          className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300 ${
                            activeCategory === category.key
                              ? "shadow-lg"
                              : "group-hover:scale-110"
                          }`}
                          style={{
                            backgroundColor: category.color,
                            boxShadow:
                              activeCategory === category.key
                                ? `0 8px 25px ${category.color}40`
                                : `0 4px 15px ${category.color}20`,
                          }}
                        >
                          <DynamicIcon
                            name={category.icon}
                            className="text-white"
                            size={20}
                          />
                        </div>
                        <div className="flex-1">
                          <h4
                            className={`font-semibold transition-colors ${
                              activeCategory === category.key
                                ? "text-white"
                                : "text-gray-300 group-hover:text-white"
                            }`}
                          >
                            {category.label}
                          </h4>
                          <p
                            className={`text-sm transition-colors ${
                              activeCategory === category.key
                                ? "text-purple-200"
                                : "text-gray-500 group-hover:text-gray-400"
                            }`}
                          >
                            {category.count} products
                          </p>
                        </div>
                      </div>
                      <ChevronRight
                        className={`h-5 w-5 transition-all duration-300 ${
                          activeCategory === category.key
                            ? "text-purple-400 rotate-90"
                            : "text-gray-500 group-hover:text-gray-300 group-hover:translate-x-1"
                        }`}
                      />
                    </div>
                  </motion.button>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Products Content */}
          <motion.div
            variants={slideIn("right")}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.1 }}
            className="flex-1"
          >
            {/* Products Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 py-4">
              {filteredProducts.length > 0 ? (
                filteredProducts.map((dbProduct, index: number) => {
                  const product = convertProduct(dbProduct);
                  // Get the primary plan (prioritize popular plans, then cheapest available plan that is in stock)
                  const primaryPlan =
                    product.plans.find(
                      (plan) => plan.isPopular && plan.isAvailable,
                    ) ||
                    product.plans.find((plan) => plan.isAvailable) ||
                    product.plans[0];

                  if (!primaryPlan) return null;

                  return (
                    <motion.div
                      key={product.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{
                        duration: 0.3,
                        delay: Math.min(index * 0.05, 0.3),
                        ease: "easeOut",
                      }}
                      whileHover={{
                        y: -8,
                        boxShadow: product.borderColor
                          ? `0 20px 40px -10px ${product.borderColor}30`
                          : "0 20px 40px -10px rgba(139, 92, 246, 0.3)",
                        transition: { duration: 0.2 },
                      }}
                      className={`bg-gray-800/60 backdrop-blur-lg border-2 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 relative cursor-pointer group ${
                        product.borderColor
                          ? ""
                          : "border-gray-700 hover:border-gray-600"
                      } ${
                        product.isFeatured
                          ? "ring-2 ring-offset-2 ring-offset-gray-900 ring-yellow-500"
                          : ""
                      }`}
                      style={getProductStyle(product.borderColor)}
                    >
                      {/* Featured badge */}
                      {product.isFeatured && (
                        <div className="absolute top-4 left-4 z-10">
                          <div className="bg-gradient-to-r from-yellow-400 to-yellow-500 text-black text-xs font-bold px-3 py-1.5 rounded-full flex items-center shadow-lg">
                            <Star className="w-3 h-3 mr-1 fill-current" />
                            FEATURED
                          </div>
                        </div>
                      )}

                      <Link href={`/product/${product.slug}`}>
                        <div className="p-6 h-full flex flex-col">
                          {/* Logo */}
                          <div className="flex items-center justify-center mb-6">
                            {product.logoUrl ? (
                              <div className="w-20 h-20 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                                <Image
                                  src={product.logoUrl}
                                  alt={product.name}
                                  width={80}
                                  height={80}
                                  className="max-w-full max-h-full object-contain rounded-xl shadow-lg"
                                  onError={(e) => {
                                    // Fallback to Package icon if logo fails to load
                                    const target = e.target as HTMLImageElement;
                                    target.style.display = "none";
                                    target.parentElement!.innerHTML =
                                      '<div class="w-20 h-20 bg-gray-700 rounded-xl flex items-center justify-center shadow-lg"><svg class="h-10 w-10 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg></div>';
                                  }}
                                  sizes="80px"
                                  quality={85}
                                  unoptimized
                                  priority
                                />
                              </div>
                            ) : (
                              <div
                                className="w-20 h-20 rounded-xl flex items-center justify-center text-white font-bold text-2xl shadow-lg group-hover:scale-110 transition-transform duration-300"
                                style={{
                                  backgroundColor:
                                    product.borderColor || "#9333EA",
                                }}
                              >
                                {product.name?.[0] || (
                                  <Package className="h-10 w-10 text-white" />
                                )}
                              </div>
                            )}
                          </div>

                          {/* Product info */}
                          <h3 className="text-xl font-bold text-white mb-3 text-center group-hover:text-purple-200 transition-colors">
                            {product.name}
                          </h3>

                          {product.description && (
                            <p className="text-gray-400 text-sm mb-4 text-center line-clamp-2 flex-grow">
                              {product.description}
                            </p>
                          )}

                          {/* Pricing */}
                          <div className="text-center mb-6">
                            <div className="flex items-center justify-center gap-3 mb-2">
                              <span className="text-3xl font-bold text-white">
                                ${primaryPlan.price}
                              </span>
                              {primaryPlan.originalPrice &&
                                primaryPlan.originalPrice >
                                  primaryPlan.price && (
                                  <span className="text-lg text-gray-400 line-through">
                                    ${primaryPlan.originalPrice}
                                  </span>
                                )}
                            </div>
                            <p className="text-gray-400 text-sm mb-3">
                              {primaryPlan.planType} •{" "}
                              {primaryPlan.billingPeriod.toLowerCase()}
                            </p>
                            {primaryPlan.originalPrice &&
                              primaryPlan.originalPrice > primaryPlan.price && (
                                <div className="bg-green-500/20 text-green-400 text-sm font-medium px-4 py-2 rounded-full inline-block">
                                  Save{" "}
                                  {Math.round(
                                    (1 -
                                      Number(primaryPlan.price) /
                                        Number(primaryPlan.originalPrice)) *
                                      100,
                                  )}
                                  %
                                </div>
                              )}
                          </div>

                          {/* Plans count and rating */}
                          <div className="grid grid-cols-2 gap-4 mb-6">
                            <div className="text-center">
                              <div className="flex items-center justify-center space-x-1 mb-1">
                                <Package className="h-4 w-4 text-purple-400" />
                                <span className="text-gray-400 text-xs">
                                  Plans
                                </span>
                              </div>
                              <p className="text-lg font-bold text-white">
                                {product.plans.length}
                              </p>
                            </div>
                            <ProductRating productId={product.id} />
                          </div>

                          {/* View Details button */}
                          <div className="mt-auto">
                            <button className="w-full font-semibold py-3 px-6 rounded-xl shadow-lg transition-all duration-300 text-center bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white shadow-purple-600/30 hover:shadow-purple-600/50 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-gray-900">
                              View Details & Plans
                            </button>
                          </div>
                        </div>
                      </Link>
                    </motion.div>
                  );
                })
              ) : (
                <div className="col-span-full text-center py-16">
                  <div
                    className="w-24 h-24 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg"
                    style={{
                      backgroundColor:
                        activeExtendedCategory?.color || "#6B7280",
                    }}
                  >
                    <Package className="h-12 w-12 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-300 mb-2">
                    No products found
                  </h3>
                  <p className="text-gray-500">
                    There are no products available in this category yet.
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
