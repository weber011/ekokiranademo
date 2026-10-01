"use client";

import React, { useEffect, useState } from "react";
import { PaymentTransaction } from "@/types";
import {
  CreditCard,
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  ShieldCheck,
  ChevronRight,
  ExternalLink,
} from "lucide-react";
import Link from "next/link";

export default function DashboardPaymentsPage() {
  const [payments, setPayments] = useState<PaymentTransaction[]>([]);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPayment, setSelectedPayment] = useState<PaymentTransaction | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        setIsLoading(true);
        const res = await fetch(`/api/payments`);
        const data = await res.json();
        if (data.success) setPayments(data.payments);
      } catch (e) {
        console.error(e);
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, []);

  const filtered = payments.filter((p) => {
    const matchStatus = statusFilter === "ALL" || p.status.toLowerCase() === statusFilter.toLowerCase();
    if (!matchStatus) return false;
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      p.internalTransactionId.toLowerCase().includes(q) ||
      p.customerName.toLowerCase().includes(q) ||
      p.orderId.toLowerCase().includes(q)
    );
  });

  const successCount = payments.filter((p) => p.status === "SUCCESS").length;
  const failedCount = payments.filter((p) => p.status === "FAILED").length;
  const totalVolume = payments.filter((p) => p.status === "SUCCESS").reduce((s, p) => s + p.amount, 0);

  const FILTERS = [
    { id: "ALL", label: "All Transactions", count: payments.length },
    { id: "SUCCESS", label: "Success", count: successCount },
    { id: "PROCESSING", label: "Processing", count: payments.filter((p) => p.status === "PROCESSING").length },
    { id: "FAILED", label: "Failed", count: failedCount },
  ];

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Payments & Transaction Ledger
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Powered by WebbyBuilder payment orchestration • Eko Financial Adapter (Demo)
          </p>
        </div>
        {/* Demo Environment Badge */}
        <div className="flex items-center gap-2 text-xs bg-emerald-50 border border-emerald-200 text-emerald-800 px-3 py-2 rounded-lg self-start sm:self-auto">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span className="font-semibold">Demo Environment</span>
          <span className="text-emerald-600">• MockEkoAdapter Active</span>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs">
          <div className="text-xs text-slate-500 font-medium mb-1">Total Transactions</div>
          <div className="text-2xl font-bold text-slate-900">{payments.length}</div>
        </div>
        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs">
          <div className="text-xs text-slate-500 font-medium mb-1">Successful Payments</div>
          <div className="text-2xl font-bold text-emerald-700">{successCount}</div>
          <div className="text-[11px] text-slate-400">
            {payments.length > 0 ? Math.round((successCount / payments.length) * 100) : 0}% success rate
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs">
          <div className="text-xs text-slate-500 font-medium mb-1">Total Payment Volume</div>
          <div className="text-2xl font-bold text-slate-900">₹{totalVolume.toLocaleString()}</div>
        </div>
        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs">
          <div className="text-xs text-slate-500 font-medium mb-1">Failed Transactions</div>
          <div className="text-2xl font-bold text-rose-700">{failedCount}</div>
        </div>
      </div>

      {/* Filter Tabs + Search */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              onClick={() => setStatusFilter(f.id)}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                statusFilter === f.id
                  ? "bg-slate-900 text-white"
                  : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
              }`}
            >
              {f.label}
              <span className={`text-[10px] px-1.5 rounded-full ${statusFilter === f.id ? "bg-slate-700 text-slate-200" : "bg-slate-100 text-slate-500"}`}>
                {f.count}
              </span>
            </button>
          ))}
        </div>
        <div className="relative w-full sm:w-56">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search transaction / order..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white border border-slate-200 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-900 outline-none focus:border-emerald-500"
          />
        </div>
      </div>

      {/* Transactions Table + Detail Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Table */}
        <div className="lg:col-span-2 bg-white rounded-lg border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="bg-slate-50/80 text-slate-500 border-b border-slate-200 font-semibold">
                  <th className="py-2.5 px-4">Transaction ID</th>
                  <th className="py-2.5 px-4">Order</th>
                  <th className="py-2.5 px-4">Customer</th>
                  <th className="py-2.5 px-4">Amount</th>
                  <th className="py-2.5 px-4">Method</th>
                  <th className="py-2.5 px-4">Status</th>
                  <th className="py-2.5 px-4"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((p) => {
                  const isSelected = selectedPayment?.id === p.id;
                  return (
                    <tr
                      key={p.id}
                      onClick={() => setSelectedPayment(p)}
                      className={`hover:bg-slate-50/80 cursor-pointer transition-colors ${isSelected ? "bg-emerald-50/40" : ""}`}
                    >
                      <td className="py-3 px-4 font-mono text-[11px] font-bold text-slate-900 max-w-[140px] truncate">
                        {p.internalTransactionId}
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-slate-900">{p.orderId}</td>
                      <td className="py-3 px-4 font-semibold text-slate-800">{p.customerName}</td>
                      <td className="py-3 px-4 font-bold text-slate-900">₹{p.amount}</td>
                      <td className="py-3 px-4">
                        <span className="bg-slate-100 text-slate-700 text-[10px] font-semibold px-2 py-0.5 rounded">
                          {p.method}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        {p.status === "SUCCESS" ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3" /> SUCCESS
                          </span>
                        ) : p.status === "FAILED" ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-800 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                            <XCircle className="w-3 h-3" /> FAILED
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                            <Clock className="w-3 h-3" /> {p.status}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <ChevronRight className="w-4 h-4 text-slate-400" />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Eko Transaction Detail Panel */}
        <div className="lg:col-span-1">
          {selectedPayment ? (
            <div className="bg-white rounded-lg border border-slate-200 p-4 sm:p-5 shadow-xs space-y-4 sticky top-20">
              <div className="pb-3 border-b border-slate-100">
                <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Payment Details</h2>
                <h3 className="text-sm font-bold text-slate-900 font-mono">{selectedPayment.internalTransactionId}</h3>
              </div>

              {/* Eko Architecture View */}
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs space-y-2">
                <div className="flex justify-between text-slate-600">
                  <span>Provider:</span>
                  <strong className="text-slate-900">{selectedPayment.provider}</strong>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Adapter:</span>
                  <strong className={`${selectedPayment.adapter === "MockEkoAdapter" ? "text-amber-700" : "text-emerald-700"}`}>
                    {selectedPayment.adapter}
                  </strong>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Environment:</span>
                  <span className={`font-semibold ${selectedPayment.environment === "Demo" ? "text-amber-700" : "text-emerald-700"}`}>
                    {selectedPayment.environment}
                  </span>
                </div>
                <div className="flex justify-between text-slate-600 pt-2 border-t border-slate-200">
                  <span>Order ID:</span>
                  <strong className="text-slate-900 font-mono">{selectedPayment.orderId}</strong>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Amount:</span>
                  <strong className="text-emerald-700 text-sm">₹{selectedPayment.amount}</strong>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Method:</span>
                  <span className="font-semibold">{selectedPayment.method}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Status:</span>
                  <span className={`font-bold ${selectedPayment.status === "SUCCESS" ? "text-emerald-700" : selectedPayment.status === "FAILED" ? "text-rose-700" : "text-amber-700"}`}>
                    {selectedPayment.status}
                  </span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Created:</span>
                  <span className="text-[11px]">
                    {new Date(selectedPayment.createdAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>
              </div>

              {selectedPayment.note && (
                <div className="text-[11px] bg-amber-50 border border-amber-200 text-amber-800 p-2.5 rounded-md">
                  {selectedPayment.note}
                </div>
              )}

              {/* Architecture Diagram Label */}
              <div className="pt-2 border-t border-slate-100">
                <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Payment Architecture</h3>
                <div className="space-y-1 text-[11px] text-slate-600">
                  {[
                    "Customer (Digital Kirana Store)",
                    "WebbyBuilder Order Service",
                    "PaymentService (Orchestrator)",
                    `${selectedPayment.adapter} ← Active Adapter`,
                    `Eko Financial Infrastructure`,
                    "Transaction Status → Order Update",
                  ].map((step, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <div className={`w-1.5 h-1.5 rounded-full ${i === 3 ? "bg-emerald-500" : "bg-slate-300"}`} />
                      <span className={i === 3 ? "text-emerald-700 font-bold" : ""}>{step}</span>
                    </div>
                  ))}
                </div>
              </div>

              <Link
                href={`/store/orders/${selectedPayment.orderId}`}
                target="_blank"
                className="w-full bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold py-2 rounded-md flex items-center justify-center gap-1.5 transition-colors"
              >
                View Invoice <ExternalLink className="w-3 h-3" />
              </Link>
            </div>
          ) : (
            <div className="bg-white rounded-lg border border-slate-200 p-8 text-center text-slate-400 text-xs shadow-xs">
              Select a transaction to view the complete Eko adapter details and payment architecture flow.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
