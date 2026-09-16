'use client';

import React, { useEffect, useState } from 'react';
import {
  Building2,
  Package,
  LayoutDashboard,
  ShoppingCart,
  ArrowRight,
} from 'lucide-react';
import { useRouter } from 'next/navigation';

import AdminSidebar from '@/components/AdminSidebar';
import { getAllBranches } from '@/app/actions/branch';

interface Branch {
  id: string;
  name: string;
  address: string | null;
  status: 'ACTIVE' | 'INACTIVE';
}

export default function BranchOperations() {
  const router = useRouter();

  const [branches, setBranches] = useState<Branch[]>([]);
  const [selectedBranch, setSelectedBranch] = useState('');

  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadBranches() {
      const result = await getAllBranches();

      if (result.success && result.data) {
        setBranches(
          result.data.filter(
            (branch) => branch.status === 'ACTIVE',
          ) as Branch[],
        );
      } else {
        alert(result.error);
      }

      setIsLoading(false);
    }

    loadBranches();
  }, []);

  const openOperation = (path: string) => {
    if (!selectedBranch) {
      alert('Please select a branch first.');
      return;
    }

    router.push(`${path}?branchId=${encodeURIComponent(selectedBranch)}`);
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
        <div className="max-w-5xl mx-auto">
          <header className="mb-8 border-b border-slate-200 pb-6">
            <h1 className="text-2xl sm:text-3xl font-bold">
              Branch Operations
            </h1>

            <p className="text-sm text-slate-500 mt-1">
              Select a branch to access its operational systems.
            </p>
          </header>

          {/* BRANCH SELECTOR */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 mb-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 rounded-lg bg-indigo-50 text-indigo-600">
                <Building2 size={22} />
              </div>

              <div>
                <h2 className="font-bold text-slate-900">Select Branch</h2>

                <p className="text-sm text-slate-500">
                  Choose the branch you want to operate.
                </p>
              </div>
            </div>

            <select
              value={selectedBranch}
              onChange={(e) => setSelectedBranch(e.target.value)}
              className="w-full h-12 border border-slate-200 rounded-lg px-4 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
            >
              <option value="">Select a branch...</option>

              {branches.map((branch) => (
                <option key={branch.id} value={branch.id}>
                  {branch.name}
                </option>
              ))}
            </select>
          </div>

          {/* OPERATIONS */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <button
              onClick={() => openOperation('/manager')}
              className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm text-left hover:border-indigo-300 hover:shadow-md transition-all group"
            >
              <div className="flex justify-between items-start">
                <div className="p-3 rounded-lg bg-indigo-50 text-indigo-600">
                  <LayoutDashboard size={24} />
                </div>

                <ArrowRight
                  size={18}
                  className="text-slate-300 group-hover:text-indigo-600"
                />
              </div>

              <h3 className="font-bold text-lg mt-5">Manager Dashboard</h3>

              <p className="text-sm text-slate-500 mt-1">
                View this branch's dashboard and performance.
              </p>
            </button>

            <button
              onClick={() => openOperation('/admin/inventory')}
              className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm text-left hover:border-indigo-300 hover:shadow-md transition-all group"
            >
              <div className="flex justify-between items-start">
                <div className="p-3 rounded-lg bg-emerald-50 text-emerald-600">
                  <Package size={24} />
                </div>

                <ArrowRight
                  size={18}
                  className="text-slate-300 group-hover:text-indigo-600"
                />
              </div>

              <h3 className="font-bold text-lg mt-5">Branch Inventory</h3>

              <p className="text-sm text-slate-500 mt-1">
                Manage products and stock for this branch.
              </p>
            </button>

            <button
              onClick={() => openOperation('/pos')}
              className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm text-left hover:border-indigo-300 hover:shadow-md transition-all group"
            >
              <div className="flex justify-between items-start">
                <div className="p-3 rounded-lg bg-orange-50 text-orange-600">
                  <ShoppingCart size={24} />
                </div>

                <ArrowRight
                  size={18}
                  className="text-slate-300 group-hover:text-indigo-600"
                />
              </div>

              <h3 className="font-bold text-lg mt-5">Branch POS</h3>

              <p className="text-sm text-slate-500 mt-1">
                Process sales for the selected branch.
              </p>
            </button>
          </div>

          {branches.length === 0 && (
            <div className="bg-white border border-slate-200 rounded-xl p-10 text-center mt-6">
              <Building2 size={40} className="mx-auto text-slate-300 mb-3" />

              <p className="font-medium text-slate-600">
                No active branches are available.
              </p>

              <button
                onClick={() => router.push('/admin/branchManagement')}
                className="mt-4 text-sm font-medium text-indigo-600 hover:text-indigo-700"
              >
                Create a branch
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
