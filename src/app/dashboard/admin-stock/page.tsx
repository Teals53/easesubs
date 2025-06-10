"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { motion } from "framer-motion";
import {
  Package,
  Plus,
  Search,
  Trash2,
  CheckCircle,
  Clock,
} from "lucide-react";

export default function AdminStockPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPlan, setSelectedPlan] = useState<string>("");
  const [newStockContent, setNewStockContent] = useState("");
  const [isAddingStock, setIsAddingStock] = useState(false);

  // Fetch all products with plans for the dropdown
  const { data: products } = trpc.admin.getProducts.useQuery({
    limit: 100,
  });

  // Fetch stock items
  const { data: stockItems, refetch: refetchStock } =
    trpc.admin.getStockItems.useQuery({
      planId: selectedPlan || undefined,
      search: searchTerm || undefined,
    });

  // Mutations
  const addStockMutation = trpc.admin.addStockItem.useMutation({
    onSuccess: () => {
      refetchStock();
      setNewStockContent("");
      setIsAddingStock(false);
    },
  });

  const deleteStockMutation = trpc.admin.deleteStockItem.useMutation({
    onSuccess: () => {
      refetchStock();
    },
  });

  const handleAddStock = async () => {
    if (!selectedPlan || !newStockContent.trim()) return;

    try {
      await addStockMutation.mutateAsync({
        planId: selectedPlan,
        content: newStockContent.trim(),
      });
    } catch {
      // Error is handled by mutation onError callback
    }
  };

  const handleDeleteStock = async (stockId: string) => {
    if (!confirm("Are you sure you want to delete this stock item?")) return;

    try {
      await deleteStockMutation.mutateAsync({ id: stockId });
    } catch {
      // Error is handled by mutation onError callback
    }
  };

  // Get all plans for dropdown
  const allPlans =
    products?.products?.flatMap(
      (product) =>
        product.plans?.map((plan) => ({
          id: plan.id,
          name: `${product.name} - ${plan.planType}`,
          deliveryType: plan.deliveryType,
        })) || [],
    ) || [];

  const automaticPlans = allPlans.filter(
    (plan) => plan.deliveryType === "AUTOMATIC",
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Stock Management</h1>
          <p className="text-gray-400">
            Manage stock items for automatic delivery
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-gray-800/50 backdrop-blur-lg p-6 rounded-2xl border border-gray-700">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              placeholder="Search stock items..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          {/* Plan Filter */}
          <select
            value={selectedPlan}
            onChange={(e) => setSelectedPlan(e.target.value)}
            className="px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            <option value="">All Automatic Plans</option>
            {automaticPlans.map((plan) => (
              <option key={plan.id} value={plan.id}>
                {plan.name}
              </option>
            ))}
          </select>

          {/* Add Stock Button */}
          <button
            onClick={() => setIsAddingStock(true)}
            disabled={!selectedPlan}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
          >
            <Plus className="h-4 w-4" />
            Add Stock Item
          </button>
        </div>

        {/* Add Stock Form */}
        {isAddingStock && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className="mt-4 p-4 bg-gray-700/50 rounded-lg border border-gray-600"
          >
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Stock Content (License Key, Credentials, etc.)
                </label>
                <textarea
                  value={newStockContent}
                  onChange={(e) => setNewStockContent(e.target.value)}
                  rows={3}
                  placeholder="Enter the product content that will be delivered automatically..."
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleAddStock}
                  disabled={
                    !newStockContent.trim() || addStockMutation.isPending
                  }
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
                >
                  {addStockMutation.isPending ? "Adding..." : "Add Stock"}
                </button>
                <button
                  onClick={() => {
                    setIsAddingStock(false);
                    setNewStockContent("");
                  }}
                  className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </div>

      {/* Stock Items */}
      <div className="bg-gray-800/50 backdrop-blur-lg rounded-2xl border border-gray-700">
        {stockItems?.length === 0 ? (
          <div className="text-center py-12">
            <Package className="mx-auto h-16 w-16 text-gray-400" />
            <h3 className="mt-4 text-lg font-semibold text-white">
              No Stock Items
            </h3>
            <p className="mt-2 text-gray-400">
              {selectedPlan
                ? "No stock items found for the selected plan."
                : "Select a plan to view or add stock items."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-700/50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Plan
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Content Preview
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {stockItems?.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-700/30">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-white">
                          {item.plan.product.name}
                        </div>
                        <div className="text-sm text-gray-400">
                          {item.plan.planType}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-300 font-mono bg-gray-800 p-2 rounded max-w-xs overflow-hidden">
                        {item.content.length > 50
                          ? `${item.content.slice(0, 50)}...`
                          : item.content}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                          item.isUsed
                            ? "bg-gray-900/30 text-gray-400"
                            : "bg-green-900/30 text-green-400"
                        }`}
                      >
                        {item.isUsed ? (
                          <>
                            <CheckCircle className="h-3 w-3" />
                            Used
                          </>
                        ) : (
                          <>
                            <Clock className="h-3 w-3" />
                            Available
                          </>
                        )}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                      {new Date(item.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleDeleteStock(item.id)}
                          disabled={
                            item.isUsed || deleteStockMutation.isPending
                          }
                          className="text-red-400 hover:text-red-300 disabled:text-gray-500 disabled:cursor-not-allowed"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

