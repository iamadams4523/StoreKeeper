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
// Replace with your actual sidebar import path
import AdminSidebar from '@/components/AdminSidebar';
import {
  getAllProducts,
  createProduct,
  updateProduct,
  deleteProduct,
} from '@/app/actions/inventory';

// Matches the Prisma schema
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

  // Fetch data on mount
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
      } finally {
        setIsLoading(false);
      }
    }
    fetchInventory();
  }, []);

  // Filter products using useMemo for performance
  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const matchesSearch =
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.sku.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory =
        categoryFilter === 'All' || product.category === categoryFilter;
      return matchesSearch && matchesCategory;
    });
  }, [products, searchQuery, categoryFilter]);

  // Analytics calculations
  const totalCostValue = useMemo(
    () => products.reduce((acc, curr) => acc + curr.costPrice * curr.stock, 0),
    [products],
  );

  const potentialRevenue = useMemo(
    () =>
      products.reduce((acc, curr) => acc + curr.sellingPrice * curr.stock, 0),
    [products],
  );

  // Categories for the dropdowns
  const categories = [
    'All',
    ...Array.from(new Set(products.map((p) => p.category))),
  ];

  // Form Handlers
  const handleOpenAdd = () => {
    setEditingProduct(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (product: Product) => {
    setEditingProduct(product);
    setIsModalOpen(true);
  };

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

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <AdminSidebar />

      <main className="flex-1 overflow-y-auto p-8">
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Header */}
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Inventory Management
              </h1>
              <p className="text-gray-500 text-sm mt-1">
                Manage your store's products, stock, and pricing.
              </p>
            </div>
            <button
              onClick={handleOpenAdd}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add Product
            </button>
          </div>

          {/* Analytics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4">
              <div className="p-3 bg-blue-100 text-blue-600 rounded-lg">
                <Package className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm text-gray-500 font-medium">Total Items</p>
                <p className="text-2xl font-bold text-gray-900">
                  {products.length}
                </p>
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4">
              <div className="p-3 bg-red-100 text-red-600 rounded-lg">
                <TrendingUp className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm text-gray-500 font-medium">
                  Total Cost Value
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  ₦{totalCostValue.toFixed(2)}
                </p>
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4">
              <div className="p-3 bg-green-100 text-green-600 rounded-lg">
                <DollarSign className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm text-gray-500 font-medium">
                  Potential Revenue
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  ₦{potentialRevenue.toFixed(2)}
                </p>
              </div>
            </div>
          </div>

          {/* Filters & Search */}
          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col sm:flex-row gap-4 justify-between">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name or SKU..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Data Table */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200 text-sm text-gray-500">
                    <th className="px-6 py-4 font-medium">Product</th>
                    <th className="px-6 py-4 font-medium">Category</th>
                    <th className="px-6 py-4 font-medium">Cost Price</th>
                    <th className="px-6 py-4 font-medium">Selling Price</th>
                    <th className="px-6 py-4 font-medium">Stock</th>
                    <th className="px-6 py-4 font-medium text-right">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredProducts.length === 0 ? (
                    <tr>
                      <td
                        colSpan={6}
                        className="px-6 py-12 text-center text-gray-500"
                      >
                        No products found matching your search.
                      </td>
                    </tr>
                  ) : (
                    filteredProducts.map((product) => (
                      <tr
                        key={product.id}
                        className="hover:bg-gray-50 transition-colors"
                      >
                        <td className="px-6 py-4">
                          <p className="font-medium text-gray-900">
                            {product.name}
                          </p>
                          <p className="text-xs text-gray-500">
                            SKU: {product.sku}
                          </p>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded-md text-xs font-medium">
                            {product.category}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          ${product.costPrice.toFixed(2)}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900 font-medium">
                          ${product.sellingPrice.toFixed(2)}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-gray-900">
                              {product.stock}
                            </span>
                            <div className="flex-1 h-2 bg-gray-200 rounded-full w-16 overflow-hidden">
                              <div
                                className={`h-full rounded-full ${
                                  product.stock > 20
                                    ? 'bg-green-500'
                                    : product.stock > 5
                                      ? 'bg-yellow-500'
                                      : 'bg-red-500'
                                }`}
                                style={{
                                  width: `${Math.min((product.stock / 100) * 100, 100)}%`,
                                }}
                              />
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right space-x-2">
                          <button
                            onClick={() => handleOpenEdit(product)}
                            className="p-2 text-gray-400 hover:text-blue-600 transition-colors rounded-lg hover:bg-blue-50"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(product.id)}
                            className="p-2 text-gray-400 hover:text-red-600 transition-colors rounded-lg hover:bg-red-50"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
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

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="flex justify-between items-center p-6 border-b border-gray-100">
              <h2 className="text-xl font-bold text-gray-900">
                {editingProduct ? 'Edit Product' : 'Add New Product'}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700">
                  Product Name
                </label>
                <input
                  type="text"
                  name="name"
                  defaultValue={editingProduct?.name || ''}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-700">
                    SKU
                  </label>
                  <input
                    type="text"
                    name="sku"
                    defaultValue={editingProduct?.sku || ''}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-700">
                    Category
                  </label>
                  <input
                    type="text"
                    name="category"
                    defaultValue={editingProduct?.category || ''}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-700">
                    Cost Price ($)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    name="costPrice"
                    defaultValue={editingProduct?.costPrice || ''}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-700">
                    Selling Price ($)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    name="sellingPrice"
                    defaultValue={editingProduct?.sellingPrice || ''}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700">
                  Initial Stock
                </label>
                <input
                  type="number"
                  name="stock"
                  defaultValue={editingProduct?.stock || ''}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700">
                  Low Stock Alert
                </label>

                <input
                  type="number"
                  name="lowStockAlert"
                  min="0"
                  defaultValue={editingProduct?.lowStockAlert ?? 5}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 text-white bg-blue-600 hover:bg-blue-700 rounded-lg font-medium transition-colors"
                >
                  {editingProduct ? 'Save Changes' : 'Add Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
