import React, { useState } from 'react';
import { Article } from '../types/index.js';
import { formatDate, estimateReadingTime } from '../utils/formatters.js';
import { api } from '../api/client.js';
import { useAuth } from '../context/AuthContext.js';
import { Eye, Bookmark, Clock, ArrowRight, BookOpen } from 'lucide-react';

interface ArticleCardProps {
  article: Article;
  onNavigate: (path: string) => void;
  featured?: boolean;
}

export const ArticleCard: React.FC<ArticleCardProps> = ({ article, onNavigate, featured = false }) => {
  const { user } = useAuth();
  const [isBookmarked, setIsBookmarked] = useState<boolean>(false);
  const readingTime = estimateReadingTime(article.content);

  const handleBookmark = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) return;
    try {
      const res = await api.toggleBookmark(article.id);
      setIsBookmarked(res.isBookmarked);
    } catch (err) {
      console.error(err);
    }
  };

  if (featured) {
    return (
      <div
        onClick={() => onNavigate(`/articles/${article.slug}`)}
        className="group relative bg-white dark:bg-slate-900 rounded-xl border border-[#a2a9b1] dark:border-slate-800 overflow-hidden shadow-xs hover:shadow-md transition-all duration-200 cursor-pointer grid grid-cols-1 md:grid-cols-12"
      >
        <div className="md:col-span-7 relative h-64 md:h-full overflow-hidden bg-slate-100">
          <img
            src={article.coverImage}
            alt={article.title}
            className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-300"
          />
          <div className="absolute top-4 left-4 bg-[#eaecf0] dark:bg-slate-800 border border-[#a2a9b1] text-slate-800 dark:text-slate-200 font-serif font-bold text-xs px-3 py-1 rounded-md shadow-xs">
            ★ Избранная статья дня
          </div>
        </div>

        <div className="md:col-span-5 p-6 md:p-8 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xs font-bold px-2.5 py-0.5 rounded bg-blue-50 text-[#36c] border border-blue-200">
                {article.categoryName || 'Вайб-кодинг'}
              </span>
              <span className="text-xs text-slate-500 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                {readingTime} мин чтения
              </span>
            </div>

            <h3 className="text-2xl font-bold font-serif text-[#202122] dark:text-white group-hover:text-[#36c] transition-colors leading-tight mb-3">
              {article.title}
            </h3>

            <p className="text-slate-600 dark:text-slate-300 text-xs sm:text-sm line-clamp-3 leading-relaxed mb-6 font-sans">
              {article.subtitle || article.content.substring(0, 160)}
            </p>
          </div>

          <div className="flex items-center justify-between border-t border-slate-200 dark:border-slate-800 pt-4">
            <div className="flex items-center gap-2.5">
              <img
                src={article.authorAvatar}
                alt={article.authorDisplayName}
                className="w-8 h-8 rounded-full object-cover border border-slate-300"
              />
              <div>
                <div className="text-xs font-bold text-slate-900 dark:text-white">
                  {article.authorDisplayName}
                </div>
                <div className="text-[10px] text-slate-500">{formatDate(article.createdAt)}</div>
              </div>
            </div>

            <div className="flex items-center gap-2 text-[#36c] font-semibold text-xs group-hover:underline">
              <span>Читать статью</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      onClick={() => onNavigate(`/articles/${article.slug}`)}
      className="group bg-white dark:bg-slate-900 rounded-lg border border-[#a2a9b1] dark:border-slate-800 p-5 shadow-2xs hover:border-blue-600 transition-all duration-200 cursor-pointer flex flex-col justify-between"
    >
      <div>
        <div className="flex items-center justify-between gap-2 mb-3">
          <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-[#f8f9fa] dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700">
            {article.categoryName || 'Общее'}
          </span>

          <button
            onClick={handleBookmark}
            className={`p-1.5 rounded transition ${
              isBookmarked ? 'text-amber-600' : 'text-slate-400 hover:text-slate-600'
            }`}
            title="Сохранить в закладки"
          >
            <Bookmark className="w-4 h-4" />
          </button>
        </div>

        <h4 className="font-bold font-serif text-lg text-[#202122] dark:text-white group-hover:text-[#36c] transition-colors line-clamp-2 leading-snug mb-2">
          {article.title}
        </h4>

        <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-3 leading-relaxed mb-4 font-sans">
          {article.subtitle || article.content.substring(0, 120)}
        </p>
      </div>

      <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
        <div className="flex items-center gap-2">
          <img
            src={article.authorAvatar}
            alt={article.authorDisplayName}
            className="w-5 h-5 rounded-full object-cover"
          />
          <span className="font-semibold text-slate-700 dark:text-slate-300 text-[11px]">
            {article.authorDisplayName}
          </span>
        </div>
        <span className="text-[10px] text-slate-400">{formatDate(article.createdAt)}</span>
      </div>
    </div>
  );
};
