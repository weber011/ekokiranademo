"use client";

import React, { useState, useRef, useEffect } from "react";
import { useCart } from "@/components/common/CartContext";
import { ChatMessage } from "@/types";
import {
  MessageSquare,
  X,
  Send,
  Loader2,
  ShoppingBag,
  ArrowRight,
  Sparkles,
  CheckCircle2,
} from "lucide-react";
import { useRouter } from "next/navigation";

export function AssistantWidget() {
  const { isAssistantOpen, setIsAssistantOpen, cart, fetchCart, addToCart } = useCart();
  const router = useRouter();

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome-1",
      role: "assistant",
      content:
        "Namaste! Main Digital Kirana ka order assistant hoon.\n\nAap bol sakte hain:\n• '2 kg chawal aur 1 litre doodh add karo'\n• 'bhaiya 2 packet maggi aur ek tata salt'\n• 'cart dikhao'",
      timestamp: "Just now",
      quickActions: [
        { label: "Add 2kg Rice & 1L Milk", action: "add_clarified", payload: { text: "2 kg chawal aur 1 litre doodh add karo" } },
        { label: "View Current Cart", action: "view_cart" },
      ],
    },
  ]);

  const [inputMessage, setInputMessage] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentActionState, setCurrentActionState] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isAssistantOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isAssistantOpen, currentActionState]);

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputMessage).trim();
    if (!text || isProcessing) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInputMessage("");
    setIsProcessing(true);
    setCurrentActionState("Understanding order...");

    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cartId: "default-session",
          messages: newMessages.map((m) => ({ role: m.role, content: m.content })),
        }),
      });

      const data = await res.json();

      // Refresh unified session cart so UI updates immediately
      await fetchCart();

      const assistantMsg: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: "assistant",
        content: data.reply || "Done.",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        quickActions: data.quickActions,
        cartSummary: data.cartSummary,
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err) {
      console.error(err);
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          role: "assistant",
          content: "I'm having trouble connecting right now. You can search products manually in the store catalogue.",
          timestamp: "Just now",
        },
      ]);
    } finally {
      setIsProcessing(false);
      setCurrentActionState(null);
    }
  };

  const handleQuickAction = async (action: string, payload?: any) => {
    if (action === "checkout") {
      setIsAssistantOpen(false);
      router.push("/store/checkout");
    } else if (action === "view_cart") {
      setIsAssistantOpen(false);
      router.push("/store/cart");
    } else if (action === "select_payment") {
      setIsAssistantOpen(false);
      router.push(`/store/checkout?method=${payload || "UPI"}`);
    } else if (action === "add_clarified") {
      if (payload?.id) {
        await addToCart(payload.id, payload.qty || 1);
        handleSendMessage("Added clarified item.");
      } else if (payload?.text) {
        handleSendMessage(payload.text);
      }
    }
  };

  if (!isAssistantOpen) {
    return (
      <button
        onClick={() => setIsAssistantOpen(true)}
        className="fixed bottom-5 right-5 z-40 bg-slate-900 hover:bg-slate-800 text-white font-medium text-xs sm:text-sm px-3.5 py-2.5 rounded-full shadow-lg border border-slate-700 flex items-center gap-2 hover:scale-102 active:scale-98 transition-all"
        aria-label="Open Order Assistant"
      >
        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
        <MessageSquare className="w-4 h-4 text-emerald-400" />
        <span>Order Assistant</span>
      </button>
    );
  }

  return (
    <div className="fixed inset-0 sm:inset-auto sm:bottom-5 sm:right-5 z-50 w-full sm:w-[380px] md:w-[420px] h-full sm:h-[580px] bg-white sm:rounded-xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden animate-fade-in">
      {/* Assistant Header */}
      <div className="bg-slate-900 text-white px-4 py-3 flex items-center justify-between border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-md bg-emerald-600 flex items-center justify-center text-white font-bold text-xs">
            DK
          </div>
          <div>
            <div className="text-xs sm:text-sm font-semibold flex items-center gap-1.5 leading-tight">
              Digital Kirana Assistant
              <span className="bg-emerald-900/80 text-emerald-300 text-[10px] px-1.5 py-0.2 rounded border border-emerald-700">
                Groq AI
              </span>
            </div>
            <div className="text-[10px] text-slate-400">Sharma General Store • Live Cart Sync</div>
          </div>
        </div>
        <button
          onClick={() => setIsAssistantOpen(false)}
          className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-white transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Real-time Cart Summary Banner */}
      <div className="bg-slate-50 px-4 py-1.5 border-b border-slate-200 text-xs text-slate-600 flex items-center justify-between font-medium">
        <span className="flex items-center gap-1">
          <ShoppingBag className="w-3.5 h-3.5 text-slate-500" />
          Cart Items: <strong className="text-slate-900">{cart.items.reduce((s, i) => s + i.quantity, 0)}</strong>
        </span>
        <span>
          Total: <strong className="text-emerald-700">₹{cart.total}</strong>
        </span>
      </div>

      {/* Chat Messages Stream */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50/50">
        {messages.map((msg) => {
          const isUser = msg.role === "user";
          return (
            <div
              key={msg.id}
              className={`flex flex-col ${isUser ? "items-end" : "items-start"}`}
            >
              <div
                className={`max-w-[88%] text-xs sm:text-sm leading-relaxed rounded-lg p-3 ${
                  isUser
                    ? "bg-slate-900 text-white rounded-br-none"
                    : "bg-white text-slate-900 border border-slate-200 shadow-2xs rounded-bl-none"
                }`}
              >
                <div className="whitespace-pre-line">{msg.content}</div>

                {/* Quick Action Chips */}
                {msg.quickActions && msg.quickActions.length > 0 && (
                  <div className="mt-2.5 pt-2 border-t border-slate-100 flex flex-wrap gap-1.5">
                    {msg.quickActions.map((qa, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleQuickAction(qa.action, qa.payload)}
                        className="bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 text-[11px] font-semibold px-2.5 py-1 rounded transition-colors flex items-center gap-1"
                      >
                        {qa.action === "checkout" && <CheckCircle2 className="w-3 h-3 text-emerald-600" />}
                        {qa.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <span className="text-[10px] text-slate-400 mt-1 px-1">{msg.timestamp}</span>
            </div>
          );
        })}

        {/* Dynamic Action Transparency State */}
        {isProcessing && (
          <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg p-2.5 text-xs text-slate-600 max-w-[80%] shadow-2xs">
            <Loader2 className="w-3.5 h-3.5 text-emerald-600 animate-spin" />
            <span>{currentActionState || "Searching catalogue..."}</span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Quick Prompts */}
      <div className="px-3 py-1.5 bg-white border-t border-slate-100 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
        <button
          onClick={() => handleSendMessage("bhaiya 2 atta, 1 litre oil, 2 milk aur 3 biscuit add kar do")}
          className="text-[10px] bg-slate-100 hover:bg-slate-200 text-slate-700 px-2 py-1 rounded whitespace-nowrap"
        >
          2 Atta + 1L Oil + 2 Milk + 3 Biscuit
        </button>
        <button
          onClick={() => handleSendMessage("cart dikhao")}
          className="text-[10px] bg-slate-100 hover:bg-slate-200 text-slate-700 px-2 py-1 rounded whitespace-nowrap"
        >
          Cart dikhao
        </button>
        <button
          onClick={() => handleSendMessage("haan checkout karo")}
          className="text-[10px] bg-slate-100 hover:bg-slate-200 text-slate-700 px-2 py-1 rounded whitespace-nowrap"
        >
          Checkout
        </button>
      </div>

      {/* Message Input Bar */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSendMessage();
        }}
        className="p-2.5 bg-white border-t border-slate-200 flex items-center gap-2"
      >
        <input
          type="text"
          placeholder="Type grocery item or Hinglish order..."
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          disabled={isProcessing}
          className="flex-1 bg-slate-100 border border-slate-200 focus:bg-white focus:border-emerald-500 rounded-md px-3 py-2 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 outline-none"
        />
        <button
          type="submit"
          disabled={!inputMessage.trim() || isProcessing}
          className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white p-2 rounded-md transition-colors"
          aria-label="Send message"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}
