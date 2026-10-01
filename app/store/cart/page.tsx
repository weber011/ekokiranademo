"use client";

import React from "react";
import Link from "next/link";
import { useCart } from "@/components/common/CartContext";
import { StoreHeader } from "@/components/store/StoreHeader";
import { AssistantWidget } from "@/components/assistant/AssistantWidget";
import {
  ShoppingBag,
  Trash2,
  Plus,
  Minus,
  ArrowRight,
  Truck,
  ShieldCheck,
  ChevronLeft,
} from "lucide-react";

export default function CartPage() {
  const { cart, updateQuantity, removeFromCart, clearCart, isLoading } = useCart();

  const isCartEmpty = cart.items.length === 0;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <StoreHeader />

      <main className="max-w-4xl mx-auto px-4 py-6 sm:py-8 w-full flex-1">
        {/* Back Link */}
        <div className="mb-4">
          <Link
            href="/store"
            className="inline-flex items-center gap-1 text-xs font-medium text-slate-600 hover:text-slate-900 transition-colors"
          >
            <ChevronLeft className="w-3.5 h-3.5" /> Continue Shopping
          </Link>
        </div>

        <div className="flex items-center justify-between mb-6">
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <ShoppingBag className="w-6 h-6 text-emerald-600" />
            Your Shopping Cart
          </h1>
          {!isCartEmpty && (
            <button
              onClick={clearCart}
              className="text-xs text-rose-600 hover:text-rose-700 font-medium flex items-center gap-1 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" /> Clear Cart
            </button>
          )}
        </div>

        {isCartEmpty ? (
          <div className="bg-white rounded-xl border border-slate-200 p-8 sm:p-12 text-center max-w-md mx-auto shadow-xs">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400">
              <ShoppingBag className="w-8 h-8" />
            </div>
            <h2 className="text-base font-semibold text-slate-900 mb-1">Your cart is empty</h2>
            <p className="text-xs text-slate-500 mb-6 leading-relaxed">
              Looks like you haven&apos;t added any groceries yet. Browse our catalogue or talk to our Order Assistant to add items instantly.
            </p>
            <Link
              href="/store"
              className="inline-flex items-center justify-center bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-5 py-2.5 rounded-lg shadow-xs transition-colors"
            >
              Browse Grocery Catalogue
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Items List */}
            <div className="md:col-span-2 space-y-3">
              {cart.items.map((item) => (
                <div
                  key={item.productId}
                  className="bg-white rounded-lg border border-slate-200 p-3 sm:p-4 flex items-center justify-between gap-3 shadow-xs"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-12 h-12 rounded-md bg-slate-50 flex items-center justify-center text-xl shrink-0 border border-slate-100">
                      {item.product.image}
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-xs sm:text-sm font-semibold text-slate-900 truncate">
                        {item.product.name}
                      </h3>
                      <div className="text-[11px] text-slate-500">
                        {item.product.unit} • ₹{item.unitPrice} each
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 sm:gap-4 shrink-0">
                    {/* Quantity controls */}
                    <div className="flex items-center bg-slate-100 border border-slate-200 rounded-md overflow-hidden">
                      <button
                        onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                        className="p-1 hover:bg-slate-200 text-slate-700 transition-colors"
                        aria-label="Decrease quantity"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="px-2 text-xs font-bold text-slate-900 min-w-[20px] text-center">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                        disabled={item.quantity >= item.product.stock}
                        className="p-1 hover:bg-slate-200 text-slate-700 disabled:opacity-40 transition-colors"
                        aria-label="Increase quantity"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Total item price */}
                    <div className="w-16 text-right font-bold text-slate-900 text-xs sm:text-sm">
                      ₹{item.totalPrice}
                    </div>

                    {/* Delete action */}
                    <button
                      onClick={() => removeFromCart(item.productId)}
                      className="p-1 text-slate-400 hover:text-rose-600 transition-colors"
                      title="Remove item"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Bill Summary */}
            <div className="md:col-span-1">
              <div className="bg-white rounded-lg border border-slate-200 p-4 sm:p-5 shadow-xs sticky top-20">
                <h2 className="text-sm font-bold text-slate-900 mb-3 pb-2 border-b border-slate-100">
                  Order Bill Summary
                </h2>

                <div className="space-y-2 text-xs mb-4">
                  <div className="flex justify-between text-slate-600">
                    <span>Items Subtotal</span>
                    <span className="font-semibold text-slate-900">₹{cart.subtotal}</span>
                  </div>

                  <div className="flex justify-between text-slate-600">
                    <span className="flex items-center gap-1">
                      <Truck className="w-3 h-3 text-emerald-600" /> Delivery Charges
                    </span>
                    <span className="font-semibold">
                      {cart.deliveryFee === 0 ? (
                        <span className="text-emerald-600 font-bold">FREE</span>
                      ) : (
                        `₹${cart.deliveryFee}`
                      )}
                    </span>
                  </div>

                  {cart.deliveryFee > 0 && (
                    <div className="text-[10px] text-amber-700 bg-amber-50 p-1.5 rounded border border-amber-200">
                      Add ₹{500 - cart.subtotal} more to get <strong>FREE delivery</strong>!
                    </div>
                  )}

                  <div className="pt-2 border-t border-slate-100 flex justify-between text-sm font-bold text-slate-900">
                    <span>To Pay</span>
                    <span className="text-emerald-700 text-base">₹{cart.total}</span>
                  </div>
                </div>

                <Link
                  href="/store/checkout"
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-2.5 px-4 rounded-lg text-xs sm:text-sm flex items-center justify-center gap-2 shadow-xs transition-colors"
                >
                  <span>Proceed to Checkout</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>

                <div className="mt-3 text-center text-[10px] text-slate-400 flex items-center justify-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-emerald-600" />
                  Eko Financial Infrastructure Protected
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      <AssistantWidget />
    </div>
  );
}
