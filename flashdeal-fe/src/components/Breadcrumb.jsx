import React from 'react';
import { ChevronRight, Home } from 'lucide-react';

export default function Breadcrumb({ items = [] }) {
  if (!items || items.length === 0) return null;

  return (
    <nav aria-label="Breadcrumb" className="py-3 px-4 sm:px-0">
      <ol className="flex items-center flex-wrap gap-1.5 text-xs text-slate-500 font-medium">
        <li>
          <button
            type="button"
            onClick={items[0]?.onClick}
            className="flex items-center gap-1 text-slate-600 hover:text-blue-600 transition"
          >
            <Home className="w-3.5 h-3.5" />
            <span>Trang chủ</span>
          </button>
        </li>

        {items.slice(1).map((item, index) => {
          const isLast = index === items.length - 2;
          return (
            <li key={index} className="flex items-center gap-1.5">
              <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              {item.onClick && !isLast ? (
                <button
                  type="button"
                  onClick={item.onClick}
                  className="text-slate-600 hover:text-blue-600 transition truncate max-w-[200px]"
                >
                  {item.label}
                </button>
              ) : (
                <span className={`truncate max-w-[300px] ${isLast ? 'text-blue-900 font-semibold' : 'text-slate-500'}`}>
                  {item.label}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
