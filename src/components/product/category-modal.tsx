"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Save,
  Palette,
  Type,
  FileText,
  Hash,
  ToggleLeft,
  ToggleRight,
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { sanitizeText } from "@/lib/input-sanitizer";

interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  color?: string | null;
  icon?: string | null;
  isActive: boolean;
  displayOrder?: number | null;
}

interface CategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  category?: Category | null;
}

export function CategoryModal({
  isOpen,
  onClose,
  onSuccess,
  category,
}: CategoryModalProps) {
  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    description: "",
    color: "#3B82F6",
    icon: "",
    displayOrder: 1,
    isActive: true,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const createMutation = trpc.admin.createCategory.useMutation({
    onSuccess: () => {
      onSuccess();
      onClose();
      resetForm();
    },
    onError: (error) => {
      setErrors({ general: error.message });
    },
  });

  const updateMutation = trpc.admin.updateCategory.useMutation({
    onSuccess: () => {
      onSuccess();
      onClose();
      resetForm();
    },
    onError: (error) => {
      setErrors({ general: error.message });
    },
  });

  useEffect(() => {
    if (category) {
      setFormData({
        name: category.name,
        slug: category.slug,
        description: category.description || "",
        color: category.color || "#3B82F6",
        icon: category.icon || "",
        displayOrder: category.displayOrder || 1,
        isActive: category.isActive,
      });
    } else {
      resetForm();
    }
    setErrors({});
  }, [category, isOpen]);

  const resetForm = () => {
    setFormData({
      name: "",
      slug: "",
      description: "",
      color: "#3B82F6",
      icon: "",
      displayOrder: 1,
      isActive: true,
    });
  };

  const generateSlug = (name: string) => {
    return sanitizeText(name)
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .trim();
  };

  const handleNameChange = (value: string) => {
    const sanitizedName = sanitizeText(value);
    setFormData((prev) => ({
      ...prev,
      name: sanitizedName,
      slug: generateSlug(sanitizedName),
    }));
  };

  const handleSlugChange = (value: string) => {
    try {
      const sanitizedSlug = sanitizeText(value)
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-")
        .trim();
      setFormData((prev) => ({ ...prev, slug: sanitizedSlug }));
    } catch {
      // If sanitization fails, keep the current slug
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    // Validation
    const newErrors: Record<string, string> = {};
    if (!formData.name.trim()) newErrors.name = "Category name is required";
    if (!formData.slug.trim()) newErrors.slug = "Category slug is required";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      if (category) {
        await updateMutation.mutateAsync({
          id: category.id,
          ...formData,
        });
      } else {
        await createMutation.mutateAsync(formData);
      }
    } catch {
      // Error handled in mutation callbacks
    }
  };

  const colorOptions = [
    "#EF4444",
    "#F97316",
    "#F59E0B",
    "#EAB308",
    "#84CC16",
    "#22C55E",
    "#10B981",
    "#14B8A6",
    "#06B6D4",
    "#0EA5E9",
    "#3B82F6",
    "#6366F1",
    "#8B5CF6",
    "#A855F7",
    "#C026D3",
    "#EC4899",
    "#F43F5E",
    "#64748B",
    "#6B7280",
    "#374151",
  ];

  const iconOptions = [
    "Package",
    "Tag",
    "Grid",
    "List",
    "Star",
    "Heart",
    "Play",
    "Music",
    "Image",
    "Video",
    "BookOpen",
    "Gamepad2",
    "Zap",
    "Tool",
    "Palette",
    "Code",
    "Database",
    "Server",
    "Globe",
    "Building2",
    "Users",
    "MessageCircle",
    "Mail",
    "Phone",
  ];

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          onClick={onClose}
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-2xl bg-gray-900 rounded-2xl border border-gray-700 shadow-2xl my-8 max-h-[90vh] overflow-y-auto"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-700">
            <h2 className="text-xl font-semibold text-white">
              {category ? "Edit Category" : "Create Category"}
            </h2>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {errors.general && (
              <div className="p-3 bg-red-900/20 border border-red-700 rounded-lg text-red-400 text-sm">
                {errors.general}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  <Type className="h-4 w-4 inline mr-2" />
                  Category Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="e.g., Streaming & Media"
                />
                {errors.name && (
                  <p className="mt-1 text-sm text-red-400">{errors.name}</p>
                )}
              </div>

              {/* Slug */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  <Hash className="h-4 w-4 inline mr-2" />
                  URL Slug
                </label>
                <input
                  type="text"
                  value={formData.slug}
                  onChange={(e) => handleSlugChange(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="e.g., streaming-media"
                />
                {errors.slug && (
                  <p className="mt-1 text-sm text-red-400">{errors.slug}</p>
                )}
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                <FileText className="h-4 w-4 inline mr-2" />
                Description (Optional)
              </label>
              <textarea
                value={formData.description}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    description: sanitizeText(e.target.value, 500),
                  }))
                }
                rows={3}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                placeholder="Brief description of this category..."
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Color */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  <Palette className="h-4 w-4 inline mr-2" />
                  Color
                </label>
                <div className="grid grid-cols-5 gap-2">
                  {colorOptions.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() =>
                        setFormData((prev) => ({ ...prev, color }))
                      }
                      className={`w-8 h-8 rounded-lg border-2 transition-all hover:scale-105 ${
                        formData.color === color
                          ? "border-white ring-2 ring-white ring-offset-2 ring-offset-gray-800"
                          : "border-gray-600 hover:border-gray-400"
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>

              {/* Icon */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Icon (Optional)
                </label>
                <select
                  value={formData.icon}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, icon: e.target.value }))
                  }
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="">Select icon</option>
                  {iconOptions.map((icon) => (
                    <option key={icon} value={icon}>
                      {icon}
                    </option>
                  ))}
                </select>
              </div>

              {/* Display Order */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Display Order
                </label>
                <input
                  type="number"
                  value={formData.displayOrder}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      displayOrder: parseInt(e.target.value) || 1,
                    }))
                  }
                  min="1"
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
            </div>

            {/* Status */}
            <div className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg">
              <div>
                <h3 className="font-medium text-white">Active Status</h3>
                <p className="text-sm text-gray-400">
                  Inactive categories won&apos;t be shown to users
                </p>
              </div>
              <button
                type="button"
                onClick={() =>
                  setFormData((prev) => ({ ...prev, isActive: !prev.isActive }))
                }
                className={`p-2 rounded-lg transition-colors ${
                  formData.isActive
                    ? "bg-green-600 hover:bg-green-700"
                    : "bg-gray-600 hover:bg-gray-700"
                }`}
              >
                {formData.isActive ? (
                  <ToggleRight className="h-5 w-5 text-white" />
                ) : (
                  <ToggleLeft className="h-5 w-5 text-white" />
                )}
              </button>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-700">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={createMutation.isPending || updateMutation.isPending}
                className="flex items-center px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-600/50 rounded-lg text-white transition-colors"
              >
                <Save className="h-4 w-4 mr-2" />
                {createMutation.isPending || updateMutation.isPending
                  ? "Saving..."
                  : category
                    ? "Update Category"
                    : "Create Category"}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
