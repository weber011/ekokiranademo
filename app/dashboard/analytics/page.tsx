"use client";

import React, { useEffect, useState } from "react";
import {
  TrendingUp,
  IndianRupee,
  ShoppingCart,
  BarChart3,
  Percent,
} from "lucide-react";

export default function DashboardAnalyticsPage() {
  const [analytics, setAnalytics] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/analytics");
        const data = await res.json();
        if (data.success) setAnalytics(data);
      } catch (e) {
        console.error(e);
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, []);

  const kpis = analytics?.kpis || {};
  const topCategories = analytics?.topCategories || [];
  const topProducts = analytics?.topProducts || [];
  const salesData = analytics?.salesLast7Days || [];

  const maxSales = Math.max(...salesData.map((d: any) => d.sales), 25000);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
          Sales Analytics
        </h1>
        <p className="text-xs text-slate-500 font-medium mt-0.5">
          Sharma General Store • September 2026 performance overview
        </p>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
        {[
          { label: "Today's Sales", value: `₹${(kpis.todaySales || 18460).toLocaleString()}`, sub: "+12.4% vs yesterday", icon: IndianRupee, color: "emerald" },
          { label: "This Week", value: `₹${(kpis.thisWeekSales || 108420).toLocaleString()}`, sub: "Mon–Sun revenue", icon: TrendingUp, color: "sky" },
          { label: "This Month", value: `₹${(kpis.thisMonthSales || 384600).toLocaleString()}`, sub: "September total", icon: BarChart3, color: "indigo" },
          { label: "Total Orders", value: (kpis.totalOrders || 1284).toLocaleString(), sub: "All-time", icon: ShoppingCart, color: "amber" },
          { label: "Avg. Order Value", value: `₹${kpis.averageOrderValue || 299}`, sub: "Per completed order", icon: IndianRupee, color: "slate" },
          { label: "Payment Success Rate", value: `${kpis.paymentSuccessRate || 96.4}%`, sub: "Eko Adapter settlements", icon: Percent, color: "emerald" },
        ].map((kpi, idx) => {
          const Icon = kpi.icon;
          return (
            <div key={idx} className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between text-slate-500 text-xs mb-1.5">
                <span className="font-medium">{kpi.label}</span>
                <div className="w-7 h-7 rounded-md bg-slate-50 text-slate-500 flex items-center justify-center">
                  <Icon className="w-4 h-4" />
                </div>
              </div>
              <div className="text-xl sm:text-2xl font-bold text-slate-900">{kpi.value}</div>
              <div className="text-[11px] text-slate-400 mt-1">{kpi.sub}</div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 7-Day Sales Bar Chart */}
        <div className="bg-white rounded-lg border border-slate-200 p-4 sm:p-5 shadow-xs">
          <h2 className="text-xs sm:text-sm font-bold text-slate-900 mb-1">7-Day Sales Trend</h2>
          <p className="text-[11px] text-slate-500 mb-4">Daily revenue (₹)</p>
          <div className="h-48 flex items-end gap-2 border-b border-slate-100">
            {salesData.map((item: any, idx: number) => {
              const heightPct = Math.round((item.sales / maxSales) * 100);
              const isToday = item.day === "Today";
              return (
                <div key={idx} className="flex-1 flex flex-col items-center gap-1 h-full justify-end group relative">
                  <div className="absolute -top-8 opacity-0 group-hover:opacity-100 bg-slate-900 text-white text-[10px] px-2 py-1 rounded whitespace-nowrap z-10">
                    ₹{item.sales.toLocaleString()}
                  </div>
                  <div
                    style={{ height: `${heightPct}%` }}
                    className={`w-full rounded-t max-w-[32px] ${isToday ? "bg-emerald-600" : "bg-slate-200"}`}
                  />
                  <div className={`text-[10px] font-semibold mt-1 ${isToday ? "text-emerald-700" : "text-slate-500"}`}>
                    {item.day}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Top Categories */}
        <div className="bg-white rounded-lg border border-slate-200 p-4 sm:p-5 shadow-xs">
          <h2 className="text-xs sm:text-sm font-bold text-slate-900 mb-1">Revenue by Category</h2>
          <p className="text-[11px] text-slate-500 mb-4">September breakdown</p>
          <div className="space-y-3">
            {topCategories.map((cat: any, idx: number) => (
              <div key={idx}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="font-semibold text-slate-800">{cat.name}</span>
                  <span className="font-bold text-slate-900">
                    ₹{cat.amount.toLocaleString()} <span className="text-slate-400 font-normal">({cat.share})</span>
                  </span>
                </div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    style={{ width: cat.share }}
                    className="h-full bg-emerald-500 rounded-full"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Top Products */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-200">
          <h2 className="text-xs sm:text-sm font-bold text-slate-900">Top Selling Products</h2>
          <p className="text-[11px] text-slate-500">By quantity sold this month</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="bg-slate-50/80 text-slate-500 border-b border-slate-200 font-semibold">
                <th className="py-2.5 px-4">#</th>
                <th className="py-2.5 px-4">Product</th>
                <th className="py-2.5 px-4">Category</th>
                <th className="py-2.5 px-4">Qty Sold</th>
                <th className="py-2.5 px-4">Revenue</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {topProducts.map((p: any, idx: number) => (
                <tr key={idx} className="hover:bg-slate-50/60">
                  <td className="py-3 px-4 font-bold text-slate-400 text-sm">{idx + 1}</td>
                  <td className="py-3 px-4 font-semibold text-slate-900">{p.name}</td>
                  <td className="py-3 px-4 text-slate-600">{p.category}</td>
                  <td className="py-3 px-4 font-bold text-slate-900">{p.quantitySold}</td>
                  <td className="py-3 px-4 font-bold text-emerald-700">₹{p.revenue.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
