import React from 'react';
import { List } from 'lucide-react';

interface TOCItem {
  id: string;
  text: string;
  level: number;
}

interface TableOfContentsProps {
  content: string;
}

export const TableOfContents: React.FC<TableOfContentsProps> = ({ content }) => {
  const items: TOCItem[] = [];
  const lines = content.split('\n');

  lines.forEach((line) => {
    const trimmed = line.trim();
    if (trimmed.startsWith('## ')) {
      const text = trimmed.replace('## ', '');
      const id = text.toLowerCase().replace(/[^\w\u0400-\u04FF\s]/g, '').trim().replace(/\s+/g, '-');
      items.push({ id, text, level: 2 });
    } else if (trimmed.startsWith('### ')) {
      const text = trimmed.replace('### ', '');
      const id = text.toLowerCase().replace(/[^\w\u0400-\u04FF\s]/g, '').trim().replace(/\s+/g, '-');
      items.push({ id, text, level: 3 });
    }
  });

  if (items.length === 0) return null;

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="bg-slate-50 dark:bg-slate-900/60 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-2xs sticky top-24">
      <div className="flex items-center gap-2 font-bold text-sm text-slate-900 dark:text-white pb-3 border-b border-slate-200 dark:border-slate-800 mb-3">
        <List className="w-4 h-4 text-indigo-500" />
        <span>Содержание статьи</span>
      </div>

      <nav className="space-y-1.5 text-xs max-h-[70vh] overflow-y-auto pr-1">
        {items.map((item, idx) => (
          <button
            key={idx}
            onClick={() => scrollToSection(item.id)}
            className={`w-full text-left py-1 px-2 rounded-lg transition-colors hover:bg-indigo-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 font-medium ${
              item.level === 3 ? 'pl-5 text-slate-500' : ''
            }`}
          >
            {item.text}
          </button>
        ))}
      </nav>
    </div>
  );
};
