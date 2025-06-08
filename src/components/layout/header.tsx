"use client";

import React, { useState, useEffect, useRef } from "react";
import { Menu, X, User, ShoppingCart } from "lucide-react";
import Link from "next/link";
import { signOut } from "next-auth/react";
import { useSessionContext } from "@/lib/session-context";
import { motion, AnimatePresence } from "framer-motion";
import { useCartStore } from "@/components/cart/cart-provider";
import { useCart } from "@/components/cart/use-cart";

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const { session } = useSessionContext();
  const { toggleCart } = useCartStore();
  const { totalItems, isHydrated } = useCart();
  const userMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    handleScroll(); // Check scroll position on mount
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close user menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        userMenuRef.current &&
        !userMenuRef.current.contains(event.target as Node)
      ) {
        setIsUserMenuOpen(false);
      }
    };

    if (isUserMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isUserMenuOpen]);

  const handleSignOut = async () => {
    try {
      await signOut({ callbackUrl: "/" });
      setIsUserMenuOpen(false);
    } catch (error) {
      console.error("Sign out error:", error);
    }
  };

  const handleCartClick = () => {
    toggleCart();
    setIsMenuOpen(false); // Close mobile menu if open
  };

  return (
    <motion.header
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? "bg-gray-900/95 backdrop-blur-md py-2 md:py-3 shadow-xl"
          : "bg-transparent py-3 md:py-5"
      }`}
    >
      <div className="container mx-auto px-2 md:px-6">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <motion.div
            className="flex items-center"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Link
              href="/"
              className="text-white font-bold text-lg md:text-2xl flex items-center focus:outline-none"
              onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            >
              <motion.svg
                whileHover={{ rotate: 10 }}
                className="w-5 h-5 md:w-6 md:h-6 mr-1 md:mr-2"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <motion.path
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 1, ease: "easeInOut" }}
                  d="M13 3L4 13H11L10 21L19 11H12L13 3Z"
                  fill="#9333EA"
                  stroke="#9333EA"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </motion.svg>
              <span className="bg-gradient-to-r from-white via-purple-200 to-purple-100 bg-clip-text text-transparent">
                EaseSubs
              </span>
            </Link>
          </motion.div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-4">
            {/* Cart Button */}
            <motion.button
              onClick={handleCartClick}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="flex items-center justify-center text-gray-400 hover:text-white p-2 rounded-lg hover:bg-gray-800 transition-all relative"
            >
              <motion.div
                animate={
                  totalItems > 0
                    ? {
                        scale: [1, 1.1, 1],
                        rotate: [0, 5, -5, 0],
                      }
                    : {}
                }
                transition={{ duration: 0.5 }}
              >
                <ShoppingCart className="w-5 h-5" />
              </motion.div>
              {isHydrated && totalItems > 0 && (
                <motion.span
                  key={totalItems}
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0, opacity: 0 }}
                  transition={{
                    type: "spring",
                    stiffness: 500,
                    damping: 15,
                    duration: 0.3,
                  }}
                  className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold"
                >
                  {totalItems > 99 ? "99+" : totalItems}
                </motion.span>
              )}
            </motion.button>

            {session?.user ? (
              <div className="relative" ref={userMenuRef}>
                <motion.button
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="flex items-center justify-center text-white bg-purple-600 hover:bg-purple-700 p-2 rounded-full transition-all"
                >
                  <User className="w-5 h-5" />
                </motion.button>

                <AnimatePresence>
                  {isUserMenuOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.2 }}
                      className="absolute right-0 mt-2 w-48 py-2 bg-gray-800 border border-gray-700 rounded-lg shadow-xl z-50"
                    >
                      <div className="px-4 py-2 border-b border-gray-700">
                        <p className="text-sm text-gray-400">Signed in as</p>
                        <p className="text-sm font-bold text-white truncate">
                          {session.user.email}
                        </p>
                      </div>
                      <motion.div whileHover={{ backgroundColor: "#374151" }}>
                        <Link
                          href="/dashboard"
                          className="block px-4 py-2 text-gray-300 hover:text-white"
                          onClick={() => setIsUserMenuOpen(false)}
                        >
                          Dashboard
                        </Link>
                      </motion.div>
                      {session.user.role === "ADMIN" && (
                        <motion.div whileHover={{ backgroundColor: "#374151" }}>
                          <Link
                            href="/dashboard/admin-dashboard"
                            className="block px-4 py-2 text-gray-300 hover:text-white"
                            onClick={() => setIsUserMenuOpen(false)}
                          >
                            Admin Dashboard
                          </Link>
                        </motion.div>
                      )}
                      <motion.div whileHover={{ backgroundColor: "#374151" }}>
                        <Link
                          href="/dashboard/orders"
                          className="block px-4 py-2 text-gray-300 hover:text-white"
                          onClick={() => setIsUserMenuOpen(false)}
                        >
                          My Orders
                        </Link>
                      </motion.div>
                      <motion.div whileHover={{ backgroundColor: "#374151" }}>
                        <Link
                          href="/dashboard/profile-settings"
                          className="block px-4 py-2 text-gray-300 hover:text-white"
                          onClick={() => setIsUserMenuOpen(false)}
                        >
                          Profile Settings
                        </Link>
                      </motion.div>
                      <motion.div whileHover={{ backgroundColor: "#374151" }}>
                        <Link
                          href="/dashboard/support"
                          className="block px-4 py-2 text-gray-300 hover:text-white"
                          onClick={() => setIsUserMenuOpen(false)}
                        >
                          Support
                        </Link>
                      </motion.div>
                      <motion.button
                        whileHover={{ backgroundColor: "#374151" }}
                        onClick={handleSignOut}
                        className="block w-full text-left px-4 py-2 text-red-400 hover:text-red-300"
                      >
                        Sign Out
                      </motion.button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Link
                  href="/auth/signin"
                  className="bg-purple-600 hover:bg-purple-700 text-white font-semibold px-6 py-2 rounded-lg transition-all"
                >
                  Sign In
                </Link>
              </motion.div>
            )}

            {/* Discord Button - Moved to the right */}
            <motion.a
              href="https://discord.gg/QWbHNAq9Dw"
              target="_blank"
              rel="noopener noreferrer"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="flex items-center gap-2 text-white bg-indigo-600 hover:bg-indigo-700 px-4 py-2 rounded-lg transition-all font-medium"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
              </svg>
              Join Discord
            </motion.a>
          </nav>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center space-x-2">
            {/* Mobile Cart Button */}
            <motion.button
              onClick={handleCartClick}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="flex items-center justify-center text-gray-400 hover:text-white p-2 rounded-lg hover:bg-gray-800 transition-all relative"
            >
              <motion.div
                animate={
                  totalItems > 0
                    ? {
                        scale: [1, 1.1, 1],
                        rotate: [0, 5, -5, 0],
                      }
                    : {}
                }
                transition={{ duration: 0.5 }}
              >
                <ShoppingCart className="w-5 h-5" />
              </motion.div>
              {isHydrated && totalItems > 0 && (
                <motion.span
                  key={totalItems}
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0, opacity: 0 }}
                  transition={{
                    type: "spring",
                    stiffness: 500,
                    damping: 15,
                    duration: 0.3,
                  }}
                  className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold"
                >
                  {totalItems > 99 ? "99+" : totalItems}
                </motion.span>
              )}
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="text-white p-2 rounded-lg hover:bg-gray-800 transition-colors"
            >
              {isMenuOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </motion.button>
          </div>
        </div>

        {/* Mobile Navigation */}
        <AnimatePresence>
          {isMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="md:hidden mt-4 pb-4 border-t border-gray-700 bg-gray-900/95 backdrop-blur-md"
            >
              <div className="flex flex-col space-y-3 pt-4">
                {/* Discord Button for Mobile */}
                <a
                  href="https://discord.gg/QWbHNAq9Dw"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 mx-4 px-4 py-2 text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-all font-medium"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <svg
                    className="w-4 h-4"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
                  </svg>
                  Join Discord
                </a>

                {session?.user ? (
                  <>
                    <div className="px-4 py-2 border-b border-gray-700">
                      <p className="text-sm text-gray-400">Signed in as</p>
                      <p className="text-sm font-bold text-white">
                        {session.user.email}
                      </p>
                    </div>
                    <Link
                      href="/dashboard"
                      className="block px-4 py-2 text-gray-300 hover:text-white"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      Dashboard
                    </Link>
                    {session.user.role === "ADMIN" && (
                      <Link
                        href="/dashboard/admin-dashboard"
                        className="block px-4 py-2 text-gray-300 hover:text-white"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        Admin Dashboard
                      </Link>
                    )}
                    <Link
                      href="/dashboard/orders"
                      className="block px-4 py-2 text-gray-300 hover:text-white"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      My Orders
                    </Link>
                    <Link
                      href="/dashboard/profile-settings"
                      className="block px-4 py-2 text-gray-300 hover:text-white"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      Profile Settings
                    </Link>
                    <Link
                      href="/dashboard/support"
                      className="block px-4 py-2 text-gray-300 hover:text-white"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      Support
                    </Link>
                    <button
                      onClick={handleSignOut}
                      className="block w-full text-left px-4 py-2 text-red-400 hover:text-red-300"
                    >
                      Sign Out
                    </button>
                  </>
                ) : (
                  <Link
                    href="/auth/signin"
                    className="block px-4 py-2 text-gray-300 hover:text-white"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Sign In
                  </Link>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.header>
  );
}
