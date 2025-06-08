"use client";

import { Fragment } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Plus, Minus, ShoppingBag, Trash2 } from "lucide-react";
import { useCartStore } from "@/components/cart/cart-provider";
import { useCart } from "@/components/cart/use-cart";
import Link from "next/link";
import Image from "next/image";

export function CartSidebar() {
  const { isOpen, toggleCart } = useCartStore();
  const {
    items,
    totalItems,
    totalPrice,
    removeItem,
    updateQuantity,
    clearCart,
    isUpdating,
    isRemoving,
    isClearing,
  } = useCart();

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
    }).format(price);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <Fragment>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40"
            onClick={toggleCart}
          />

          {/* Cart Sidebar */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 h-full w-full max-w-md bg-gray-900 border-l border-gray-700 z-50 flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-700">
              <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                <ShoppingBag className="h-5 w-5" />
                Shopping Cart ({totalItems})
              </h2>
              <button
                onClick={toggleCart}
                className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
              >
                <X className="h-5 w-5 text-gray-400" />
              </button>
            </div>

            {/* Cart Items */}
            <div className="flex-1 overflow-y-auto p-6">
              {items.length === 0 ? (
                <div className="text-center py-12">
                  <ShoppingBag className="h-16 w-16 mx-auto text-gray-600 mb-4" />
                  <h3 className="text-lg font-medium text-gray-400 mb-2">
                    Your cart is empty
                  </h3>
                  <p className="text-gray-500 mb-6">
                    Add some products to get started!
                  </p>
                  <button
                    onClick={toggleCart}
                    className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg transition-colors"
                  >
                    Continue Shopping
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {items.map((item) => (
                    <motion.div
                      key={item.planId}
                      layout
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      className="bg-gray-800 rounded-lg p-4 border border-gray-700"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-start space-x-3 flex-1">
                          {/* Product Logo/Icon */}
                          <div className="w-12 h-12 flex-shrink-0">
                            {item.logoUrl ? (
                              <Image
                                src={item.logoUrl}
                                alt={item.productName}
                                width={48}
                                height={48}
                                className="w-full h-full rounded-lg object-cover"
                                unoptimized
                              />
                            ) : (
                              <div
                                className="w-12 h-12 rounded-lg flex items-center justify-center text-white font-bold text-lg"
                                style={{
                                  backgroundColor:
                                    item.borderColor || "#9333EA",
                                }}
                              >
                                {item.productName[0]}
                              </div>
                            )}
                          </div>

                          <div className="flex-1 min-w-0">
                            <h3 className="font-medium text-white truncate">
                              {item.productName}
                            </h3>
                            <p className="text-sm text-gray-400">
                              {item.planType}
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-lg font-bold text-white">
                                {formatPrice(item.price)}
                              </span>
                              {item.originalPrice &&
                                item.originalPrice > item.price && (
                                  <span className="text-sm text-gray-500 line-through">
                                    {formatPrice(item.originalPrice)}
                                  </span>
                                )}
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={() => removeItem(item.planId)}
                          disabled={isRemoving}
                          className="p-1 hover:bg-gray-700 rounded transition-colors flex-shrink-0 disabled:opacity-50"
                        >
                          <Trash2 className="h-4 w-4 text-gray-400 hover:text-red-400" />
                        </button>
                      </div>

                      {/* Quantity Controls */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() =>
                              updateQuantity(item.planId, item.quantity - 1)
                            }
                            disabled={item.quantity <= 1 || isUpdating}
                            className="p-1 hover:bg-gray-700 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <Minus className="h-4 w-4 text-gray-400" />
                          </button>
                          <span className="w-8 text-center text-white font-medium">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() =>
                              updateQuantity(item.planId, item.quantity + 1)
                            }
                            disabled={isUpdating}
                            className="p-1 hover:bg-gray-700 rounded transition-colors disabled:opacity-50"
                          >
                            <Plus className="h-4 w-4 text-gray-400" />
                          </button>
                        </div>
                        <div className="text-white font-semibold">
                          {formatPrice(item.price * item.quantity)}
                        </div>
                      </div>
                    </motion.div>
                  ))}

                  {/* Clear Cart Button */}
                  {items.length > 0 && (
                    <button
                      onClick={clearCart}
                      disabled={isClearing}
                      className="w-full text-center text-sm text-gray-400 hover:text-gray-300 py-2 border border-gray-700 rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50"
                    >
                      {isClearing ? "Clearing..." : "Clear Cart"}
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Footer */}
            {items.length > 0 && (
              <div className="border-t border-gray-700 p-6">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-lg font-medium text-white">Total</span>
                  <span className="text-2xl font-bold text-white">
                    {formatPrice(totalPrice)}
                  </span>
                </div>
                <Link
                  href="/checkout"
                  onClick={toggleCart}
                  className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors shadow-lg shadow-purple-600/30 text-center block"
                >
                  Proceed to Checkout
                </Link>
                <p className="text-xs text-gray-500 text-center mt-2">
                  Secure checkout with 256-bit SSL encryption
                </p>
              </div>
            )}
          </motion.div>
        </Fragment>
      )}
    </AnimatePresence>
  );
}
