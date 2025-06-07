"use client";

import { useSession } from "next-auth/react";
import { trpc } from "@/lib/trpc";
import { useCartStore } from "./cart-provider";
import { toast } from "sonner";
import { useCallback, useEffect } from "react";

export function useCart() {
  const { data: session, status } = useSession();
  const {
    items,
    setItems,
    isHydrated,
    getTotalItems,
    getTotalPrice,
    toggleCart,
  } = useCartStore();

  // Get tRPC utils outside of callbacks
  const utils = trpc.useUtils();

  // Get server cart data with better caching strategy
  const {
    data: serverCart,
    refetch: refetchCart,
    isLoading: isLoadingCart,
  } = trpc.cart.get.useQuery(undefined, {
    enabled: !!session?.user?.id && isHydrated && status === "authenticated",
    staleTime: 0, // Always fetch fresh data
    gcTime: 5 * 60 * 1000, // 5 minutes cache
    refetchOnWindowFocus: false,
    refetchOnMount: true,
    retry: (failureCount, error) => {
      // Don't retry on auth errors
      if (error.data?.code === "UNAUTHORIZED") {
        return false;
      }
      return failureCount < 2;
    },
  });

  // Cart mutations with improved error handling
  const addMutation = trpc.cart.add.useMutation({
    onMutate: async () => {
      // Cancel any outgoing refetches
      await utils.cart.get.cancel();

      // Snapshot the previous value
      const previousItems = items;

      // Don't do optimistic updates for now to avoid conflicts
      return { previousItems };
    },
    onError: (err, variables, context) => {
      // Revert optimistic update on error
      if (context?.previousItems) {
        setItems(context.previousItems);
      }

      // Handle specific error cases
      if (err.data?.code === "UNAUTHORIZED") {
        toast.error("Please sign in to add items to cart");
      } else {
        toast.error(err.message || "Failed to add item to cart");
      }
    },
    onSuccess: () => {
      toast.success("Added to cart successfully!");
      // Refetch to get fresh data
      refetchCart();
    },
    onSettled: () => {
      // Always refetch after settled to ensure consistency
      refetchCart();
    },
  });

  const updateMutation = trpc.cart.updateQuantity.useMutation({
    onMutate: async () => {
      await utils.cart.get.cancel();
      const previousItems = items;

      return { previousItems };
    },
    onError: (err, variables, context) => {
      if (context?.previousItems) {
        setItems(context.previousItems);
      }
      toast.error(err.message || "Failed to update quantity");
    },
    onSuccess: () => {
      refetchCart();
    },
    onSettled: () => {
      refetchCart();
    },
  });

  const removeMutation = trpc.cart.remove.useMutation({
    onMutate: async () => {
      await utils.cart.get.cancel();
      const previousItems = items;

      return { previousItems };
    },
    onError: (err, variables, context) => {
      if (context?.previousItems) {
        setItems(context.previousItems);
      }
      toast.error(err.message || "Failed to remove item");
    },
    onSuccess: () => {
      refetchCart();
    },
    onSettled: () => {
      refetchCart();
    },
  });

  const clearMutation = trpc.cart.clear.useMutation({
    onMutate: async () => {
      await utils.cart.get.cancel();
      const previousItems = items;

      return { previousItems };
    },
    onError: (err, variables, context) => {
      if (context?.previousItems) {
        setItems(context.previousItems);
      }
      toast.error(err.message || "Failed to clear cart");
    },
    onSuccess: () => {
      toast.success("Cart cleared");
      refetchCart();
    },
    onSettled: () => {
      refetchCart();
    },
  });

  // Sync server cart with local state
  useEffect(() => {
    if (serverCart?.items && isHydrated) {
      const formattedItems = serverCart.items.map((serverItem) => ({
        id: serverItem.id,
        productId: serverItem.plan.product.id,
        planId: serverItem.plan.id,
        productName: serverItem.plan.product.name,
        planName: serverItem.plan.name,
        planType: serverItem.plan.planType,
        price: Number(serverItem.plan.price),
        originalPrice: serverItem.plan.originalPrice
          ? Number(serverItem.plan.originalPrice)
          : undefined,
        billingPeriod: serverItem.plan.billingPeriod,
        borderColor: serverItem.plan.product.borderColor || undefined,
        logoUrl: serverItem.plan.product.logoUrl || undefined,
        quantity: serverItem.quantity,
      }));

      setItems(formattedItems);
    }
  }, [serverCart, isHydrated, setItems]);

  // Cart operations
  const addItem = useCallback(
    async (
      item: {
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
      },
      quantity: number = 1,
    ) => {
      if (!session?.user?.id || status !== "authenticated") {
        toast.error("Please sign in to add items to cart");
        return;
      }

      // Call the mutation directly without optimistic updates
      try {
        await addMutation.mutateAsync({
          planId: item.planId,
          quantity,
        });
      } catch (error) {
        // Error is already handled in onError callback
        console.error("Add to cart error:", error);
      }
    },
    [session?.user?.id, status, addMutation],
  );

  const removeItem = useCallback(
    async (planId: string) => {
      if (!session?.user?.id || status !== "authenticated") return;

      try {
        await removeMutation.mutateAsync({ planId });
      } catch (error) {
        console.error("Remove from cart error:", error);
      }
    },
    [session?.user?.id, status, removeMutation],
  );

  const updateQuantity = useCallback(
    async (planId: string, quantity: number) => {
      if (!session?.user?.id || status !== "authenticated") return;

      if (quantity <= 0) {
        return removeItem(planId);
      }

      try {
        await updateMutation.mutateAsync({ planId, quantity });
      } catch (error) {
        console.error("Update quantity error:", error);
      }
    },
    [session?.user?.id, status, updateMutation, removeItem],
  );

  const clearCart = useCallback(async () => {
    if (!session?.user?.id || status !== "authenticated") return;

    try {
      await clearMutation.mutateAsync();
    } catch (error) {
      console.error("Clear cart error:", error);
    }
  }, [session?.user?.id, status, clearMutation]);

  return {
    items,
    totalItems: getTotalItems(),
    totalPrice: getTotalPrice(),
    isLoading: isLoadingCart,
    isHydrated,

    // Actions
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
    toggleCart,
    refetchCart,

    // Mutation states
    isAdding: addMutation.isPending,
    isUpdating: updateMutation.isPending,
    isRemoving: removeMutation.isPending,
    isClearing: clearMutation.isPending,
  };
}
