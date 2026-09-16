'use client';

import React, { useEffect, useMemo, useState } from 'react';

import {
  Building2,
  Plus,
  Search,
  Edit,
  CheckCircle2,
  XCircle,
  Users,
  Package,
  ShoppingCart,
  X,
} from 'lucide-react';

import AdminSidebar from '@/components/AdminSidebar';

import {
  getAllBranches,
  createBranch,
  updateBranch,
  toggleBranchStatus,
} from '@/app/actions/branch';

interface Branch {
  id: string;
  name: string;
  address: string | null;
  phone: string | null;
  email: string | null;
  status: 'ACTIVE' | 'INACTIVE';
  createdAt: Date;
  updatedAt: Date;

  _count: {
    users: number;
    products: number;
    orders: number;
  };
}

export default function BranchManagement() {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBranch, setEditingBranch] = useState<Branch | null>(null);

  const [form, setForm] = useState({
    name: '',
    address: '',
    phone: '',
    email: '',
  });

  async function loadBranches() {
    const result = await getAllBranches();

    if (result.success && result.data) {
      setBranches(result.data as Branch[]);
    } else {
      alert(result.error);
    }

    setIsLoading(false);
  }

  useEffect(() => {
    loadBranches();
  }, []);

  const filteredBranches = useMemo(() => {
    const query = searchQuery.toLowerCase();

    return branches.filter(
      (branch) =>
        branch.name.toLowerCase().includes(query) ||
        branch.address?.toLowerCase().includes(query) ||
        branch.email?.toLowerCase().includes(query),
    );
  }, [branches, searchQuery]);

  const openCreateModal = () => {
    setEditingBranch(null);

    setForm({
      name: '',
      address: '',
      phone: '',
      email: '',
    });

    setIsModalOpen(true);
  };

  const openEditModal = (branch: Branch) => {
    setEditingBranch(branch);

    setForm({
      name: branch.name,
      address: branch.address || '',
      phone: branch.phone || '',
      email: branch.email || '',
    });

    setIsModalOpen(true);
  };

  const closeModal = () => {
    if (isSaving) return;

    setIsModalOpen(false);
    setEditingBranch(null);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (isSaving) return;

    try {
      setIsSaving(true);

      const result = editingBranch
        ? await updateBranch(editingBranch.id, form)
        : await createBranch(form);

      if (!result.success) {
        alert(result.error);
        return;
      }

      await loadBranches();

      setIsModalOpen(false);
      setEditingBranch(null);
    } catch (error) {
      console.error(error);
      alert('Failed to save branch.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleStatus = async (branch: Branch) => {
    const result = await toggleBranchStatus(branch.id, branch.status);

    if (!result.success) {
      alert(result.error);
      return;
    }

    setBranches((current) =>
      current.map((item) =>
        item.id === branch.id
          ? {
              ...item,
              status: result.data?.status ?? item.status,
            }
          : item,
      ),
    );
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen bg-slate-50">
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto mb-4" />
            <p className="text-sm text-slate-500">Loading branches...</p>
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
                Branch Management
              </h1>

              <p className="text-sm text-slate-500 mt-1">
                Create and manage your store branches.
              </p>
            </div>

            <button
              onClick={openCreateModal}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 h-10 px-4 font-medium shadow-sm"
            >
              <Plus size={18} />
              Add New Branch
            </button>
          </header>

          {/* SEARCH */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 mb-6">
            <div className="relative max-w-md">
              <Search
                size={18}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search branches..."
                className="w-full h-10 rounded-lg border border-slate-200 pl-10 pr-4 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
              />
            </div>
          </div>

          {/* TABLE */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-225">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="text-left px-6 py-4 text-xs font-bold uppercase text-slate-500">
                      Branch
                    </th>

                    <th className="text-left px-6 py-4 text-xs font-bold uppercase text-slate-500">
                      Contact
                    </th>

                    <th className="text-left px-6 py-4 text-xs font-bold uppercase text-slate-500">
                      Staff
                    </th>

                    <th className="text-left px-6 py-4 text-xs font-bold uppercase text-slate-500">
                      Products
                    </th>

                    <th className="text-left px-6 py-4 text-xs font-bold uppercase text-slate-500">
                      Orders
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
                  {filteredBranches.map((branch) => (
                    <tr
                      key={branch.id}
                      className="hover:bg-slate-50 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center">
                            <Building2 size={19} />
                          </div>

                          <div>
                            <p className="font-bold text-slate-900">
                              {branch.name}
                            </p>

                            <p className="text-xs text-slate-500">
                              {branch.address || 'No address provided'}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <div className="text-sm">
                          <p className="text-slate-700">
                            {branch.phone || 'No phone'}
                          </p>

                          <p className="text-xs text-slate-500">
                            {branch.email || 'No email'}
                          </p>
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-slate-600">
                          <Users size={15} />
                          {branch._count.users}
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-slate-600">
                          <Package size={15} />
                          {branch._count.products}
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-slate-600">
                          <ShoppingCart size={15} />
                          {branch._count.orders}
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        {branch.status === 'ACTIVE' ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700">
                            <CheckCircle2 size={13} />
                            Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-700">
                            <XCircle size={13} />
                            Inactive
                          </span>
                        )}
                      </td>

                      <td className="px-6 py-4">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => openEditModal(branch)}
                            className="p-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100"
                            title="Edit branch"
                          >
                            <Edit size={16} />
                          </button>

                          <button
                            onClick={() => handleToggleStatus(branch)}
                            className={`px-3 py-2 rounded-lg text-xs font-bold ${
                              branch.status === 'ACTIVE'
                                ? 'bg-rose-50 text-rose-600 hover:bg-rose-100'
                                : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'
                            }`}
                          >
                            {branch.status === 'ACTIVE'
                              ? 'Deactivate'
                              : 'Activate'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {filteredBranches.length === 0 && (
              <div className="py-16 text-center">
                <Building2 size={36} className="mx-auto text-slate-300 mb-3" />

                <p className="font-medium text-slate-600">No branches found.</p>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-xl overflow-hidden">
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-200">
              <div>
                <h2 className="text-lg font-bold">
                  {editingBranch ? 'Edit Branch' : 'Add New Branch'}
                </h2>

                <p className="text-xs text-slate-500 mt-1">
                  Enter the branch information below.
                </p>
              </div>

              <button
                onClick={closeModal}
                className="p-2 rounded-lg hover:bg-slate-100"
              >
                <X size={19} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <input
                required
                placeholder="Branch name"
                value={form.name}
                onChange={(e) =>
                  setForm({
                    ...form,
                    name: e.target.value,
                  })
                }
                className="w-full h-11 border border-slate-200 rounded-lg px-3 text-sm outline-none focus:border-indigo-500"
              />

              <input
                placeholder="Address"
                value={form.address}
                onChange={(e) =>
                  setForm({
                    ...form,
                    address: e.target.value,
                  })
                }
                className="w-full h-11 border border-slate-200 rounded-lg px-3 text-sm outline-none focus:border-indigo-500"
              />

              <input
                placeholder="Phone number"
                value={form.phone}
                onChange={(e) =>
                  setForm({
                    ...form,
                    phone: e.target.value,
                  })
                }
                className="w-full h-11 border border-slate-200 rounded-lg px-3 text-sm outline-none focus:border-indigo-500"
              />

              <input
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
                    : editingBranch
                      ? 'Save Changes'
                      : 'Create Branch'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
