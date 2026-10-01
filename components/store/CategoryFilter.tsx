"use client";

import React from "react";

interface CategoryFilterProps {
  categories: string[];
  selectedCategory: string;
  onSelectCategory: (category: string) => void;
}

export function CategoryFilter({
  categories,
  selectedCategory,
  onSelectCategory,
}: CategoryFilterProps) {
  return (
    <div className="w-full overflow-x-auto no-scrollbar py-2 border-b border-slate-200 bg-white">
      <div className="max-w-7xl mx-auto px-4 flex items-center gap-1.5 min-w-max">
        {categories.map((cat) => {
          const isSelected = selectedCategory.toLowerCase() === cat.toLowerCase();
          return (
            <button
              key={cat}
              onClick={() => onSelectCategory(cat)}
              className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${
                isSelected
                  ? "bg-slate-900 text-white shadow-sm"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200 hover:text-slate-900 border border-slate-200/80"
              }`}
            >
              {cat}
            </button>
          );
        })}
      </div>
    </div>
  );
}
