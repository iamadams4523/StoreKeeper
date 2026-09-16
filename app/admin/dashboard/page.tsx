// app/admin/dashboard/page.tsx

'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Building2,
  Users,
  Package,
  TrendingUp,
  CheckCircle2,
  XCircle,
  ArrowRight,
  ClipboardList,
} from 'lucide-react';

import AdminSidebar from '@/components/AdminSidebar';
import { getAdminDashboard } from '@/app/actions/admin';
import { getPendingActions } from '@/app/actions/approvals';

interface BranchOverview {
  id: string;
  name: string;
  status: 'ACTIVE' | 'INACTIVE';
  staffCount: number;
  productCount: number;
  orderCount: number;
  sales: number;
}

interface DashboardData {
  totalBranches: number;
  activeBranches: number;
  totalStaff: number;
  activeStaff: number;
  totalProducts: number;
  totalRevenue: number;
  totalInventoryValue: number;
  branches: BranchOverview[];
}

const formatCurrency = (value: number) =>
  `₦${value.toLocaleString('en-NG', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

export default function AdminDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [pendingCount, setPendingCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadDashboard() {
      const [dashboardResult, pendingResult] = await Promise.all([
        getAdminDashboard(),
        getPendingActions(),
      ]);

      if (dashboardResult.success && dashboardResult.data) {
        setData(dashboardResult.data);
      } else {
        alert(dashboardResult.error);
      }

      if (pendingResult.success && pendingResult.data) {
        setPendingCount(pendingResult.data.length);
      }
      // Silently ignore a failed pending-count fetch — it shouldn't
      // block the rest of the dashboard from rendering.

      setIsLoading(false);
    }

    loadDashboard();
  }, []);

  if (isLoading) {
    return (
      <div className="flex min-h-screen bg-slate-50">
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto mb-4" />
            <p className="text-sm text-slate-500">Loading admin dashboard...</p>
          </div>
        </main>
      </div>
    );
  }

  if (!data) {
    return null;
  }

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-900">
      <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <header className="mb-8 border-b border-slate-200 pb-6">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
              Admin Dashboard
            </h1>

            <p className="text-sm sm:text-base text-slate-500 mt-1">
              Overview of all branches, staff, sales and inventory.
            </p>
          </header>

          {/* KPI CARDS */}
          <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4 lg:gap-6 mb-8">
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
              <div className="bg-blue-50 p-3 rounded-lg text-blue-600">
                <Building2 size={24} />
              </div>

              <div>
                <p className="text-sm font-medium text-slate-500">
                  Total Branches
                </p>

                <h3 className="text-2xl font-bold">{data.totalBranches}</h3>

                <p className="text-xs text-emerald-600 mt-1">
                  {data.activeBranches} active
                </p>
              </div>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
              <div className="bg-purple-50 p-3 rounded-lg text-purple-600">
                <Users size={24} />
              </div>

              <div>
                <p className="text-sm font-medium text-slate-500">
                  Total Staff
                </p>

                <h3 className="text-2xl font-bold">{data.totalStaff}</h3>

                <p className="text-xs text-emerald-600 mt-1">
                  {data.activeStaff} active
                </p>
              </div>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
              <div className="bg-emerald-50 p-3 rounded-lg text-emerald-600">
                <TrendingUp size={24} />
              </div>

              <div>
                <p className="text-sm font-medium text-slate-500">
                  Overall Sales
                </p>

                <h3 className="text-xl sm:text-2xl font-bold">
                  {formatCurrency(data.totalRevenue)}
                </h3>
              </div>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
              <div className="bg-orange-50 p-3 rounded-lg text-orange-600">
                <Package size={24} />
              </div>

              <div>
                <p className="text-sm font-medium text-slate-500">
                  Inventory Value
                </p>

                <h3 className="text-xl sm:text-2xl font-bold">
                  {formatCurrency(data.totalInventoryValue)}
                </h3>
              </div>
            </div>

            {/* Pending approvals — links straight to the review queue */}
            <Link
              href="/admin/approvals"
              className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4 hover:border-indigo-300 hover:shadow-md transition-all group"
            >
              <div
                className={`p-3 rounded-lg ${
                  pendingCount > 0
                    ? 'bg-rose-50 text-rose-600'
                    : 'bg-slate-100 text-slate-500'
                }`}
              >
                <ClipboardList size={24} />
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-500">
                  Pending Approvals
                </p>

                <h3 className="text-2xl font-bold">{pendingCount}</h3>

                {pendingCount > 0 && (
                  <p className="text-xs text-rose-600 mt-1">Needs review</p>
                )}
              </div>

              <ArrowRight
                size={16}
                className="text-slate-300 group-hover:text-indigo-600 shrink-0"
              />
            </Link>
          </section>

          {/* BRANCH OVERVIEW */}
          <section className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-5 sm:p-6 border-b border-slate-200">
              <h2 className="text-lg font-bold">Branch Overview</h2>

              <p className="text-sm text-slate-500 mt-1">
                Performance and operational status across branches.
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[850px]">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="text-left px-6 py-4 text-xs font-bold uppercase text-slate-500">
                      Branch
                    </th>

                    <th className="text-left px-6 py-4 text-xs font-bold uppercase text-slate-500">
                      Status
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
                      Sales
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {data.branches.map((branch) => (
                    <tr
                      key={branch.id}
                      className="hover:bg-slate-50 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center">
                            <Building2 size={19} />
                          </div>

                          <span className="font-bold">{branch.name}</span>
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

                      <td className="px-6 py-4 font-medium">
                        {branch.staffCount}
                      </td>

                      <td className="px-6 py-4 font-medium">
                        {branch.productCount}
                      </td>

                      <td className="px-6 py-4 font-medium">
                        {branch.orderCount}
                      </td>

                      <td className="px-6 py-4 font-bold text-slate-900">
                        {formatCurrency(branch.sales)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {data.branches.length === 0 && (
              <div className="py-16 text-center">
                <Building2 size={40} className="mx-auto text-slate-300 mb-3" />

                <p className="font-medium text-slate-600">
                  No branches have been created yet.
                </p>
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}
