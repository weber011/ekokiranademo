"use client";

import React from "react";
import Link from "next/link";
import { Menu, Search, Bell, ExternalLink, Store } from "lucide-react";

export function DashboardTopNav({ onToggleSidebar }: { onToggleSidebar: () => void }) {
  return (
    <header className="h-16 bg-white border-b border-slate-200 px-4 sm:px-6 flex items-center justify-between gap-4 sticky top-0 z-30">
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="p-1.5 rounded-md hover:bg-slate-100 text-slate-600 lg:hidden"
          aria-label="Toggle menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="hidden sm:block font-bold text-slate-800 text-sm">
          Sharma General Store <span className="text-slate-400 font-normal">| Ranchi</span>
        </div>
      </div>

      {/* Right controls */}
      <div className="flex items-center gap-3">
        {/* Customer Store Link */}
        <Link
          href="/store"
          className="bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-semibold px-3 py-1.5 rounded-md flex items-center gap-1.5 transition-colors"
        >
          <Store className="w-3.5 h-3.5 text-emerald-600" />
          <span>View Store</span>
          <ExternalLink className="w-3 h-3 text-emerald-500" />
        </Link>

        {/* Notifications */}
        <div className="relative">
          <button className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-colors relative">
            <Bell className="w-4 h-4" />
            <span className="w-2 h-2 rounded-full bg-rose-500 absolute top-1.5 right-1.5" />
          </button>
        </div>

        {/* Owner Profile */}
        <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
          <div className="w-8 h-8 rounded-full bg-slate-900 text-white font-bold text-xs flex items-center justify-center">
            RS
          </div>
          <div className="hidden md:block text-left">
            <div className="text-xs font-bold text-slate-900 leading-tight">Rajesh Sharma</div>
            <div className="text-[10px] text-slate-400 font-medium">Owner / Merchant</div>
          </div>
        </div>
      </div>
    </header>
  );
}
