"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Order, OrderStatus } from "@/types";
import {
  ShoppingCart,
  Search,
  CheckCircle2,
  Clock,
  Truck,
  Package,
  XCircle,
  ExternalLink,
  ChevronRight,
  Filter,
} from "lucide-react";

export default function DashboardOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchOrders = async () => {
    try {
      setIsLoading(true);
      const res = await fetch("/api/orders");
      const data = await res.json();
      if (data.success) {
        setOrders(data.orders);
        if (selectedOrder) {
          const updated = data.orders.find((o: Order) => o.id === selectedOrder.id);
          if (updated) setSelectedOrder(updated);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleUpdateOrderStatus = async (orderId: string, newStatus: OrderStatus) => {
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderStatus: newStatus }),
      });
      const data = await res.json();
      if (data.success) {
        fetchOrders();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const filteredOrders = orders.filter((o) => {
    const matchStatus =
      selectedStatus === "ALL" ||
      o.orderStatus.toLowerCase() === selectedStatus.toLowerCase();
    if (!matchStatus) return false;

    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      o.id.toLowerCase().includes(q) ||
      o.customerName.toLowerCase().includes(q) ||
      o.customerMobile.includes(q)
    );
  });

  const STATUS_TABS = [
    { id: "ALL", label: "All Orders", count: orders.length },
    { id: "PENDING", label: "Pending", count: orders.filter((o) => o.orderStatus === "PENDING").length },
    { id: "PAID", label: "Paid", count: orders.filter((o) => o.orderStatus === "PAID").length },
    { id: "PREPARING", label: "Preparing", count: orders.filter((o) => o.orderStatus === "PREPARING").length },
    { id: "OUT_FOR_DELIVERY", label: "Out for Delivery", count: orders.filter((o) => o.orderStatus === "OUT_FOR_DELIVERY").length },
    { id: "DELIVERED", label: "Delivered", count: orders.filter((o) => o.orderStatus === "DELIVERED").length },
    { id: "CANCELLED", label: "Cancelled", count: orders.filter((o) => o.orderStatus === "CANCELLED").length },
  ];

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Orders Management
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Track and process grocery orders across live delivery pipelines
          </p>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search order ID or customer..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white border border-slate-200 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-900 outline-none focus:border-emerald-500"
          />
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1 border-b border-slate-200">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setSelectedStatus(tab.id)}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold whitespace-nowrap transition-colors flex items-center gap-1.5 ${
              selectedStatus === tab.id
                ? "bg-slate-900 text-white"
                : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
            }`}
          >
            <span>{tab.label}</span>
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                selectedStatus === tab.id ? "bg-slate-800 text-slate-200" : "bg-slate-100 text-slate-500"
              }`}
            >
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Main Grid: Orders Table + Details Drawer */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Table View (2 Cols) */}
        <div className="lg:col-span-2 bg-white rounded-lg border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="bg-slate-50/80 text-slate-500 border-b border-slate-200 font-semibold">
                  <th className="py-2.5 px-4">Order ID</th>
                  <th className="py-2.5 px-4">Customer</th>
                  <th className="py-2.5 px-4">Items</th>
                  <th className="py-2.5 px-4">Amount</th>
                  <th className="py-2.5 px-4">Status</th>
                  <th className="py-2.5 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredOrders.map((order) => {
                  const isSelected = selectedOrder?.id === order.id;
                  return (
                    <tr
                      key={order.id}
                      onClick={() => setSelectedOrder(order)}
                      className={`hover:bg-slate-50/80 cursor-pointer transition-colors ${
                        isSelected ? "bg-emerald-50/50" : ""
                      }`}
                    >
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
                        <span
                          className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded border ${
                            order.orderStatus === "PAID"
                              ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                              : order.orderStatus === "DELIVERED"
                              ? "bg-slate-100 text-slate-800 border-slate-300"
                              : order.orderStatus === "PREPARING"
                              ? "bg-sky-50 text-sky-800 border-sky-200"
                              : order.orderStatus === "OUT_FOR_DELIVERY"
                              ? "bg-indigo-50 text-indigo-800 border-indigo-200"
                              : order.orderStatus === "CANCELLED"
                              ? "bg-rose-50 text-rose-800 border-rose-200"
                              : "bg-amber-50 text-amber-800 border-amber-200"
                          }`}
                        >
                          {order.orderStatus}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <ChevronRight className="w-4 h-4 text-slate-400 inline" />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Selected Order Detail Panel (1 Col) */}
        <div className="lg:col-span-1">
          {selectedOrder ? (
            <div className="bg-white rounded-lg border border-slate-200 p-4 sm:p-5 shadow-xs space-y-4 sticky top-20">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div>
                  <h2 className="text-sm font-bold text-slate-900 font-mono">
                    {selectedOrder.id}
                  </h2>
                  <div className="text-[11px] text-slate-400">
                    Placed on {new Date(selectedOrder.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </div>
                </div>
                <Link
                  href={`/store/orders/${selectedOrder.id}`}
                  target="_blank"
                  className="text-xs text-emerald-700 hover:text-emerald-800 font-semibold flex items-center gap-1"
                >
                  Invoice <ExternalLink className="w-3 h-3" />
                </Link>
              </div>

              {/* Customer summary */}
              <div className="text-xs space-y-1 bg-slate-50 p-3 rounded-md border border-slate-200">
                <div className="font-bold text-slate-900">{selectedOrder.customerName}</div>
                <div className="text-slate-600">{selectedOrder.customerMobile}</div>
                <div className="text-slate-500 text-[11px]">{selectedOrder.deliveryAddress}</div>
              </div>

              {/* Order Items */}
              <div>
                <h3 className="text-xs font-bold text-slate-700 mb-2">Order Items</h3>
                <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1 text-xs">
                  {selectedOrder.items.map((it, idx) => (
                    <div key={idx} className="flex justify-between text-slate-800">
                      <span className="truncate pr-2">
                        {it.name} <span className="text-slate-400">×{it.quantity}</span>
                      </span>
                      <span className="font-semibold shrink-0">₹{it.totalPrice}</span>
                    </div>
                  ))}
                </div>
                <div className="pt-2 mt-2 border-t border-slate-100 flex justify-between text-xs font-bold">
                  <span>Total Amount</span>
                  <span className="text-emerald-700 text-sm">₹{selectedOrder.total}</span>
                </div>
              </div>

              {/* Status Update Actions */}
              <div>
                <h3 className="text-xs font-bold text-slate-700 mb-2">Update Order Pipeline</h3>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <button
                    onClick={() => handleUpdateOrderStatus(selectedOrder.id, "PREPARING")}
                    className="p-2 rounded bg-sky-50 hover:bg-sky-100 text-sky-800 border border-sky-200 font-semibold transition-colors flex items-center justify-center gap-1"
                  >
                    <Package className="w-3.5 h-3.5" /> Preparing
                  </button>
                  <button
                    onClick={() => handleUpdateOrderStatus(selectedOrder.id, "OUT_FOR_DELIVERY")}
                    className="p-2 rounded bg-indigo-50 hover:bg-indigo-100 text-indigo-800 border border-indigo-200 font-semibold transition-colors flex items-center justify-center gap-1"
                  >
                    <Truck className="w-3.5 h-3.5" /> Out for Delivery
                  </button>
                  <button
                    onClick={() => handleUpdateOrderStatus(selectedOrder.id, "DELIVERED")}
                    className="p-2 rounded bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 font-semibold transition-colors flex items-center justify-center gap-1"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" /> Delivered
                  </button>
                  <button
                    onClick={() => handleUpdateOrderStatus(selectedOrder.id, "CANCELLED")}
                    className="p-2 rounded bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200 font-semibold transition-colors flex items-center justify-center gap-1"
                  >
                    <XCircle className="w-3.5 h-3.5" /> Cancel Order
                  </button>
                </div>
              </div>

              {/* Order Timeline */}
              <div className="pt-2 border-t border-slate-100">
                <h3 className="text-xs font-bold text-slate-700 mb-2">Order Activity Timeline</h3>
                <div className="space-y-2 text-xs">
                  {selectedOrder.timeline.map((event, idx) => (
                    <div key={idx} className="flex items-start gap-2">
                      <div
                        className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${
                          event.done ? "bg-emerald-600" : "bg-slate-300"
                        }`}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between">
                          <span className={`font-semibold ${event.done ? "text-slate-900" : "text-slate-400"}`}>
                            {event.title}
                          </span>
                          <span className="text-[10px] text-slate-400">{event.time}</span>
                        </div>
                        {event.description && (
                          <div className="text-[10px] text-slate-500">{event.description}</div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-lg border border-slate-200 p-8 text-center text-slate-400 text-xs shadow-xs">
              Select an order from the list to view its complete items, customer details and update delivery status.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
