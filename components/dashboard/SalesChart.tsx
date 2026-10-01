"use client";

import React from "react";

interface SalesDataPoint {
  day: string;
  date: string;
  sales: number;
  orders: number;
}

export function SalesChart({ data }: { data: SalesDataPoint[] }) {
  if (!data || data.length === 0) return null;

  const maxSales = Math.max(...data.map((d) => d.sales), 25000);

  return (
    <div className="bg-white rounded-lg border border-slate-200 p-4 sm:p-5 shadow-xs">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xs sm:text-sm font-bold text-slate-900">7-Day Sales Performance</h2>
          <p className="text-[11px] text-slate-500">Daily revenue and order volume</p>
        </div>
        <div className="flex items-center gap-3 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 bg-emerald-600 rounded-xs" />
            <span className="text-slate-600 font-medium">Sales (₹)</span>
          </div>
        </div>
      </div>

      {/* Chart Bars */}
      <div className="h-48 flex items-end justify-between gap-2 sm:gap-4 pt-6 pb-2 border-b border-slate-100">
        {data.map((item, idx) => {
          const heightPercent = Math.round((item.sales / maxSales) * 100);
          const isToday = item.day === "Today";

          return (
            <div key={idx} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end group relative">
              {/* Tooltip on hover */}
              <div className="absolute -top-9 opacity-0 group-hover:opacity-100 bg-slate-900 text-white text-[10px] font-semibold py-1 px-2 rounded shadow-md pointer-events-none transition-opacity whitespace-nowrap z-20">
                ₹{item.sales.toLocaleString()} • {item.orders} orders
              </div>

              {/* Bar */}
              <div
                style={{ height: `${heightPercent}%` }}
                className={`w-full max-w-[36px] rounded-t transition-all ${
                  isToday
                    ? "bg-emerald-600 hover:bg-emerald-700"
                    : "bg-slate-200 hover:bg-slate-300"
                }`}
              />

              {/* Day Label */}
              <div className="text-center mt-1">
                <div className={`text-[10px] sm:text-xs font-semibold ${isToday ? "text-emerald-700" : "text-slate-600"}`}>
                  {item.day}
                </div>
                <div className="text-[9px] text-slate-400">{item.date}</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Micro Metrics footer */}
      <div className="grid grid-cols-3 gap-2 pt-3 text-center text-xs">
        <div>
          <span className="text-[10px] text-slate-400 block">Weekly Total</span>
          <strong className="text-slate-900">₹1,08,420</strong>
        </div>
        <div>
          <span className="text-[10px] text-slate-400 block">Avg. Daily Revenue</span>
          <strong className="text-slate-900">₹15,488</strong>
        </div>
        <div>
          <span className="text-[10px] text-slate-400 block">Peak Day (Sun)</span>
          <strong className="text-emerald-700">₹24,350</strong>
        </div>
      </div>
    </div>
  );
}
