import React, { useEffect, useState } from 'react';
import { api } from '../api/client.js';
import { Article } from '../types/index.js';
import { ArticleCard } from '../components/ArticleCard.js';
import { Search, Filter } from 'lucide-react';

interface SearchPageProps {
  initialQuery?: string;
  initialTag?: string;
  onNavigate: (path: string) => void;
}

export const SearchPage: React.FC<SearchPageProps> = ({ initialQuery = '', initialTag = '', onNavigate }) => {
  const [query, setQuery] = useState(initialQuery);
  const [articles, setArticles] = useState<Article[]>([]);
  const [sort, setSort] = useState('newest');
  const [loading, setLoading] = useState(false);

  const executeSearch = async () => {
    setLoading(true);
    try {
      const res = await api.getArticles({
        search: query,
        tag: initialTag,
        sort,
        limit: 20
      });
      setArticles(res.articles);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    executeSearch();
  }, [query, initialTag, sort]);

  return (
    <div className="space-y-8 pb-16">
      {/* Search Bar Header */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-4">
        <h1 className="text-2xl font-bold font-serif text-slate-900 dark:text-white">
          {initialTag ? `Статьи с тегом #${initialTag}` : 'Поиск по энциклопедии'}
        </h1>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex-1 min-w-[260px] relative">
            <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Введите запрос..."
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm"
            />
          </div>

          <div className="flex items-center gap-2 text-xs">
            <Filter className="w-4 h-4 text-slate-400" />
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="p-2.5 bg-slate-50 dark:bg-slate-800 border rounded-xl"
            >
              <option value="newest">Сначала новые</option>
              <option value="popular">По популярности</option>
              <option value="updated">По дате обновления</option>
            </select>
          </div>
        </div>
      </div>

      {/* Results */}
      <div className="space-y-4">
        <div className="text-xs font-semibold text-slate-400 uppercase">
          Найдено результатов ({articles.length})
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-400">Загрузка результатов...</div>
        ) : articles.length === 0 ? (
          <div className="p-12 text-center text-slate-400 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl">
            По вашему запросу ничего не найдено. Попробуйте изменить формулировку.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {articles.map((art) => (
              <ArticleCard key={art.id} article={art} onNavigate={onNavigate} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
