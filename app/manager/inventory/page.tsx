'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Search,
  Plus,
  Edit2,
  Trash2,
  Package,
  TrendingUp,
  DollarSign,
  X,
} from 'lucide-react';

import {
  getAllProducts,
  createProduct,
  updateProduct,
  deleteProduct,
} from '@/app/actions/inventory';

interface Product {
  id: string;
  sku: string;
  name: string;
  category: string;
  stock: number;
  lowStockAlert: number;
  costPrice: number;
  sellingPrice: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export default function InventoryPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Fetch inventory
  useEffect(() => {
    async function fetchInventory() {
      try {
        const result = await getAllProducts();

        if (result.success) {
          setProducts(result.data ?? []);
        } else {
          console.error(result.error);
          setProducts([]);
        }
      } catch (error) {
        console.error('Failed to fetch products:', error);
        setProducts([]);
      } finally {
        setIsLoading(false);
      }
    }

    fetchInventory();
  }, []);

  // Filter products
  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const query = searchQuery.toLowerCase();

      const matchesSearch =
        product.name.toLowerCase().includes(query) ||
        product.sku.toLowerCase().includes(query);

      const matchesCategory =
        categoryFilter === 'All' || product.category === categoryFilter;

      return matchesSearch && matchesCategory;
    });
  }, [products, searchQuery, categoryFilter]);

  // Analytics
  const totalCostValue = useMemo(
    () => products.reduce((acc, curr) => acc + curr.costPrice * curr.stock, 0),
    [products],
  );

  const potentialRevenue = useMemo(
    () =>
      products.reduce((acc, curr) => acc + curr.sellingPrice * curr.stock, 0),
    [products],
  );

  // Categories
  const categories = [
    'All',
    ...Array.from(new Set(products.map((p) => p.category))),
  ];

  // Open add modal
  const handleOpenAdd = () => {
    setEditingProduct(null);
    setIsModalOpen(true);
  };

  // Open edit modal
  const handleOpenEdit = (product: Product) => {
    setEditingProduct(product);
    setIsModalOpen(true);
  };

  // Save product
  const handleSaveProduct = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const formData = new FormData(e.currentTarget);

    try {
      let saveResult;

      if (editingProduct) {
        saveResult = await updateProduct(editingProduct.id, formData);
      } else {
        saveResult = await createProduct(formData);
      }

      if (!saveResult.success) {
        alert(saveResult.error);
        return;
      }

      const result = await getAllProducts();

      if (result.success) {
        setProducts(result.data ?? []);
      } else {
        console.error(result.error);
      }

      setIsModalOpen(false);
    } catch (error) {
      console.error('Error saving product:', error);
      alert('Failed to save product. Please try again.');
    }
  };

  // Delete product
  const handleDelete = async (id: string) => {
    if (
      !confirm(
        'Are you sure you want to delete this product? This action cannot be undone.',
      )
    ) {
      return;
    }

    try {
      const deleteResult = await deleteProduct(id);

      if (!deleteResult.success) {
        alert(deleteResult.error);
        return;
      }

      const result = await getAllProducts();

      if (result.success) {
        setProducts(result.data ?? []);
      } else {
        console.error(result.error);
      }
    } catch (error) {
      console.error('Error deleting product:', error);
      alert('Failed to delete product.');
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="h-10 w-10 sm:h-12 sm:w-12 animate-spin rounded-full border-4 border-slate-200 border-b-indigo-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <main className="w-full px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        <div className="mx-auto w-full max-w-7xl space-y-6 sm:space-y-8">
          {/* ================= HEADER ================= */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
                Inventory Management
              </h1>

              <p className="mt-1 text-sm sm:text-base text-slate-500">
                Manage your store&apos;s products, stock, and pricing.
              </p>
            </div>

            <button
              type="button"
              onClick={handleOpenAdd}
              className="inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
            >
              <Plus className="h-4 w-4" />
              Add Product
            </button>
          </div>

          {/* ================= ANALYTICS ================= */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 sm:gap-6">
            {/* Total Items */}
            <div className="flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
              <div className="shrink-0 rounded-lg bg-indigo-50 p-3 text-indigo-600">
                <Package className="h-5 w-5 sm:h-6 sm:w-6" />
              </div>

              <div className="min-w-0">
                <p className="text-sm font-medium text-slate-500">
                  Total Items
                </p>

                <p className="mt-1 text-xl sm:text-2xl font-bold text-slate-900">
                  {products.length}
                </p>
              </div>
            </div>

            {/* Total Cost */}
            <div className="flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
              <div className="shrink-0 rounded-lg bg-red-50 p-3 text-red-600">
                <TrendingUp className="h-5 w-5 sm:h-6 sm:w-6" />
              </div>

              <div className="min-w-0">
                <p className="text-sm font-medium text-slate-500">
                  Total Cost Value
                </p>

                <p className="mt-1 truncate text-xl sm:text-2xl font-bold text-slate-900">
                  ₦{totalCostValue.toFixed(2)}
                </p>
              </div>
            </div>

            {/* Potential Revenue */}
            <div className="flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
              <div className="shrink-0 rounded-lg bg-green-50 p-3 text-green-600">
                <DollarSign className="h-5 w-5 sm:h-6 sm:w-6" />
              </div>

              <div className="min-w-0">
                <p className="text-sm font-medium text-slate-500">
                  Potential Revenue
                </p>

                <p className="mt-1 truncate text-xl sm:text-2xl font-bold text-slate-900">
                  ₦{potentialRevenue.toFixed(2)}
                </p>
              </div>
            </div>
          </div>

          {/* ================= FILTERS ================= */}
          <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
            {/* Search */}
            <div className="relative w-full sm:max-w-md">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

              <input
                type="text"
                placeholder="Search by name or SKU..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white py-2.5 pl-10 pr-4 text-sm text-slate-900 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>

            {/* Category */}
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full sm:w-auto rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-700 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
            >
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* ================= TABLE ================= */}
          {/* ================= TABLE ================= */}
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="max-h-125 overflow-auto">
              <table className="w-full min-w-190 border-collapse text-left">
                <thead className="sticky top-0 z-10">
                  <tr className="border-b border-slate-200 bg-slate-50 text-xs text-slate-500 sm:text-sm">
                    <th className="px-4 py-3 font-medium sm:px-6 sm:py-4">
                      Product
                    </th>

                    <th className="px-4 py-3 font-medium sm:px-6 sm:py-4">
                      Category
                    </th>

                    <th className="px-4 py-3 font-medium sm:px-6 sm:py-4">
                      Cost Price
                    </th>

                    <th className="px-4 py-3 font-medium sm:px-6 sm:py-4">
                      Selling Price
                    </th>

                    <th className="px-4 py-3 font-medium sm:px-6 sm:py-4">
                      Stock
                    </th>

                    <th className="px-4 py-3 text-right font-medium sm:px-6 sm:py-4">
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-200">
                  {filteredProducts.length === 0 ? (
                    <tr>
                      <td
                        colSpan={6}
                        className="px-6 py-12 text-center text-sm text-slate-500"
                      >
                        No products found matching your search.
                      </td>
                    </tr>
                  ) : (
                    filteredProducts.map((product) => (
                      <tr
                        key={product.id}
                        className="transition-colors hover:bg-slate-50"
                      >
                        {/* Product */}
                        <td className="px-4 py-4 sm:px-6">
                          <p className="font-medium text-slate-900">
                            {product.name}
                          </p>

                          <p className="mt-0.5 text-xs text-slate-500">
                            SKU: {product.sku}
                          </p>
                        </td>

                        {/* Category */}
                        <td className="px-4 py-4 sm:px-6">
                          <span className="inline-flex rounded-md bg-slate-100 px-2 py-1 text-xs font-medium text-slate-700">
                            {product.category}
                          </span>
                        </td>

                        {/* Cost Price */}
                        <td className="px-4 py-4 text-sm text-slate-600 sm:px-6">
                          ₦{product.costPrice.toFixed(2)}
                        </td>

                        {/* Selling Price */}
                        <td className="px-4 py-4 text-sm font-medium text-slate-900 sm:px-6">
                          ₦{product.sellingPrice.toFixed(2)}
                        </td>

                        {/* Stock */}
                        <td className="px-4 py-4 sm:px-6">
                          <div className="flex items-center gap-2">
                            <span className="w-8 text-sm font-medium text-slate-900">
                              {product.stock}
                            </span>

                            <div className="h-2 w-16 overflow-hidden rounded-full bg-slate-200">
                              <div
                                className={`h-full rounded-full transition-all ${
                                  product.stock > 20
                                    ? 'bg-green-500'
                                    : product.stock > 5
                                      ? 'bg-yellow-500'
                                      : 'bg-red-500'
                                }`}
                                style={{
                                  width: `${Math.min(product.stock, 100)}%`,
                                }}
                              />
                            </div>
                          </div>
                        </td>

                        {/* Actions */}
                        <td className="px-4 py-4 text-right sm:px-6">
                          <div className="flex justify-end gap-1">
                            <button
                              type="button"
                              onClick={() => handleOpenEdit(product)}
                              aria-label={`Edit ${product.name}`}
                              className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-indigo-50 hover:text-indigo-600"
                            >
                              <Edit2 className="h-4 w-4" />
                            </button>

                            <button
                              type="button"
                              onClick={() => handleDelete(product.id)}
                              aria-label={`Delete ${product.name}`}
                              className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600"
                            >
                              <Trash2 className="h-4 w-4" />
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

      {/* ================= ADD / EDIT MODAL ================= */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center overflow-y-auto bg-black/50 p-3 sm:p-4">
          <div className="my-auto w-full max-w-md overflow-hidden rounded-xl bg-white shadow-2xl">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 p-4 sm:p-6">
              <h2 className="text-lg sm:text-xl font-bold text-slate-900">
                {editingProduct ? 'Edit Product' : 'Add New Product'}
              </h2>

              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                aria-label="Close modal"
                className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form
              onSubmit={handleSaveProduct}
              className="max-h-[80vh] overflow-y-auto p-4 sm:p-6"
            >
              <div className="space-y-4">
                {/* Product Name */}
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-700">
                    Product Name
                  </label>

                  <input
                    type="text"
                    name="name"
                    defaultValue={editingProduct?.name || ''}
                    required
                    className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>

                {/* SKU + Category */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-slate-700">
                      SKU
                    </label>

                    <input
                      type="text"
                      name="sku"
                      defaultValue={editingProduct?.sku || ''}
                      required
                      className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-slate-700">
                      Category
                    </label>

                    <input
                      type="text"
                      name="category"
                      defaultValue={editingProduct?.category || ''}
                      required
                      className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                    />
                  </div>
                </div>

                {/* Cost + Selling Price */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-slate-700">
                      Cost Price (₦)
                    </label>

                    <input
                      type="number"
                      step="0.01"
                      name="costPrice"
                      defaultValue={editingProduct?.costPrice || ''}
                      required
                      className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-slate-700">
                      Selling Price (₦)
                    </label>

                    <input
                      type="number"
                      step="0.01"
                      name="sellingPrice"
                      defaultValue={editingProduct?.sellingPrice || ''}
                      required
                      className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                    />
                  </div>
                </div>

                {/* Stock */}
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-700">
                    Initial Stock
                  </label>

                  <input
                    type="number"
                    name="stock"
                    defaultValue={editingProduct?.stock || ''}
                    required
                    className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>

                {/* Low Stock Alert */}
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-700">
                    Low Stock Alert
                  </label>

                  <input
                    type="number"
                    name="lowStockAlert"
                    min="0"
                    defaultValue={editingProduct?.lowStockAlert ?? 5}
                    required
                    className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>

                {/* Buttons */}
                <div className="flex flex-col-reverse gap-3 pt-3 sm:flex-row">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="flex-1 rounded-lg bg-slate-100 px-4 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-200"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    className="flex-1 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                  >
                    {editingProduct ? 'Save Changes' : 'Add Product'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
