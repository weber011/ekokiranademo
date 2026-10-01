"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Boxes,
  Users,
  CreditCard,
  FileText,
  BarChart3,
  Settings,
  Store,
  ShieldCheck,
  X,
} from "lucide-react";

const NAV_ITEMS = [
  { label: "Overview", href: "/dashboard", icon: LayoutDashboard },
  { label: "Orders", href: "/dashboard/orders", icon: ShoppingCart },
  { label: "Products", href: "/dashboard/products", icon: Package },
  { label: "Inventory", href: "/dashboard/inventory", icon: Boxes },
  { label: "Customers", href: "/dashboard/customers", icon: Users },
  { label: "Payments", href: "/dashboard/payments", icon: CreditCard },
  { label: "Invoices", href: "/dashboard/invoices", icon: FileText },
  { label: "Analytics", href: "/dashboard/analytics", icon: BarChart3 },
];

export function DashboardSidebar({
  isOpen,
  onClose,
}: {
  isOpen?: boolean;
  onClose?: () => void;
}) {
  const pathname = usePathname();

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 bg-slate-900/50 z-40 lg:hidden backdrop-blur-xs"
        />
      )}

      <aside
        className={`fixed top-0 left-0 bottom-0 z-50 w-60 bg-white border-r border-slate-200 flex flex-col justify-between transition-transform duration-200 lg:translate-x-0 ${
          isOpen ? "translate-x-0 shadow-xl" : "-translate-x-full"
        }`}
      >
        <div>
          {/* Brand Header */}
          <div className="h-16 px-4 border-b border-slate-200 flex items-center justify-between">
            <Link href="/dashboard" className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white font-bold text-sm shadow-xs">
                DK
              </div>
              <div>
                <div className="font-bold text-slate-900 text-sm leading-tight">Digital Kirana</div>
                <div className="text-[10px] text-slate-400 font-medium">Merchant OS • WebbyBuilder</div>
              </div>
            </Link>
            {onClose && (
              <button
                onClick={onClose}
                className="p-1 text-slate-400 hover:text-slate-600 lg:hidden"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>

          {/* Navigation Links */}
          <nav className="p-3 space-y-1">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive =
                item.href === "/dashboard"
                  ? pathname === "/dashboard"
                  : pathname.startsWith(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onClose}
                  className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold transition-colors ${
                    isActive
                      ? "bg-slate-900 text-white"
                      : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? "text-emerald-400" : "text-slate-400"}`} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Bottom Store & Infrastructure Identity */}
        <div className="p-3 border-t border-slate-200 bg-slate-50/70 space-y-2.5 text-xs">
          {/* Demo Environment Indicator */}
          <div className="flex items-center justify-between bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-md p-2 text-[11px]">
            <div className="flex items-center gap-1.5 font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Demo Environment</span>
            </div>
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          </div>

          {/* Store Name & Location */}
          <div className="px-1">
            <div className="font-bold text-slate-800 text-[11px] leading-tight">
              Sharma General Store
            </div>
            <div className="text-[10px] text-slate-500">Ranchi, Jharkhand</div>
            <div className="text-[10px] text-emerald-600 font-semibold mt-0.5">
              ● Store Status: OPEN
            </div>
          </div>

          <Link
            href="/store"
            target="_blank"
            className="w-full bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-md py-1.5 px-2.5 text-[11px] font-semibold flex items-center justify-center gap-1.5 transition-colors shadow-2xs"
          >
            <Store className="w-3.5 h-3.5 text-slate-500" />
            <span>Open Customer Store</span>
          </Link>
        </div>
      </aside>
    </>
  );
}
