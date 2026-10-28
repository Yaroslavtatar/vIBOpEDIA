import React, { useEffect, useState } from 'react';
import { api } from '../api/client.js';
import { Article } from '../types/index.js';
import { ArticleCard } from '../components/ArticleCard.js';
import { Bookmark } from 'lucide-react';

interface BookmarksPageProps {
  onNavigate: (path: string) => void;
}

export const BookmarksPage: React.FC<BookmarksPageProps> = ({ onNavigate }) => {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getBookmarks()
      .then((res) => setArticles(res.articles))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-8 pb-16">
      <div className="border-b border-slate-200 dark:border-slate-800 pb-4">
        <h1 className="text-3xl font-bold font-serif text-slate-900 dark:text-white flex items-center gap-3">
          <Bookmark className="w-7 h-7 text-amber-500" />
          <span>Сохранённые закладки</span>
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Ваша личная подборка избранных энциклопедических материалов
        </p>
      </div>

      {loading ? (
        <div className="p-12 text-center text-slate-400">Загрузка закладок...</div>
      ) : articles.length === 0 ? (
        <div className="p-12 text-center text-slate-400 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl">
          У вас пока нет сохранённых закладок. Нажимайте значок закладок на статьях для быстрой сохранности.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {articles.map((art) => (
            <ArticleCard key={art.id} article={art} onNavigate={onNavigate} />
          ))}
        </div>
      )}
    </div>
  );
};
