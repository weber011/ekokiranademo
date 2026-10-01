"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Invoice, Order } from "@/types";
import {
  Printer,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Store,
  ChevronLeft,
  ShieldCheck,
  Package,
} from "lucide-react";

export default function OrderInvoicePage() {
  const params = useParams();
  const orderId = params.id as string;

  const [order, setOrder] = useState<Order | null>(null);
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadOrder() {
      try {
        const res = await fetch(`/api/orders/${orderId}`);
        const data = await res.json();
        if (data.success) {
          setOrder(data.order);
          setInvoice(data.invoice);
        }
      } catch (e) {
        console.error("Failed to load invoice:", e);
      } finally {
        setIsLoading(false);
      }
    }
    if (orderId) loadOrder();
  }, [orderId]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="text-center space-y-2">
          <div className="w-8 h-8 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-slate-500 font-medium">Generating Tax Invoice...</p>
        </div>
      </div>
    );
  }

  if (!order || !invoice) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white border border-slate-200 rounded-xl p-8 max-w-md text-center shadow-xs">
          <h2 className="text-base font-bold text-slate-900 mb-2">Order Not Found</h2>
          <p className="text-xs text-slate-500 mb-4">
            Could not find an active invoice for order ID <strong>{orderId}</strong>.
          </p>
          <Link
            href="/store"
            className="bg-emerald-600 text-white text-xs font-semibold px-4 py-2 rounded-md"
          >
            Return to Store
          </Link>
        </div>
      </div>
    );
  }

  const isPaid = order.paymentStatus === "PAID";

  return (
    <div className="min-h-screen bg-slate-100 py-6 sm:py-10 px-4">
      {/* Top Action Bar */}
      <div className="max-w-2xl mx-auto mb-4 flex items-center justify-between no-print">
        <Link
          href="/store"
          className="inline-flex items-center gap-1 text-xs font-medium text-slate-600 hover:text-slate-900 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" /> Back to Store
        </Link>
        <div className="flex items-center gap-2">
          <Link
            href="/dashboard/orders"
            className="bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-semibold px-3 py-1.5 rounded-md flex items-center gap-1.5 transition-colors"
          >
            <Store className="w-3.5 h-3.5" /> Merchant View
          </Link>
          <button
            onClick={() => window.print()}
            className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold px-3 py-1.5 rounded-md flex items-center gap-1.5 transition-colors shadow-xs"
          >
            <Printer className="w-3.5 h-3.5" /> Print Invoice
          </button>
        </div>
      </div>

      {/* Main Printable Invoice Sheet */}
      <div className="max-w-2xl mx-auto bg-white border border-slate-300 rounded-lg p-6 sm:p-8 shadow-sm">
        {/* Invoice Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start pb-6 border-b border-slate-200 gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-7 h-7 rounded bg-emerald-600 text-white font-bold flex items-center justify-center text-xs">
                DK
              </div>
              <h1 className="text-lg font-bold text-slate-900 tracking-tight">Digital Kirana</h1>
            </div>
            <div className="text-xs font-semibold text-slate-700">Sharma General Store</div>
            <div className="text-[11px] text-slate-500">
              Kanke Road, Near CMPDI, Ranchi, Jharkhand — 834008
            </div>
            <div className="text-[11px] text-slate-500">
              GSTIN / Reg: 20AABCS1429B1Z8 • Ph: +91 98351 24567
            </div>
          </div>

          <div className="text-left sm:text-right space-y-1">
            <div className="text-sm font-bold text-slate-900">{invoice.invoiceNumber}</div>
            <div className="text-xs text-slate-600">
              Order Ref: <strong className="text-slate-900">{invoice.orderId}</strong>
            </div>
            <div className="text-xs text-slate-500">Date: {invoice.date}</div>
            <div>
              {isPaid ? (
                <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded border border-emerald-300">
                  <CheckCircle2 className="w-3 h-3" /> PAID
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded border border-amber-300">
                  <Clock className="w-3 h-3" /> PENDING
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Billed To / Shipping Details */}
        <div className="py-4 border-b border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
              Billed To Customer
            </span>
            <div className="font-semibold text-slate-900">{invoice.customerName}</div>
            <div className="text-slate-600">{invoice.customerMobile}</div>
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
              Delivery Address
            </span>
            <div className="text-slate-700 leading-relaxed">{invoice.deliveryAddress}</div>
          </div>
        </div>

        {/* Itemized Table */}
        <div className="py-4">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500 font-semibold">
                <th className="pb-2">#</th>
                <th className="pb-2">Item Description</th>
                <th className="pb-2 text-center">Unit</th>
                <th className="pb-2 text-center">Qty</th>
                <th className="pb-2 text-right">Price</th>
                <th className="pb-2 text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {invoice.items.map((item, idx) => (
                <tr key={idx} className="text-slate-800">
                  <td className="py-2.5 text-slate-400">{idx + 1}</td>
                  <td className="py-2.5 font-medium">{item.name}</td>
                  <td className="py-2.5 text-center text-slate-500">{item.unit}</td>
                  <td className="py-2.5 text-center font-bold text-slate-900">{item.quantity}</td>
                  <td className="py-2.5 text-right text-slate-600">₹{item.unitPrice}</td>
                  <td className="py-2.5 text-right font-semibold text-slate-900">₹{item.totalPrice}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals Calculation */}
        <div className="pt-3 border-t border-slate-200">
          <div className="max-w-xs ml-auto space-y-1.5 text-xs">
            <div className="flex justify-between text-slate-600">
              <span>Subtotal:</span>
              <span className="font-semibold text-slate-900">₹{invoice.subtotal}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Delivery Fee:</span>
              <span>{invoice.deliveryFee === 0 ? "FREE" : `₹${invoice.deliveryFee}`}</span>
            </div>
            <div className="pt-2 border-t border-slate-200 flex justify-between text-sm font-bold text-slate-900">
              <span>Total Amount:</span>
              <span className="text-emerald-700 text-base">₹{invoice.total}</span>
            </div>
          </div>
        </div>

        {/* Payment Infrastructure & Verification Footer */}
        <div className="mt-6 pt-4 border-t border-slate-200 bg-slate-50 -mx-6 -mb-6 p-4 sm:p-6 rounded-b-lg text-[11px] text-slate-500">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-2">
            <div>
              <span className="font-semibold text-slate-700">Payment Mode:</span> {invoice.paymentMethod}
            </div>
            <div>
              <span className="font-semibold text-slate-700">Transaction Ref:</span>{" "}
              <span className="font-mono text-slate-900 font-semibold">{invoice.transactionRef}</span>
            </div>
          </div>
          <div className="flex items-center justify-between pt-2 border-t border-slate-200 text-[10px] text-slate-400">
            <span>Powered by <strong>WebbyBuilder</strong></span>
            <span className="flex items-center gap-1 text-emerald-700">
              <ShieldCheck className="w-3 h-3" /> Financial Infrastructure: Eko Adapter (Demo)
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
