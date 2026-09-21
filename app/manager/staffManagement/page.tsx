'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Users,
  UserPlus,
  Search,
  Edit,
  Shield,
  Mail,
  CheckCircle2,
  XCircle,
  X,
} from 'lucide-react';

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
  branchId: string | null;
  branch?: {
    id: string;
    name: string;
  } | null;
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
          role: 'SALES_ASSISTANT',
        });

        if (!result.success) {
          alert(result.error);
          return;
        }
      }

      // ================================================
      // REFRESH STAFF
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

      if (result.pending) {
        alert('Status change submitted for admin approval.');
        return;
      }

      // Pull the value out into its own explicitly-typed variable
      // BEFORE building the new array — this sidesteps any narrowing
      // quirk across the setStaff callback closure.
      const newStatus = result.data?.status as
        | 'ACTIVE'
        | 'SUSPENDED'
        | undefined;

      setStaff((currentStaff) =>
        currentStaff.map((staffMember) =>
          staffMember.id === person.id
            ? { ...staffMember, status: newStatus ?? staffMember.status }
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
      <section className="w-full min-h-[calc(100vh-32px)] md:min-h-screen flex items-center justify-center px-4 sm:px-6">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto mb-4" />

          <p className="text-sm text-slate-500">Loading staff members...</p>
        </div>
      </section>
    );
  }

  // ====================================================
  // PAGE
  // ====================================================

  return (
    <section className="w-full min-w-0 overflow-x-hidden">
      <div className="w-full max-w-[1600px] mx-auto px-4 py-5 sm:px-6 sm:py-6 lg:px-8 lg:py-8 xl:px-10">
        {/* =================================================
            HEADER
        ================================================= */}

        <header className="flex flex-col gap-4 mb-6 sm:mb-8 pb-5 sm:pb-6 border-b border-slate-200 md:flex-row md:items-end md:justify-between">
          <div className="min-w-0">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-slate-900">
              Staff Management
            </h1>

            <p className="text-sm sm:text-base text-slate-500 mt-1.5 max-w-2xl">
              Manage employee access, roles, and account information.
            </p>
          </div>

          <button
            type="button"
            onClick={handleOpenAdd}
            className="inline-flex w-full md:w-auto items-center justify-center rounded-lg bg-indigo-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-indigo-700 active:bg-indigo-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 gap-2 shrink-0"
          >
            <UserPlus size={18} />
            Add New Staff
          </button>
        </header>

        {/* =================================================
            ANALYTICS
        ================================================= */}

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 lg:gap-5 mb-6 sm:mb-8">
          {/* Total Employees */}

          <div className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4 min-w-0">
            <div className="bg-blue-50 p-3 rounded-lg text-blue-600 shrink-0">
              <Users size={24} />
            </div>

            <div className="min-w-0">
              <p className="text-sm font-medium text-slate-500 truncate">
                Total Employees
              </p>

              <h3 className="text-2xl font-bold text-slate-900 mt-0.5">
                {staff.length}
              </h3>
            </div>
          </div>

          {/* Active Accounts */}

          <div className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4 min-w-0">
            <div className="bg-emerald-50 p-3 rounded-lg text-emerald-600 shrink-0">
              <CheckCircle2 size={24} />
            </div>

            <div className="min-w-0">
              <p className="text-sm font-medium text-slate-500 truncate">
                Active Accounts
              </p>

              <h3 className="text-2xl font-bold text-slate-900 mt-0.5">
                {activeStaffCount}
              </h3>
            </div>
          </div>

          {/* Sales Assistants */}

          <div className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4 min-w-0 sm:col-span-2 xl:col-span-1">
            <div className="bg-purple-50 p-3 rounded-lg text-purple-600 shrink-0">
              <Shield size={24} />
            </div>

            <div className="min-w-0">
              <p className="text-sm font-medium text-slate-500 truncate">
                Sales Assistants
              </p>

              <h3 className="text-2xl font-bold text-slate-900 mt-0.5">
                {assistantCount}
              </h3>
            </div>
          </div>
        </div>

        {/* =================================================
            STAFF SECTION
        ================================================= */}

        <section className="w-full min-w-0">
          {/* Search */}

          <div className="bg-white p-3 sm:p-4 rounded-t-xl border border-slate-200">
            <div className="relative w-full">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                size={18}
              />

              <input
                type="text"
                placeholder="Search staff by name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-11 pl-10 pr-4 rounded-lg border border-slate-200 text-sm text-slate-900 placeholder:text-slate-400 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
              />
            </div>
          </div>

          {/* =================================================
              TABLE
          ================================================= */}

          <div className="bg-white border-x border-b border-slate-200 rounded-b-xl shadow-sm overflow-hidden">
            {/* 
              Important:
              Only this container scrolls horizontally.
              The rest of the page remains responsive.
            */}

            <div className="w-full overflow-x-auto overscroll-x-contain">
              <table className="w-full min-w-[850px] text-left text-sm">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold text-xs">
                  <tr>
                    <th className="px-4 sm:px-6 py-4 whitespace-nowrap">
                      Employee
                    </th>

                    <th className="px-4 sm:px-6 py-4 whitespace-nowrap">
                      Role
                    </th>

                    <th className="px-4 sm:px-6 py-4 whitespace-nowrap">
                      Email
                    </th>

                    <th className="px-4 sm:px-6 py-4 whitespace-nowrap">
                      Status
                    </th>

                    <th className="px-4 sm:px-6 py-4 whitespace-nowrap">
                      Joined
                    </th>

                    <th className="px-4 sm:px-6 py-4 text-right whitespace-nowrap">
                      Actions
                    </th>
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
                        className="hover:bg-slate-50/80 transition-colors"
                      >
                        {/* Employee */}

                        <td className="px-4 sm:px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shrink-0 bg-indigo-100 text-indigo-700">
                              {person.firstName.charAt(0).toUpperCase()}

                              {person.lastName.charAt(0).toUpperCase()}
                            </div>

                            <div className="min-w-0">
                              <p className="font-bold text-slate-900 whitespace-nowrap">
                                {person.firstName} {person.lastName}
                              </p>
                            </div>
                          </div>
                        </td>

                        {/* Role */}

                        <td className="px-4 sm:px-6 py-4">
                          <div className="flex items-center gap-1.5 whitespace-nowrap">
                            <Shield
                              size={16}
                              className="text-slate-400 shrink-0"
                            />

                            <span className="font-medium text-slate-600">
                              Sales Assistant
                            </span>
                          </div>
                        </td>

                        {/* Email */}

                        <td className="px-4 sm:px-6 py-4">
                          <div className="flex items-center gap-2 text-slate-600">
                            <Mail
                              size={14}
                              className="text-slate-400 shrink-0"
                            />

                            <span className="text-xs font-medium whitespace-nowrap">
                              {person.email}
                            </span>
                          </div>
                        </td>

                        {/* Status */}

                        <td className="px-4 sm:px-6 py-4">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider whitespace-nowrap ${
                              person.status === 'ACTIVE'
                                ? 'bg-emerald-100 text-emerald-700'
                                : 'bg-rose-100 text-rose-700'
                            }`}
                          >
                            <span
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

                        <td className="px-4 sm:px-6 py-4 text-slate-600 text-sm whitespace-nowrap">
                          {new Date(person.createdAt).toLocaleDateString()}
                        </td>

                        {/* Actions */}

                        <td className="px-4 sm:px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleOpenEdit(person)}
                              className="p-2.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 active:bg-indigo-100 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500"
                              title="Edit Details"
                              aria-label={`Edit ${person.firstName} ${person.lastName}`}
                            >
                              <Edit size={16} />
                            </button>

                            <button
                              type="button"
                              onClick={() => handleToggleStatus(person)}
                              className={`p-2.5 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                                person.status === 'ACTIVE'
                                  ? 'text-slate-400 hover:text-rose-600 hover:bg-rose-50 active:bg-rose-100'
                                  : 'text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 active:bg-emerald-100'
                              }`}
                              title={
                                person.status === 'ACTIVE'
                                  ? 'Suspend Account'
                                  : 'Activate Account'
                              }
                              aria-label={
                                person.status === 'ACTIVE'
                                  ? `Suspend ${person.firstName} ${person.lastName}`
                                  : `Activate ${person.firstName} ${person.lastName}`
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

            {/* Mobile table hint */}

            {filteredStaff.length > 0 && (
              <div className="border-t border-slate-100 px-4 py-2.5 text-center text-[11px] text-slate-400 sm:hidden">
                Swipe left or right to view all columns
              </div>
            )}
          </div>
        </section>
      </div>

      {/* =================================================
          ADD / EDIT MODAL
      ================================================= */}

      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-3 sm:p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="staff-modal-title"
        >
          <div className="bg-white rounded-xl sm:rounded-2xl shadow-xl w-full max-w-md max-h-[calc(100dvh-24px)] sm:max-h-[calc(100dvh-32px)] overflow-y-auto">
            {/* Modal Header */}

            <div className="sticky top-0 z-10 px-4 sm:px-6 py-4 sm:py-5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h2
                id="staff-modal-title"
                className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2 min-w-0"
              >
                <UserPlus size={20} className="text-indigo-600 shrink-0" />

                <span className="truncate">
                  {editingStaff ? 'Edit Staff Member' : 'Onboard New Staff'}
                </span>
              </h2>

              <button
                type="button"
                onClick={handleCloseModal}
                disabled={isSaving}
                className="text-slate-400 hover:text-slate-600 p-2 rounded-md hover:bg-slate-200 transition-colors disabled:opacity-50 shrink-0 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                aria-label="Close modal"
              >
                <X size={20} />
              </button>
            </div>

            {/* Form */}

            <form
              onSubmit={handleSaveStaff}
              className="p-4 sm:p-6 space-y-4 sm:space-y-5"
            >
              {/* First / Last Name */}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label
                    htmlFor="firstName"
                    className="text-sm font-semibold text-slate-700"
                  >
                    First Name
                  </label>

                  <input
                    id="firstName"
                    required
                    name="firstName"
                    defaultValue={editingStaff?.firstName || ''}
                    className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="e.g. John"
                  />
                </div>

                <div className="space-y-1.5">
                  <label
                    htmlFor="lastName"
                    className="text-sm font-semibold text-slate-700"
                  >
                    Last Name
                  </label>

                  <input
                    id="lastName"
                    required
                    name="lastName"
                    defaultValue={editingStaff?.lastName || ''}
                    className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="e.g. Doe"
                  />
                </div>
              </div>

              {/* Email */}

              <div className="space-y-1.5">
                <label
                  htmlFor="email"
                  className="text-sm font-semibold text-slate-700"
                >
                  Email Address
                </label>

                <div className="relative">
                  <Mail
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                    size={16}
                  />

                  <input
                    id="email"
                    required
                    type="email"
                    name="email"
                    defaultValue={editingStaff?.email || ''}
                    className="w-full pl-10 pr-3 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="staff@store.com"
                  />
                </div>
              </div>

              {/* Password */}

              {!editingStaff && (
                <div className="space-y-1.5">
                  <label
                    htmlFor="password"
                    className="text-sm font-semibold text-slate-700"
                  >
                    Password
                  </label>

                  <input
                    id="password"
                    required
                    type="password"
                    name="password"
                    minLength={6}
                    className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="Minimum 6 characters"
                  />

                  <p className="text-xs text-slate-400">
                    This password will be used by the staff member to log in.
                  </p>
                </div>
              )}

              {/* Role */}

              <div className="space-y-1.5">
                <label
                  htmlFor="role"
                  className="text-sm font-semibold text-slate-700"
                >
                  System Role
                </label>

                <div className="flex items-center gap-2">
                  <Shield size={16} className="text-slate-400 shrink-0" />

                  <input
                    id="role"
                    type="text"
                    value="Sales Assistant"
                    disabled
                    readOnly
                    className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm bg-slate-100 text-slate-500 cursor-not-allowed"
                  />
                </div>
              </div>

              {/* Status */}

              <div className="space-y-1.5">
                <label
                  htmlFor="status"
                  className="text-sm font-semibold text-slate-700"
                >
                  Account Status
                </label>

                <input
                  id="status"
                  type="text"
                  value={
                    editingStaff?.status === 'SUSPENDED'
                      ? 'Suspended'
                      : 'Active'
                  }
                  disabled
                  readOnly
                  className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm bg-slate-100 text-slate-500 cursor-not-allowed"
                />

                {editingStaff && (
                  <p className="text-xs text-slate-400">
                    Use the suspend/activate button in the staff table to change
                    account status.
                  </p>
                )}
              </div>

              {/* Buttons */}

              <div className="pt-2 sm:pt-4 flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2 sm:gap-3">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  disabled={isSaving}
                  className="w-full sm:w-auto px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-100 active:bg-slate-200 rounded-lg transition-colors disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={isSaving}
                  className="w-full sm:w-auto px-4 py-2.5 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 rounded-lg transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
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
    </section>
  );
}
