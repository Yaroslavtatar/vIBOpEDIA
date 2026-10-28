import React, { useState, useEffect } from 'react';
import { api } from '../api/client.js';
import { Article, Category } from '../types/index.js';
import { Search, X, FileText, ArrowRight, PlusCircle, Sparkles } from 'lucide-react';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (path: string) => void;
}

export const SearchModal: React.FC<SearchModalProps> = ({ isOpen, onClose, onNavigate }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Article[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.getCategories().then((res) => setCategories(res.categories)).catch(console.error);
  }, []);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    const timer = setTimeout(() => {
      setLoading(true);
      api.getArticles({ search: query, limit: 6 })
        .then((res) => setResults(res.articles))
        .catch(console.error)
        .finally(() => setLoading(false));
    }, 200);

    return () => clearTimeout(timer);
  }, [query]);

  // Keyboard shortcut Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
        else {
          // Open handled by parent or toggle
        }
      } else if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-start justify-center pt-16 sm:pt-24 px-4 animate-fade-in">
      <div className="w-full max-w-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col">
        {/* Search Input Bar */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center gap-3">
          <Search className="w-5 h-5 text-indigo-500" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Поиск статей по названию, тегам или содержимому..."
            autoFocus
            className="flex-1 bg-transparent text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none text-base"
          />
          {query && (
            <button onClick={() => setQuery('')} className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
              <X className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={onClose}
            className="px-2.5 py-1 text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition"
          >
            ESC
          </button>
        </div>

        {/* Results / Suggestions / Empty state */}
        <div className="max-h-96 overflow-y-auto p-4 space-y-4">
          {loading ? (
            <div className="p-8 text-center text-slate-400 text-sm">Поиск по базе знаний...</div>
          ) : query.trim() ? (
            results.length > 0 ? (
              <div className="space-y-2">
                <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-2">
                  Найдено статей ({results.length})
                </div>
                {results.map((article) => (
                  <div
                    key={article.id}
                    onClick={() => {
                      onNavigate(`/articles/${article.slug}`);
                      onClose();
                    }}
                    className="p-3 rounded-2xl hover:bg-indigo-50/60 dark:hover:bg-slate-800/80 transition cursor-pointer flex items-center justify-between gap-4 group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
                        <FileText className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="font-semibold text-sm text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition">
                          {article.title}
                        </div>
                        <div className="text-xs text-slate-500 line-clamp-1">{article.subtitle}</div>
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center">
                <p className="text-slate-600 dark:text-slate-300 font-semibold mb-1">
                  Статья по запросу «{query}» не найдена
                </p>
                <p className="text-xs text-slate-400 mb-4">
                  Вы можете стать автором первой статьи на эту тему!
                </p>
                <button
                  onClick={() => {
                    onNavigate(`/articles/new?title=${encodeURIComponent(query)}`);
                    onClose();
                  }}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold inline-flex items-center gap-2 shadow-sm"
                >
                  <PlusCircle className="w-4 h-4" />
                  Создать статью «{query}»
                </button>
              </div>
            )
          ) : (
            <div>
              <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-2 mb-3">
                Популярные категории
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {categories.map((cat) => (
                  <div
                    key={cat.id}
                    onClick={() => {
                      onNavigate(`/categories/${cat.slug}`);
                      onClose();
                    }}
                    className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-indigo-500/50 hover:bg-slate-50 dark:hover:bg-slate-800 transition cursor-pointer"
                  >
                    <div className="font-semibold text-xs text-slate-800 dark:text-slate-200 mb-0.5">
                      {cat.name}
                    </div>
                    <div className="text-[10px] text-slate-400 line-clamp-1">{cat.description}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="p-3 bg-slate-50 dark:bg-slate-800/40 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-400 px-4">
          <span className="flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            Вайбопедия использует полнотекстовый поиск по фактам и описаниям
          </span>
          <button
            onClick={() => {
              onNavigate(`/search?q=${encodeURIComponent(query)}`);
              onClose();
            }}
            className="text-indigo-600 dark:text-indigo-400 font-semibold hover:underline"
          >
            Все результаты →
          </button>
        </div>
      </div>
    </div>
  );
};
