"use client";

import React, { useEffect, useState } from "react";
import { Product } from "@/types";
import {
  Boxes,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Search,
  Plus,
  ArrowUpRight,
  TrendingDown,
  RefreshCw,
} from "lucide-react";

export default function DashboardInventoryPage() {
  const [items, setItems] = useState<Product[]>([]);
  const [summary, setSummary] = useState<any>({
    totalItems: 0,
    inStock: 0,
    lowStock: 0,
    outOfStock: 0,
    totalInventoryValue: 0,
  });
  const [filter, setFilter] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  // Quick Restock State
  const [restockProduct, setRestockProduct] = useState<Product | null>(null);
  const [restockQty, setRestockQty] = useState("20");

  const fetchInventory = async () => {
    try {
      setIsLoading(true);
      const res = await fetch(`/api/inventory?filter=${filter}`);
      const data = await res.json();
      if (data.success) {
        setItems(data.items);
        setSummary(data.summary);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, [filter]);

  const handleApplyRestock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!restockProduct) return;
    try {
      const newTotalStock = restockProduct.stock + Number(restockQty);
      await fetch("/api/inventory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: restockProduct.id,
          newStock: newTotalStock,
        }),
      });
      setRestockProduct(null);
      fetchInventory();
    } catch (e) {
      console.error(e);
    }
  };

  const filteredItems = items.filter((item) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      item.name.toLowerCase().includes(q) ||
      item.brand.toLowerCase().includes(q) ||
      item.category.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Inventory & Stock Control
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Monitor stock thresholds, warehouse reorders, and live out-of-stock alerts
          </p>
        </div>

        <button
          onClick={fetchInventory}
          className="bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-semibold px-3 py-2 rounded-lg flex items-center gap-1.5 transition-colors self-start sm:self-auto shadow-2xs"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh Stock</span>
        </button>
      </div>

      {/* 4 Inventory Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs">
          <div className="text-xs text-slate-500 font-medium mb-1">Total Catalogue Items</div>
          <div className="text-xl sm:text-2xl font-bold text-slate-900">
            {summary.totalItems}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Across 20 categories</div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs">
          <div className="text-xs text-slate-500 font-medium mb-1 flex items-center justify-between">
            <span>In Stock</span>
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
          </div>
          <div className="text-xl sm:text-2xl font-bold text-emerald-700">
            {summary.inStock}
          </div>
          <div className="text-[11px] text-emerald-600 font-medium mt-1">Healthy stock level</div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs">
          <div className="text-xs text-slate-500 font-medium mb-1 flex items-center justify-between">
            <span>Low Stock</span>
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
          </div>
          <div className="text-xl sm:text-2xl font-bold text-amber-700">
            {summary.lowStock}
          </div>
          <div className="text-[11px] text-amber-600 font-medium mt-1">Below reorder level</div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs">
          <div className="text-xs text-slate-500 font-medium mb-1 flex items-center justify-between">
            <span>Out of Stock</span>
            <XCircle className="w-3.5 h-3.5 text-rose-600" />
          </div>
          <div className="text-xl sm:text-2xl font-bold text-rose-700">
            {summary.outOfStock}
          </div>
          <div className="text-[11px] text-rose-600 font-medium mt-1">Action required</div>
        </div>
      </div>

      {/* Filter and Search */}
      <div className="bg-white p-3 rounded-lg border border-slate-200 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 shadow-xs">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search inventory items..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-md pl-9 pr-3 py-1.5 text-xs text-slate-900 outline-none focus:bg-white focus:border-emerald-500"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          {["ALL", "LOW", "OUT"].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1 rounded-md text-xs font-semibold transition-colors ${
                filter === f
                  ? "bg-slate-900 text-white"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              {f === "ALL" ? "All Products" : f === "LOW" ? "Low Stock Alerts" : "Out of Stock"}
            </button>
          ))}
        </div>
      </div>

      {/* Inventory Table */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="bg-slate-50/80 text-slate-500 border-b border-slate-200 font-semibold">
                <th className="py-2.5 px-4">Product</th>
                <th className="py-2.5 px-4">Category</th>
                <th className="py-2.5 px-4">Current Stock</th>
                <th className="py-2.5 px-4">Reorder Level</th>
                <th className="py-2.5 px-4">Status</th>
                <th className="py-2.5 px-4 text-right">Quick Restock</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredItems.map((item) => {
                const isOut = item.stock <= 0;
                const isLow = item.stock > 0 && item.stock <= item.reorderLevel;

                return (
                  <tr key={item.id} className="hover:bg-slate-50/60 text-slate-800">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2.5">
                        <span className="text-xl">{item.image}</span>
                        <div>
                          <div className="font-semibold text-slate-900">{item.name}</div>
                          <div className="text-[10px] text-slate-400">
                            {item.brand} • {item.unit} • ₹{item.price}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-slate-600 font-medium">{item.category}</td>
                    <td className="py-3 px-4 font-mono font-bold text-slate-900 text-sm">
                      {item.stock}
                    </td>
                    <td className="py-3 px-4 text-slate-500 font-mono">{item.reorderLevel}</td>
                    <td className="py-3 px-4">
                      {isOut ? (
                        <span className="inline-block bg-rose-50 text-rose-700 text-[10px] font-bold px-2 py-0.5 rounded border border-rose-200">
                          OUT OF STOCK
                        </span>
                      ) : isLow ? (
                        <span className="inline-block bg-amber-50 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded border border-amber-200">
                          LOW STOCK
                        </span>
                      ) : (
                        <span className="inline-block bg-emerald-50 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded border border-emerald-200">
                          IN STOCK
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => {
                          setRestockProduct(item);
                          setRestockQty("20");
                        }}
                        className="bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-[11px] px-2.5 py-1 rounded border border-slate-200 inline-flex items-center gap-1 transition-colors"
                      >
                        <Plus className="w-3 h-3" /> Restock
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Restock Modal */}
      {restockProduct && (
        <div className="fixed inset-0 bg-slate-900/50 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-xl border border-slate-200 max-w-sm w-full p-5 shadow-2xl space-y-4 animate-fade-in">
            <h2 className="text-sm font-bold text-slate-900">Restock Product Units</h2>
            <div className="text-xs text-slate-600 bg-slate-50 p-3 rounded-md border border-slate-200">
              <div className="font-semibold text-slate-900">{restockProduct.name}</div>
              <div className="text-[11px] text-slate-500 mt-0.5">
                Current Stock: <strong>{restockProduct.stock}</strong> units
              </div>
            </div>

            <form onSubmit={handleApplyRestock} className="space-y-3 text-xs">
              <div>
                <label className="block font-medium text-slate-700 mb-1">Add Quantity (+ units)</label>
                <input
                  type="number"
                  required
                  min="1"
                  value={restockQty}
                  onChange={(e) => setRestockQty(e.target.value)}
                  className="w-full border border-slate-200 rounded-md p-2 text-slate-900 outline-none focus:border-emerald-500 text-sm font-bold"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setRestockProduct(null)}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold px-3 py-1.5 rounded-md"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-4 py-1.5 rounded-md shadow-xs"
                >
                  Confirm Restock
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
