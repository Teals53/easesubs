"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface CartItem {
  id: string;
  productId: string;
  planId: string;
  productName: string;
  planName: string;
  planType: string;
  price: number;
  originalPrice?: number;
  billingPeriod: string;
  borderColor?: string;
  logoUrl?: string;
  quantity: number;
}

interface CartStore {
  items: CartItem[];
  isOpen: boolean;
  isAnimating: boolean;
  isHydrated: boolean;
  // Remove local state management - let server be source of truth
  toggleCart: () => void;
  closeCart: () => void;
  openCart: () => void;
  setAnimating: (animating: boolean) => void;
  setItems: (items: CartItem[]) => void;
  setHydrated: (hydrated: boolean) => void;
  getTotalItems: () => number;
  getTotalPrice: () => number;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,
      isAnimating: false,
      isHydrated: false,

      toggleCart: () => {
        // Prevent toggling while animating
        if (get().isAnimating) return;
        set({ isOpen: !get().isOpen });
      },

      closeCart: () => {
        // Only close if open and not animating
        if (get().isOpen && !get().isAnimating) {
          set({ isOpen: false });
        }
      },

      openCart: () => {
        // Only open if closed and not animating
        if (!get().isOpen && !get().isAnimating) {
          set({ isOpen: true });
        }
      },

      setAnimating: (animating) => {
        set({ isAnimating: animating });
      },

      setItems: (items) => {
        set({ items });
      },

      setHydrated: (hydrated) => {
        set({ isHydrated: hydrated });
      },

      getTotalItems: () => {
        // Return 0 if not hydrated to prevent hydration mismatch
        if (!get().isHydrated) return 0;
        return get().items.reduce((total, item) => total + item.quantity, 0);
      },

      getTotalPrice: () => {
        return get().items.reduce(
          (total, item) => total + item.price * item.quantity,
          0,
        );
      },
    }),
    {
      name: "easesubs-cart",
      // Only persist cart items and open state
      partialize: (state) => ({
        items: state.items,
      }),
      onRehydrateStorage: () => (state) => {
        // Set hydrated to true after rehydration
        if (state) {
          state.setHydrated(true);
        }
      },
    },
  ),
);
