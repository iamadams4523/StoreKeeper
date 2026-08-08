'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Package,
  AlertTriangle,
  TrendingUp,
  Users,
  X,
  Clock,
  Download,
  ArrowDownLeft,
  Search,
} from 'lucide-react';
import AdminSidebar from '@/components/AdminSidebar';

// Import our new Server Actions
import { getAllProducts } from '@/app/actions/inventory';
import { getStoreKPIs, getRecentOrders } from '@/app/actions/analytics';

// --- Types ---
interface Product {
  id: string;
  sku: string;
  name: string;
  stock: number;
  threshold: number;
  price: number;
}

interface Sale {
  id: string;
  productName: string;
  assistantName: string;
  quantity: number;
  totalPrice: number;
  date: Date;
}

export default function AdminDashboard() {
  // --- Live State ---
  const [products, setProducts] = useState<Product[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [kpis, setKpis] = useState({ totalRevenue: 0, todaysRevenue: 0 });
  const [isLoading, setIsLoading] = useState(true);

  // --- State: Modals ---
  const [showLowStockModal, setShowLowStockModal] = useState(false);
  const [showTransactionModal, setShowTransactionModal] = useState(false);

  // --- Fetch Live Data on Mount ---
  useEffect(() => {
    async function loadDashboardData() {
      try {
        // Fetch everything in parallel for speed
        const [productsRes, kpiRes, ordersRes] = await Promise.all([
          getAllProducts(),
          getStoreKPIs(),
          getRecentOrders(),
        ]);

        if (productsRes.success && productsRes.data) {
          // Map DB fields to UI fields
          const mappedProducts = productsRes.data.map((p: any) => ({
            id: p.id,
            sku: p.sku,
            name: p.name,
            stock: p.stock,
            threshold: p.lowStockAlert,
            price: p.sellingPrice,
          }));
          setProducts(mappedProducts);
        }

        if (kpiRes.success && kpiRes.data) {
          setKpis({
            totalRevenue: kpiRes.data.totalRevenue,
            todaysRevenue: kpiRes.data.todaysRevenue,
          });
        }

        if (ordersRes.success && ordersRes.data) {
          // Flatten multi-item orders into single UI rows
          const flattenedSales: Sale[] = [];
          ordersRes.data.forEach((order: any) => {
            order.items.forEach((item: any) => {
              flattenedSales.push({
                id: `${order.id}-${item.productId}`, // Unique key
                productName: item.product.name,
                assistantName: `${order.staff.firstName} ${order.staff.lastName}`,
                quantity: item.quantity,
                totalPrice: item.price * item.quantity,
                date: new Date(order.createdAt),
              });
            });
          });
          setSales(flattenedSales);
        }
      } catch (error) {
        console.error('Failed to load dashboard data', error);
      } finally {
        setIsLoading(false);
      }
    }

    loadDashboardData();
  }, []);

  // --- Calculations for Main Dashboard ---
  const now = new Date();
  const startOfToday = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
  );

  const salesToday = sales.filter((s) => s.date >= startOfToday);
  const lowStockProducts = products.filter((p) => p.stock <= p.threshold);
  const lowStockCount = lowStockProducts.length;
  const activeStaffToday = new Set(salesToday.map((s) => s.assistantName)).size;

  // --- Fintech-Style Transaction Grouping Logic ---
  const groupedTransactions = useMemo(() => {
    const groups: Record<string, Sale[]> = {};
    const sortedSales = [...sales].sort(
      (a, b) => b.date.getTime() - a.date.getTime(),
    );

    sortedSales.forEach((sale) => {
      const saleDate = new Date(
        sale.date.getFullYear(),
        sale.date.getMonth(),
        sale.date.getDate(),
      );
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      let dateLabel = '';
      if (saleDate.getTime() === today.getTime()) {
        dateLabel = 'Today';
      } else if (saleDate.getTime() === yesterday.getTime()) {
        dateLabel = 'Yesterday';
      } else {
        dateLabel = saleDate.toLocaleDateString('en-GB', {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
        });
      }

      if (!groups[dateLabel]) groups[dateLabel] = [];
      groups[dateLabel].push(sale);
    });

    return groups;
  }, [sales, now]);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-emerald-500"></div>
          <p className="text-slate-500 font-medium">Syncing database...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-slate-50 text-slate-900 font-sans">
      <AdminSidebar />

      <main className="flex-1 overflow-y-auto p-8">
        {/* Top Header */}
        <header className="flex justify-between items-end mb-8 border-b border-slate-200 pb-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">
              Dashboard Overview
            </h1>
            <p className="text-slate-500 mt-1">
              Live updates from your sales assistants and inventory status.
            </p>
          </div>
          <button className="flex items-center gap-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-medium px-4 py-2 rounded-lg transition-colors shadow-sm text-sm">
            <Download size={16} />
            Export Daily Report
          </button>
        </header>

        {/* Key Metric Cards */}
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div
            onClick={() => setShowTransactionModal(true)}
            className="cursor-pointer bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col transition-all duration-200 hover:shadow-md hover:border-emerald-200 group"
          >
            <div className="flex justify-between items-start mb-4">
              <div className="bg-emerald-100 p-2.5 rounded-lg text-emerald-700 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                <TrendingUp size={20} />
              </div>
              <span className="text-xs font-medium text-slate-400 bg-slate-100 px-2 py-1 rounded-full">
                Today
              </span>
            </div>
            <p className="text-sm text-slate-500 font-medium">Revenue Today</p>
            <h3 className="text-3xl font-bold mt-1 text-slate-900">
              ₦
              {kpis.todaysRevenue.toLocaleString(undefined, {
                minimumFractionDigits: 2,
              })}
            </h3>
            <p className="text-xs text-emerald-600 mt-2 font-medium">
              View Transaction History →
            </p>
          </div>

          <div
            onClick={() => setShowLowStockModal(true)}
            className={`cursor-pointer p-6 rounded-xl border shadow-sm flex flex-col transition-all duration-200 hover:shadow-md group ${
              lowStockCount > 0
                ? 'border-amber-200 bg-amber-50/30'
                : 'bg-white border-slate-200'
            }`}
          >
            <div className="flex justify-between items-start mb-4">
              <div
                className={`p-2.5 rounded-lg transition-colors ${lowStockCount > 0 ? 'bg-amber-100 text-amber-700 group-hover:bg-amber-500 group-hover:text-white' : 'bg-slate-100 text-slate-500'}`}
              >
                <AlertTriangle size={20} />
              </div>
              <span className="text-xs font-medium text-slate-400 bg-slate-100 px-2 py-1 rounded-full">
                Action Needed
              </span>
            </div>
            <p className="text-sm text-slate-500 font-medium">
              Low Stock Items
            </p>
            <h3
              className={`text-3xl font-bold mt-1 ${lowStockCount > 0 ? 'text-amber-700' : 'text-slate-900'}`}
            >
              {lowStockCount}
            </h3>
            <p className="text-xs text-amber-600 mt-2 font-medium">
              Click to review goods →
            </p>
          </div>

          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col">
            <div className="flex justify-between items-start mb-4">
              <div className="bg-indigo-100 p-2.5 rounded-lg text-indigo-700">
                <Package size={20} />
              </div>
              <span className="text-xs font-medium text-slate-400 bg-slate-100 px-2 py-1 rounded-full">
                Catalog
              </span>
            </div>
            <p className="text-sm text-slate-500 font-medium">Total Products</p>
            <h3 className="text-3xl font-bold mt-1 text-slate-900">
              {products.length}
            </h3>
            <p className="text-xs text-slate-400 mt-2 font-medium">
              Manage in Inventory Tab
            </p>
          </div>

          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col">
            <div className="flex justify-between items-start mb-4">
              <div className="bg-blue-100 p-2.5 rounded-lg text-blue-700">
                <Users size={20} />
              </div>
              <span className="text-xs font-medium text-slate-400 bg-slate-100 px-2 py-1 rounded-full">
                Staff
              </span>
            </div>
            <p className="text-sm text-slate-500 font-medium">
              Active Assistants
            </p>
            <h3 className="text-3xl font-bold mt-1 text-slate-900">
              {activeStaffToday}
            </h3>
            <p className="text-xs text-slate-400 mt-2 font-medium">
              Selling today
            </p>
          </div>
        </section>

        {/* Live Incoming Sales Feed */}
        <section className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-5 border-b border-slate-200 flex items-center justify-between">
            <div>
              <h2 className="font-bold text-slate-800 text-lg flex items-center gap-2">
                Live Sales Feed
                <span className="relative flex h-3 w-3 ml-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                </span>
              </h2>
            </div>
            <span className="text-xs font-semibold bg-slate-100 text-slate-600 px-3 py-1.5 rounded-full">
              {salesToday.length} Transactions Today
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  <th className="px-6 py-4">Time</th>
                  <th className="px-6 py-4">Product Sold</th>
                  <th className="px-6 py-4">Handled By</th>
                  <th className="px-6 py-4 text-center">Qty</th>
                  <th className="px-6 py-4 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {salesToday.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-6 py-12 text-center text-slate-400"
                    >
                      Waiting for transactions...
                    </td>
                  </tr>
                ) : (
                  salesToday
                    .sort((a, b) => b.date.getTime() - a.date.getTime())
                    .map((sale) => (
                      <tr
                        key={sale.id}
                        className="hover:bg-slate-50 transition-colors"
                      >
                        <td className="px-6 py-4 text-slate-500 text-xs whitespace-nowrap font-mono flex items-center gap-1.5">
                          <Clock size={14} className="text-slate-400" />
                          {sale.date.toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </td>
                        <td className="px-6 py-4 font-medium text-slate-900">
                          {sale.productName}
                        </td>
                        <td className="px-6 py-4 text-slate-600">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-xs font-bold">
                              {sale.assistantName.charAt(0)}
                            </div>
                            {sale.assistantName}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center font-semibold text-slate-700">
                          {sale.quantity}
                        </td>
                        <td className="px-6 py-4 text-right font-bold text-emerald-600">
                          +₦{sale.totalPrice.toFixed(2)}
                        </td>
                      </tr>
                    ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      </main>

      {/* ================= MODALS ================= */}

      {/* Dynamic Low Stock Modal */}
      {showLowStockModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-2xl w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-amber-50">
              <div>
                <h3 className="font-bold text-lg text-amber-900 flex items-center gap-2">
                  <AlertTriangle size={20} className="text-amber-600" />
                  Inventory Alerts
                </h3>
                <p className="text-xs text-amber-700 mt-1">
                  Products at or below minimum threshold
                </p>
              </div>
              <button
                onClick={() => setShowLowStockModal(false)}
                className="text-amber-600 hover:bg-amber-100 p-1.5 rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            <div className="max-h-96 overflow-y-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50 sticky top-0 border-b border-slate-200 shadow-sm">
                  <tr className="text-xs font-semibold text-slate-500 uppercase">
                    <th className="px-6 py-3">Product Name</th>
                    <th className="px-6 py-3">Current Stock</th>
                    <th className="px-6 py-3">Threshold Restock Point</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {lowStockProducts.length === 0 ? (
                    <tr>
                      <td
                        colSpan={3}
                        className="px-6 py-10 text-center text-slate-500"
                      >
                        Healthy Inventory! All products are sufficiently
                        stocked.
                      </td>
                    </tr>
                  ) : (
                    lowStockProducts.map((p) => (
                      <tr key={p.id} className="hover:bg-slate-50">
                        <td className="px-6 py-4 font-medium text-slate-900">
                          {p.name}{' '}
                          <span className="text-xs text-slate-400 block font-normal">
                            {p.sku}
                          </span>
                        </td>
                        <td className="px-6 py-4 font-bold text-amber-600 flex items-center gap-2">
                          {p.stock}
                          {p.stock === 0 && (
                            <span className="text-[10px] bg-rose-100 text-rose-700 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">
                              Out
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-slate-500 font-mono">
                          {p.threshold}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* FINTECH-STYLE TRANSACTION HISTORY MODAL */}
      {showTransactionModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 sm:justify-end sm:p-0">
          <div className="bg-slate-50 shadow-2xl sm:max-w-md w-full h-[85vh] sm:h-screen overflow-hidden flex flex-col rounded-2xl sm:rounded-none animate-in slide-in-from-bottom-10 sm:slide-in-from-right-10 duration-200">
            <div className="px-5 py-4 bg-white flex justify-between items-center sticky top-0 z-10 border-b border-slate-100">
              <h3 className="font-bold text-lg text-slate-900">
                Transaction History
              </h3>
              <div className="flex items-center gap-2">
                <button className="text-slate-400 hover:text-slate-600 p-2 rounded-full hover:bg-slate-100 transition-colors">
                  <Search size={18} />
                </button>
                <button
                  onClick={() => setShowTransactionModal(false)}
                  className="text-slate-400 hover:text-slate-600 p-2 rounded-full hover:bg-slate-100 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            <div className="bg-emerald-600 px-6 py-8 text-white flex flex-col items-center justify-center shrink-0">
              <span className="text-emerald-100 text-sm font-medium mb-1">
                Total All-Time Revenue
              </span>
              <span className="text-4xl font-black tracking-tight">
                ₦{kpis.totalRevenue.toFixed(2)}
              </span>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-6">
              {Object.entries(groupedTransactions).map(
                ([dateLabel, daySales]) => (
                  <div key={dateLabel}>
                    <div className="flex items-center justify-between mb-3 px-1">
                      <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                        {dateLabel}
                      </h4>
                      <span className="text-xs font-medium text-slate-400">
                        ₦
                        {daySales
                          .reduce((sum, s) => sum + s.totalPrice, 0)
                          .toFixed(2)}
                      </span>
                    </div>
                    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                      {daySales.map((sale, idx) => (
                        <div
                          key={sale.id}
                          className={`p-4 flex items-center justify-between hover:bg-slate-50 transition-colors cursor-default ${idx !== daySales.length - 1 ? 'border-b border-slate-50' : ''}`}
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
                              <ArrowDownLeft size={20} strokeWidth={2.5} />
                            </div>
                            <div>
                              <p className="text-sm font-bold text-slate-900 line-clamp-1">
                                {sale.productName}
                              </p>
                              <p className="text-xs text-slate-500 mt-0.5">
                                {sale.date.toLocaleTimeString([], {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}{' '}
                                • {sale.assistantName}
                              </p>
                            </div>
                          </div>
                          <div className="text-right shrink-0 ml-4">
                            <p className="text-sm font-bold text-emerald-600">
                              +₦{sale.totalPrice.toFixed(2)}
                            </p>
                            <p className="text-xs text-slate-400 mt-0.5">
                              Qty: {sale.quantity}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ),
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
