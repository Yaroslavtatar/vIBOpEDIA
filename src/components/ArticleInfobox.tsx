import React from 'react';
import { ArticleInfoboxItem } from '../types/index.js';
import { Info } from 'lucide-react';

interface ArticleInfoboxProps {
  items: ArticleInfoboxItem[];
  title: string;
}

export const ArticleInfobox: React.FC<ArticleInfoboxProps> = ({ items, title }) => {
  if (!items || items.length === 0) return null;

  return (
    <div className="bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs my-4">
      <div className="bg-indigo-600 text-white p-3 font-bold text-sm flex items-center gap-2">
        <Info className="w-4 h-4" />
        <span>Справочные факты: {title}</span>
      </div>

      <div className="divide-y divide-slate-200 dark:divide-slate-800 text-xs">
        {items.map((item, idx) => (
          <div key={idx} className="p-3 grid grid-cols-12 gap-2">
            <span className="col-span-5 font-semibold text-slate-500 dark:text-slate-400">
              {item.label}
            </span>
            <span className="col-span-7 text-slate-800 dark:text-slate-200 font-medium">
              {item.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
