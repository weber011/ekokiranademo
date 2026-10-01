"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Order } from "@/types";
import { SalesChart } from "@/components/dashboard/SalesChart";
import {
  IndianRupee,
  ShoppingCart,
  Clock,
  AlertTriangle,
  ArrowRight,
  TrendingUp,
  CheckCircle2,
  Package,
  ExternalLink,
} from "lucide-react";

export default function DashboardOverviewPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [analytics, setAnalytics] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [ordersRes, analyticsRes] = await Promise.all([
          fetch("/api/orders"),
          fetch("/api/analytics"),
        ]);
        const ordersData = await ordersRes.json();
        const analyticsData = await analyticsRes.json();

        if (ordersData.success) setOrders(ordersData.orders);
        if (analyticsData.success) setAnalytics(analyticsData);
      } catch (err) {
        console.error("Failed to load dashboard data:", err);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  const kpis = analytics?.kpis || {
    todaySales: 18460,
    todayOrders: 47,
    pendingPayments: 3,
    lowStock: 8,
  };

  const salesData = analytics?.salesLast7Days || [];

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Good morning, Rajesh
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Tuesday, 8 September 2026 • Sharma General Store, Ranchi
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-800 text-xs font-semibold px-2.5 py-1 rounded-md border border-emerald-200">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            Store Status: OPEN
          </span>
        </div>
      </div>

      {/* Top 4 KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* KPI 1: Today's Sales */}
        <div className="bg-white rounded-lg border border-slate-200 p-3.5 sm:p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs mb-1.5">
            <span className="font-medium">Today&apos;s Sales</span>
            <div className="w-7 h-7 rounded-md bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <IndianRupee className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-bold text-slate-900">
            ₹{kpis.todaySales?.toLocaleString()}
          </div>
          <div className="text-[11px] text-emerald-700 font-medium mt-1 flex items-center gap-1">
            <TrendingUp className="w-3 h-3" /> +12.4% vs yesterday
          </div>
        </div>

        {/* KPI 2: Today's Orders */}
        <div className="bg-white rounded-lg border border-slate-200 p-3.5 sm:p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs mb-1.5">
            <span className="font-medium">Orders</span>
            <div className="w-7 h-7 rounded-md bg-blue-50 text-blue-700 flex items-center justify-center">
              <ShoppingCart className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-bold text-slate-900">
            {kpis.todayOrders}
          </div>
          <div className="text-[11px] text-slate-500 font-medium mt-1">
            38 delivered, 6 active
          </div>
        </div>

        {/* KPI 3: Pending Payments */}
        <div className="bg-white rounded-lg border border-slate-200 p-3.5 sm:p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs mb-1.5">
            <span className="font-medium">Pending Payments</span>
            <div className="w-7 h-7 rounded-md bg-amber-50 text-amber-700 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-bold text-slate-900">
            {kpis.pendingPayments}
          </div>
          <div className="text-[11px] text-amber-700 font-medium mt-1">
            Awaiting settlement / COD
          </div>
        </div>

        {/* KPI 4: Low Stock Alerts */}
        <Link
          href="/dashboard/inventory"
          className="bg-white rounded-lg border border-slate-200 p-3.5 sm:p-4 shadow-xs hover:border-amber-300 transition-colors block"
        >
          <div className="flex items-center justify-between text-slate-500 text-xs mb-1.5">
            <span className="font-medium">Low Stock Alerts</span>
            <div className="w-7 h-7 rounded-md bg-rose-50 text-rose-700 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-bold text-slate-900">
            {kpis.lowStock}
          </div>
          <div className="text-[11px] text-rose-600 font-medium mt-1">
            Needs replenishment
          </div>
        </Link>
      </div>

      {/* 7-Day Sales Chart */}
      <SalesChart data={salesData} />

      {/* Recent Orders Table */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h2 className="text-xs sm:text-sm font-bold text-slate-900">Recent Orders</h2>
            <p className="text-[11px] text-slate-500">Live store and AI assistant orders</p>
          </div>
          <Link
            href="/dashboard/orders"
            className="text-xs text-emerald-700 hover:text-emerald-800 font-semibold flex items-center gap-1 transition-colors"
          >
            <span>View all orders</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="bg-slate-50/80 text-slate-500 border-b border-slate-200 font-semibold">
                <th className="py-2.5 px-4">Order ID</th>
                <th className="py-2.5 px-4">Customer</th>
                <th className="py-2.5 px-4">Items</th>
                <th className="py-2.5 px-4">Amount</th>
                <th className="py-2.5 px-4">Payment</th>
                <th className="py-2.5 px-4">Status</th>
                <th className="py-2.5 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {orders.slice(0, 10).map((order) => {
                const isPaid = order.paymentStatus === "PAID";
                return (
                  <tr key={order.id} className="hover:bg-slate-50/60 text-slate-800">
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">
                      {order.id}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900">{order.customerName}</div>
                      <div className="text-[10px] text-slate-400">{order.customerMobile}</div>
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      {order.items.reduce((s, i) => s + i.quantity, 0)} items
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-900">
                      ₹{order.total}
                    </td>
                    <td className="py-3 px-4">
                      <span className="inline-block bg-slate-100 text-slate-700 text-[10px] font-semibold px-2 py-0.5 rounded border border-slate-200">
                        {order.paymentMethod}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      {isPaid ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3" /> Paid
                        </span>
                      ) : order.paymentStatus === "FAILED" ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                          Failed
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                          <Clock className="w-3 h-3" /> Pending
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Link
                        href={`/store/orders/${order.id}`}
                        target="_blank"
                        className="text-slate-600 hover:text-emerald-700 font-semibold inline-flex items-center gap-1 transition-colors"
                      >
                        Invoice <ExternalLink className="w-3 h-3" />
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
