"use client";

import React, { useEffect, useState } from "react";
import { Product } from "@/types";
import {
  Package,
  Search,
  Plus,
  Edit2,
  Trash2,
  AlertCircle,
  CheckCircle2,
  X,
  Filter,
} from "lucide-react";

export default function DashboardProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<string[]>(["All"]);
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [selectedStock, setSelectedStock] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);

  // Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    name: "",
    category: "Rice & Grains",
    brand: "",
    unit: "1 kg",
    price: "",
    mrp: "",
    stock: "",
    reorderLevel: "5",
    image: "📦",
    description: "",
  });

  const fetchProducts = async () => {
    try {
      setIsLoading(true);
      const res = await fetch("/api/products");
      const data = await res.json();
      if (data.success) {
        setProducts(data.products);
        setCategories(data.categories || ["All"]);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleOpenAddModal = () => {
    setEditingProduct(null);
    setFormData({
      name: "",
      category: categories[1] || "Rice & Grains",
      brand: "",
      unit: "1 kg",
      price: "",
      mrp: "",
      stock: "20",
      reorderLevel: "5",
      image: "📦",
      description: "",
    });
    setIsAddModalOpen(true);
  };

  const handleOpenEditModal = (p: Product) => {
    setEditingProduct(p);
    setFormData({
      name: p.name,
      category: p.category,
      brand: p.brand,
      unit: p.unit,
      price: p.price.toString(),
      mrp: p.mrp.toString(),
      stock: p.stock.toString(),
      reorderLevel: p.reorderLevel.toString(),
      image: p.image || "📦",
      description: p.description || "",
    });
    setIsAddModalOpen(true);
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        price: Number(formData.price),
        mrp: Number(formData.mrp || formData.price),
        stock: Number(formData.stock),
        reorderLevel: Number(formData.reorderLevel),
      };

      if (editingProduct) {
        await fetch("/api/products", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: editingProduct.id, ...payload }),
        });
      } else {
        await fetch("/api/products", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }

      setIsAddModalOpen(false);
      fetchProducts();
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteProduct = async (id: string, name: string) => {
    if (confirm(`Are you sure you want to remove "${name}" from store catalogue?`)) {
      await fetch(`/api/products?id=${id}`, { method: "DELETE" });
      fetchProducts();
    }
  };

  const filteredProducts = products.filter((p) => {
    const matchCat =
      selectedCategory === "All" ||
      p.category.toLowerCase() === selectedCategory.toLowerCase();
    if (!matchCat) return false;

    if (selectedStock === "LOW" && !(p.stock > 0 && p.stock <= p.reorderLevel)) return false;
    if (selectedStock === "OUT" && p.stock > 0) return false;
    if (selectedStock === "IN" && p.stock <= p.reorderLevel) return false;

    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      p.name.toLowerCase().includes(q) ||
      p.brand.toLowerCase().includes(q) ||
      p.category.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Product Catalogue
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Manage 100+ grocery items, pricing, inventory thresholds and availability
          </p>
        </div>

        <button
          onClick={handleOpenAddModal}
          className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-4 py-2 rounded-lg flex items-center gap-1.5 shadow-xs transition-colors self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add Product</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-3 rounded-lg border border-slate-200 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 shadow-xs">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search products by name or brand..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-md pl-9 pr-3 py-1.5 text-xs text-slate-900 outline-none focus:bg-white focus:border-emerald-500"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
          {/* Category Dropdown */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="bg-slate-50 border border-slate-200 text-xs font-medium text-slate-800 rounded-md px-2.5 py-1.5 outline-none"
          >
            {categories.map((c) => (
              <option key={c} value={c}>
                Category: {c}
              </option>
            ))}
          </select>

          {/* Stock Filter */}
          <select
            value={selectedStock}
            onChange={(e) => setSelectedStock(e.target.value)}
            className="bg-slate-50 border border-slate-200 text-xs font-medium text-slate-800 rounded-md px-2.5 py-1.5 outline-none"
          >
            <option value="ALL">All Stock Levels</option>
            <option value="IN">In Stock</option>
            <option value="LOW">Low Stock</option>
            <option value="OUT">Out of Stock</option>
          </select>

          <span className="text-[11px] text-slate-500 whitespace-nowrap pl-2 border-l border-slate-200">
            {filteredProducts.length} items
          </span>
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="bg-slate-50/80 text-slate-500 border-b border-slate-200 font-semibold">
                <th className="py-2.5 px-4">Product</th>
                <th className="py-2.5 px-4">Category</th>
                <th className="py-2.5 px-4">Price / MRP</th>
                <th className="py-2.5 px-4">Stock</th>
                <th className="py-2.5 px-4">Status</th>
                <th className="py-2.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredProducts.map((p) => {
                const isLow = p.stock > 0 && p.stock <= p.reorderLevel;
                const isOut = p.stock <= 0;

                return (
                  <tr key={p.id} className="hover:bg-slate-50/60 text-slate-800">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2.5">
                        <span className="text-xl shrink-0">{p.image}</span>
                        <div>
                          <div className="font-semibold text-slate-900">{p.name}</div>
                          <div className="text-[10px] text-slate-400">
                            Brand: {p.brand} • Pack: {p.unit}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-slate-600 font-medium">{p.category}</td>
                    <td className="py-3 px-4">
                      <span className="font-bold text-slate-900">₹{p.price}</span>
                      {p.mrp > p.price && (
                        <span className="text-slate-400 line-through ml-1.5 text-[11px]">
                          ₹{p.mrp}
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-800">{p.stock} units</td>
                    <td className="py-3 px-4">
                      {isOut ? (
                        <span className="inline-block bg-rose-50 text-rose-700 text-[10px] font-bold px-2 py-0.5 rounded border border-rose-200">
                          OUT OF STOCK
                        </span>
                      ) : isLow ? (
                        <span className="inline-block bg-amber-50 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded border border-amber-200">
                          LOW STOCK ({p.stock})
                        </span>
                      ) : (
                        <span className="inline-block bg-emerald-50 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded border border-emerald-200">
                          IN STOCK
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="inline-flex items-center gap-1">
                        <button
                          onClick={() => handleOpenEditModal(p)}
                          className="p-1 hover:bg-slate-100 text-slate-600 hover:text-slate-900 rounded"
                          title="Edit product"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteProduct(p.id, p.name)}
                          className="p-1 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded"
                          title="Delete product"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Product Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-xl border border-slate-200 max-w-lg w-full p-6 shadow-2xl space-y-4 animate-fade-in max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h2 className="text-base font-bold text-slate-900">
                {editingProduct ? "Edit Product" : "Add New Grocery Product"}
              </h2>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="space-y-3 text-xs">
              <div>
                <label className="block font-medium text-slate-700 mb-1">Product Full Name *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Aashirvaad Shuddh Chakki Atta 5kg"
                  className="w-full border border-slate-200 rounded-md p-2 text-slate-900 outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Category *</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full border border-slate-200 rounded-md p-2 text-slate-900 outline-none"
                  >
                    {categories.filter((c) => c !== "All").map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Brand *</label>
                  <input
                    type="text"
                    required
                    value={formData.brand}
                    onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                    placeholder="e.g. Tata, Amul, Fortune"
                    className="w-full border border-slate-200 rounded-md p-2 text-slate-900 outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Unit / Pack *</label>
                  <input
                    type="text"
                    required
                    value={formData.unit}
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                    placeholder="e.g. 1 kg, 500 ml"
                    className="w-full border border-slate-200 rounded-md p-2 text-slate-900 outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Store Price (₹) *</label>
                  <input
                    type="number"
                    required
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    placeholder="245"
                    className="w-full border border-slate-200 rounded-md p-2 text-slate-900 outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">MRP (₹)</label>
                  <input
                    type="number"
                    value={formData.mrp}
                    onChange={(e) => setFormData({ ...formData, mrp: e.target.value })}
                    placeholder="275"
                    className="w-full border border-slate-200 rounded-md p-2 text-slate-900 outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Initial Stock *</label>
                  <input
                    type="number"
                    required
                    value={formData.stock}
                    onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                    className="w-full border border-slate-200 rounded-md p-2 text-slate-900 outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Reorder Level *</label>
                  <input
                    type="number"
                    required
                    value={formData.reorderLevel}
                    onChange={(e) => setFormData({ ...formData, reorderLevel: e.target.value })}
                    className="w-full border border-slate-200 rounded-md p-2 text-slate-900 outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Emoji Icon</label>
                  <input
                    type="text"
                    value={formData.image}
                    onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                    className="w-full border border-slate-200 rounded-md p-2 text-slate-900 outline-none focus:border-emerald-500 text-center"
                  />
                </div>
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">Description</label>
                <textarea
                  rows={2}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Short description for grocery item..."
                  className="w-full border border-slate-200 rounded-md p-2 text-slate-900 outline-none focus:border-emerald-500"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold px-4 py-2 rounded-md transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-4 py-2 rounded-md shadow-xs transition-colors"
                >
                  {editingProduct ? "Update Product" : "Save Product"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
