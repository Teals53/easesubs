"use client";

import { useState, useEffect, useRef } from "react";
import {
  Menu,
  User,
  ShoppingCart,
  Home,
  Package,
  LifeBuoy,
  Settings,
  BarChart3,
  LogOut,
  X,
} from "lucide-react";
import Link from "next/link";
import { signOut } from "next-auth/react";
import { useSessionContext } from "@/lib/session-context";
import { motion, AnimatePresence } from "framer-motion";
import { useCartStore } from "@/components/cart/cart-provider";
import { useCart } from "@/components/cart/use-cart";
import { iconHover } from "@/lib/animations";

export function Header() {
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

  const handleUserMenuToggle = (event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    setIsUserMenuOpen(!isUserMenuOpen);
  };

  const handleSignOut = async () => {
    try {
      await signOut({ callbackUrl: "/" });
      setIsUserMenuOpen(false);
    } catch {
      // Silently handle sign out errors
    }
  };

  const handleCartClick = () => {
    toggleCart();
    setIsUserMenuOpen(false); // Close user menu if open
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
              className="text-white font-bold text-lg md:text-2xl flex items-center focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-gray-900 rounded-lg"
              onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
              aria-label="EaseSubs - Go to homepage"
            >
              <motion.svg
                whileHover={{ rotate: 10 }}
                className="w-5 h-5 md:w-6 md:h-6 mr-1 md:mr-2"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                role="img"
                aria-label="EaseSubs logo"
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
          <nav
            className="hidden md:flex items-center space-x-8"
            role="navigation"
            aria-label="Main navigation"
          >
            {/* Cart Button */}
            <motion.button
              {...iconHover}
              onClick={handleCartClick}
              className="relative p-2 text-white hover:text-purple-300 transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-gray-900 rounded-lg"
              aria-label={`Shopping cart with ${isHydrated ? totalItems : 0} items`}
            >
              <ShoppingCart className="w-6 h-6" aria-hidden="true" />
              {isHydrated && totalItems > 0 && (
                <span
                  className="absolute -top-1 -right-1 bg-purple-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center"
                  aria-label={`${totalItems} items in cart`}
                >
                  {totalItems}
                </span>
              )}
            </motion.button>

            {session?.user ? (
              <div className="relative" ref={userMenuRef}>
                <motion.button
                  {...iconHover}
                  onClick={handleUserMenuToggle}
                  className="flex items-center space-x-2 text-white hover:text-purple-300 transition-colors p-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-gray-900"
                  aria-expanded={isUserMenuOpen}
                  aria-haspopup="true"
                  aria-label={`User menu for ${session?.user?.name || "User"}`}
                >
                  <User className="w-5 h-5" aria-hidden="true" />
                  <span className="hidden lg:block text-sm">
                    {session?.user?.name?.split(" ")[0] || "User"}
                  </span>
                </motion.button>

                {/* User Dropdown */}
                <AnimatePresence>
                  {isUserMenuOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="absolute right-0 mt-2 w-48 bg-gray-800 rounded-lg shadow-lg border border-gray-700 z-50"
                      role="menu"
                      aria-label="User menu options"
                    >
                      <div className="py-1">
                        <Link
                          href="/dashboard"
                          className="flex items-center px-4 py-2 text-sm text-gray-300 hover:text-white hover:bg-gray-700 transition-colors focus:outline-none focus:bg-gray-700"
                          onClick={() => setIsUserMenuOpen(false)}
                          role="menuitem"
                        >
                          <Home className="w-4 h-4 mr-2" aria-hidden="true" />
                          Dashboard
                        </Link>
                        <Link
                          href="/dashboard/orders"
                          className="flex items-center px-4 py-2 text-sm text-gray-300 hover:text-white hover:bg-gray-700 transition-colors focus:outline-none focus:bg-gray-700"
                          onClick={() => setIsUserMenuOpen(false)}
                          role="menuitem"
                        >
                          <Package
                            className="w-4 h-4 mr-2"
                            aria-hidden="true"
                          />
                          Orders
                        </Link>
                        <Link
                          href="/dashboard/profile-settings"
                          className="flex items-center px-4 py-2 text-sm text-gray-300 hover:text-white hover:bg-gray-700 transition-colors focus:outline-none focus:bg-gray-700"
                          onClick={() => setIsUserMenuOpen(false)}
                          role="menuitem"
                        >
                          <Settings
                            className="w-4 h-4 mr-2"
                            aria-hidden="true"
                          />
                          Settings
                        </Link>
                        <Link
                          href="/dashboard/support"
                          className="flex items-center px-4 py-2 text-sm text-gray-300 hover:text-white hover:bg-gray-700 transition-colors focus:outline-none focus:bg-gray-700"
                          onClick={() => setIsUserMenuOpen(false)}
                          role="menuitem"
                        >
                          <LifeBuoy
                            className="w-4 h-4 mr-2"
                            aria-hidden="true"
                          />
                          Support
                        </Link>
                        {(session?.user?.role === "ADMIN" || 
                          session?.user?.role === "MANAGER" || 
                          session?.user?.role === "SUPPORT_AGENT") && (
                          <Link
                            href={
                              session?.user?.role === "SUPPORT_AGENT" 
                                ? "/dashboard/admin-support"
                                : "/dashboard/admin-dashboard"
                            }
                            className="flex items-center px-4 py-2 text-sm text-gray-300 hover:text-white hover:bg-gray-700 transition-colors focus:outline-none focus:bg-gray-700"
                            onClick={() => setIsUserMenuOpen(false)}
                            role="menuitem"
                          >
                            <BarChart3
                              className="w-4 h-4 mr-2"
                              aria-hidden="true"
                            />
                            {session?.user?.role === "SUPPORT_AGENT" ? "Support" : "Admin"}
                          </Link>
                        )}
                        <hr className="my-1 border-gray-700" role="separator" />
                        <button
                          onClick={handleSignOut}
                          className="flex items-center w-full px-4 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-gray-700 transition-colors"
                          role="menuitem"
                        >
                          <LogOut className="w-4 h-4 mr-2" aria-hidden="true" />
                          Sign Out
                        </button>
                      </div>
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
              {...iconHover}
              onClick={handleCartClick}
              className="relative p-2 text-white hover:text-purple-300 transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-gray-900 rounded-lg"
              aria-label={`Shopping cart with ${isHydrated ? totalItems : 0} items`}
            >
              <ShoppingCart className="w-5 h-5" aria-hidden="true" />
              {isHydrated && totalItems > 0 && (
                <span
                  className="absolute -top-1 -right-1 bg-purple-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center"
                  aria-label={`${totalItems} items in cart`}
                >
                  {totalItems > 99 ? "99+" : totalItems}
                </span>
              )}
            </motion.button>

            {/* Mobile User Menu/Hamburger - Combined */}
            <div className="relative" ref={userMenuRef}>
              <motion.button
                {...iconHover}
                onClick={handleUserMenuToggle}
                className="flex items-center space-x-1 text-white hover:text-purple-300 transition-colors p-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-gray-900"
                aria-expanded={isUserMenuOpen}
                aria-haspopup="true"
                aria-label="Open menu"
              >
                {isUserMenuOpen ? (
                  <X className="w-6 h-6" aria-hidden="true" />
                ) : (
                  <Menu className="w-6 h-6" aria-hidden="true" />
                )}
              </motion.button>

              {/* Mobile Menu Dropdown - Enhanced */}
              <AnimatePresence>
                {isUserMenuOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="absolute right-0 mt-2 w-80 bg-gray-800 rounded-xl shadow-2xl border border-gray-700 z-50"
                    role="menu"
                    aria-label="Mobile menu"
                  >
                    <div className="py-2">
                      {session?.user ? (
                        <>
                          {/* User Info */}
                          <div className="px-6 py-2 border-b border-gray-700">
                            <p className="text-sm text-gray-400 mb-1">Signed in as</p>
                            <p className="text-base font-bold text-white truncate">
                              {session.user.email}
                            </p>
                          </div>

                          {/* Join Discord Button */}
                          <div className="px-6 py-3">
                            <a
                              href="https://discord.gg/QWbHNAq9Dw"
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center justify-center gap-3 w-full px-4 py-3 text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-all font-medium"
                              onClick={() => setIsUserMenuOpen(false)}
                            >
                              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
                              </svg>
                              Join Discord
                            </a>
                          </div>

                          {/* User Navigation */}
                          <div className="px-3">
                            <Link
                              href="/dashboard"
                              className="flex items-center px-4 py-3 text-base text-gray-300 hover:text-white hover:bg-gray-700 transition-colors rounded-lg"
                              onClick={() => setIsUserMenuOpen(false)}
                              role="menuitem"
                            >
                              <Home className="w-5 h-5 mr-4" aria-hidden="true" />
                              Dashboard
                            </Link>
                            {(session?.user?.role === "ADMIN" || 
                              session?.user?.role === "MANAGER" || 
                              session?.user?.role === "SUPPORT_AGENT") && (
                              <Link
                                href={
                                  session?.user?.role === "SUPPORT_AGENT" 
                                    ? "/dashboard/admin-support"
                                    : "/dashboard/admin-dashboard"
                                }
                                className="flex items-center px-4 py-3 text-base text-gray-300 hover:text-white hover:bg-gray-700 transition-colors rounded-lg"
                                onClick={() => setIsUserMenuOpen(false)}
                                role="menuitem"
                              >
                                <BarChart3 className="w-5 h-5 mr-4" aria-hidden="true" />
                                {session?.user?.role === "SUPPORT_AGENT" ? "Support Dashboard" : "Admin Dashboard"}
                              </Link>
                            )}
                            <Link
                              href="/dashboard/orders"
                              className="flex items-center px-4 py-3 text-base text-gray-300 hover:text-white hover:bg-gray-700 transition-colors rounded-lg"
                              onClick={() => setIsUserMenuOpen(false)}
                              role="menuitem"
                            >
                              <Package className="w-5 h-5 mr-4" aria-hidden="true" />
                              My Orders
                            </Link>
                            <Link
                              href="/dashboard/profile-settings"
                              className="flex items-center px-4 py-3 text-base text-gray-300 hover:text-white hover:bg-gray-700 transition-colors rounded-lg"
                              onClick={() => setIsUserMenuOpen(false)}
                              role="menuitem"
                            >
                              <Settings className="w-5 h-5 mr-4" aria-hidden="true" />
                              Profile Settings
                            </Link>
                            <Link
                              href="/dashboard/support"
                              className="flex items-center px-4 py-3 text-base text-gray-300 hover:text-white hover:bg-gray-700 transition-colors rounded-lg"
                              onClick={() => setIsUserMenuOpen(false)}
                              role="menuitem"
                            >
                              <LifeBuoy className="w-5 h-5 mr-4" aria-hidden="true" />
                              Support
                            </Link>
                          </div>

                          {/* Sign Out */}
                          <div className="px-3 pt-3 border-t border-gray-700 mt-3">
                            <button
                              onClick={handleSignOut}
                              className="flex items-center w-full px-4 py-3 text-base text-red-400 hover:text-red-300 hover:bg-gray-700 transition-colors rounded-lg"
                              role="menuitem"
                            >
                              <LogOut className="w-5 h-5 mr-4" aria-hidden="true" />
                              Sign Out
                            </button>
                          </div>
                        </>
                      ) : (
                        <>
                          {/* Join Discord Button for non-authenticated users */}
                          <div className="px-6 py-4">
                            <a
                              href="https://discord.gg/QWbHNAq9Dw"
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center justify-center gap-3 w-full px-4 py-3 text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-all font-medium mb-4"
                              onClick={() => setIsUserMenuOpen(false)}
                            >
                              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
                              </svg>
                              Join Discord
                            </a>
                            
                            {/* Sign In Button */}
                            <Link
                              href="/auth/signin"
                              className="block w-full text-center bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 rounded-xl transition-all text-base"
                              onClick={() => setIsUserMenuOpen(false)}
                            >
                              Sign In
                            </Link>
                          </div>
                        </>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>


      </div>
    </motion.header>
  );
}
