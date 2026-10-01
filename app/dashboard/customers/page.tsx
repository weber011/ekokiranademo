"use client";

import React, { useEffect, useState } from "react";
import { Customer } from "@/types";
import {
  Users,
  Search,
  Phone,
  MapPin,
  IndianRupee,
  ShoppingBag,
  BookOpen,
  PlusCircle,
  ArrowDownRight,
  ArrowUpRight,
  X,
  MessageSquare,
  CheckCircle2,
} from "lucide-react";

interface KhaataData {
  id: string;
  customerId: string;
  customerName: string;
  customerMobile: string;
  balance: number;
  creditLimit: number;
}

interface KhaataTx {
  id: string;
  accountId: string;
  type: "CREDIT" | "DEBIT" | "SETTLEMENT";
  amount: number;
  balanceAfter: number;
  reference?: string;
  note?: string;
  createdAt: string;
}

export default function DashboardCustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  // Khaata Modal State
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [khaataAccount, setKhaataAccount] = useState<KhaataData | null>(null);
  const [khaataHistory, setKhaataHistory] = useState<KhaataTx[]>([]);
  const [isKhaataLoading, setIsKhaataLoading] = useState(false);

  // Add Transaction Form State
  const [txType, setTxType] = useState<"CREDIT" | "DEBIT">("CREDIT");
  const [txAmount, setTxAmount] = useState<string>("");
  const [txNote, setTxNote] = useState<string>("");
  const [isSubmittingTx, setIsSubmittingTx] = useState(false);
  const [txSuccessMessage, setTxSuccessMessage] = useState("");

  const loadCustomers = async () => {
    try {
      const res = await fetch("/api/customers");
      const data = await res.json();
      if (data.success) setCustomers(data.customers);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadCustomers();
  }, []);

  const openKhaataModal = async (customer: Customer) => {
    setSelectedCustomer(customer);
    setIsKhaataLoading(true);
    setTxSuccessMessage("");
    setTxAmount("");
    setTxNote("");

    try {
      const res = await fetch(`/api/khaata?customerId=${customer.id}`);
      const data = await res.json();
      if (data.success) {
        setKhaataAccount(data.account);
        setKhaataHistory(data.history || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsKhaataLoading(false);
    }
  };

  const handleRecordTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomer || !txAmount || parseFloat(txAmount) <= 0) return;

    setIsSubmittingTx(true);
    try {
      const res = await fetch("/api/khaata/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerId: selectedCustomer.id,
          type: txType,
          amount: parseFloat(txAmount),
          note: txNote || (txType === "CREDIT" ? "Grocery on credit" : "Cash payment received"),
        }),
      });

      const data = await res.json();
      if (data.success) {
        setTxSuccessMessage(`Recorded ₹${txAmount} ${txType === "CREDIT" ? "credit" : "payment"}`);
        setTxAmount("");
        setTxNote("");
        // Reload history
        const refreshed = await fetch(`/api/khaata?customerId=${selectedCustomer.id}`);
        const refData = await refreshed.json();
        if (refData.success) {
          setKhaataAccount(refData.account);
          setKhaataHistory(refData.history || []);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsSubmittingTx(false);
    }
  };

  const filtered = customers.filter((c) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      c.name.toLowerCase().includes(q) ||
      c.mobile.includes(q) ||
      c.address.toLowerCase().includes(q)
    );
  });

  const totalCustomers = customers.length;
  const totalRevenue = customers.reduce((sum, c) => sum + c.totalSpent, 0);
  const avgSpend = totalCustomers > 0 ? Math.round(totalRevenue / totalCustomers) : 0;
  const topCustomer = [...customers].sort((a, b) => b.totalSpent - a.totalSpent)[0];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Customer Directory & Khaata Ledger
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            {totalCustomers} registered customers • Ranchi delivery area • Double-entry ledger
          </p>
        </div>
        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by name or mobile..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white border border-slate-200 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-900 outline-none focus:border-emerald-500"
          />
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs">
          <div className="text-xs text-slate-500 font-medium mb-1">Total Customers</div>
          <div className="text-2xl font-bold text-slate-900">{totalCustomers}</div>
        </div>
        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs">
          <div className="text-xs text-slate-500 font-medium mb-1">Total Revenue</div>
          <div className="text-2xl font-bold text-emerald-700">₹{totalRevenue.toLocaleString()}</div>
        </div>
        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs">
          <div className="text-xs text-slate-500 font-medium mb-1">Avg. Spend per Customer</div>
          <div className="text-2xl font-bold text-slate-900">₹{avgSpend.toLocaleString()}</div>
        </div>
        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs">
          <div className="text-xs text-slate-500 font-medium mb-1">Top Customer</div>
          <div className="text-sm font-bold text-slate-900">{topCustomer?.name || "—"}</div>
          <div className="text-[11px] text-emerald-700">₹{topCustomer?.totalSpent?.toLocaleString()}</div>
        </div>
      </div>

      {/* Customers Table */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="bg-slate-50/80 text-slate-500 border-b border-slate-200 font-semibold">
                <th className="py-2.5 px-4">Customer</th>
                <th className="py-2.5 px-4">Mobile</th>
                <th className="py-2.5 px-4">Location</th>
                <th className="py-2.5 px-4">Orders</th>
                <th className="py-2.5 px-4">Total Spent</th>
                <th className="py-2.5 px-4">Last Order</th>
                <th className="py-2.5 px-4 text-right">Khaata Ledger</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((c) => (
                <tr key={c.id} className="hover:bg-slate-50/60 text-slate-800">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-slate-900 text-white font-bold text-xs flex items-center justify-center shrink-0">
                        {c.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")
                          .slice(0, 2)}
                      </div>
                      <div className="font-semibold text-slate-900">{c.name}</div>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <span className="flex items-center gap-1 text-slate-600">
                      <Phone className="w-3 h-3 text-slate-400" />
                      {c.mobile}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span className="flex items-center gap-1 text-slate-500 max-w-[180px] truncate">
                      <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                      {c.address.split(",").slice(-2).join(",").trim()}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-bold text-slate-900">
                    <span className="flex items-center gap-1">
                      <ShoppingBag className="w-3 h-3 text-slate-400" />
                      {c.totalOrders}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-bold text-emerald-700">
                    ₹{c.totalSpent.toLocaleString()}
                  </td>
                  <td className="py-3 px-4 text-slate-500">
                    {new Date(c.lastOrderDate).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                    })}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={() => openKhaataModal(c)}
                      className="inline-flex items-center gap-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-semibold px-2.5 py-1 rounded border border-emerald-200 transition-colors"
                    >
                      <BookOpen className="w-3 h-3" />
                      <span>Khaata</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* KHAATA MODAL DRAWER */}
      {selectedCustomer && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-xl w-full border border-slate-200 shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div>
                <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-emerald-600" />
                  Khaata Ledger — {selectedCustomer.name}
                </h2>
                <p className="text-[11px] text-slate-500">{selectedCustomer.mobile}</p>
              </div>
              <button
                onClick={() => setSelectedCustomer(null)}
                className="p-1.5 rounded-md hover:bg-slate-200 text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1">
              {/* Balance Card */}
              <div className="p-4 rounded-lg bg-emerald-50/70 border border-emerald-200 flex items-center justify-between">
                <div>
                  <div className="text-[11px] font-medium text-slate-600">Current Outstanding (Udhaar)</div>
                  <div className="text-2xl font-bold text-slate-900">
                    ₹{khaataAccount?.balance?.toLocaleString() ?? 0}
                  </div>
                </div>
                {khaataAccount && khaataAccount.balance > 0 && (
                  <a
                    href={`https://wa.me/${selectedCustomer.mobile.replace(/\D/g, "")}?text=Namaste%20${encodeURIComponent(
                      selectedCustomer.name
                    )},%20Sharma%20General%20Store%20se%20aapka%20pending%20Khaata%20balance%20Rs.%20${
                      khaataAccount.balance
                    }%20hai.%20Kripya%20UPI/cash%20se%20settle%20karein.%20Dhanyawaad!`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-3 py-1.5 rounded-md shadow-xs transition-colors"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>WhatsApp Reminder</span>
                  </a>
                )}
              </div>

              {/* Record New Transaction Form */}
              <form onSubmit={handleRecordTransaction} className="p-3.5 bg-slate-50 rounded-lg border border-slate-200 space-y-3">
                <div className="text-xs font-bold text-slate-900">Record New Transaction</div>

                {txSuccessMessage && (
                  <div className="p-2 bg-emerald-100/70 text-emerald-800 rounded text-xs flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>{txSuccessMessage}</span>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setTxType("CREDIT")}
                    className={`p-2 rounded text-xs font-bold flex items-center justify-center gap-1.5 border transition-all ${
                      txType === "CREDIT"
                        ? "bg-rose-50 border-rose-400 text-rose-700"
                        : "bg-white border-slate-200 text-slate-600"
                    }`}
                  >
                    <ArrowUpRight className="w-3.5 h-3.5" />
                    Give Goods on Udhaar (Credit)
                  </button>
                  <button
                    type="button"
                    onClick={() => setTxType("DEBIT")}
                    className={`p-2 rounded text-xs font-bold flex items-center justify-center gap-1.5 border transition-all ${
                      txType === "DEBIT"
                        ? "bg-emerald-50 border-emerald-400 text-emerald-700"
                        : "bg-white border-slate-200 text-slate-600"
                    }`}
                  >
                    <ArrowDownRight className="w-3.5 h-3.5" />
                    Received Cash / Payment (Debit)
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 mb-1">Amount (₹)</label>
                    <input
                      type="number"
                      required
                      min="1"
                      step="1"
                      placeholder="e.g. 250"
                      value={txAmount}
                      onChange={(e) => setTxAmount(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded px-2.5 py-1.5 text-xs text-slate-900 outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 mb-1">Note / Description</label>
                    <input
                      type="text"
                      placeholder="e.g. 5kg Atta & Oil"
                      value={txNote}
                      onChange={(e) => setTxNote(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded px-2.5 py-1.5 text-xs text-slate-900 outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmittingTx || !txAmount}
                  className="w-full bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white font-semibold py-1.5 rounded text-xs transition-colors"
                >
                  {isSubmittingTx ? "Saving to Ledger..." : "Add to Ledger"}
                </button>
              </form>

              {/* Transaction History Log */}
              <div>
                <div className="text-xs font-bold text-slate-900 mb-2">Ledger Entries</div>
                {khaataHistory.length === 0 ? (
                  <div className="text-center py-6 text-xs text-slate-400 border border-dashed rounded-lg">
                    No transactions recorded yet for this customer.
                  </div>
                ) : (
                  <div className="space-y-1.5 max-h-48 overflow-y-auto">
                    {khaataHistory.map((tx) => (
                      <div
                        key={tx.id}
                        className="p-2.5 rounded-lg border border-slate-200 bg-white flex items-center justify-between text-xs"
                      >
                        <div className="flex items-center gap-2">
                          <div
                            className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-[10px] ${
                              tx.type === "CREDIT"
                                ? "bg-rose-100 text-rose-700"
                                : "bg-emerald-100 text-emerald-700"
                            }`}
                          >
                            {tx.type === "CREDIT" ? "+" : "−"}
                          </div>
                          <div>
                            <div className="font-semibold text-slate-900">{tx.note || tx.type}</div>
                            <div className="text-[10px] text-slate-400">
                              {new Date(tx.createdAt).toLocaleDateString("en-IN", {
                                day: "numeric",
                                month: "short",
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div
                            className={`font-bold ${
                              tx.type === "CREDIT" ? "text-rose-600" : "text-emerald-700"
                            }`}
                          >
                            {tx.type === "CREDIT" ? "+" : "−"}₹{tx.amount.toLocaleString()}
                          </div>
                          <div className="text-[10px] text-slate-400">Bal: ₹{tx.balanceAfter.toLocaleString()}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
