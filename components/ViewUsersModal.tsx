"use client";

import { useState, useEffect } from "react";
import {
  X,
  Users,
  Search,
  Filter,
  Trash2,
  Mail,
  Phone,
  Building2,
  Briefcase,
  Award,
  Calendar,
  Stethoscope,
  Activity,
  UserPlus,
  Hospital,
  Pencil,
  Check,
} from "lucide-react";

interface User {
  id: string;
  userId: string;
  role: string;
  firstName: string;
  lastName: string;
  fullName: string;
  email: string;
  phone: string;
  department: string;
  specialization?: string;
  licenseNumber?: string;
  yearsOfExperience?: number;
  shift?: string;
  staffRole?: string;
  hospitalName?: string;
  hospitalId?: string;
  createdAt: string;
}

interface HospitalOption {
  id: string;
  name: string;
  city: string;
  state: string;
}

interface ViewUsersModalProps {
  isOpen: boolean;
  onClose: () => void;
  adminId: string;
}

export default function ViewUsersModal({
  isOpen,
  onClose,
  adminId,
}: ViewUsersModalProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [hospitals, setHospitals] = useState<HospitalOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");

  // Edit modal state
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [selectedHospitalId, setSelectedHospitalId] = useState<string>("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchUsers();
      fetchHospitals();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  useEffect(() => {
    filterUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [users, searchQuery, roleFilter]);

  const fetchHospitals = async () => {
    try {
      const response = await fetch(`/api/admin/hospitals?adminId=${adminId}`);
      const data = await response.json();
      if (response.ok && data.hospitals) {
        setHospitals(data.hospitals);
      }
    } catch (err) {
      console.error("Failed to fetch hospitals:", err);
    }
  };

  const fetchUsers = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/admin/users?adminId=${adminId}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch users");
      }

      setUsers(data.users);
      setFilteredUsers(data.users);
    } catch (err: any) {
      setError(err.message || "Failed to fetch users");
    } finally {
      setLoading(false);
    }
  };

  const filterUsers = () => {
    let filtered = users;

    // Filter by role
    if (roleFilter !== "all") {
      filtered = filtered.filter((user) => user.role === roleFilter);
    }

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (user) =>
          user.fullName.toLowerCase().includes(query) ||
          user.email.toLowerCase().includes(query) ||
          user.userId.toLowerCase().includes(query) ||
          user.phone?.includes(query),
      );
    }

    setFilteredUsers(filtered);
  };

  const handleDelete = async (userId: string, role: string) => {
    if (
      !confirm(
        `Are you sure you want to delete this ${role}? This action cannot be undone.`,
      )
    ) {
      return;
    }

    try {
      const response = await fetch(
        `/api/admin/users?adminId=${adminId}&userId=${userId}&role=${role}`,
        {
          method: "DELETE",
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to delete user");
      }

      // Refresh users list
      fetchUsers();
    } catch (err: any) {
      alert(err.message || "Failed to delete user");
    }
  };

  const handleEdit = (user: User) => {
    setEditingUser(user);
    setSelectedHospitalId(user.hospitalId || "");
  };

  const handleSaveHospital = async () => {
    if (!editingUser || !selectedHospitalId) {
      alert("Please select a hospital");
      return;
    }

    setSaving(true);
    try {
      const response = await fetch("/api/admin/assign-hospital", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          adminId,
          userId: editingUser.userId,
          userRole: editingUser.role,
          hospitalId: selectedHospitalId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to assign hospital");
      }

      // Refresh users and close edit modal
      await fetchUsers();
      setEditingUser(null);
      setSelectedHospitalId("");
    } catch (err: any) {
      alert(err.message || "Failed to assign hospital");
    } finally {
      setSaving(false);
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "doctor":
        return "bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-900/30";
      case "nurse":
        return "bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300 border-green-200 dark:border-green-900/30";
      case "staff":
        return "bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-900/30";
      default:
        return "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700";
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "doctor":
        return <Stethoscope className="w-4 h-4" />;
      case "nurse":
        return <Activity className="w-4 h-4" />;
      case "staff":
        return <UserPlus className="w-4 h-4" />;
      default:
        return <Users className="w-4 h-4" />;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-6xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-800">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 dark:bg-purple-900/40 rounded-lg">
              <Users className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                All Registered Users
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {filteredUsers.length} of {users.length} users
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        {/* Filters */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-800 space-y-4">
          <div className="flex gap-4 flex-wrap">
            {/* Search */}
            <div className="flex-1 min-w-[250px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by name, email, or ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-400 focus:border-transparent"
                />
              </div>
            </div>

            {/* Role Filter */}
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-gray-400" />
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-400 focus:border-transparent"
              >
                <option value="all">All Roles</option>
                <option value="doctor">Doctors</option>
                <option value="nurse">Nurses</option>
                <option value="staff">Staff</option>
              </select>
            </div>

            {/* Refresh Button */}
            <button
              onClick={fetchUsers}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors font-medium"
              disabled={loading}
            >
              {loading ? "Loading..." : "Refresh"}
            </button>
          </div>
        </div>

        {/* Users List */}
        <div className="flex-1 overflow-y-auto p-6">
          {error && (
            <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900/30 rounded-lg text-red-700 dark:text-red-400 text-sm mb-4">
              {error}
            </div>
          )}

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="text-center">
                <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-gray-800 dark:border-gray-300 border-r-transparent"></div>
                <p className="mt-2 text-gray-500 dark:text-gray-400 font-medium">
                  Loading users...
                </p>
              </div>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="text-center py-20 text-gray-400">
              <Users className="w-16 h-16 mx-auto mb-4 opacity-20" />
              <p>No users found.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {filteredUsers.map((user) => (
                <div
                  key={user.id}
                  className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4 border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow"
                >
                  {/* User Header */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-white dark:bg-gray-700 rounded-lg">
                        {getRoleIcon(user.role)}
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-900 dark:text-white">
                          {user.fullName}
                        </h3>
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium border ${getRoleBadgeColor(
                            user.role,
                          )}`}
                        >
                          {user.role.charAt(0).toUpperCase() +
                            user.role.slice(1)}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDelete(user.userId, user.role)}
                      className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                      title="Delete user"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleEdit(user)}
                      className="p-2 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                      title="Edit user"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                  </div>

                  {/* User Details */}
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                      <span className="font-mono font-medium">
                        {user.userId}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                      <Mail className="w-4 h-4" />
                      <span>{user.email}</span>
                    </div>
                    {user.phone && (
                      <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                        <Phone className="w-4 h-4" />
                        <span>{user.phone}</span>
                      </div>
                    )}
                    {user.department && (
                      <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                        <Building2 className="w-4 h-4" />
                        <span>{user.department}</span>
                      </div>
                    )}
                    {user.hospitalName && (
                      <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                        <Hospital className="w-4 h-4" />
                        <span>{user.hospitalName}</span>
                      </div>
                    )}

                    {/* Role-specific details */}
                    {user.role === "doctor" && (
                      <>
                        {user.specialization && (
                          <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                            <Briefcase className="w-4 h-4" />
                            <span>{user.specialization}</span>
                          </div>
                        )}
                        {user.licenseNumber && (
                          <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                            <Award className="w-4 h-4" />
                            <span>License: {user.licenseNumber}</span>
                          </div>
                        )}
                        {user.yearsOfExperience !== undefined && (
                          <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                            <Calendar className="w-4 h-4" />
                            <span>
                              {user.yearsOfExperience} years experience
                            </span>
                          </div>
                        )}
                      </>
                    )}

                    {user.role === "nurse" && (
                      <>
                        {user.licenseNumber && (
                          <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                            <Award className="w-4 h-4" />
                            <span>License: {user.licenseNumber}</span>
                          </div>
                        )}
                        {user.shift && (
                          <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                            <Calendar className="w-4 h-4" />
                            <span className="capitalize">
                              {user.shift} shift
                            </span>
                          </div>
                        )}
                      </>
                    )}

                    {user.role === "staff" && user.staffRole && (
                      <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                        <Briefcase className="w-4 h-4" />
                        <span>{user.staffRole}</span>
                      </div>
                    )}

                    <div className="pt-2 text-xs text-gray-400 dark:text-gray-500">
                      Created: {new Date(user.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 dark:border-gray-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-700 transition-colors font-medium"
          >
            Close
          </button>
        </div>
      </div>

      {/* Edit User Modal */}
      {editingUser && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-md">
            {/* Edit Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-800">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/40 rounded-lg">
                  <Pencil className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                    Edit User
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {editingUser.fullName}
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setEditingUser(null);
                  setSelectedHospitalId("");
                }}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
              </button>
            </div>

            {/* Edit Modal Body */}
            <div className="p-6 space-y-4">
              {/* User Info */}
              <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-gray-500 dark:text-gray-400">ID:</span>
                  <span className="font-mono font-medium text-gray-900 dark:text-white">
                    {editingUser.userId}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-gray-500 dark:text-gray-400">
                    Role:
                  </span>
                  <span className="capitalize font-medium text-gray-900 dark:text-white">
                    {editingUser.role}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-gray-500 dark:text-gray-400">
                    Current Hospital:
                  </span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {editingUser.hospitalName || "Not assigned"}
                  </span>
                </div>
              </div>

              {/* Hospital Assignment */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <Hospital className="w-4 h-4 inline mr-2" />
                  Assign Hospital
                </label>
                <select
                  value={selectedHospitalId}
                  onChange={(e) => setSelectedHospitalId(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent"
                >
                  <option value="">Select a hospital...</option>
                  {hospitals.map((hospital) => (
                    <option key={hospital.id} value={hospital.id}>
                      {hospital.name} - {hospital.city}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Edit Modal Footer */}
            <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 dark:border-gray-800">
              <button
                onClick={() => {
                  setEditingUser(null);
                  setSelectedHospitalId("");
                }}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveHospital}
                disabled={saving || !selectedHospitalId}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg transition-colors font-medium"
              >
                {saving ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    Save Changes
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
