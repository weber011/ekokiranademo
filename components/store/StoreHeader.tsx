"use client";

import React from "react";
import Link from "next/link";
import { ShoppingBag, MessageSquare, Store, Search, ShieldCheck } from "lucide-react";
import { useCart } from "@/components/common/CartContext";

export function StoreHeader({
  searchQuery,
  onSearchChange,
}: {
  searchQuery?: string;
  onSearchChange?: (val: string) => void;
}) {
  const { totalItemsCount, setIsAssistantOpen } = useCart();

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200">
      {/* Top micro-bar with store identity and demo badge */}
      <div className="bg-slate-900 text-slate-300 text-[11px] sm:text-xs py-1 px-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="inline-block w-2 h-2 rounded-full bg-emerald-400"></span>
          <span className="font-medium text-white">Sharma General Store</span>
          <span className="hidden sm:inline text-slate-400">• Ranchi, Jharkhand</span>
          <span className="hidden md:inline bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded text-[10px]">
            Store Status: OPEN
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-slate-400 hidden sm:inline">Powered by WebbyBuilder</span>
          <span className="text-emerald-400 bg-emerald-950/60 border border-emerald-800/60 px-1.5 py-0.2 rounded text-[10px] flex items-center gap-1">
            <ShieldCheck className="w-2.5 h-2.5" /> Eko Adapter (Demo)
          </span>
          <Link
            href="/dashboard"
            className="text-white hover:text-emerald-300 font-medium flex items-center gap-1 transition-colors ml-1"
          >
            <Store className="w-3 h-3" /> Merchant Portal
          </Link>
        </div>
      </div>

      {/* Main navigation header */}
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
        {/* Brand */}
        <Link href="/store" className="flex items-center gap-2 shrink-0">
          <div className="w-9 h-9 rounded-lg bg-emerald-600 flex items-center justify-center text-white font-bold text-lg shadow-sm">
            DK
          </div>
          <div>
            <div className="font-bold text-slate-900 text-base sm:text-lg leading-tight tracking-tight">
              Digital Kirana
            </div>
            <div className="text-[11px] text-slate-500 font-medium hidden sm:block">
              Daily groceries, delivered simply.
            </div>
          </div>
        </Link>

        {/* Search Bar */}
        <div className="flex-1 max-w-md mx-2">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search atta, rice, milk, oil, biscuits..."
              value={searchQuery || ""}
              onChange={(e) => onSearchChange && onSearchChange(e.target.value)}
              className="w-full bg-slate-100/80 hover:bg-slate-100 focus:bg-white border border-slate-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-lg pl-9 pr-3 py-1.5 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 outline-none transition-all"
            />
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* Order by Chat AI Assistant Button */}
          <button
            onClick={() => setIsAssistantOpen(true)}
            className="flex items-center gap-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition-colors"
            title="Order grocery by chat assistant"
          >
            <MessageSquare className="w-4 h-4 text-emerald-600" />
            <span className="hidden sm:inline">Order by chat</span>
            <span className="sm:hidden">Chat</span>
          </button>

          {/* Cart Link */}
          <Link
            href="/store/cart"
            className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-lg text-xs sm:text-sm font-semibold shadow-sm transition-colors"
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Cart</span>
            {totalItemsCount > 0 && (
              <span className="bg-white text-emerald-700 rounded-full px-1.5 py-0.2 text-[11px] font-bold">
                {totalItemsCount}
              </span>
            )}
          </Link>
        </div>
      </div>
    </header>
  );
}
