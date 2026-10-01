"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useCart } from "@/components/common/CartContext";
import { StoreHeader } from "@/components/store/StoreHeader";
import { PaymentMethod } from "@/types";
import {
  ShieldCheck,
  CreditCard,
  Truck,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  ChevronLeft,
  QrCode,
  Smartphone,
  Banknote,
  Sparkles,
} from "lucide-react";

function CheckoutContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { cart, clearCart, showToast } = useCart();

  // Form State with realistic default values for instant demo convenience
  const [customerName, setCustomerName] = useState("Rahul Kumar");
  const [customerMobile, setCustomerMobile] = useState("+91 98351 10293");
  const [deliveryAddress, setDeliveryAddress] = useState(
    "Flat 302, Green Valley Apts, Kanke Road, Ranchi, Jharkhand"
  );
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(
    (searchParams.get("method") as PaymentMethod) || "UPI"
  );
  const [simulateFailure, setSimulateFailure] = useState(false);

  // Payment Execution State
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentStep, setPaymentStep] = useState<
    "FORM" | "INITIATED" | "PROCESSING" | "SUCCESS" | "FAILED"
  >("FORM");
  const [transactionRef, setTransactionRef] = useState<string>("");
  const [createdOrderId, setCreatedOrderId] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string>("");

  useEffect(() => {
    const m = searchParams.get("method") as PaymentMethod;
    if (m) setPaymentMethod(m);
  }, [searchParams]);

  if (cart.items.length === 0 && paymentStep === "FORM") {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col">
        <StoreHeader />
        <div className="max-w-md mx-auto my-12 p-8 bg-white border border-slate-200 rounded-xl text-center shadow-xs">
          <h2 className="text-base font-bold text-slate-900 mb-2">Your Cart is Empty</h2>
          <p className="text-xs text-slate-500 mb-4">
            Add grocery items to your cart before proceeding to checkout.
          </p>
          <Link
            href="/store"
            className="inline-block bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-4 py-2 rounded-md"
          >
            Go to Store
          </Link>
        </div>
      </div>
    );
  }

  const handleCreateOrderAndPay = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName || !customerMobile || !deliveryAddress) {
      showToast("Please fill in all delivery details.", "error");
      return;
    }

    setIsProcessing(true);
    setErrorMessage("");

    try {
      // 1. Create official Order in WebbyBuilder Order Service
      const orderRes = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cartId: "default-session",
          customerName,
          customerMobile,
          deliveryAddress,
          paymentMethod,
        }),
      });

      const orderData = await orderRes.json();
      if (!orderData.success) {
        throw new Error(orderData.error || "Failed to create order");
      }

      const orderId = orderData.order.id;
      setCreatedOrderId(orderId);

      // If Cash on Delivery, complete immediately without online payment rail
      if (paymentMethod === "COD") {
        setPaymentStep("SUCCESS");
        setIsProcessing(false);
        setTimeout(() => {
          router.push(`/store/orders/${orderId}`);
        }, 1500);
        return;
      }

      // 2. Initiate Online Payment via Eko Adapter Layer
      setPaymentStep("INITIATED");

      const payRes = await fetch("/api/payments/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId,
          customerName,
          customerMobile,
          amount: cart.total,
          paymentMethod,
          simulateFailure,
        }),
      });

      const payData = await payRes.json();
      if (!payData.success && payData.payment?.status === "FAILED") {
        setTransactionRef(payData.payment.internalTransactionId);
        setPaymentStep("FAILED");
        setErrorMessage(payData.payment.message || "Payment declined by provider.");
        setIsProcessing(false);
        return;
      }

      const txRef = payData.payment.internalTransactionId;
      setTransactionRef(txRef);

      // Simulate step transition: INITIATED -> PROCESSING -> SUCCESS
      setTimeout(async () => {
        setPaymentStep("PROCESSING");

        // Polling payment settlement from Eko Adapter
        setTimeout(async () => {
          const statusRes = await fetch(`/api/payments/status?ref=${txRef}`);
          const statusData = await statusRes.json();

          if (statusData.success && statusData.status === "SUCCESS") {
            setPaymentStep("SUCCESS");
            setTimeout(() => {
              router.push(`/store/orders/${orderId}`);
            }, 1800);
          } else {
            setPaymentStep("FAILED");
            setErrorMessage("Payment verification failed on provider rail.");
          }
          setIsProcessing(false);
        }, 1200);
      }, 1000);
    } catch (err: any) {
      console.error(err);
      setPaymentStep("FAILED");
      setErrorMessage(err.message || "An error occurred during checkout.");
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <StoreHeader />

      <main className="max-w-4xl mx-auto px-4 py-6 sm:py-8 w-full flex-1">
        {/* Breadcrumb / Back */}
        <div className="mb-4">
          <Link
            href="/store/cart"
            className="inline-flex items-center gap-1 text-xs font-medium text-slate-600 hover:text-slate-900 transition-colors"
          >
            <ChevronLeft className="w-3.5 h-3.5" /> Back to Cart
          </Link>
        </div>

        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight mb-6">
          Checkout & Delivery
        </h1>

        {/* PAYMENT PROCESSING OVERLAY / STATUS SCREEN */}
        {paymentStep !== "FORM" ? (
          <div className="bg-white rounded-xl border border-slate-200 p-6 sm:p-10 max-w-lg mx-auto shadow-sm text-center">
            {paymentStep === "INITIATED" && (
              <div className="space-y-4">
                <div className="w-14 h-14 bg-amber-50 border border-amber-200 rounded-full flex items-center justify-center mx-auto text-amber-600 animate-pulse">
                  <Loader2 className="w-7 h-7 animate-spin" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900">Initiating Payment</h2>
                  <p className="text-xs text-slate-500 mt-1">
                    Routing transaction through Eko Financial Adapter...
                  </p>
                </div>
                <div className="bg-slate-50 rounded-lg p-3 text-xs text-left space-y-1.5 border border-slate-200">
                  <div className="flex justify-between text-slate-600">
                    <span>Order Reference:</span>
                    <strong className="text-slate-900">{createdOrderId}</strong>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Provider:</span>
                    <strong className="text-slate-900">Eko (Demo Mode)</strong>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Amount:</span>
                    <strong className="text-emerald-700 font-bold">₹{cart.total}</strong>
                  </div>
                </div>
              </div>
            )}

            {paymentStep === "PROCESSING" && (
              <div className="space-y-4">
                <div className="w-14 h-14 bg-sky-50 border border-sky-200 rounded-full flex items-center justify-center mx-auto text-sky-600">
                  <Loader2 className="w-7 h-7 animate-spin" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900">Processing Payment</h2>
                  <p className="text-xs text-slate-500 mt-1">
                    Awaiting confirmation from bank settlement rail...
                  </p>
                </div>
                <div className="bg-slate-50 rounded-lg p-3 text-xs text-left space-y-1.5 border border-slate-200">
                  <div className="flex justify-between text-slate-600">
                    <span>Transaction Reference:</span>
                    <strong className="text-slate-900 font-mono text-[11px]">{transactionRef}</strong>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Status:</span>
                    <span className="bg-sky-100 text-sky-800 text-[10px] font-semibold px-2 py-0.5 rounded">
                      PROCESSING
                    </span>
                  </div>
                </div>
              </div>
            )}

            {paymentStep === "SUCCESS" && (
              <div className="space-y-4">
                <div className="w-14 h-14 bg-emerald-50 border border-emerald-200 rounded-full flex items-center justify-center mx-auto text-emerald-600">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900">Payment Successful!</h2>
                  <p className="text-xs text-slate-500 mt-1">
                    Your grocery order has been confirmed and marked as PAID.
                  </p>
                </div>
                <div className="bg-emerald-50/60 rounded-lg p-3 text-xs text-left space-y-1.5 border border-emerald-200">
                  <div className="flex justify-between text-slate-600">
                    <span>Order ID:</span>
                    <strong className="text-slate-900">{createdOrderId}</strong>
                  </div>
                  {transactionRef && (
                    <div className="flex justify-between text-slate-600">
                      <span>Transaction Ref:</span>
                      <strong className="text-slate-900 font-mono text-[11px]">{transactionRef}</strong>
                    </div>
                  )}
                  <div className="flex justify-between text-slate-600">
                    <span>Total Amount Paid:</span>
                    <strong className="text-emerald-700 font-bold">₹{cart.total}</strong>
                  </div>
                </div>
                <p className="text-[11px] text-slate-400">Generating tax invoice...</p>
              </div>
            )}

            {paymentStep === "FAILED" && (
              <div className="space-y-4">
                <div className="w-14 h-14 bg-rose-50 border border-rose-200 rounded-full flex items-center justify-center mx-auto text-rose-600">
                  <AlertTriangle className="w-8 h-8" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900">Payment Failed</h2>
                  <p className="text-xs text-rose-600 mt-1">{errorMessage}</p>
                </div>
                <p className="text-[11px] text-slate-500">
                  Your order has NOT been marked as paid. You can try again or choose another payment method.
                </p>
                <div className="pt-2 flex gap-2 justify-center">
                  <button
                    onClick={() => {
                      setPaymentStep("FORM");
                      setSimulateFailure(false);
                    }}
                    className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold px-4 py-2 rounded-md transition-colors"
                  >
                    Try Again
                  </button>
                  <Link
                    href="/store/cart"
                    className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold px-4 py-2 rounded-md transition-colors"
                  >
                    Return to Cart
                  </Link>
                </div>
              </div>
            )}
          </div>
        ) : (
          /* MAIN CHECKOUT FORM */
          <form onSubmit={handleCreateOrderAndPay} className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Left 2 Cols: Customer & Delivery Info + Payment Mode */}
            <div className="md:col-span-2 space-y-6">
              {/* Delivery Details Card */}
              <div className="bg-white rounded-lg border border-slate-200 p-4 sm:p-5 shadow-xs">
                <h2 className="text-sm font-bold text-slate-900 mb-4 pb-2 border-b border-slate-100 flex items-center gap-2">
                  <Truck className="w-4 h-4 text-emerald-600" />
                  1. Delivery Details
                </h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 mb-3.5">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Full Name <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-emerald-500 rounded-md px-3 py-2 text-xs text-slate-900 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Mobile Number <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={customerMobile}
                      onChange={(e) => setCustomerMobile(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-emerald-500 rounded-md px-3 py-2 text-xs text-slate-900 outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Delivery Address in Ranchi <span className="text-rose-500">*</span>
                  </label>
                  <textarea
                    rows={2}
                    required
                    value={deliveryAddress}
                    onChange={(e) => setDeliveryAddress(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-emerald-500 rounded-md px-3 py-2 text-xs text-slate-900 outline-none"
                  />
                </div>
              </div>

              {/* Payment Selection Card */}
              <div className="bg-white rounded-lg border border-slate-200 p-4 sm:p-5 shadow-xs">
                <h2 className="text-sm font-bold text-slate-900 mb-3 pb-2 border-b border-slate-100 flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    2. Select Payment Method
                  </span>
                  <span className="text-[11px] font-normal text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    Eko Adapter Ready
                  </span>
                </h2>

                <div className="space-y-2.5 mb-4">
                  {/* Option: UPI */}
                  <label
                    className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                      paymentMethod === "UPI"
                        ? "border-emerald-500 bg-emerald-50/40"
                        : "border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="UPI"
                      checked={paymentMethod === "UPI"}
                      onChange={() => setPaymentMethod("UPI")}
                      className="mt-1 text-emerald-600 focus:ring-emerald-500"
                    />
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                          <Smartphone className="w-3.5 h-3.5 text-emerald-600" />
                          UPI Payment (Google Pay / PhonePe / Paytm)
                        </span>
                        <span className="text-[10px] bg-emerald-100 text-emerald-800 font-semibold px-1.5 py-0.2 rounded">
                          Recommended
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Instant demo settlement via Eko Mock Financial Rail. No PIN required here.
                      </p>
                    </div>
                  </label>

                  {/* Option: Cash on Delivery */}
                  <label
                    className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                      paymentMethod === "COD"
                        ? "border-emerald-500 bg-emerald-50/40"
                        : "border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="COD"
                      checked={paymentMethod === "COD"}
                      onChange={() => setPaymentMethod("COD")}
                      className="mt-1 text-emerald-600 focus:ring-emerald-500"
                    />
                    <div className="flex-1">
                      <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                        <Banknote className="w-3.5 h-3.5 text-slate-700" />
                        Cash on Delivery (COD)
                      </span>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Pay cash to the delivery partner upon grocery arrival at your doorstep.
                      </p>
                    </div>
                  </label>

                  {/* Option: Demo Payment */}
                  <label
                    className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                      paymentMethod === "DEMO"
                        ? "border-emerald-500 bg-emerald-50/40"
                        : "border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="DEMO"
                      checked={paymentMethod === "DEMO"}
                      onChange={() => setPaymentMethod("DEMO")}
                      className="mt-1 text-emerald-600 focus:ring-emerald-500"
                    />
                    <div className="flex-1">
                      <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                        <CreditCard className="w-3.5 h-3.5 text-indigo-600" />
                        Demo Simulator Payment
                      </span>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Direct adapter test trigger for presentation and architecture demonstration.
                      </p>
                    </div>
                  </label>
                </div>

                {/* Simulation Control (Testing Payment Failure outcome) */}
                <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                  <span className="text-[11px] text-slate-500">Demo Testing Toggle:</span>
                  <label className="flex items-center gap-1.5 cursor-pointer text-[11px] text-slate-600 hover:text-slate-900">
                    <input
                      type="checkbox"
                      checked={simulateFailure}
                      onChange={(e) => setSimulateFailure(e.target.checked)}
                      className="rounded border-slate-300 text-rose-600 focus:ring-rose-500"
                    />
                    <span>Simulate Bank Failure Scenario</span>
                  </label>
                </div>
              </div>
            </div>

            {/* Right Column: Order Summary Box */}
            <div className="md:col-span-1">
              <div className="bg-white rounded-lg border border-slate-200 p-4 sm:p-5 shadow-xs sticky top-20">
                <h2 className="text-sm font-bold text-slate-900 mb-3 pb-2 border-b border-slate-100">
                  Order Summary ({cart.items.length} items)
                </h2>

                {/* Micro Item List */}
                <div className="space-y-2 max-h-40 overflow-y-auto mb-3 pr-1 text-xs">
                  {cart.items.map((it) => (
                    <div key={it.productId} className="flex justify-between text-slate-700">
                      <span className="truncate pr-2">
                        {it.product.name} <span className="text-slate-400">×{it.quantity}</span>
                      </span>
                      <span className="font-semibold text-slate-900 shrink-0">₹{it.totalPrice}</span>
                    </div>
                  ))}
                </div>

                <div className="space-y-2 text-xs pt-2 border-t border-slate-100 mb-4">
                  <div className="flex justify-between text-slate-600">
                    <span>Subtotal</span>
                    <span className="font-semibold text-slate-900">₹{cart.subtotal}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Delivery</span>
                    <span>{cart.deliveryFee === 0 ? "FREE" : `₹${cart.deliveryFee}`}</span>
                  </div>
                  <div className="pt-2 border-t border-slate-100 flex justify-between text-sm font-bold text-slate-900">
                    <span>Total Payable</span>
                    <span className="text-emerald-700 text-base">₹{cart.total}</span>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isProcessing}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white font-semibold py-2.5 px-4 rounded-lg text-xs sm:text-sm flex items-center justify-center gap-2 shadow-xs transition-colors"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Connecting Adapter...</span>
                    </>
                  ) : (
                    <span>
                      {paymentMethod === "COD"
                        ? "Confirm Cash Order"
                        : `Pay ₹${cart.total} via ${paymentMethod}`}
                    </span>
                  )}
                </button>

                <div className="mt-4 p-2 bg-slate-50 border border-slate-200 rounded text-[10px] text-slate-500 leading-tight text-center">
                  <strong>Security Note:</strong> No raw card details, CVV, or PINs are collected on this screen.
                </div>
              </div>
            </div>
          </form>
        )}
      </main>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-50 flex flex-col">
          <StoreHeader />
          <div className="flex-1 flex items-center justify-center p-8">
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <Loader2 className="w-5 h-5 animate-spin text-emerald-600" />
              <span>Loading checkout...</span>
            </div>
          </div>
        </div>
      }
    >
      <CheckoutContent />
    </Suspense>
  );
}
