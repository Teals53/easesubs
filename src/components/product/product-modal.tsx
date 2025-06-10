"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Plus, Minus, Package, Save } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { modalBackdrop, modalContent } from "@/lib/animations";
import type { BillingPeriod } from "@prisma/client";
import type { Product, ProductPlan } from "@/types/product";

interface ProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  product?: Partial<Product> | null;
}

interface PlanData extends Omit<ProductPlan, "billingPeriod" | "features"> {
  billingPeriod: BillingPeriod;
  features: string[];
}

export function ProductModal({
  isOpen,
  onClose,
  onSuccess,
  product,
}: ProductModalProps) {
  // Fetch complete product data when editing
  const { data: fullProductData } = trpc.admin.getProductById.useQuery(
    { id: product?.id || "" },
    {
      enabled: !!product?.id && isOpen,
      refetchOnWindowFocus: false,
    },
  );

  // Fetch categories for the dropdown
  const { data: categories = [] } = trpc.admin.getCategories.useQuery(
    undefined,
    {
      enabled: isOpen,
    },
  );

  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    description: "",
    categoryId: "",
    logoUrl: "",
    borderColor: "",
    isActive: true,
    isFeatured: false,
    displayOrder: 0,
    seoTitle: "",
    seoDescription: "",
  });

  const [plans, setPlans] = useState<PlanData[]>([
    {
      name: "Basic",
      planType: "Basic",
      price: 9.99,
      billingPeriod: "MONTHLY" as const,
      duration: 30,
      features: [],
      isPopular: false,
      isAvailable: true,
      deliveryType: "MANUAL" as const,
    },
  ]);

  // Update form data when product data changes
  useEffect(() => {
    // If we're editing a product and have full product data, use it
    if (product?.id && fullProductData) {
      setFormData({
        name: fullProductData.name || "",
        slug: fullProductData.slug || "",
        description: fullProductData.description || "",
        categoryId: fullProductData.categoryId || "",
        logoUrl: fullProductData.logoUrl || "",
        borderColor: fullProductData.borderColor || "",
        isActive: fullProductData.isActive ?? true,
        isFeatured: fullProductData.isFeatured ?? false,
        displayOrder: fullProductData.displayOrder || 0,
        seoTitle: fullProductData.seoTitle || "",
        seoDescription: fullProductData.seoDescription || "",
      });

      if (fullProductData.plans && fullProductData.plans.length > 0) {
        setPlans(
          fullProductData.plans.map((plan) => ({
            id: plan.id,
            name: plan.name,
            planType: plan.planType,
            price: Number(plan.price.toString()),
            originalPrice: plan.originalPrice
              ? Number(plan.originalPrice.toString())
              : undefined,
            billingPeriod: plan.billingPeriod,
            duration: plan.duration,
            features:
              typeof plan.features === "string"
                ? JSON.parse(plan.features)
                : Array.isArray(plan.features)
                  ? (plan.features as string[])
                  : [],
            isPopular: plan.isPopular,
            isAvailable: plan.isAvailable,
            maxSubscriptions: plan.maxSubscriptions || undefined,
            deliveryType:
              (plan.deliveryType as "MANUAL" | "AUTOMATIC") || "MANUAL",
          })),
        );
      }
    }
    // If we're creating a new product (no product.id), reset the form
    else if (!product?.id) {
      setFormData({
        name: "",
        slug: "",
        description: "",
        categoryId: "",
        logoUrl: "",
        borderColor: "",
        isActive: true,
        isFeatured: false,
        displayOrder: 0,
        seoTitle: "",
        seoDescription: "",
      });
      setPlans([
        {
          name: "Basic",
          planType: "Basic",
          price: 9.99,
          billingPeriod: "MONTHLY" as const,
          duration: 30,
          features: [],
          isPopular: false,
          isAvailable: true,
          deliveryType: "MANUAL" as const,
        },
      ]);
    }
    // If we have a product ID but no full data yet, don't populate the form yet
    // (wait for the full data to load)
  }, [fullProductData, product?.id]);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createProductMutation = trpc.admin.createProduct.useMutation({
    onSuccess: () => {
      onSuccess();
      onClose();
      setError(null);
    },
    onError: (error) => {
      setError(error.message);
    },
  });

  const updateProductMutation = trpc.admin.updateProduct.useMutation({
    onSuccess: () => {
      onSuccess();
      onClose();
      setError(null);
    },
    onError: (error) => {
      setError(error.message);
    },
  });

  const billingPeriods = [
    { key: "MONTHLY", label: "Monthly" },
    { key: "YEARLY", label: "Yearly" },
    { key: "LIFETIME", label: "Lifetime" },
    { key: "CUSTOM", label: "Custom" },
  ];

  const handleInputChange = (
    field: string,
    value: string | number | boolean,
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handlePlanChange = (
    index: number,
    field: string,
    value: string | number | boolean | undefined | null,
  ) => {
    const newPlans = [...plans];
    if (field === "features" && typeof value === "string") {
      newPlans[index] = { ...newPlans[index], [field]: [value] };
    } else {
      newPlans[index] = { ...newPlans[index], [field]: value };
    }
    setPlans(newPlans);
  };

  const addPlan = () => {
    setPlans((prev) => [
      ...prev,
      {
        name: "",
        planType: "",
        price: 0,
        billingPeriod: "MONTHLY",
        duration: 30,
        features: [],
        isPopular: false,
        isAvailable: true,
        deliveryType: "MANUAL",
      },
    ]);
  };

  const removePlan = (index: number) => {
    if (plans.length > 1) {
      setPlans((prev) => prev.filter((_, i) => i !== index));
    }
  };

  const addFeature = (planIndex: number) => {
    setPlans((prev) =>
      prev.map((plan, i) =>
        i === planIndex ? { ...plan, features: [...plan.features, ""] } : plan,
      ),
    );
  };

  const removeFeature = (planIndex: number, featureIndex: number) => {
    setPlans((prev) =>
      prev.map((plan, i) =>
        i === planIndex
          ? {
              ...plan,
              features: plan.features.filter((_, fi) => fi !== featureIndex),
            }
          : plan,
      ),
    );
  };

  const updateFeature = (
    planIndex: number,
    featureIndex: number,
    value: string,
  ) => {
    setPlans((prev) =>
      prev.map((plan, i) =>
        i === planIndex
          ? {
              ...plan,
              features: plan.features.map((f, fi) =>
                fi === featureIndex ? value : f,
              ),
            }
          : plan,
      ),
    );
  };

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      if (product?.id) {
        // Update existing product including plans
        await updateProductMutation.mutateAsync({
          id: product.id,
          ...formData,
          plans: plans.filter((plan) => plan.name && plan.planType),
        });
      } else {
        // Create new product
        const validPlans = plans.filter((plan) => plan.name && plan.planType);
        await createProductMutation.mutateAsync({
          ...formData,
          plans: validPlans,
        });
      }
    } catch {
      // Silently handle form submission errors
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        {/* Backdrop */}
        <motion.div
          {...modalBackdrop}
          onClick={onClose}
          className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        />

        {/* Modal */}
        <motion.div
          {...modalContent}
          className="relative w-full max-w-4xl max-h-[90vh] mx-4 bg-gray-800 rounded-2xl border border-gray-700 overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-700">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-purple-600 rounded-lg">
                <Package className="h-5 w-5 text-white" />
              </div>
              <h2 className="text-xl font-semibold text-white">
                {product ? "Edit Product" : "Create New Product"}
              </h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
            >
              <X className="h-5 w-5 text-gray-400" />
            </button>
          </div>

          {/* Content */}
          <div className="overflow-y-auto max-h-[calc(90vh-140px)]">
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {error && (
                <div className="bg-red-900/30 text-red-400 p-3 rounded-lg text-sm">
                  {error}
                </div>
              )}

              {/* Basic Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-white">
                  Basic Information
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Product Name *
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => {
                        handleInputChange("name", e.target.value);
                        if (!product) {
                          handleInputChange(
                            "slug",
                            generateSlug(e.target.value),
                          );
                        }
                      }}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                      placeholder="Enter product name"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Slug *
                    </label>
                    <input
                      type="text"
                      value={formData.slug}
                      onChange={(e) =>
                        handleInputChange("slug", e.target.value)
                      }
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                      placeholder="product-slug"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Category *
                    </label>
                    <select
                      value={formData.categoryId}
                      onChange={(e) =>
                        handleInputChange("categoryId", e.target.value)
                      }
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                      required
                    >
                      <option value="">Select a category</option>
                      {categories.map((category) => (
                        <option key={category.id} value={category.id}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Border Color
                    </label>
                    <input
                      type="color"
                      value={formData.borderColor}
                      onChange={(e) =>
                        handleInputChange("borderColor", e.target.value)
                      }
                      className="w-full h-10 bg-gray-700 border border-gray-600 rounded-lg"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Display Order
                    </label>
                    <input
                      type="number"
                      value={formData.displayOrder}
                      onChange={(e) =>
                        handleInputChange(
                          "displayOrder",
                          parseInt(e.target.value) || 0,
                        )
                      }
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                      placeholder="0"
                    />
                    <p className="text-xs text-gray-400 mt-1">
                      Lower numbers appear first. Use 0 for default ordering.
                    </p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) =>
                      handleInputChange("description", e.target.value)
                    }
                    rows={3}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="Product description"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Logo URL
                  </label>
                  <input
                    type="url"
                    value={formData.logoUrl}
                    onChange={(e) =>
                      handleInputChange("logoUrl", e.target.value)
                    }
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="https://example.com/logo.png"
                  />
                  <p className="text-xs text-gray-400 mt-1">
                    URL to the product logo image. If left empty, a default logo
                    will be generated.
                  </p>
                </div>

                {/* SEO Section */}
                <div className="space-y-4">
                  <h4 className="text-md font-medium text-gray-200">
                    SEO Settings
                  </h4>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      SEO Title
                    </label>
                    <input
                      type="text"
                      value={formData.seoTitle}
                      onChange={(e) =>
                        handleInputChange("seoTitle", e.target.value)
                      }
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                      placeholder="Custom SEO title for search engines"
                    />
                    <p className="text-xs text-gray-400 mt-1">
                      If left empty, the product name will be used for SEO.
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      SEO Description
                    </label>
                    <textarea
                      value={formData.seoDescription}
                      onChange={(e) =>
                        handleInputChange("seoDescription", e.target.value)
                      }
                      rows={2}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                      placeholder="Brief description for search engines (155 characters recommended)"
                    />
                    <p className="text-xs text-gray-400 mt-1">
                      Meta description for search engines. Keep it under 155
                      characters for best results.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={formData.isActive}
                      onChange={(e) =>
                        handleInputChange("isActive", e.target.checked)
                      }
                      className="w-4 h-4 text-purple-600 bg-gray-700 border-gray-600 rounded focus:ring-purple-500 focus:ring-2"
                    />
                    <span className="text-sm text-gray-300">Active</span>
                  </label>

                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={formData.isFeatured}
                      onChange={(e) =>
                        handleInputChange("isFeatured", e.target.checked)
                      }
                      className="w-4 h-4 text-purple-600 bg-gray-700 border-gray-600 rounded focus:ring-purple-500 focus:ring-2"
                    />
                    <span className="text-sm text-gray-300">Featured</span>
                  </label>
                </div>
              </div>

              {/* Plans Section */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium text-white">
                    Pricing Plans
                  </h3>
                  <button
                    type="button"
                    onClick={addPlan}
                    className="flex items-center px-3 py-1 bg-purple-600 hover:bg-purple-700 rounded-lg text-white text-sm transition-colors"
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add Plan
                  </button>
                </div>

                {plans.map((plan, planIndex) => (
                  <div
                    key={planIndex}
                    className="bg-gray-700/50 p-4 rounded-lg border border-gray-600"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-md font-medium text-white">
                        Plan {planIndex + 1}
                      </h4>
                      {plans.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removePlan(planIndex)}
                          className="p-1 text-red-400 hover:text-red-300 transition-colors"
                        >
                          <Minus className="h-4 w-4" />
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Plan Name *
                        </label>
                        <input
                          type="text"
                          value={plan.name}
                          onChange={(e) =>
                            handlePlanChange(planIndex, "name", e.target.value)
                          }
                          className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                          placeholder="e.g., Basic, Premium"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Plan Type *
                        </label>
                        <input
                          type="text"
                          value={plan.planType}
                          onChange={(e) =>
                            handlePlanChange(
                              planIndex,
                              "planType",
                              e.target.value,
                            )
                          }
                          className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                          placeholder="e.g., Individual, Family"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Price *
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          value={plan.price}
                          onChange={(e) =>
                            handlePlanChange(
                              planIndex,
                              "price",
                              parseFloat(e.target.value) || 0,
                            )
                          }
                          className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                          placeholder="9.99"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Original Price
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          value={plan.originalPrice || ""}
                          onChange={(e) =>
                            handlePlanChange(
                              planIndex,
                              "originalPrice",
                              e.target.value
                                ? parseFloat(e.target.value)
                                : undefined,
                            )
                          }
                          className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                          placeholder="19.99"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Billing Period *
                        </label>
                        <select
                          value={plan.billingPeriod}
                          onChange={(e) =>
                            handlePlanChange(
                              planIndex,
                              "billingPeriod",
                              e.target.value,
                            )
                          }
                          className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                          required
                        >
                          {billingPeriods.map((period) => (
                            <option key={period.key} value={period.key}>
                              {period.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Duration (days) *
                        </label>
                        <input
                          type="number"
                          value={plan.duration}
                          onChange={(e) =>
                            handlePlanChange(
                              planIndex,
                              "duration",
                              parseInt(e.target.value) || 0,
                            )
                          }
                          className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                          placeholder="30"
                          required
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Delivery Type *
                        </label>
                        <select
                          value={plan.deliveryType}
                          onChange={(e) =>
                            handlePlanChange(
                              planIndex,
                              "deliveryType",
                              e.target.value as "MANUAL" | "AUTOMATIC",
                            )
                          }
                          className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                          required
                        >
                          <option value="MANUAL">Manual</option>
                          <option value="AUTOMATIC">Automatic</option>
                        </select>
                        <p className="text-xs text-gray-400 mt-1">
                          {plan.deliveryType === "AUTOMATIC"
                            ? "Products delivered automatically from stock"
                            : "Products delivered manually via support tickets"}
                        </p>
                      </div>

                      <label className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={plan.isPopular}
                          onChange={(e) =>
                            handlePlanChange(
                              planIndex,
                              "isPopular",
                              e.target.checked,
                            )
                          }
                          className="w-4 h-4 text-yellow-600 bg-gray-700 border-gray-600 rounded focus:ring-yellow-500 focus:ring-2"
                        />
                        <span className="text-sm text-gray-300">Popular</span>
                      </label>

                      <label className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={plan.isAvailable}
                          onChange={(e) =>
                            handlePlanChange(
                              planIndex,
                              "isAvailable",
                              e.target.checked,
                            )
                          }
                          className="w-4 h-4 text-green-600 bg-gray-700 border-gray-600 rounded focus:ring-green-500 focus:ring-2"
                        />
                        <span className="text-sm text-gray-300">Available</span>
                      </label>
                    </div>

                    {/* Delivery Information */}
                    <div className="mb-4">
                      <div className="bg-gray-800/30 p-4 rounded-lg border border-gray-700">
                        <h5 className="text-sm font-medium text-gray-300 mb-2">
                          Stock & Delivery Information
                        </h5>
                        <div className="text-xs text-gray-400 space-y-1">
                          {plan.deliveryType === "AUTOMATIC" ? (
                            <>
                              <p>
                                •{" "}
                                <span className="text-green-400">
                                  Automatic Delivery:
                                </span>{" "}
                                Stock managed through Stock Management system
                              </p>
                              <p>
                                • Products delivered automatically when stock is
                                available
                              </p>
                              <p>
                                • If no stock available, product cannot be
                                purchased
                              </p>
                            </>
                          ) : (
                            <>
                              <p>
                                •{" "}
                                <span className="text-blue-400">
                                  Manual Delivery:
                                </span>{" "}
                                Unlimited stock (stockless)
                              </p>
                              <p>
                                • Products delivered manually via support
                                tickets
                              </p>
                              <p>• No stock limitations apply</p>
                            </>
                          )}
                        </div>
                      </div>

                      <div className="mt-4">
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Max Subscriptions (Optional)
                        </label>
                        <input
                          type="number"
                          min="0"
                          value={plan.maxSubscriptions || ""}
                          onChange={(e) =>
                            handlePlanChange(
                              planIndex,
                              "maxSubscriptions",
                              e.target.value
                                ? parseInt(e.target.value)
                                : undefined,
                            )
                          }
                          className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                          placeholder="Leave empty for unlimited"
                        />
                        <p className="text-xs text-gray-400 mt-1">
                          Maximum concurrent subscriptions for this plan
                        </p>
                      </div>
                    </div>

                    {/* Features */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="block text-sm font-medium text-gray-300">
                          Features
                        </label>
                        <button
                          type="button"
                          onClick={() => addFeature(planIndex)}
                          className="text-purple-400 hover:text-purple-300 text-sm"
                        >
                          + Add Feature
                        </button>
                      </div>
                      <div className="space-y-2">
                        {plan.features.map((feature, featureIndex) => (
                          <div
                            key={featureIndex}
                            className="flex items-center space-x-2"
                          >
                            <input
                              type="text"
                              value={feature}
                              onChange={(e) =>
                                updateFeature(
                                  planIndex,
                                  featureIndex,
                                  e.target.value,
                                )
                              }
                              className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                              placeholder="Feature description"
                            />
                            <button
                              type="button"
                              onClick={() =>
                                removeFeature(planIndex, featureIndex)
                              }
                              className="p-2 text-red-400 hover:text-red-300 transition-colors"
                            >
                              <Minus className="h-4 w-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end space-x-3 pt-6 border-t border-gray-700">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex items-center px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-600/50 rounded-lg text-white transition-colors"
                >
                  {isLoading ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                  ) : (
                    <Save className="h-4 w-4 mr-2" />
                  )}
                  {product ? "Update Product" : "Create Product"}
                </button>
              </div>
            </form>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
