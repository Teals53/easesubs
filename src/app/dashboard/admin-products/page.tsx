"use client";

import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import { motion } from "framer-motion";
import Image from "next/image";
import {
  Package,
  Search,
  Plus,
  Edit,
  Trash2,
  DollarSign,
  Calendar,
  ToggleLeft,
  ToggleRight,
  Filter,
} from "lucide-react";
import { useState, useMemo } from "react";
import { UserRole } from "@prisma/client";
import { trpc } from "@/lib/trpc";
import { ProductModal } from "@/components/product/product-modal";
import { CategoryModal } from "@/components/product/category-modal";
import { DynamicIcon } from "@/lib/icon-utils";

interface ExtendedUser {
  id: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
  role: UserRole;
}

export default function AdminProductsPage() {
  const { data: session, status } = useSession();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"products" | "categories">(
    "products",
  );

  const utils = trpc.useUtils();

  const [editingProduct, setEditingProduct] = useState<{
    id: string;
    name: string;
    slug: string;
    category: string;
    logoUrl?: string | null;
    
    borderColor?: string | null;
    isActive: boolean;
    isFeatured: boolean;
    displayOrder?: number | null;
    seoTitle?: string | null;
    seoDescription?: string | null;
    plans?: unknown;
  } | null>(null);

  // Properly typed user with role
  const user = session?.user as ExtendedUser | undefined;
  const isAdmin = user?.role === "ADMIN";

  const {
    data: productsData,
    isLoading,
    refetch,
  } = trpc.admin.getProducts.useQuery(
    {
      search: searchTerm || undefined,
      categoryId: selectedCategory || undefined,
      page: currentPage,
      limit: 12,
    },
    {
      enabled: isAdmin,
    },
  );

  const { data: categories, refetch: refetchCategories } =
    trpc.admin.getCategories.useQuery(undefined, {
      enabled: isAdmin,
    });

  const toggleProductStatusMutation =
    trpc.admin.toggleProductStatus.useMutation({
      onSuccess: () => {
        refetch();
      },
    });

  const deleteProductMutation = trpc.admin.deleteProduct.useMutation({
    onSuccess: () => {
      refetch();
    },
  });

  // Calculate stats from current page data
  const stats = useMemo(() => {
    if (!productsData?.products) {
      return { total: 0, active: 0, inactive: 0, avgPrice: 0 };
    }

    // Use stats from API if available, otherwise fallback to current page calculation
    if (productsData.stats) {
      return {
        total: productsData.stats.total,
        active: productsData.stats.active,
        inactive: productsData.stats.inactive,
        avgPrice: productsData.stats.avgPrice,
      };
    }

    // Fallback calculation (for backwards compatibility)
    const products = productsData.products;
    const active = products.filter((p) => p.isActive).length;
    const inactive = products.filter((p) => !p.isActive).length;
    const avgPrice =
      products.length > 0
        ? products.reduce(
            (sum, p) => sum + (Number(p.plans?.[0]?.price) || 0),
            0,
          ) / products.length
        : 0;

    return {
      total: products.length,
      active,
      inactive,
      avgPrice,
    };
  }, [productsData]);

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  if (!session || !isAdmin) {
    redirect("/dashboard");
  }

  const handleToggleStatus = async (productId: string) => {
    try {
      await toggleProductStatusMutation.mutateAsync({ productId });
    } catch {
      // Error is handled by mutation onError callback
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    if (
      confirm(
        "Are you sure you want to delete this product? This action cannot be undone.",
      )
    ) {
      try {
        await deleteProductMutation.mutateAsync({ productId });
      } catch {
        // Error is handled by mutation onError callback
      }
    }
  };

  const handleEditProduct = (product: {
    id: string;
    name: string;
    slug: string;
    category: {
      id: string;
      name: string;
    };
    logoUrl?: string | null;
    
    borderColor?: string | null;
    isActive: boolean;
    isFeatured: boolean;
    displayOrder?: number | null;
    seoTitle?: string | null;
    seoDescription?: string | null;
    plans?: unknown;
  }) => {
    // Convert category object to the format expected by ProductModal
    const productForModal = {
      ...product,
      category: product.category.name, // Use category name for backward compatibility
    };
    setEditingProduct(productForModal);
    setIsProductModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsProductModalOpen(false);
    setEditingProduct(null);
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(price);
  };

  const formatDate = (date: string | Date) => {
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-purple-600 bg-clip-text text-transparent mb-2">
              Product Management
            </h1>
            <p className="text-gray-400">
              Manage your products, categories, pricing, and availability
            </p>
          </div>
          <button
            onClick={() =>
              activeTab === "products"
                ? setIsProductModalOpen(true)
                : setIsCategoryModalOpen(true)
            }
            className="flex items-center px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg text-white transition-colors"
          >
            <Plus className="h-4 w-4 mr-2" />
            {activeTab === "products" ? "Add Product" : "Add Category"}
          </button>
        </div>

        {/* Tabs */}
        <div className="flex space-x-1 bg-gray-800/50 p-1 rounded-lg">
          <button
            onClick={() => setActiveTab("products")}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              activeTab === "products"
                ? "bg-purple-600 text-white"
                : "text-gray-400 hover:text-white hover:bg-gray-700"
            }`}
          >
            Products
          </button>
          <button
            onClick={() => setActiveTab("categories")}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              activeTab === "categories"
                ? "bg-purple-600 text-white"
                : "text-gray-400 hover:text-white hover:bg-gray-700"
            }`}
          >
            Categories
          </button>
        </div>
      </motion.div>

      {/* Content based on active tab */}
      {activeTab === "products" ? (
        <>
          {/* Stats Cards */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="grid grid-cols-1 md:grid-cols-4 gap-6"
          >
            <div className="bg-gray-800/50 backdrop-blur-lg p-6 rounded-2xl border border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm font-medium">
                    Total Products
                  </p>
                  <p className="text-2xl font-bold text-white">{stats.total}</p>
                </div>
                <div className="p-3 bg-purple-500/20 rounded-xl">
                  <Package className="h-6 w-6 text-purple-400" />
                </div>
              </div>
            </div>

            <div className="bg-gray-800/50 backdrop-blur-lg p-6 rounded-2xl border border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm font-medium">
                    Active Products
                  </p>
                  <p className="text-2xl font-bold text-white">
                    {stats.active}
                  </p>
                </div>
                <div className="p-3 bg-green-500/20 rounded-xl">
                  <ToggleRight className="h-6 w-6 text-green-400" />
                </div>
              </div>
            </div>

            <div className="bg-gray-800/50 backdrop-blur-lg p-6 rounded-2xl border border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm font-medium">
                    Inactive Products
                  </p>
                  <p className="text-2xl font-bold text-white">
                    {stats.inactive}
                  </p>
                </div>
                <div className="p-3 bg-red-500/20 rounded-xl">
                  <ToggleLeft className="h-6 w-6 text-red-400" />
                </div>
              </div>
            </div>

            <div className="bg-gray-800/50 backdrop-blur-lg p-6 rounded-2xl border border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm font-medium">
                    Avg. Price
                  </p>
                  <p className="text-2xl font-bold text-white">
                    {formatPrice(stats.avgPrice)}
                  </p>
                </div>
                <div className="p-3 bg-blue-500/20 rounded-xl">
                  <DollarSign className="h-6 w-6 text-blue-400" />
                </div>
              </div>
            </div>
          </motion.div>

          {/* Filters */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-gray-800/50 backdrop-blur-lg p-6 rounded-2xl border border-gray-700"
          >
            <div className="flex flex-col md:flex-row gap-4">
              {/* Search */}
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => {
                      setSearchTerm(e.target.value);
                      setCurrentPage(1);
                    }}
                    placeholder="Search products..."
                    className="w-full pl-10 pr-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>

              {/* Category Filter */}
              <div className="md:w-64">
                <div className="relative">
                  <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <select
                    value={selectedCategory}
                    onChange={(e) => {
                      setSelectedCategory(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="w-full pl-10 pr-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="">All Categories</option>
                    {categories?.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name} ({category.count})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Products Grid */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="space-y-6"
          >
            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
                  <div
                    key={i}
                    className="bg-gray-800/50 backdrop-blur-lg p-6 rounded-2xl border border-gray-700 animate-pulse"
                  >
                    <div className="h-32 bg-gray-700 rounded-lg mb-4"></div>
                    <div className="space-y-2">
                      <div className="h-4 bg-gray-700 rounded w-3/4"></div>
                      <div className="h-3 bg-gray-700 rounded w-1/2"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {productsData?.products?.map((product) => (
                  <div
                    key={product.id}
                    className="bg-gray-800/50 backdrop-blur-lg p-6 rounded-2xl border border-gray-700 hover:border-gray-600 transition-all duration-200"
                  >
                    {/* Product Image */}
                    <div
                      className="h-32 bg-gradient-to-br from-purple-500/20 to-blue-500/20 rounded-lg mb-4 flex items-center justify-center border-2"
                      style={{
                        borderColor: product.borderColor || "#6366f1",
                        boxShadow: `0 0 10px ${product.borderColor || "#6366f1"}20`,
                      }}
                    >
                      {product.logoUrl ? (
                        <Image
                          src={product.logoUrl}
                          alt={product.name}
                          width={64}
                          height={64}
                          className="rounded-lg object-cover"
                          unoptimized
                        />
                      ) : (
                        <div
                          className="h-16 w-16 rounded-lg flex items-center justify-center text-white font-bold text-xl"
                          style={{
                            backgroundColor: product.borderColor || "#9333EA",
                          }}
                        >
                          {product.name?.[0] || (
                            <Package className="h-12 w-12 text-purple-400" />
                          )}
                        </div>
                      )}
                    </div>

                    {/* Product Info */}
                    <div className="space-y-2 mb-4">
                      <h3 className="text-lg font-semibold text-white">
                        {product.name}
                      </h3>
                      <p className="text-gray-400 text-sm leading-relaxed min-h-[3rem] whitespace-pre-wrap break-words">
                        {product.description || "No description available"}
                      </p>
                      <div className="flex items-center space-x-2">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            product.isActive
                              ? "bg-green-900/30 text-green-400"
                              : "bg-red-900/30 text-red-400"
                          }`}
                        >
                          {product.isActive ? "Active" : "Inactive"}
                        </span>
                        <span className="text-gray-400 text-xs">
                          {product.plans?.length || 0} plans
                        </span>
                      </div>
                    </div>

                    {/* Pricing */}
                    <div className="mb-4">
                      {product.plans?.[0] && (
                        <div className="flex items-center space-x-2">
                          <span className="text-2xl font-bold text-white">
                            {formatPrice(Number(product.plans[0].price))}
                          </span>
                          {product.plans[0].originalPrice && (
                            <span className="text-gray-400 line-through text-sm">
                              {formatPrice(
                                Number(product.plans[0].originalPrice),
                              )}
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-between">
                      <div className="text-gray-400 text-xs flex items-center">
                        <Calendar className="h-3 w-3 mr-1" />
                        {formatDate(product.createdAt)}
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleEditProduct(product)}
                          className="p-2 bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors"
                          title="Edit Product"
                        >
                          <Edit className="h-4 w-4 text-white" />
                        </button>
                        <button
                          onClick={() => handleToggleStatus(product.id)}
                          disabled={toggleProductStatusMutation.isPending}
                          className={`p-2 rounded-lg transition-colors ${
                            product.isActive
                              ? "bg-red-600 hover:bg-red-700"
                              : "bg-green-600 hover:bg-green-700"
                          }`}
                          title={product.isActive ? "Deactivate" : "Activate"}
                        >
                          {product.isActive ? (
                            <ToggleLeft className="h-4 w-4 text-white" />
                          ) : (
                            <ToggleRight className="h-4 w-4 text-white" />
                          )}
                        </button>
                        <button
                          onClick={() => handleDeleteProduct(product.id)}
                          disabled={deleteProductMutation.isPending}
                          className="p-2 bg-red-600 hover:bg-red-700 disabled:bg-red-600/50 rounded-lg transition-colors"
                          title="Delete Product"
                        >
                          <Trash2 className="h-4 w-4 text-white" />
                        </button>
                      </div>
                    </div>
                  </div>
                )) || (
                  <div className="col-span-full text-center py-12 text-gray-400">
                    No products found
                  </div>
                )}
              </div>
            )}
          </motion.div>

          {/* Pagination */}
          {productsData && productsData.pages > 1 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="flex items-center justify-center space-x-2"
            >
              <button
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-700/50 rounded-lg text-white transition-colors"
              >
                Previous
              </button>

              <div className="flex space-x-1">
                {[...Array(productsData.pages)].map((_, i) => (
                  <button
                    key={i + 1}
                    onClick={() => setCurrentPage(i + 1)}
                    className={`w-10 h-10 rounded-lg transition-colors ${
                      currentPage === i + 1
                        ? "bg-purple-600 text-white"
                        : "bg-gray-700 hover:bg-gray-600 text-gray-300"
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>

              <button
                onClick={() =>
                  setCurrentPage((prev) =>
                    Math.min(productsData.pages, prev + 1),
                  )
                }
                disabled={currentPage === productsData.pages}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-700/50 rounded-lg text-white transition-colors"
              >
                Next
              </button>
            </motion.div>
          )}
        </>
      ) : (
        /* Categories Tab */
        <CategoriesTab
          categories={categories}
          refetch={refetchCategories}
          utils={utils}
        />
      )}

      {/* Modals */}
      <ProductModal
        isOpen={isProductModalOpen}
        onClose={handleCloseModal}
        onSuccess={() => {
          refetch();
          handleCloseModal();
        }}
        product={editingProduct}
      />

      <CategoryModal
        isOpen={isCategoryModalOpen}
        onClose={() => setIsCategoryModalOpen(false)}
        onSuccess={() => {
          // Refetch categories when a category is created/updated
          refetchCategories();
          utils.admin.getCategories.invalidate();
          utils.product.getCategories.invalidate();
        }}
      />
    </div>
  );
}

// Categories Tab Component
interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  color?: string | null;
  icon?: string | null;
  isActive: boolean;
  displayOrder?: number | null;
  createdAt: Date;
  updatedAt: Date;
  count: number;
}

function CategoriesTab({
  categories,
  refetch,
  utils,
}: {
  categories: Category[] | undefined;
  refetch: () => void;
  utils: ReturnType<typeof trpc.useUtils>;
}) {
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);

  const toggleCategoryStatusMutation =
    trpc.admin.toggleCategoryStatus.useMutation({
      onSuccess: () => {
        refetch();
        utils.admin.getCategories.invalidate();
        utils.product.getCategories.invalidate();
      },
    });

  const deleteCategoryMutation = trpc.admin.deleteCategory.useMutation({
    onSuccess: () => {
      refetch();
      utils.admin.getCategories.invalidate();
      utils.product.getCategories.invalidate();
    },
  });

  const handleToggleStatus = async (categoryId: string) => {
    try {
      await toggleCategoryStatusMutation.mutateAsync({ id: categoryId });
    } catch {
      // Error is handled by mutation onError callback
    }
  };

  const handleDeleteCategory = async (categoryId: string) => {
    if (
      confirm(
        "Are you sure you want to delete this category? This action cannot be undone.",
      )
    ) {
      try {
        await deleteCategoryMutation.mutateAsync({ id: categoryId });
      } catch {
        // Error is handled by mutation onError callback
      }
    }
  };

  const handleEditCategory = (category: Category) => {
    setEditingCategory(category);
    setIsCategoryModalOpen(true);
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
      >
        {categories?.map((category) => (
          <div
            key={category.id}
            className="bg-gray-800/50 backdrop-blur-lg p-6 rounded-2xl border border-gray-700 hover:border-gray-600 transition-all duration-200"
          >
            {/* Category Header */}
            <div className="flex items-center justify-between mb-4">
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center"
                style={{ backgroundColor: category.color || "#3B82F6" }}
              >
                {category.icon ? (
                  <DynamicIcon
                    name={category.icon}
                    className="text-white"
                    size={24}
                  />
                ) : (
                  <span className="text-white font-bold text-lg">
                    {category.name?.[0] || "C"}
                  </span>
                )}
              </div>
              <div className="flex items-center space-x-1">
                <span
                  className={`px-2 py-1 rounded-full text-xs font-medium ${
                    category.isActive
                      ? "bg-green-900/30 text-green-400"
                      : "bg-red-900/30 text-red-400"
                  }`}
                >
                  {category.isActive ? "Active" : "Inactive"}
                </span>
              </div>
            </div>

            {/* Category Info */}
            <div className="space-y-2 mb-4">
              <h3 className="text-lg font-semibold text-white">
                {category.name}
              </h3>
              <p className="text-gray-400 text-sm">
                {category.description || "No description"}
              </p>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-400">{category.count} products</span>
                <span className="text-gray-400">
                  Order: {category.displayOrder || 0}
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between">
              <div className="text-gray-400 text-xs">
                {new Date(category.createdAt).toLocaleDateString()}
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => handleEditCategory(category)}
                  className="p-2 bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors"
                  title="Edit Category"
                >
                  <Edit className="h-4 w-4 text-white" />
                </button>
                <button
                  onClick={() => handleToggleStatus(category.id)}
                  disabled={toggleCategoryStatusMutation.isPending}
                  className={`p-2 rounded-lg transition-colors ${
                    category.isActive
                      ? "bg-red-600 hover:bg-red-700"
                      : "bg-green-600 hover:bg-green-700"
                  }`}
                  title={category.isActive ? "Deactivate" : "Activate"}
                >
                  {category.isActive ? (
                    <ToggleLeft className="h-4 w-4 text-white" />
                  ) : (
                    <ToggleRight className="h-4 w-4 text-white" />
                  )}
                </button>
                <button
                  onClick={() => handleDeleteCategory(category.id)}
                  disabled={
                    deleteCategoryMutation.isPending || category.count > 0
                  }
                  className="p-2 bg-red-600 hover:bg-red-700 disabled:bg-red-600/50 rounded-lg transition-colors"
                  title={
                    category.count > 0
                      ? "Cannot delete category with products"
                      : "Delete Category"
                  }
                >
                  <Trash2 className="h-4 w-4 text-white" />
                </button>
              </div>
            </div>
          </div>
        )) || (
          <div className="col-span-full text-center py-12 text-gray-400">
            No categories found
          </div>
        )}
      </motion.div>

      {/* Category Modal */}
      <CategoryModal
        isOpen={isCategoryModalOpen}
        onClose={() => {
          setIsCategoryModalOpen(false);
          setEditingCategory(null);
        }}
        onSuccess={() => {
          refetch();
          utils.admin.getCategories.invalidate();
          utils.product.getCategories.invalidate();
          setIsCategoryModalOpen(false);
          setEditingCategory(null);
        }}
        category={editingCategory}
      />
    </>
  );
}

