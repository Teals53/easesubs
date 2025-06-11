"use client";

import { useState, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import {
  User,
  Shield,
  Key,
  Trash2,
  Save,
  Edit,
  Crown,
  UserCheck,
  Eye,
  EyeOff,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { sanitizeText } from "@/lib/input-sanitizer";
import { modalBackdrop, modalContent } from "@/lib/animations";

export default function ProfileSettingsClient() {
  const { data: session, status, update } = useSession();
  const [isEditing, setIsEditing] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");
  const [deleteConfirmation, setDeleteConfirmation] = useState("");
  const [deleteError, setDeleteError] = useState("");
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });
  const [formData, setFormData] = useState({
    name: "",
  });

  // Get user data from session
  const userProfile = session?.user;

  // Get tRPC utils for cache invalidation
  const utils = trpc.useUtils();

  // Fetch user profile data from database
  const { data: dbUserProfile } = trpc.user.getProfile.useQuery(undefined, {
    enabled: !!session?.user?.id,
    refetchOnWindowFocus: false,
  });

  // Update profile mutation
  const updateProfileMutation = trpc.user.updateProfile.useMutation({
    onSuccess: async (data) => {
      toast.success("Profile updated successfully!");
      setIsEditing(false);

      // Update the session with the new user data
      if (data.user && formData.name !== session?.user?.name) {
        await update({
          ...session,
          user: {
            ...session?.user,
            name: data.user.name,
          },
        });
      }

      // Invalidate and refetch user profile data
      await utils.user.getProfile.invalidate();
      
      // Update local form data to reflect the change immediately
      setFormData({
        name: data.user?.name || formData.name,
      });
    },
    onError: (error) => {
      console.error("Profile update error:", error);
      toast.error(`Failed to update profile: ${error.message}`);
    },
  });

  // Change password mutation
  const changePasswordMutation = trpc.auth.changePassword.useMutation({
    onSuccess: () => {
      toast.success("Password changed successfully!");
      setShowPasswordModal(false);
      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    },
    onError: (error) => {
      toast.error(`Failed to change password: ${error.message}`);
    },
  });

  // Delete account mutation
  const deleteAccountMutation = trpc.user.deleteAccount.useMutation({
    onSuccess: () => {
      toast.success("Account deleted successfully. You will be signed out.");
      signOut({ callbackUrl: "/" });
    },
    onError: (error) => {
      setDeleteError(
        error.message || "Failed to delete account. Please try again.",
      );
    },
  });

  // Initialize form data when profile loads
  useEffect(() => {
    // Prioritize database profile data over session data for accuracy
    const profileData = dbUserProfile || userProfile;
    if (profileData) {
      setFormData({
        name: profileData.name || "",
      });
    }
  }, [userProfile, dbUserProfile]);

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  const handleSave = async () => {
    try {
      // Sanitize the input first
      const sanitizedName = sanitizeText(formData.name, 50);
      
      // Validate form data
      if (!sanitizedName || sanitizedName.trim().length < 2) {
        toast.error("Name must be at least 2 characters long");
        return;
      }

      if (sanitizedName.trim().length > 50) {
        toast.error("Name must be less than 50 characters");
        return;
      }

      // Validate name format (same as registration)
      if (!/^[a-zA-Z\s'-]+$/.test(sanitizedName.trim())) {
        toast.error("Name can only contain letters, spaces, hyphens, and apostrophes");
        return;
      }

      // Check if name actually changed (prioritize database data)
      const profileData = dbUserProfile || userProfile;
      if (sanitizedName.trim() === profileData?.name?.trim()) {
        toast.info("No changes detected");
        setIsEditing(false);
        return;
      }

      try {
        await updateProfileMutation.mutateAsync({
          name: sanitizedName.trim(),
        });
      } catch (error) {
        console.error("Save error:", error);
        // Error is handled by mutation onError callback
      }
    } catch (sanitizationError) {
      console.error("Input sanitization error:", sanitizationError);
      toast.error("Invalid input detected");
    }
  };

  const handleCancel = () => {
    // Reset form data to original values (prioritize database data)
    const profileData = dbUserProfile || userProfile;
    setFormData({
      name: profileData?.name || "",
    });
    setIsEditing(false);
  };

  const handlePasswordChange = async () => {
    // Validation
    if (
      !passwordData.currentPassword ||
      !passwordData.newPassword ||
      !passwordData.confirmPassword
    ) {
      toast.error("All password fields are required");
      return;
    }

    if (passwordData.newPassword.length < 8) {
      toast.error("New password must be at least 8 characters long");
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error("New passwords do not match");
      return;
    }

    try {
      await changePasswordMutation.mutateAsync({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      });
    } catch {
      // Error is handled by mutation onError callback
    }
  };

  const closePasswordModal = () => {
    setShowPasswordModal(false);
    setPasswordData({
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    });
    setShowPasswords({
      current: false,
      new: false,
      confirm: false,
    });
  };

  const closeDeleteModal = () => {
    setShowDeleteModal(false);
    setDeletePassword("");
    setDeleteConfirmation("");
    setDeleteError("");
  };

  const handleDeleteAccount = async () => {
    // Clear previous errors
    setDeleteError("");

    // Validation
    if (!deletePassword.trim()) {
      setDeleteError("Please enter your password");
      return;
    }

    if (deleteConfirmation !== "DELETE MY ACCOUNT") {
      setDeleteError('Please type "DELETE MY ACCOUNT" to confirm');
      return;
    }

    try {
      await deleteAccountMutation.mutateAsync({
        password: deletePassword,
        confirmation: "DELETE MY ACCOUNT" as const,
      });
    } catch {
      // Error is handled by mutation onError callback
    }
  };

  const handlePasswordModalBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      closePasswordModal();
    }
  };

  const handleDeleteModalBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      closeDeleteModal();
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "ADMIN":
        return <Crown className="h-4 w-4 text-red-400" />;
      case "SUPPORT_AGENT":
        return <UserCheck className="h-4 w-4 text-yellow-400" />;
      case "MANAGER":
        return <Shield className="h-4 w-4 text-blue-400" />;
      default:
        return <User className="h-4 w-4 text-gray-400" />;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case "ADMIN":
        return "text-red-400";
      case "SUPPORT_AGENT":
        return "text-yellow-400";
      case "MANAGER":
        return "text-blue-400";
      default:
        return "text-gray-400";
    }
  };

  const formatRole = (role: string) => {
    switch (role) {
      case "SUPPORT_AGENT":
        return "Support Agent";
      default:
        return role.charAt(0) + role.slice(1).toLowerCase();
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-8"
      >
        <h1 className="text-3xl font-bold text-white mb-2">Profile Settings</h1>
        <p className="text-gray-400">
          Manage your account settings and preferences
        </p>
      </motion.div>

      {/* Personal Information */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-gray-800/50 backdrop-blur-lg p-6 rounded-2xl border border-gray-700"
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-white flex items-center">
            <User className="w-5 h-5 mr-2" />
            Personal Information
          </h2>
          {!isEditing ? (
            <button
              onClick={() => setIsEditing(true)}
              className="flex items-center px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg text-white text-sm transition-colors"
            >
              <Edit className="w-4 h-4 mr-2" />
              Edit
            </button>
          ) : (
            <div className="flex space-x-2">
              <button
                onClick={handleCancel}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-white text-sm transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={updateProfileMutation.isPending || !formData.name.trim() || formData.name.trim().length < 2}
                className="flex items-center px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-green-600/50 disabled:cursor-not-allowed rounded-lg text-white text-sm transition-colors"
              >
                <Save className="w-4 h-4 mr-2" />
                {updateProfileMutation.isPending ? "Saving..." : "Save"}
              </button>
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">
              Full Name
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => {
                try {
                  // First sanitize to remove dangerous content (HTML, scripts, etc.)
                  const sanitized = sanitizeText(e.target.value, 50);
                  // Then filter to allow only valid name characters (letters, spaces, hyphens, apostrophes)
                  const validValue = sanitized.replace(/[^a-zA-Z\s\-']/g, '');
                  setFormData({ ...formData, name: validValue });
                } catch (error) {
                  // If sanitization fails (e.g., too long), show error
                  console.error("Input sanitization error:", error);
                  toast.error("Invalid input detected");
                }
              }}
              disabled={!isEditing}
              className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
              placeholder="Enter your full name"
              maxLength={50}
            />
            {isEditing && (
              <p className="text-xs text-gray-500 mt-1">
                {formData.name.length}/50 characters
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">
              Email Address
            </label>
            <input
              type="email"
              value={session?.user?.email || ""}
              disabled
              className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-gray-300 opacity-50 cursor-not-allowed"
            />
            <p className="text-xs text-gray-500 mt-1">
              Email cannot be changed
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Account Role
              </label>
              <div className="flex items-center space-x-2 w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg">
                {getRoleIcon(session?.user?.role || "USER")}
                <span
                  className={`font-medium ${getRoleColor(session?.user?.role || "USER")}`}
                >
                  {formatRole(session?.user?.role || "USER")}
                </span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Account Status
              </label>
              <div className="flex items-center space-x-2 w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg">
                {(() => {
                  const isActive = dbUserProfile && 'isActive' in dbUserProfile ? dbUserProfile.isActive : true;
                  return (
                    <>
                      <div className={`w-2 h-2 rounded-full ${
                        isActive ? 'bg-green-400' : 'bg-red-400'
                      }`}></div>
                      <span className={`font-medium ${
                        isActive ? 'text-green-400' : 'text-red-400'
                      }`}>
                        {isActive ? 'Active' : 'Inactive'}
                      </span>
                    </>
                  );
                })()}
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Security & Account Management */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-gray-800/50 backdrop-blur-lg p-6 rounded-2xl border border-gray-700"
      >
        <h2 className="text-xl font-semibold text-white mb-6 flex items-center">
          <Shield className="w-5 h-5 mr-2" />
          Security & Account Management
        </h2>

        <div className="space-y-4">
          {/* Password Management */}
          <div className="flex items-center justify-between p-4 bg-gray-700/50 rounded-lg">
            <div className="flex items-center">
              <Key className="w-5 h-5 text-gray-400 mr-3" />
              <div>
                <p className="text-white font-medium">Change Password</p>
                <p className="text-gray-400 text-sm">
                  Update your account password
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowPasswordModal(true)}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm transition-colors"
            >
              Change
            </button>
          </div>

          {/* Danger Zone */}
          <div className="mt-6 p-4 bg-red-900/20 border border-red-500/30 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Trash2 className="w-5 h-5 text-red-400 mr-3" />
                <div>
                  <p className="text-red-400 font-medium">Delete Account</p>
                  <p className="text-gray-400 text-sm">
                    Permanently delete your account and all associated data
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowDeleteModal(true)}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm transition-colors"
              >
                Delete Account
              </button>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Password Change Modal */}
      <AnimatePresence>
        {showPasswordModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <motion.div
              {...modalBackdrop}
              onClick={handlePasswordModalBackdropClick}
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            />

            {/* Modal */}
            <motion.div
              {...modalContent}
              className="relative w-full max-w-md mx-4 bg-gray-800 rounded-2xl border border-gray-700 overflow-hidden"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-700">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-purple-600 rounded-lg">
                    <Key className="h-5 w-5 text-white" />
                  </div>
                  <h2 className="text-xl font-semibold text-white">
                    Change Password
                  </h2>
                </div>
                <button
                  onClick={closePasswordModal}
                  className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <X className="h-5 w-5 text-gray-400" />
                </button>
              </div>

              {/* Content */}
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Current Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPasswords.current ? "text" : "password"}
                      value={passwordData.currentPassword}
                      onChange={(e) =>
                        setPasswordData({ ...passwordData, currentPassword: e.target.value })
                      }
                      className="w-full px-4 py-3 pr-12 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                      placeholder="Enter your current password"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setShowPasswords({ ...showPasswords, current: !showPasswords.current })
                      }
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-300"
                    >
                      {showPasswords.current ? (
                        <EyeOff className="w-5 h-5" />
                      ) : (
                        <Eye className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    New Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPasswords.new ? "text" : "password"}
                      value={passwordData.newPassword}
                      onChange={(e) =>
                        setPasswordData({ ...passwordData, newPassword: e.target.value })
                      }
                      className="w-full px-4 py-3 pr-12 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                      placeholder="Enter your new password"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setShowPasswords({ ...showPasswords, new: !showPasswords.new })
                      }
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-300"
                    >
                      {showPasswords.new ? (
                        <EyeOff className="w-5 h-5" />
                      ) : (
                        <Eye className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                  <p className="text-xs text-gray-400 mt-1">
                    Must be at least 8 characters long
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Confirm New Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPasswords.confirm ? "text" : "password"}
                      value={passwordData.confirmPassword}
                      onChange={(e) =>
                        setPasswordData({ ...passwordData, confirmPassword: e.target.value })
                      }
                      className="w-full px-4 py-3 pr-12 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                      placeholder="Confirm your new password"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setShowPasswords({ ...showPasswords, confirm: !showPasswords.confirm })
                      }
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-300"
                    >
                      {showPasswords.confirm ? (
                        <EyeOff className="w-5 h-5" />
                      ) : (
                        <Eye className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-700">
                <button
                  onClick={closePasswordModal}
                  className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handlePasswordChange}
                  disabled={changePasswordMutation.isPending || !passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword}
                  className="flex items-center px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-600/50 disabled:cursor-not-allowed rounded-lg text-white transition-colors"
                >
                  {changePasswordMutation.isPending ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                  ) : (
                    <Save className="h-4 w-4 mr-2" />
                  )}
                  Change Password
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Account Modal */}
      <AnimatePresence>
        {showDeleteModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <motion.div
              {...modalBackdrop}
              onClick={handleDeleteModalBackdropClick}
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            />

            {/* Modal */}
            <motion.div
              {...modalContent}
              className="relative w-full max-w-md mx-4 bg-gray-800 rounded-2xl border border-gray-700 overflow-hidden"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-700">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-red-600 rounded-lg">
                    <Trash2 className="h-5 w-5 text-white" />
                  </div>
                  <h2 className="text-xl font-semibold text-white">
                    Delete Account
                  </h2>
                </div>
                <button
                  onClick={closeDeleteModal}
                  className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <X className="h-5 w-5 text-gray-400" />
                </button>
              </div>

              {/* Content */}
              <div className="p-6 space-y-4">
                <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-4">
                  <h3 className="text-red-400 font-medium mb-2">⚠️ Warning</h3>
                  <p className="text-red-300 text-sm">
                    This action is irreversible. All your data including orders, subscriptions, and support tickets will be permanently deleted.
                  </p>
                </div>

                {deleteError && (
                  <div className="bg-red-900/30 text-red-400 p-3 rounded-lg text-sm">
                    {deleteError}
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Password
                  </label>
                  <input
                    type="password"
                    value={deletePassword}
                    onChange={(e) => setDeletePassword(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500"
                    placeholder="Enter your password"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                                         Type &quot;DELETE MY ACCOUNT&quot; to confirm
                  </label>
                  <input
                    type="text"
                    value={deleteConfirmation}
                    onChange={(e) => setDeleteConfirmation(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500"
                    placeholder="DELETE MY ACCOUNT"
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-700">
                <button
                  onClick={closeDeleteModal}
                  className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteAccount}
                  disabled={deleteAccountMutation.isPending || !deletePassword || deleteConfirmation !== "DELETE MY ACCOUNT"}
                  className="flex items-center px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-red-600/50 disabled:cursor-not-allowed rounded-lg text-white transition-colors"
                >
                  {deleteAccountMutation.isPending ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                  ) : (
                    <Trash2 className="h-4 w-4 mr-2" />
                  )}
                  Delete Account
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
} 