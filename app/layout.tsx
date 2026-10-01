import type { Metadata } from "next";
import "./globals.css";
import { CartProvider } from "@/components/common/CartContext";

export const metadata: Metadata = {
  title: "Digital Kirana — Sharma General Store, Ranchi",
  description: "Your store, orders and payments — all in one place. Powered by WebbyBuilder.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-50 text-slate-900 antialiased font-sans">
        <CartProvider>{children}</CartProvider>
      </body>
    </html>
  );
}
