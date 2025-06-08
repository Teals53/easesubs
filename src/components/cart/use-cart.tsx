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

  // Get server cart data with real-time stock validation
  const {
    data: serverCart,
    refetch: refetchCart,
    isLoading: isLoadingCart,
  } = trpc.cart.getItems.useQuery(undefined, {
    enabled: !!session?.user?.id && isHydrated && status === "authenticated",
    staleTime: 0, // Always fetch fresh data for stock validation
    gcTime: 5 * 60 * 1000, // 5 minutes cache
    refetchOnWindowFocus: true, // Refetch when window gains focus to check stock
    refetchOnMount: true,
    refetchInterval: 30000, // Refetch every 30 seconds for stock updates
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
      await utils.cart.getItems.cancel();

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
      await utils.cart.getItems.cancel();
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
      await utils.cart.getItems.cancel();
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
      await utils.cart.getItems.cancel();
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

  // Sync server cart with local state and handle stock adjustments
  useEffect(() => {
    if (serverCart && isHydrated && Array.isArray(serverCart)) {
      const formattedItems = serverCart.map((serverItem) => ({
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
        availableStock: serverItem.availableStock,
        stockAdjusted: serverItem.stockAdjusted,
        previousQuantity:
          "previousQuantity" in serverItem
            ? serverItem.previousQuantity
            : undefined,
      }));

      setItems(formattedItems);

      // Show notifications for stock adjustments
      const adjustedItems = serverCart.filter((item) => item.stockAdjusted);
      if (adjustedItems.length > 0) {
        adjustedItems.forEach((item) => {
          const previousQty =
            "previousQuantity" in item ? item.previousQuantity : item.quantity;
          toast.warning(
            `${item.plan.product.name} quantity adjusted from ${previousQty} to ${item.quantity} due to limited stock`,
            { duration: 5000 },
          );
        });
      }
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
        toast.error(
          "Please sign in to add items to your cart. You'll be redirected to the sign-in page.",
          {
            duration: 3000,
          },
        );
        // Redirect to sign in page after a short delay
        setTimeout(() => {
          window.location.href = "/auth/signin";
        }, 1500);
        throw new Error("User not authenticated");
      }

      // Call the mutation directly without optimistic updates
      // Let the error propagate so the calling component can handle success/failure
      await addMutation.mutateAsync({
        planId: item.planId,
        quantity,
      });
    },
    [session?.user?.id, status, addMutation],
  );

  const removeItem = useCallback(
    async (planId: string) => {
      if (!session?.user?.id || status !== "authenticated") {
        throw new Error("User not authenticated");
      }

      // Let the error propagate so the calling component can handle success/failure
      await removeMutation.mutateAsync({ planId });
    },
    [session?.user?.id, status, removeMutation],
  );

  const updateQuantity = useCallback(
    async (planId: string, quantity: number) => {
      if (!session?.user?.id || status !== "authenticated") {
        throw new Error("User not authenticated");
      }

      if (quantity <= 0) {
        return removeItem(planId);
      }

      // Let the error propagate so the calling component can handle success/failure
      await updateMutation.mutateAsync({ planId, quantity });
    },
    [session?.user?.id, status, updateMutation, removeItem],
  );

  const clearCart = useCallback(async () => {
    if (!session?.user?.id || status !== "authenticated") {
      throw new Error("User not authenticated");
    }

    // Let the error propagate so the calling component can handle success/failure
    await clearMutation.mutateAsync();
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
