"use client";

import React from "react";
import { Product } from "@/types";
import { useCart } from "@/components/common/CartContext";
import { Plus, Minus, AlertCircle } from "lucide-react";

export function ProductCard({ product }: { product: Product }) {
  const { cart, addToCart, updateQuantity } = useCart();

  const cartItem = cart.items.find((it) => it.productId === product.id);
  const currentQuantity = cartItem?.quantity || 0;

  const isOutOfStock = product.stock <= 0;
  const isLowStock = product.stock > 0 && product.stock <= product.reorderLevel;
  const discountPercent =
    product.mrp > product.price
      ? Math.round(((product.mrp - product.price) / product.mrp) * 100)
      : 0;

  return (
    <div className="bg-white rounded-lg border border-slate-200 p-3 sm:p-3.5 flex flex-col justify-between hover:border-slate-300 hover:shadow-xs transition-all">
      <div>
        {/* Top bar: Category & Discount Badge */}
        <div className="flex items-center justify-between gap-1 mb-2">
          <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider truncate">
            {product.brand}
          </span>
          {discountPercent > 0 && (
            <span className="bg-emerald-50 text-emerald-700 text-[10px] font-bold px-1.5 py-0.5 rounded border border-emerald-200">
              {discountPercent}% OFF
            </span>
          )}
        </div>

        {/* Product Visual & Unit */}
        <div className="h-20 bg-slate-50 rounded-md flex items-center justify-center text-3xl mb-2.5 border border-slate-100 relative">
          <span>{product.image}</span>
          {isLowStock && (
            <span className="absolute bottom-1 right-1 bg-amber-100 text-amber-800 text-[9px] font-semibold px-1.5 py-0.2 rounded flex items-center gap-0.5">
              <AlertCircle className="w-2.5 h-2.5" /> Only {product.stock} left
            </span>
          )}
        </div>

        {/* Product Title & Unit */}
        <h3 className="font-semibold text-slate-900 text-xs sm:text-sm line-clamp-2 leading-snug mb-1">
          {product.name}
        </h3>
        <div className="text-[11px] text-slate-500 font-medium mb-2">
          Pack: <span className="text-slate-700 font-semibold">{product.unit}</span>
        </div>
      </div>

      {/* Pricing & Cart Action */}
      <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2 mt-auto">
        <div>
          <div className="flex items-baseline gap-1.5">
            <span className="font-bold text-slate-900 text-sm sm:text-base">
              ₹{product.price}
            </span>
            {product.mrp > product.price && (
              <span className="text-[11px] text-slate-400 line-through">
                ₹{product.mrp}
              </span>
            )}
          </div>
        </div>

        <div>
          {isOutOfStock ? (
            <button
              disabled
              className="bg-slate-100 text-slate-400 text-xs font-semibold px-2.5 py-1.5 rounded cursor-not-allowed border border-slate-200"
            >
              Out of stock
            </button>
          ) : currentQuantity > 0 ? (
            <div className="flex items-center bg-emerald-50 border border-emerald-300 rounded-md overflow-hidden">
              <button
                onClick={() => updateQuantity(product.id, currentQuantity - 1)}
                className="p-1 hover:bg-emerald-100 text-emerald-800 transition-colors"
                aria-label="Decrease quantity"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>
              <span className="px-2 text-xs font-bold text-emerald-900 min-w-[20px] text-center">
                {currentQuantity}
              </span>
              <button
                onClick={() => updateQuantity(product.id, currentQuantity + 1)}
                disabled={currentQuantity >= product.stock}
                className="p-1 hover:bg-emerald-100 text-emerald-800 disabled:opacity-40 transition-colors"
                aria-label="Increase quantity"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => addToCart(product.id, 1)}
              className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-3 py-1.5 rounded-md shadow-xs transition-colors flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
