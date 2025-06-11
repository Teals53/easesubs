"use client";

import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import { motion } from "framer-motion";
import {
  Users,
  Search,
  X,
  Shield,
  User,
  Calendar,
  ChevronLeft,
  ChevronRight,
  UserCheck,
  Crown,
  Edit,
  Trash2,
} from "lucide-react";
import { trpc, invalidatePatterns } from "@/lib/trpc";
import { useState } from "react";
import { UserRole } from "@prisma/client";
import { toast } from "sonner";

interface ExtendedUser {
  id: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
  role: UserRole;
}

export default function AdminUsersPage() {
  const { data: session, status } = useSession();
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [editingUser, setEditingUser] = useState<
    (ExtendedUser & { isActive: boolean; createdAt: string | Date }) | null
  >(null);
  const [editForm, setEditForm] = useState({
    name: "",
    email: "",
    role: "USER" as UserRole,
    isActive: true,
  });
  const itemsPerPage = 10;

  // Properly typed user with role
  const user = session?.user as ExtendedUser | undefined;
  const isAdmin = user?.role === "ADMIN" || user?.role === "MANAGER";
  const isFullAdmin = user?.role === "ADMIN";

  // Get tRPC utils for cache invalidation
  const utils = trpc.useUtils();

  const {
    data: usersData,
    isLoading,
    refetch,
  } = trpc.admin.getUsers.useQuery(
    {
      search: searchTerm,
      page,
      limit: itemsPerPage,
    },
    {
      enabled: isAdmin,
      // Refetch every 60 seconds for real-time updates
      refetchInterval: 60000,
    },
  );

  const updateUserRoleMutation = trpc.admin.updateUserRole.useMutation({
    onSuccess: () => {
      // Invalidate all user-related queries
      invalidatePatterns.users(utils);
      invalidatePatterns.dashboard(utils);
      refetch();
    },
    onError: () => {
      toast.error("Failed to update user role. Please try again.");
    },
  });

  const updateUserMutation = trpc.admin.updateUser.useMutation({
    onSuccess: () => {
      // Invalidate all user-related queries
      invalidatePatterns.users(utils);
      invalidatePatterns.dashboard(utils);
      refetch();
      setEditingUser(null);
    },
    onError: () => {
      toast.error("Failed to update user. Please try again.");
    },
  });

  const deleteUserMutation = trpc.admin.deleteUser.useMutation({
    onSuccess: () => {
      // Invalidate all user-related queries
      invalidatePatterns.users(utils);
      invalidatePatterns.dashboard(utils);
      refetch();
    },
    onError: () => {
      toast.error("Failed to delete user. Please try again.");
    },
  });

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

  const handleRoleChange = async (userId: string, newRole: string) => {
    try {
      await updateUserRoleMutation.mutateAsync({
        userId,
        role: newRole as "USER" | "ADMIN" | "SUPPORT_AGENT" | "MANAGER",
      });
    } catch {
      // Error is handled by mutation onError callback
    }
  };

  const handleEditUser = (
    user: ExtendedUser & { isActive: boolean; createdAt: string | Date },
  ) => {
    setEditingUser(user);
    setEditForm({
      name: user.name || "",
      email: user.email || "",
      role: user.role,
      isActive: user.isActive,
    });
  };

  const handleUpdateUser = async () => {
    if (!editingUser) return;

    try {
      await updateUserMutation.mutateAsync({
        userId: editingUser.id,
        name: editForm.name || undefined,
        email: editForm.email || undefined,
        isActive: editForm.isActive,
        // Role is not updated here - use the dropdown in the table instead
      });
    } catch {
      // Error is handled by mutation onError callback
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (
      confirm(
        "Are you sure you want to delete this user? This action cannot be undone.",
      )
    ) {
      try {
        await deleteUserMutation.mutateAsync({ userId });
      } catch {
        // Error is handled by mutation onError callback
      }
    }
  };

  const formatDate = (date: string | Date) => {
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
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

  // Helper function to check if current user can modify target user
  const canModifyUser = (targetUserId: string, targetUserRole: string) => {
    // Cannot modify yourself
    if (session?.user?.id === targetUserId) {
      return false;
    }
    // Only ADMIN can modify ADMIN users
    if (!isFullAdmin && targetUserRole === "ADMIN") {
      return false;
    }
    return true;
  };

  // Helper function to check if current user can change target user's role
  const canChangeRole = (targetUserId: string, targetUserRole: string) => {
    // Cannot change your own role
    if (session?.user?.id === targetUserId) {
      return false;
    }
    // Only ADMIN can modify ADMIN users
    if (!isFullAdmin && targetUserRole === "ADMIN") {
      return false;
    }
    return true;
  };

  const totalPages = usersData ? Math.ceil(usersData.total / itemsPerPage) : 0;

  // Calculate stats from the users data
  const stats = usersData?.users
    ? {
        total: usersData.total,
        admins: usersData.users.filter((u) => u.role === "ADMIN").length,
        supportAgents: usersData.users.filter((u) => u.role === "SUPPORT_AGENT")
          .length,
        users: usersData.users.filter((u) => u.role === "USER").length,
      }
    : { total: 0, admins: 0, supportAgents: 0, users: 0 };

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-purple-600 bg-clip-text text-transparent mb-2">
            User Management
          </h1>
          <p className="text-gray-400">
            Manage user accounts, roles, and permissions
          </p>
        </div>
      </motion.div>

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
              <p className="text-gray-400 text-sm font-medium">Total Users</p>
              <p className="text-2xl font-bold text-white">{stats.total}</p>
            </div>
            <div className="p-3 bg-blue-500/20 rounded-xl">
              <Users className="h-6 w-6 text-blue-400" />
            </div>
          </div>
        </div>

        <div className="bg-gray-800/50 backdrop-blur-lg p-6 rounded-2xl border border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm font-medium">Admins</p>
              <p className="text-2xl font-bold text-white">{stats.admins}</p>
            </div>
            <div className="p-3 bg-red-500/20 rounded-xl">
              <Crown className="h-6 w-6 text-red-400" />
            </div>
          </div>
        </div>

        <div className="bg-gray-800/50 backdrop-blur-lg p-6 rounded-2xl border border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm font-medium">
                Support Agents
              </p>
              <p className="text-2xl font-bold text-white">
                {stats.supportAgents}
              </p>
            </div>
            <div className="p-3 bg-yellow-500/20 rounded-xl">
              <UserCheck className="h-6 w-6 text-yellow-400" />
            </div>
          </div>
        </div>

        <div className="bg-gray-800/50 backdrop-blur-lg p-6 rounded-2xl border border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm font-medium">Regular Users</p>
              <p className="text-2xl font-bold text-white">{stats.users}</p>
            </div>
            <div className="p-3 bg-gray-500/20 rounded-xl">
              <User className="h-6 w-6 text-gray-400" />
            </div>
          </div>
        </div>
      </motion.div>

      {/* Search and Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-gray-800/50 backdrop-blur-lg p-6 rounded-2xl border border-gray-700"
      >
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <input
              type="text"
              placeholder="Search users by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            )}
          </div>
        </div>
      </motion.div>

      {/* Users Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-gray-800/50 backdrop-blur-lg rounded-2xl border border-gray-700 overflow-hidden"
      >
        {/* Desktop Table View */}
        <div className="hidden lg:block overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-700/50">
              <tr>
                <th className="text-left py-4 px-6 text-gray-400 font-medium">
                  User
                </th>
                <th className="text-left py-4 px-6 text-gray-400 font-medium">
                  Role
                </th>
                <th className="text-left py-4 px-6 text-gray-400 font-medium">
                  Joined
                </th>
                <th className="text-left py-4 px-6 text-gray-400 font-medium">
                  Status
                </th>
                <th className="text-left py-4 px-6 text-gray-400 font-medium">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {isLoading
                ? Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="border-b border-gray-700">
                      <td className="py-4 px-6">
                        <div className="animate-pulse flex items-center space-x-3">
                          <div className="w-10 h-10 bg-gray-700 rounded-full"></div>
                          <div className="space-y-2">
                            <div className="h-4 bg-gray-700 rounded w-32"></div>
                            <div className="h-3 bg-gray-700 rounded w-24"></div>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="h-6 bg-gray-700 rounded w-20"></div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="h-4 bg-gray-700 rounded w-24"></div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="h-6 bg-gray-700 rounded w-16"></div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex space-x-2">
                          <div className="h-8 w-8 bg-gray-700 rounded"></div>
                          <div className="h-8 w-8 bg-gray-700 rounded"></div>
                        </div>
                      </td>
                    </tr>
                  ))
                : usersData?.users?.map((user) => (
                    <tr
                      key={user.id}
                      className="border-b border-gray-700 hover:bg-gray-700/30 transition-colors"
                    >
                      <td className="py-4 px-6">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center">
                            <span className="text-white font-bold text-sm">
                              {user.name?.[0]?.toUpperCase() ||
                                user.email?.[0]?.toUpperCase() ||
                                "U"}
                            </span>
                          </div>
                          <div>
                            <p className="text-white font-medium">
                              {user.name || "Anonymous"}
                            </p>
                            <p className="text-gray-400 text-sm">
                              {user.email}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center space-x-2">
                          {getRoleIcon(user.role)}
                          <select
                            value={user.role}
                            onChange={(e) =>
                              handleRoleChange(user.id, e.target.value)
                            }
                            disabled={updateUserRoleMutation.isPending || !canChangeRole(user.id, user.role)}
                            className="bg-gray-700 border border-gray-600 rounded px-2 py-1 text-white text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <option value="USER">User</option>
                            {isFullAdmin && <option value="ADMIN">Admin</option>}
                            <option value="SUPPORT_AGENT">Support Agent</option>
                            <option value="MANAGER">Manager</option>
                          </select>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center text-gray-400">
                          <Calendar className="h-4 w-4 mr-2" />
                          <span className="text-sm">
                            {formatDate(user.createdAt)}
                          </span>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <span
                          className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                            user.isActive
                              ? "bg-green-900/30 text-green-400"
                              : "bg-red-900/30 text-red-400"
                          }`}
                        >
                          {user.isActive ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleEditUser(user)}
                            disabled={!canModifyUser(user.id, user.role)}
                            className="p-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-600/50 disabled:cursor-not-allowed rounded-lg transition-colors"
                            title={canModifyUser(user.id, user.role) ? "Edit User" : "Cannot edit this user"}
                          >
                            <Edit className="h-4 w-4 text-white" />
                          </button>
                          {session?.user?.id !== user.id && canModifyUser(user.id, user.role) && (
                            <button
                              onClick={() => handleDeleteUser(user.id)}
                              disabled={deleteUserMutation.isPending}
                              className="p-2 bg-red-600 hover:bg-red-700 disabled:bg-red-600/50 rounded-lg transition-colors"
                              title="Delete User"
                            >
                              <Trash2 className="h-4 w-4 text-white" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
            </tbody>
          </table>
        </div>

        {/* Mobile Card View */}
        <div className="lg:hidden p-4">
          {isLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div
                  key={i}
                  className="bg-gray-700/30 rounded-xl p-4 animate-pulse"
                >
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="w-10 h-10 bg-gray-700 rounded-full"></div>
                    <div className="space-y-2 flex-1">
                      <div className="h-4 bg-gray-700 rounded w-32"></div>
                      <div className="h-3 bg-gray-700 rounded w-24"></div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="h-6 bg-gray-700 rounded w-20"></div>
                    <div className="h-4 bg-gray-700 rounded w-24"></div>
                    <div className="h-6 bg-gray-700 rounded w-16"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {usersData?.users?.map((user) => (
                <div
                  key={user.id}
                  className="bg-gray-700/30 rounded-xl p-4 space-y-4"
                >
                  {/* User Info */}
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-white font-bold text-sm">
                        {user.name?.[0]?.toUpperCase() ||
                          user.email?.[0]?.toUpperCase() ||
                          "U"}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-medium truncate">
                        {user.name || "Anonymous"}
                      </p>
                      <p className="text-gray-400 text-sm truncate">
                        {user.email}
                      </p>
                    </div>
                    <span
                      className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        user.isActive
                          ? "bg-green-900/30 text-green-400"
                          : "bg-red-900/30 text-red-400"
                      }`}
                    >
                      {user.isActive ? "Active" : "Inactive"}
                    </span>
                  </div>

                  {/* Role Selector */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      {getRoleIcon(user.role)}
                      <span className="text-gray-300 text-sm">Role:</span>
                    </div>
                    <select
                      value={user.role}
                      onChange={(e) =>
                        handleRoleChange(user.id, e.target.value)
                      }
                      disabled={updateUserRoleMutation.isPending || !canChangeRole(user.id, user.role)}
                      className="bg-gray-700 border border-gray-600 rounded px-3 py-1 text-white text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <option value="USER">User</option>
                      {isFullAdmin && <option value="ADMIN">Admin</option>}
                      <option value="SUPPORT_AGENT">Support Agent</option>
                      <option value="MANAGER">Manager</option>
                    </select>
                  </div>

                  {/* Join Date and Actions */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center text-gray-400 text-sm">
                      <Calendar className="h-4 w-4 mr-2" />
                      <span>Joined {formatDate(user.createdAt)}</span>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleEditUser(user)}
                        disabled={!canModifyUser(user.id, user.role)}
                        className="p-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-600/50 disabled:cursor-not-allowed rounded-lg transition-colors"
                        title={canModifyUser(user.id, user.role) ? "Edit User" : "Cannot edit this user"}
                      >
                        <Edit className="h-4 w-4 text-white" />
                      </button>
                      {session?.user?.id !== user.id && canModifyUser(user.id, user.role) && (
                        <button
                          onClick={() => handleDeleteUser(user.id)}
                          disabled={deleteUserMutation.isPending}
                          className="p-2 bg-red-600 hover:bg-red-700 disabled:bg-red-600/50 rounded-lg transition-colors"
                          title="Delete User"
                        >
                          <Trash2 className="h-4 w-4 text-white" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Pagination */}
        {usersData && totalPages > 1 && (
          <div className="px-4 lg:px-6 py-4 border-t border-gray-700 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="text-sm text-gray-400 text-center sm:text-left">
              Showing {(page - 1) * itemsPerPage + 1} to{" "}
              {Math.min(page * itemsPerPage, usersData.total)} of{" "}
              {usersData.total} users
            </div>
            <div className="flex items-center justify-center space-x-2">
              <button
                onClick={() => setPage(page - 1)}
                disabled={page === 1}
                className="p-2 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-700/50 rounded-lg transition-colors"
              >
                <ChevronLeft className="h-4 w-4 text-white" />
              </button>
              <span className="text-white text-sm px-3">
                Page {page} of {totalPages}
              </span>
              <button
                onClick={() => setPage(page + 1)}
                disabled={page === totalPages}
                className="p-2 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-700/50 rounded-lg transition-colors"
              >
                <ChevronRight className="h-4 w-4 text-white" />
              </button>
            </div>
          </div>
        )}
      </motion.div>

      {/* Edit User Modal */}
      {editingUser && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setEditingUser(null);
            }
          }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-gray-800 rounded-2xl border border-gray-700 p-6 w-full max-w-md"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-xl font-bold text-white mb-4">Edit User</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Name
                </label>
                <input
                  type="text"
                  value={editForm.name}
                  onChange={(e) =>
                    setEditForm({ ...editForm, name: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  value={editForm.email}
                  onChange={(e) =>
                    setEditForm({ ...editForm, email: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                />
              </div>



              <label className="flex items-center space-x-2">
                <input
                  id="isActive"
                  type="checkbox"
                  checked={editForm.isActive}
                  onChange={(e) =>
                    setEditForm({ ...editForm, isActive: e.target.checked })
                  }
                  className="w-4 h-4 text-purple-600 bg-gray-700 border-gray-600 rounded focus:ring-purple-500 focus:ring-2"
                />
                <span className="text-sm text-gray-300">Active</span>
              </label>
            </div>

            <div className="flex space-x-3 mt-6">
              <button
                onClick={handleUpdateUser}
                disabled={updateUserMutation.isPending}
                className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-600/50 text-white font-medium py-2 px-4 rounded-lg transition-colors"
              >
                {updateUserMutation.isPending ? "Updating..." : "Update User"}
              </button>
              <button
                onClick={() => setEditingUser(null)}
                className="flex-1 bg-gray-600 hover:bg-gray-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
              >
                Cancel
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
