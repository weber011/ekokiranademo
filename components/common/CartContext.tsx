"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { Cart } from "@/types";

interface CartContextType {
  cart: Cart;
  isLoading: boolean;
  isAssistantOpen: boolean;
  setIsAssistantOpen: (open: boolean) => void;
  toast: { message: string; type: "success" | "error" | "info" } | null;
  showToast: (message: string, type?: "success" | "error" | "info") => void;
  fetchCart: () => Promise<void>;
  addToCart: (productId: string, quantity?: number) => Promise<boolean>;
  updateQuantity: (productId: string, quantity: number) => Promise<boolean>;
  removeFromCart: (productId: string) => Promise<boolean>;
  clearCart: () => Promise<void>;
  totalItemsCount: number;
}

const defaultCart: Cart = {
  id: "default-session",
  items: [],
  subtotal: 0,
  deliveryFee: 0,
  total: 0,
  updatedAt: new Date().toISOString(),
};

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<Cart>(defaultCart);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isAssistantOpen, setIsAssistantOpen] = useState<boolean>(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "info" } | null>(null);

  const showToast = useCallback((message: string, type: "success" | "error" | "info" = "success") => {
    setToast({ message, type });
    setTimeout(() => {
      setToast((prev) => (prev?.message === message ? null : prev));
    }, 3500);
  }, []);

  const fetchCart = useCallback(async () => {
    try {
      const res = await fetch("/api/cart?cartId=default-session");
      const data = await res.json();
      if (data.success && data.cart) {
        setCart(data.cart);
      }
    } catch (e) {
      console.error("Failed to load cart:", e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  const addToCart = async (productId: string, quantity: number = 1): Promise<boolean> => {
    try {
      const res = await fetch("/api/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cartId: "default-session", productId, quantity }),
      });
      const data = await res.json();
      if (data.success) {
        setCart(data.cart);
        showToast(data.message || "Added to cart", "success");
        return true;
      } else {
        showToast(data.error || data.message || "Could not add item", "error");
        return false;
      }
    } catch (e) {
      showToast("Network error updating cart", "error");
      return false;
    }
  };

  const updateQuantity = async (productId: string, quantity: number): Promise<boolean> => {
    try {
      const res = await fetch("/api/cart", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cartId: "default-session", productId, quantity }),
      });
      const data = await res.json();
      if (data.success) {
        setCart(data.cart);
        return true;
      } else {
        showToast(data.error || "Update failed", "error");
        return false;
      }
    } catch (e) {
      showToast("Network error updating cart", "error");
      return false;
    }
  };

  const removeFromCart = async (productId: string): Promise<boolean> => {
    try {
      const res = await fetch(`/api/cart?cartId=default-session&productId=${productId}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.success) {
        setCart(data.cart);
        showToast(data.message || "Item removed", "info");
        return true;
      }
      return false;
    } catch (e) {
      showToast("Network error removing item", "error");
      return false;
    }
  };

  const clearCart = async () => {
    try {
      const res = await fetch("/api/cart?cartId=default-session", { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        setCart(data.cart);
        showToast("Cart cleared", "info");
      }
    } catch (e) {
      console.error(e);
    }
  };

  const totalItemsCount = cart.items.reduce((acc, it) => acc + it.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        cart,
        isLoading,
        isAssistantOpen,
        setIsAssistantOpen,
        toast,
        showToast,
        fetchCart,
        addToCart,
        updateQuantity,
        removeFromCart,
        clearCart,
        totalItemsCount,
      }}
    >
      {children}
      {toast && (
        <div className="fixed bottom-5 right-5 z-50 flex items-center gap-2 bg-slate-900 text-white text-xs sm:text-sm font-medium px-4 py-2.5 rounded-lg shadow-lg border border-slate-700 animate-fade-in">
          <span
            className={`w-2 h-2 rounded-full ${
              toast.type === "success"
                ? "bg-emerald-400"
                : toast.type === "error"
                ? "bg-rose-400"
                : "bg-sky-400"
            }`}
          />
          {toast.message}
        </div>
      )}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
