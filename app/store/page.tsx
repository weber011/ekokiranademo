"use client";

import React, { useState, useEffect, useMemo } from "react";
import { StoreHeader } from "@/components/store/StoreHeader";
import { CategoryFilter } from "@/components/store/CategoryFilter";
import { ProductCard } from "@/components/store/ProductCard";
import { AssistantWidget } from "@/components/assistant/AssistantWidget";
import { Product } from "@/types";
import { Loader2, PackageSearch, Sparkles, Truck, ShieldCheck, Clock } from "lucide-react";
import Link from "next/link";

export default function StorePage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<string[]>(["All"]);
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    async function loadProducts() {
      try {
        setIsLoading(true);
        const res = await fetch("/api/products");
        const data = await res.json();
        if (data.success) {
          setProducts(data.products);
          setCategories(data.categories || ["All"]);
        }
      } catch (err) {
        console.error("Failed to load store products:", err);
      } finally {
        setIsLoading(false);
      }
    }
    loadProducts();
  }, []);

  const filteredProducts = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return products.filter((p) => {
      const matchCat =
        selectedCategory === "All" ||
        p.category.toLowerCase() === selectedCategory.toLowerCase();
      if (!matchCat) return false;

      if (!q) return true;
      return (
        p.name.toLowerCase().includes(q) ||
        p.brand.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        p.tags?.some((t) => t.toLowerCase().includes(q))
      );
    });
  }, [products, selectedCategory, searchQuery]);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Customer Store Header */}
      <StoreHeader searchQuery={searchQuery} onSearchChange={setSearchQuery} />

      {/* Category Pills Bar */}
      <CategoryFilter
        categories={categories}
        selectedCategory={selectedCategory}
        onSelectCategory={setSelectedCategory}
      />

      {/* Compact Store Notice / Highlights Banner */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-600">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5 font-medium text-slate-800">
              <Truck className="w-3.5 h-3.5 text-emerald-600" />
              Free Delivery on orders above ₹500
            </span>
            <span className="hidden md:flex items-center gap-1.5 text-slate-500">
              <Clock className="w-3.5 h-3.5" /> Fast 45-min local delivery in Ranchi
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-[11px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded border border-slate-200">
              Showing <strong className="text-slate-900">{filteredProducts.length}</strong> products
            </span>
          </div>
        </div>
      </div>

      {/* Main Catalogue Grid */}
      <main className="max-w-7xl mx-auto px-4 py-6 flex-1 w-full">
        {isLoading ? (
          <div className="py-20 flex flex-col items-center justify-center text-slate-400 gap-3">
            <Loader2 className="w-7 h-7 animate-spin text-emerald-600" />
            <p className="text-sm font-medium">Loading grocery catalogue...</p>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="py-16 text-center max-w-md mx-auto bg-white border border-slate-200 rounded-xl p-8 shadow-xs">
            <PackageSearch className="w-10 h-10 text-slate-400 mx-auto mb-3" />
            <h3 className="font-semibold text-slate-800 text-base mb-1">No products found</h3>
            <p className="text-xs text-slate-500 mb-4">
              We couldn't find items matching &quot;{searchQuery}&quot; in {selectedCategory}. Try another search term or ask the AI Assistant.
            </p>
            <button
              onClick={() => {
                setSearchQuery("");
                setSelectedCategory("All");
              }}
              className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold px-4 py-2 rounded-md transition-colors"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
            {filteredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </main>

      {/* Store Footer */}
      <footer className="bg-white border-t border-slate-200 mt-auto py-6">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div>
            <span className="font-semibold text-slate-800">Digital Kirana</span> — Sharma General Store, Ranchi, Jharkhand.
            <div className="text-[11px] text-slate-400">Your store, orders and payments — all in one place.</div>
          </div>
          <div className="flex items-center gap-4 text-[11px]">
            <span>Powered by <strong>WebbyBuilder</strong></span>
            <span>•</span>
            <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
              Eko Adapter — Demo Environment
            </span>
          </div>
        </div>
      </footer>

      {/* Floating AI Order Assistant */}
      <AssistantWidget />
    </div>
  );
}
