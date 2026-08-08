'use client';

import React, { useState, useEffect, useMemo } from 'react';

import {
  Users,
  UserPlus,
  Search,
  Edit,
  Shield,
  ShieldCheck,
  Mail,
  CheckCircle2,
  XCircle,
  X,
} from 'lucide-react';

import AdminSidebar from '@/components/AdminSidebar';

import {
  getAllStaff,
  createStaffAccount,
  updateStaff,
  toggleStaffStatus,
} from '@/app/actions/staff';

// ======================================================
// TYPES
// ======================================================

interface Staff {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: 'SALES_ASSISTANT';
  status: 'ACTIVE' | 'SUSPENDED';
  createdAt: Date;
}

// ======================================================
// PAGE
// ======================================================

export default function StaffManagementPage() {
  // ====================================================
  // STATE
  // ====================================================

  const [staff, setStaff] = useState<Staff[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [searchQuery, setSearchQuery] = useState('');

  const [isModalOpen, setIsModalOpen] = useState(false);

  const [editingStaff, setEditingStaff] = useState<Staff | null>(null);

  const [isSaving, setIsSaving] = useState(false);

  // ====================================================
  // LOAD STAFF
  // ====================================================

  useEffect(() => {
    async function loadStaff() {
      try {
        setIsLoading(true);

        const result = await getAllStaff();

        if (result.success) {
          setStaff(result.data as Staff[]);
        } else {
          console.error(result.error);
          alert(result.error);
        }
      } catch (error) {
        console.error('Failed to load staff:', error);
        alert('Failed to load staff members.');
      } finally {
        setIsLoading(false);
      }
    }

    loadStaff();
  }, []);

  // ====================================================
  // FILTER STAFF
  // ====================================================

  const filteredStaff = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();

    if (!query) {
      return staff;
    }

    return staff.filter((person) => {
      const fullName = `${person.firstName} ${person.lastName}`.toLowerCase();

      return (
        fullName.includes(query) || person.email.toLowerCase().includes(query)
      );
    });
  }, [staff, searchQuery]);

  // ====================================================
  // ANALYTICS
  // ====================================================

  const activeStaffCount = staff.filter(
    (person) => person.status === 'ACTIVE',
  ).length;

  const suspendedStaffCount = staff.filter(
    (person) => person.status === 'SUSPENDED',
  ).length;

  const assistantCount = staff.filter(
    (person) => person.role === 'SALES_ASSISTANT',
  ).length;

  // ====================================================
  // OPEN ADD MODAL
  // ====================================================

  const handleOpenAdd = () => {
    setEditingStaff(null);
    setIsModalOpen(true);
  };

  // ====================================================
  // OPEN EDIT MODAL
  // ====================================================

  const handleOpenEdit = (person: Staff) => {
    setEditingStaff(person);
    setIsModalOpen(true);
  };

  // ====================================================
  // CLOSE MODAL
  // ====================================================

  const handleCloseModal = () => {
    if (isSaving) return;

    setIsModalOpen(false);
    setEditingStaff(null);
  };

  // ====================================================
  // SAVE STAFF
  // ====================================================

  const handleSaveStaff = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (isSaving) return;

    const formData = new FormData(e.currentTarget);

    const firstName = String(formData.get('firstName') || '').trim();

    const lastName = String(formData.get('lastName') || '').trim();

    const email = String(formData.get('email') || '')
      .trim()
      .toLowerCase();

    try {
      setIsSaving(true);

      // ================================================
      // UPDATE EXISTING STAFF
      // ================================================

      if (editingStaff) {
        const result = await updateStaff(editingStaff.id, {
          firstName,
          lastName,
          email,
        });

        if (!result.success) {
          alert(result.error);
          return;
        }
      }

      // ================================================
      // CREATE NEW STAFF
      // ================================================
      else {
        const passwordRaw = String(formData.get('password') || '');

        if (!passwordRaw) {
          alert('Please enter a password.');
          return;
        }

        const result = await createStaffAccount({
          firstName,
          lastName,
          email,
          passwordRaw,
        });

        if (!result.success) {
          alert(result.error);
          return;
        }
      }

      // ================================================
      // REFRESH STAFF FROM DATABASE
      // ================================================

      const refreshResult = await getAllStaff();

      if (!refreshResult.success) {
        alert(refreshResult.error);
        return;
      }

      setStaff(refreshResult.data as Staff[]);

      setIsModalOpen(false);
      setEditingStaff(null);
    } catch (error) {
      console.error('Error saving staff:', error);

      alert('Failed to save staff member. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  // ====================================================
  // TOGGLE STAFF STATUS
  // ====================================================

  const handleToggleStatus = async (person: Staff) => {
    try {
      const result = await toggleStaffStatus(person.id, person.status);

      if (!result.success) {
        alert(result.error);
        return;
      }

      // Update the local state with database result
      setStaff((currentStaff) =>
        currentStaff.map((staffMember) =>
          staffMember.id === person.id
            ? {
                ...staffMember,
                status: result.data?.status ?? staffMember.status,
              }
            : staffMember,
        ),
      );
    } catch (error) {
      console.error('Error updating staff status:', error);

      alert('Failed to update staff status. Please try again.');
    }
  };

  // ====================================================
  // LOADING SCREEN
  // ====================================================

  if (isLoading) {
    return (
      <div className="flex min-h-screen bg-slate-50">
        <AdminSidebar />

        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto mb-4" />

            <p className="text-sm text-slate-500">Loading staff members...</p>
          </div>
        </main>
      </div>
    );
  }

  // ====================================================
  // PAGE
  // ====================================================

  return (
    <div className="flex min-h-screen bg-slate-50">
      <AdminSidebar />

      <main className="flex-1 overflow-y-auto p-8">
        <div className="max-w-7xl mx-auto">
          {/* ============================================
              HEADER
          ============================================ */}

          <header className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8 border-b border-slate-200 pb-6">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-slate-900">
                Staff Management
              </h1>

              <p className="text-slate-500 mt-1">
                Manage employee access, roles, and account information.
              </p>
            </div>

            <button
              onClick={handleOpenAdd}
              className="inline-flex items-center justify-center rounded-lg text-sm font-medium transition-colors bg-indigo-600 text-white hover:bg-indigo-700 h-10 px-4 py-2 gap-2 shadow-sm"
            >
              <UserPlus size={18} />
              Add New Staff
            </button>
          </header>

          {/* ============================================
              ANALYTICS CARDS
          ============================================ */}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {/* Total Employees */}

            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
              <div className="bg-blue-50 p-3 rounded-lg text-blue-600">
                <Users size={24} />
              </div>

              <div>
                <p className="text-sm font-medium text-slate-500">
                  Total Employees
                </p>

                <h3 className="text-2xl font-bold text-slate-900">
                  {staff.length}
                </h3>
              </div>
            </div>

            {/* Active Accounts */}

            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
              <div className="bg-emerald-50 p-3 rounded-lg text-emerald-600">
                <CheckCircle2 size={24} />
              </div>

              <div>
                <p className="text-sm font-medium text-slate-500">
                  Active Accounts
                </p>

                <h3 className="text-2xl font-bold text-slate-900">
                  {activeStaffCount}
                </h3>
              </div>
            </div>

            {/* Sales Assistants */}

            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
              <div className="bg-purple-50 p-3 rounded-lg text-purple-600">
                <Shield size={24} />
              </div>

              <div>
                <p className="text-sm font-medium text-slate-500">
                  Sales Assistants
                </p>

                <h3 className="text-2xl font-bold text-slate-900">
                  {assistantCount}
                </h3>
              </div>
            </div>
          </div>

          {/* ============================================
              SEARCH
          ============================================ */}

          <div className="bg-white p-4 rounded-t-xl border border-slate-200 border-b-0 flex items-center">
            <div className="relative w-full max-w-md">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                size={18}
              />

              <input
                type="text"
                placeholder="Search staff by name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all bg-slate-50"
              />
            </div>
          </div>

          {/* ============================================
              TABLE
          ============================================ */}

          <div className="bg-white border border-slate-200 rounded-b-xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold text-xs">
                  <tr>
                    <th className="px-6 py-4">Employee</th>

                    <th className="px-6 py-4">Role</th>

                    <th className="px-6 py-4">Email</th>

                    <th className="px-6 py-4">Status</th>

                    <th className="px-6 py-4">Joined</th>

                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {filteredStaff.length === 0 ? (
                    <tr>
                      <td
                        colSpan={6}
                        className="px-6 py-12 text-center text-slate-500"
                      >
                        <Users
                          size={32}
                          className="mx-auto mb-3 text-slate-300"
                        />

                        <p className="font-medium">No staff members found.</p>

                        <p className="text-xs mt-1">
                          {searchQuery
                            ? 'Try a different search.'
                            : 'Add your first staff member.'}
                        </p>
                      </td>
                    </tr>
                  ) : (
                    filteredStaff.map((person) => (
                      <tr
                        key={person.id}
                        className="hover:bg-slate-50/80 transition-colors group"
                      >
                        {/* Employee */}

                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shrink-0 bg-indigo-100 text-indigo-700">
                              {person.firstName.charAt(0).toUpperCase()}

                              {person.lastName.charAt(0).toUpperCase()}
                            </div>

                            <div>
                              <p className="font-bold text-slate-900">
                                {person.firstName} {person.lastName}
                              </p>

                              {/* <p className="text-xs text-slate-500 font-mono mt-0.5">
                                {person.id}
                              </p> */}
                            </div>
                          </div>
                        </td>

                        {/* Role */}

                        <td className="px-6 py-4">
                          <div className="flex items-center gap-1.5">
                            <Shield size={16} className="text-slate-400" />

                            <span className="font-medium text-slate-600">
                              Sales Assistant
                            </span>
                          </div>
                        </td>

                        {/* Email */}

                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2 text-slate-600">
                            <Mail size={14} className="text-slate-400" />

                            <span className="text-xs font-medium">
                              {person.email}
                            </span>
                          </div>
                        </td>

                        {/* Status */}

                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                              person.status === 'ACTIVE'
                                ? 'bg-emerald-100 text-emerald-700'
                                : 'bg-rose-100 text-rose-700'
                            }`}
                          >
                            <div
                              className={`w-1.5 h-1.5 rounded-full ${
                                person.status === 'ACTIVE'
                                  ? 'bg-emerald-500'
                                  : 'bg-rose-500'
                              }`}
                            />

                            {person.status === 'ACTIVE'
                              ? 'Active'
                              : 'Suspended'}
                          </span>
                        </td>

                        {/* Joined */}

                        <td className="px-6 py-4 text-slate-600 text-sm">
                          {new Date(person.createdAt).toLocaleDateString()}
                        </td>

                        {/* Actions */}

                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            {/* Edit */}

                            <button
                              onClick={() => handleOpenEdit(person)}
                              className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors"
                              title="Edit Details"
                            >
                              <Edit size={16} />
                            </button>

                            {/* Toggle Status */}

                            <button
                              onClick={() => handleToggleStatus(person)}
                              className={`p-2 rounded-md transition-colors ${
                                person.status === 'ACTIVE'
                                  ? 'text-slate-400 hover:text-rose-600 hover:bg-rose-50'
                                  : 'text-slate-400 hover:text-emerald-600 hover:bg-emerald-50'
                              }`}
                              title={
                                person.status === 'ACTIVE'
                                  ? 'Suspend Account'
                                  : 'Activate Account'
                              }
                            >
                              {person.status === 'ACTIVE' ? (
                                <XCircle size={16} />
                              ) : (
                                <CheckCircle2 size={16} />
                              )}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>

      {/* =================================================
          ADD / EDIT MODAL
      ================================================= */}

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
            {/* Modal Header */}

            <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <UserPlus size={20} className="text-indigo-600" />

                {editingStaff ? 'Edit Staff Member' : 'Onboard New Staff'}
              </h2>

              <button
                type="button"
                onClick={handleCloseModal}
                disabled={isSaving}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-md hover:bg-slate-200 transition-colors disabled:opacity-50"
              >
                <X size={20} />
              </button>
            </div>

            {/* Form */}

            <form onSubmit={handleSaveStaff} className="p-6 space-y-5">
              {/* First / Last Name */}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-slate-700">
                    First Name
                  </label>

                  <input
                    required
                    name="firstName"
                    defaultValue={editingStaff?.firstName || ''}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="e.g. John"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-slate-700">
                    Last Name
                  </label>

                  <input
                    required
                    name="lastName"
                    defaultValue={editingStaff?.lastName || ''}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="e.g. Doe"
                  />
                </div>
              </div>

              {/* Email */}

              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-slate-700">
                  Email Address
                </label>

                <div className="relative">
                  <Mail
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                    size={16}
                  />

                  <input
                    required
                    type="email"
                    name="email"
                    defaultValue={editingStaff?.email || ''}
                    className="w-full pl-10 pr-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="staff@store.com"
                  />
                </div>
              </div>

              {/* Password - Only for new staff */}

              {!editingStaff && (
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-slate-700">
                    Password
                  </label>

                  <input
                    required
                    type="password"
                    name="password"
                    minLength={6}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="Minimum 6 characters"
                  />

                  <p className="text-xs text-slate-400">
                    This password will be used by the staff member to log in.
                  </p>
                </div>
              )}

              {/* Role */}

              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-slate-700">
                  System Role
                </label>

                <div className="flex items-center gap-2">
                  <Shield size={16} className="text-slate-400" />

                  <input
                    type="text"
                    value="Sales Assistant"
                    disabled
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm bg-slate-100 text-slate-500 cursor-not-allowed"
                  />
                </div>
              </div>

              {/* Status */}

              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-slate-700">
                  Account Status
                </label>

                <input
                  type="text"
                  value={
                    editingStaff?.status === 'SUSPENDED'
                      ? 'Suspended'
                      : 'Active'
                  }
                  disabled
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm bg-slate-100 text-slate-500 cursor-not-allowed"
                />

                {editingStaff && (
                  <p className="text-xs text-slate-400">
                    Use the suspend/activate button in the staff table to change
                    account status.
                  </p>
                )}
              </div>

              {/* Buttons */}

              <div className="pt-4 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  disabled={isSaving}
                  className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSaving
                    ? 'Saving...'
                    : editingStaff
                      ? 'Save Updates'
                      : 'Create Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
