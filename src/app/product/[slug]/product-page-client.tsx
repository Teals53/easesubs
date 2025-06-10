"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import { ArrowLeft, Clock, Check, Package, ShoppingCart } from "lucide-react";
import Link from "next/link";
import { trpc } from "@/lib/trpc";
import { useCart } from "@/components/cart/use-cart";
import { toast } from "sonner";
import ProductStats from "@/components/product/ProductStats";
import ProductReviews from "@/components/product/ProductReviews";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import Script from "next/script";

interface ProductPageClientProps {
  slug: string;
}

export default function ProductPageClient({ slug }: ProductPageClientProps) {
  const [selectedPlanId, setSelectedPlanId] = useState<string>("");
  const [quantity, setQuantity] = useState(1);
  const [addToCartSuccess, setAddToCartSuccess] = useState(false);
  const { addItem, isAdding } = useCart();

  const { data: product, isLoading } = trpc.product.getBySlug.useQuery(
    { slug },
    {
      enabled: !!slug,
      retry: (failureCount) => {
        // Don't retry if slug is invalid
        if (!slug) return false;
        return failureCount < 2;
      },
    },
  );

  // Get the selected plan
  const selectedPlan =
    product?.plans.find((plan) => plan.id === selectedPlanId) ||
    product?.plans[0];

  // Get stock availability for the selected plan
  const { data: stockData } = trpc.product.getStockAvailability.useQuery(
    { planId: selectedPlan?.id || "" },
    {
      enabled: !!selectedPlan?.id,
      refetchInterval: 30000, // Refetch every 30 seconds to keep stock info fresh
    },
  );

  if (isLoading) {
    return (
      <>
        <Header />
        <div className="min-h-screen bg-gray-900 flex items-center justify-center pt-20">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-purple-500"></div>
        </div>
        <Footer />
      </>
    );
  }

  if (!product) {
    return (
      <>
        <Header />
        <div className="min-h-screen bg-gray-900 flex items-center justify-center pt-20">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-white mb-4">
              Product Not Found
            </h1>
            <Link
              href="/"
              className="text-purple-400 hover:text-purple-300 transition-colors"
            >
              ← Back to Home
            </Link>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  const handleAddToCart = async () => {
    if (!selectedPlan) {
      toast.error("Please select a plan");
      return;
    }

    if (!product?.id) {
      toast.error("Product information is not available");
      return;
    }

    const cartItem = {
      productId: product.id,
      planId: selectedPlan.id,
      productName: product.name,
      planName: selectedPlan.name,
      planType: selectedPlan.planType,
      price: Number(selectedPlan.price),
      originalPrice: selectedPlan.originalPrice
        ? Number(selectedPlan.originalPrice)
        : undefined,
      billingPeriod: selectedPlan.billingPeriod,
      borderColor: product.borderColor || undefined,
      logoUrl: product.logoUrl || undefined,
    };

    try {
      await addItem(cartItem, quantity);
      // Only show success animation if the operation actually succeeded
      setAddToCartSuccess(true);
      setTimeout(() => setAddToCartSuccess(false), 2000);
    } catch {
      if (process.env.NODE_ENV === 'development') {
        // console.error("Error adding to cart:", error);
      }
      toast.error("Failed to add to cart. Please try again.");
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(price);
  };

  const getBillingPeriodLabel = (period: string) => {
    switch (period) {
      case "MONTHLY":
        return "per month";
      case "YEARLY":
        return "per year";
      case "LIFETIME":
        return "one-time";
      case "CUSTOM":
        return "custom";
      default:
        return period.toLowerCase();
    }
  };

  // Generate structured data for the product
  const structuredData = {
    "@context": "https://schema.org/",
    "@type": "Product",
    name: product.name,
    description: product.description || `Premium ${product.name} subscription plans at discounted prices`,
            image: product.logoUrl || "https://via.placeholder.com/1200x630/8B5CF6/FFFFFF?text=EaseSubs",
    brand: {
      "@type": "Brand",
      name: "EaseSubs",
    },
    offers: product.plans.map((plan) => ({
      "@type": "Offer",
      name: plan.name,
      price: plan.price,
      priceCurrency: "USD",
      availability: "https://schema.org/InStock",
      seller: {
        "@type": "Organization",
        name: "EaseSubs",
      },
      priceValidUntil: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 1 year from now
    })),
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: "4.8",
      reviewCount: "127",
    },
  };

  return (
    <>
      {/* Product specific structured data */}
      <Script
        id="product-structured-data"
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(structuredData),
        }}
      />
      
      <Header />
      <main className="min-h-screen bg-gray-900 pt-20">
        {/* Back to Products Navigation */}
        <div className="border-b border-gray-800">
          <div className="container mx-auto px-4 py-4">
            <Link
              href="/#products"
              className="inline-flex items-center text-gray-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              <span>Back to Products</span>
            </Link>
          </div>
        </div>

        <article className="container mx-auto px-4 py-12">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Product Image & Info */}
            <motion.section
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-6"
            >
              {/* Product Logo */}
              <div
                className="h-64 bg-gradient-to-br from-purple-500/20 to-blue-500/20 rounded-2xl flex items-center justify-center border-2"
                style={{
                  borderColor: product.borderColor || "#6366f1",
                  boxShadow: `0 0 20px ${product.borderColor || "#6366f1"}40`,
                }}
              >
                {product.logoUrl ? (
                  <Image
                    src={product.logoUrl}
                    alt={`${product.name} logo`}
                    width={96}
                    height={96}
                    className="rounded-lg object-cover"
                    unoptimized
                    priority
                  />
                ) : (
                  <div
                    className="h-24 w-24 rounded-lg flex items-center justify-center text-white font-bold text-3xl"
                    style={{
                      backgroundColor: product.borderColor || "#9333EA",
                    }}
                  >
                    {product.name?.[0]?.toUpperCase() || (
                      <Package className="h-16 w-16 text-purple-400" />
                    )}
                  </div>
                )}
              </div>

              {/* Product Details */}
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <h1 className="text-3xl font-bold text-white">
                    {product.name}
                  </h1>
                  {product.isFeatured && (
                    <div className="bg-gradient-to-r from-yellow-400 to-yellow-500 text-black text-sm font-bold px-3 py-1.5 rounded-full flex items-center shadow-lg">
                      <svg
                        className="w-4 h-4 mr-1"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                        aria-hidden="true"
                      >
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                      FEATURED
                    </div>
                  )}
                </div>

                <div className="flex items-center space-x-2">
                  <span className="text-gray-400 text-sm">Category:</span>
                  <span className="text-white font-medium">
                    {product.category.name}
                  </span>
                </div>

                <div className="text-gray-300 text-lg leading-relaxed whitespace-pre-wrap break-words">
                  {product.description ||
                    "Premium quality product with excellent features and reliability."}
                </div>

                {/* Product Stats */}
                <ProductStats
                  productId={product.id}
                  plansCount={product.plans.length}
                />
              </div>
            </motion.section>

            {/* Plan Selection & Purchase */}
            <motion.section
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-6"
            >
              {/* Plan Selection */}
              <div className="bg-gray-800/50 backdrop-blur-lg p-6 rounded-2xl border border-gray-700">
                <h2 className="text-xl font-semibold text-white mb-4">
                  Choose Your Plan
                </h2>

                <div className="space-y-3">
                  {product.plans.map((plan) => (
                    <div
                      key={plan.id}
                      onClick={() => setSelectedPlanId(plan.id)}
                      className={`relative p-4 rounded-lg border-2 cursor-pointer transition-all ${
                        selectedPlanId === plan.id ||
                        (!selectedPlanId && plan === product.plans[0])
                          ? "border-purple-500 bg-purple-500/10"
                          : "border-gray-600 hover:border-gray-500"
                      }`}
                    >
                      {plan.isPopular && (
                        <div className="absolute -top-2 left-4 bg-purple-600 text-white px-2 py-1 rounded text-xs font-medium">
                          Popular
                        </div>
                      )}

                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-semibold text-white">
                            {plan.name}
                          </h3>
                          <p className="text-sm text-gray-400">
                            {plan.planType}
                          </p>
                          <div className="flex items-center space-x-2 mt-1">
                            <Clock className="h-4 w-4 text-gray-400" />
                            <span className="text-sm text-gray-400">
                              {plan.duration} days
                            </span>
                          </div>
                        </div>

                        <div className="text-right">
                          <div className="flex items-center space-x-2">
                            {plan.originalPrice && (
                              <>
                                <span className="text-gray-400 line-through text-sm">
                                  {formatPrice(Number(plan.originalPrice))}
                                </span>
                                <span className="bg-green-500 text-white text-xs font-bold px-2 py-1 rounded">
                                  {Math.round(
                                    (1 -
                                      Number(plan.price) /
                                        Number(plan.originalPrice)) *
                                      100,
                                  )}
                                  % OFF
                                </span>
                              </>
                            )}
                            <span className="text-xl font-bold text-white">
                              {formatPrice(Number(plan.price))}
                            </span>
                          </div>
                          <p className="text-sm text-gray-400">
                            {getBillingPeriodLabel(plan.billingPeriod)}
                          </p>
                        </div>
                      </div>

                      {/* Plan Features */}
                      {plan.features &&
                        Array.isArray(plan.features) &&
                        plan.features.length > 0 && (
                          <div className="mt-3 pt-3 border-t border-gray-600">
                            <div className="grid grid-cols-1 gap-1">
                              {(plan.features as string[]).map(
                                (feature, index) => (
                                  <div
                                    key={index}
                                    className="flex items-center space-x-2"
                                  >
                                    <Check className="h-3 w-3 text-green-400 flex-shrink-0" />
                                    <span className="text-xs text-gray-300">
                                      {feature}
                                    </span>
                                  </div>
                                ),
                              )}
                            </div>
                          </div>
                        )}

                      {/* Delivery Type Info */}
                      <div className="mt-2 space-y-1">
                        <div className="flex items-center space-x-2">
                          {plan.deliveryType === "AUTOMATIC" ? (
                            <>
                              <Package className="h-4 w-4 text-green-400" />
                              <span className="text-sm text-green-400">
                                Automatic Delivery
                              </span>
                            </>
                          ) : (
                            <>
                              <Package className="h-4 w-4 text-blue-400" />
                              <span className="text-sm text-blue-400">
                                Manual Delivery
                              </span>
                            </>
                          )}
                        </div>

                        {/* Stock info for selected plan */}
                        {plan.id === selectedPlan?.id && stockData && (
                          <div className="flex items-center space-x-2">
                            {stockData.deliveryType === "AUTOMATIC" ? (
                              stockData.available ? (
                                <>
                                  <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                                  <span className="text-xs text-green-400">
                                    {stockData.count} in stock
                                  </span>
                                </>
                              ) : (
                                <>
                                  <div className="w-2 h-2 bg-red-400 rounded-full"></div>
                                  <span className="text-xs text-red-400">
                                    Out of stock
                                  </span>
                                </>
                              )
                            ) : (
                              <>
                                <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                                <span className="text-xs text-blue-400">
                                  Unlimited stock
                                </span>
                              </>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Purchase Section */}
              <div className="bg-gray-800/50 backdrop-blur-lg p-6 rounded-2xl border border-gray-700">
                <div className="space-y-4">
                  {/* Quantity */}
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">
                      Quantity
                    </label>
                    <div className="flex items-center space-x-3">
                      <button
                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                        className="p-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
                        aria-label="Decrease quantity"
                      >
                        -
                      </button>
                      <span className="text-white font-semibold w-8 text-center">
                        {quantity}
                      </span>
                      <button
                        onClick={() => {
                          // For manual delivery, no stock limit. For automatic, we'll check at cart level
                          const maxQty = 99;
                          setQuantity(Math.min(maxQty, quantity + 1));
                        }}
                        className="p-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
                        aria-label="Increase quantity"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  {/* Total Price */}
                  <div className="border-t border-gray-600 pt-4">
                    <div className="flex items-center justify-between text-lg">
                      <span className="text-gray-400">Total:</span>
                      <span className="font-bold text-white">
                        {formatPrice(
                          Number(selectedPlan?.price || 0) * quantity,
                        )}
                      </span>
                    </div>
                  </div>

                  {/* Add to Cart Button */}
                  <motion.button
                    onClick={handleAddToCart}
                    disabled={
                      isAdding ||
                      (stockData?.deliveryType === "AUTOMATIC" &&
                        !stockData?.available)
                    }
                    className={`w-full flex items-center justify-center px-6 py-3 rounded-lg text-white font-semibold transition-colors ${
                      addToCartSuccess
                        ? "bg-green-600 hover:bg-green-700"
                        : stockData?.deliveryType === "AUTOMATIC" &&
                            !stockData?.available
                          ? "bg-gray-600 cursor-not-allowed"
                          : "bg-purple-600 hover:bg-purple-700"
                    } disabled:bg-gray-600 disabled:cursor-not-allowed`}
                    animate={addToCartSuccess ? { scale: [1, 1.05, 1] } : {}}
                    transition={{ duration: 0.3 }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    {isAdding ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                    ) : addToCartSuccess ? (
                      <Check className="h-5 w-5 mr-2" />
                    ) : (
                      <ShoppingCart className="h-5 w-5 mr-2" />
                    )}
                    {stockData?.deliveryType === "AUTOMATIC" &&
                    !stockData?.available
                      ? "Out of Stock"
                      : isAdding
                        ? "Adding..."
                        : addToCartSuccess
                          ? "Added to Cart!"
                          : "Add to Cart"}
                  </motion.button>
                </div>
              </div>
            </motion.section>
          </div>
        </article>

        {/* Product Reviews Section */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <ProductReviews productId={product.id} />
        </section>
      </main>

      <Footer />
    </>
  );
} 