'use client';

import React, { useEffect, useMemo, useState } from 'react';

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
  Building2,
} from 'lucide-react';

import AdminSidebar from '@/components/AdminSidebar';

import {
  getAllStaff,
  createStaffAccount,
  updateStaff,
  toggleStaffStatus,
} from '@/app/actions/staff';

import { getAllBranches } from '@/app/actions/branch';

interface Branch {
  id: string;
  name: string;
  status: 'ACTIVE' | 'INACTIVE';
}

interface Staff {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: 'MANAGER' | 'SALES_ASSISTANT';
  status: 'ACTIVE' | 'SUSPENDED';
  branchId: string | null;
  branch?: {
    id: string;
    name: string;
  } | null;
  createdAt: Date;
}

export default function AdminStaffManagement() {
  const [staff, setStaff] = useState<Staff[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);

  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<
    'ALL' | 'MANAGER' | 'SALES_ASSISTANT'
  >('ALL');

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<Staff | null>(null);

  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    role: 'SALES_ASSISTANT' as 'MANAGER' | 'SALES_ASSISTANT',
    branchId: '',
  });

  async function loadData() {
    const [staffResult, branchResult] = await Promise.all([
      getAllStaff(),
      getAllBranches(),
    ]);

    if (staffResult.success && staffResult.data) {
      setStaff(staffResult.data as Staff[]);
    } else {
      alert(staffResult.error);
    }

    if (branchResult.success && branchResult.data) {
      setBranches(
        branchResult.data
          .filter((branch) => branch.status === 'ACTIVE')
          .map((branch) => ({
            id: branch.id,
            name: branch.name,
            status: branch.status,
          })),
      );
    } else {
      alert(branchResult.error);
    }

    setIsLoading(false);
  }

  useEffect(() => {
    loadData();
  }, []);

  const filteredStaff = useMemo(() => {
    const query = searchQuery.toLowerCase();

    return staff.filter((person) => {
      const matchesSearch =
        `${person.firstName} ${person.lastName}`
          .toLowerCase()
          .includes(query) ||
        person.email.toLowerCase().includes(query) ||
        person.branch?.name?.toLowerCase().includes(query);

      const matchesRole = roleFilter === 'ALL' || person.role === roleFilter;

      return matchesSearch && matchesRole;
    });
  }, [staff, searchQuery, roleFilter]);

  const activeStaffCount = staff.filter(
    (person) => person.status === 'ACTIVE',
  ).length;

  const managerCount = staff.filter(
    (person) => person.role === 'MANAGER',
  ).length;

  const assistantCount = staff.filter(
    (person) => person.role === 'SALES_ASSISTANT',
  ).length;

  const openCreateModal = () => {
    setEditingStaff(null);

    setForm({
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      role: 'SALES_ASSISTANT',
      branchId: branches[0]?.id || '',
    });

    setIsModalOpen(true);
  };

  const openEditModal = (person: Staff) => {
    setEditingStaff(person);

    setForm({
      firstName: person.firstName,
      lastName: person.lastName,
      email: person.email,
      password: '',
      role: person.role,
      branchId: person.branchId || '',
    });

    setIsModalOpen(true);
  };

  const closeModal = () => {
    if (isSaving) return;

    setIsModalOpen(false);
    setEditingStaff(null);
  };

  const handleSaveStaff = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (isSaving) return;

    try {
      setIsSaving(true);

      if (editingStaff) {
        const result = await updateStaff(editingStaff.id, {
          firstName: form.firstName,
          lastName: form.lastName,
          email: form.email,
          role: form.role,
          branchId: form.branchId,
        });

        if (!result.success) {
          alert(result.error);
          return;
        }
      } else {
        if (!form.password) {
          alert('Please enter a password.');
          return;
        }

        const result = await createStaffAccount({
          firstName: form.firstName,
          lastName: form.lastName,
          email: form.email,
          passwordRaw: form.password,
          role: form.role,
          branchId: form.branchId,
        });

        if (!result.success) {
          alert(result.error);
          return;
        }
      }

      await loadData();

      setIsModalOpen(false);
      setEditingStaff(null);
    } catch (error) {
      console.error(error);
      alert('Failed to save staff member.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleStatus = async (person: Staff) => {
    const result = await toggleStaffStatus(person.id, person.status);

    if (!result.success) {
      alert(result.error);
      return;
    }

    setStaff((current) =>
      current.map((member) =>
        member.id === person.id
          ? {
              ...member,
              status: result.data?.status ?? member.status,
            }
          : member,
      ),
    );
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen bg-slate-50">
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto mb-4" />
            <p className="text-sm text-slate-500">Loading staff members...</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-slate-50">
      <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto">
          {/* HEADER */}
          <header className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8 border-b border-slate-200 pb-6">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
                Staff Management
              </h1>

              <p className="text-sm text-slate-500 mt-1">
                Manage managers and sales assistants across all branches.
              </p>
            </div>

            <button
              onClick={openCreateModal}
              className="inline-flex items-center justify-center rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 h-10 px-4 py-2 gap-2 text-sm font-medium shadow-sm"
            >
              <UserPlus size={18} />
              Add New Staff
            </button>
          </header>

          {/* KPI CARDS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 lg:gap-6 mb-8">
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
              <div className="bg-blue-50 p-3 rounded-lg text-blue-600">
                <Users size={24} />
              </div>

              <div>
                <p className="text-sm font-medium text-slate-500">
                  Total Employees
                </p>

                <h3 className="text-2xl font-bold">{staff.length}</h3>
              </div>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
              <div className="bg-emerald-50 p-3 rounded-lg text-emerald-600">
                <CheckCircle2 size={24} />
              </div>

              <div>
                <p className="text-sm font-medium text-slate-500">
                  Active Accounts
                </p>

                <h3 className="text-2xl font-bold">{activeStaffCount}</h3>
              </div>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
              <div className="bg-purple-50 p-3 rounded-lg text-purple-600">
                <Shield size={24} />
              </div>

              <div>
                <p className="text-sm font-medium text-slate-500">Managers</p>

                <h3 className="text-2xl font-bold">{managerCount}</h3>
              </div>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
              <div className="bg-orange-50 p-3 rounded-lg text-orange-600">
                <Users size={24} />
              </div>

              <div>
                <p className="text-sm font-medium text-slate-500">
                  Sales Assistants
                </p>

                <h3 className="text-2xl font-bold">{assistantCount}</h3>
              </div>
            </div>
          </div>

          {/* FILTERS */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm mb-6 flex flex-col md:flex-row gap-3">
            <div className="relative flex-1">
              <Search
                size={18}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search staff or branch..."
                className="w-full h-10 rounded-lg border border-slate-200 pl-10 pr-4 text-sm outline-none focus:border-indigo-500"
              />
            </div>

            <select
              value={roleFilter}
              onChange={(e) =>
                setRoleFilter(
                  e.target.value as 'ALL' | 'MANAGER' | 'SALES_ASSISTANT',
                )
              }
              className="h-10 rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-indigo-500"
            >
              <option value="ALL">All Roles</option>
              <option value="MANAGER">Managers</option>
              <option value="SALES_ASSISTANT">Sales Assistants</option>
            </select>
          </div>

          {/* TABLE */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-250">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="text-left px-6 py-4 text-xs font-bold uppercase text-slate-500">
                      Employee
                    </th>

                    <th className="text-left px-6 py-4 text-xs font-bold uppercase text-slate-500">
                      Role
                    </th>

                    <th className="text-left px-6 py-4 text-xs font-bold uppercase text-slate-500">
                      Branch
                    </th>

                    <th className="text-left px-6 py-4 text-xs font-bold uppercase text-slate-500">
                      Email
                    </th>

                    <th className="text-left px-6 py-4 text-xs font-bold uppercase text-slate-500">
                      Status
                    </th>

                    <th className="text-right px-6 py-4 text-xs font-bold uppercase text-slate-500">
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {filteredStaff.map((person) => (
                    <tr
                      key={person.id}
                      className="hover:bg-slate-50 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm bg-indigo-100 text-indigo-700">
                            {person.firstName.charAt(0)}
                            {person.lastName.charAt(0)}
                          </div>

                          <p className="font-bold text-slate-900">
                            {person.firstName} {person.lastName}
                          </p>
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1.5">
                          <Shield size={16} className="text-slate-400" />

                          <span className="font-medium text-slate-600">
                            {person.role === 'MANAGER'
                              ? 'Manager'
                              : 'Sales Assistant'}
                          </span>
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-slate-600">
                          <Building2 size={15} className="text-slate-400" />

                          {person.branch?.name || 'Unassigned'}
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-slate-600">
                          <Mail size={14} className="text-slate-400" />

                          <span className="text-xs font-medium">
                            {person.email}
                          </span>
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        {person.status === 'ACTIVE' ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700">
                            <CheckCircle2 size={13} />
                            Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-700">
                            <XCircle size={13} />
                            Suspended
                          </span>
                        )}
                      </td>

                      <td className="px-6 py-4">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => openEditModal(person)}
                            className="p-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100"
                          >
                            <Edit size={16} />
                          </button>

                          <button
                            onClick={() => handleToggleStatus(person)}
                            className={`px-3 py-2 rounded-lg text-xs font-bold ${
                              person.status === 'ACTIVE'
                                ? 'bg-rose-50 text-rose-600 hover:bg-rose-100'
                                : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'
                            }`}
                          >
                            {person.status === 'ACTIVE'
                              ? 'Suspend'
                              : 'Activate'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {filteredStaff.length === 0 && (
              <div className="py-16 text-center">
                <Users size={36} className="mx-auto text-slate-300 mb-3" />

                <p className="font-medium text-slate-600">
                  No staff members found.
                </p>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-xl overflow-hidden max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-200">
              <div>
                <h2 className="text-lg font-bold">
                  {editingStaff ? 'Edit Staff Member' : 'Add New Staff'}
                </h2>

                <p className="text-xs text-slate-500 mt-1">
                  Assign the staff member to a branch.
                </p>
              </div>

              <button
                onClick={closeModal}
                className="p-2 rounded-lg hover:bg-slate-100"
              >
                <X size={19} />
              </button>
            </div>

            <form onSubmit={handleSaveStaff} className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <input
                  required
                  placeholder="First name"
                  value={form.firstName}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      firstName: e.target.value,
                    })
                  }
                  className="h-11 border border-slate-200 rounded-lg px-3 text-sm outline-none focus:border-indigo-500"
                />

                <input
                  required
                  placeholder="Last name"
                  value={form.lastName}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      lastName: e.target.value,
                    })
                  }
                  className="h-11 border border-slate-200 rounded-lg px-3 text-sm outline-none focus:border-indigo-500"
                />
              </div>

              <input
                required
                type="email"
                placeholder="Email address"
                value={form.email}
                onChange={(e) =>
                  setForm({
                    ...form,
                    email: e.target.value,
                  })
                }
                className="w-full h-11 border border-slate-200 rounded-lg px-3 text-sm outline-none focus:border-indigo-500"
              />

              {!editingStaff && (
                <input
                  required
                  type="password"
                  minLength={6}
                  placeholder="Password"
                  value={form.password}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      password: e.target.value,
                    })
                  }
                  className="w-full h-11 border border-slate-200 rounded-lg px-3 text-sm outline-none focus:border-indigo-500"
                />
              )}

              {/* ROLE */}
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">
                  Role
                </label>

                <select
                  value={form.role}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      role: e.target.value as 'MANAGER' | 'SALES_ASSISTANT',
                    })
                  }
                  className="w-full h-11 border border-slate-200 rounded-lg px-3 text-sm outline-none focus:border-indigo-500"
                >
                  <option value="MANAGER">Manager</option>

                  <option value="SALES_ASSISTANT">Sales Assistant</option>
                </select>
              </div>

              {/* BRANCH */}
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">
                  Branch
                </label>

                <select
                  required
                  value={form.branchId}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      branchId: e.target.value,
                    })
                  }
                  className="w-full h-11 border border-slate-200 rounded-lg px-3 text-sm outline-none focus:border-indigo-500"
                >
                  <option value="">Select branch</option>

                  {branches.map((branch) => (
                    <option key={branch.id} value={branch.id}>
                      {branch.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2.5 rounded-lg border border-slate-200 text-sm font-medium"
                >
                  Cancel
                </button>

                <button
                  disabled={isSaving}
                  className="px-5 py-2.5 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 disabled:opacity-50"
                >
                  {isSaving
                    ? 'Saving...'
                    : editingStaff
                      ? 'Save Changes'
                      : 'Create Staff'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
