import React, { useEffect, useState } from 'react';
import { api } from '../api/client.js';
import { Category, Article } from '../types/index.js';
import { ArticleCard } from '../components/ArticleCard.js';
import { useAuth } from '../context/AuthContext.js';
import { FolderTree, BookOpen, Cpu, Globe, Palette, Landmark, Compass, Zap, Tag, ChevronRight, Plus, FolderPlus } from 'lucide-react';

interface CategoriesPageProps {
  categorySlug?: string;
  onNavigate: (path: string) => void;
}

const CATEGORY_ICONS: Record<string, any> = {
  Cpu,
  Globe,
  Palette,
  Landmark,
  Compass,
  Zap,
  BookOpen
};

export const CategoriesPage: React.FC<CategoriesPageProps> = ({ categorySlug, onNavigate }) => {
  const { user, hasRole } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const catRes = await api.getCategories();
        setCategories(catRes.categories);

        if (categorySlug) {
          const matched = catRes.categories.find((c) => c.slug === categorySlug);
          if (matched) {
            setSelectedCategory(matched);
            const artRes = await api.getArticles({ category: matched.id });
            setArticles(artRes.articles);
          }
        } else {
          setSelectedCategory(null);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [categorySlug]);

  if (loading) {
    return (
      <div className="p-16 text-center text-slate-400">
        <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-sm font-semibold">Загрузка категорий...</p>
      </div>
    );
  }

  // Single Category View
  if (selectedCategory) {
    const IconComp = CATEGORY_ICONS[selectedCategory.iconName] || BookOpen;
    const subCategories = categories.filter((c) => c.parentId === selectedCategory.id);

    return (
      <div className="space-y-8 pb-16 font-sans">
        <div className={`p-8 sm:p-12 rounded-2xl bg-gradient-to-tr ${selectedCategory.color || 'from-blue-600 to-indigo-700'} text-white shadow-md flex flex-col md:flex-row items-center justify-between gap-6`}>
          <div className="flex items-center gap-6">
            <div className="p-4 bg-white/10 backdrop-blur-md rounded-2xl">
              <IconComp className="w-12 h-12" />
            </div>
            <div>
              <span className="text-xs font-bold uppercase tracking-widest text-white/80">Категория энциклопедии</span>
              <h1 className="text-3xl sm:text-4xl font-bold font-serif">{selectedCategory.name}</h1>
              <p className="text-sm text-white/90 mt-2 max-w-2xl">{selectedCategory.description}</p>
            </div>
          </div>

          <button
            onClick={() => onNavigate('/categories')}
            className="px-4 py-2 bg-white/20 hover:bg-white/30 text-white rounded-xl text-xs font-bold transition shrink-0"
          >
            ← Все категории
          </button>
        </div>

        {/* Subcategories list if present */}
        {subCategories.length > 0 && (
          <div className="space-y-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5">
            <h3 className="font-serif font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
              <Tag className="w-4 h-4 text-blue-600" />
              <span>Подкатегории ({subCategories.length}):</span>
            </h3>
            <div className="flex flex-wrap gap-2">
              {subCategories.map((sub) => (
                <button
                  key={sub.id}
                  onClick={() => onNavigate(`/categories/${sub.slug}`)}
                  className="px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-blue-500 rounded-lg text-xs font-semibold text-slate-800 dark:text-slate-200 transition flex items-center gap-1.5"
                >
                  <ChevronRight className="w-3.5 h-3.5 text-blue-500" />
                  <span>{sub.name}</span>
                  <span className="text-[10px] text-slate-400">({sub.articleCount || 0})</span>
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="space-y-4">
          <h2 className="text-xl font-bold font-serif text-slate-900 dark:text-white">
            Публикации в этой рубрике ({articles.length})
          </h2>

          {articles.length === 0 ? (
            <div className="p-12 text-center text-slate-500 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-3">
              <p className="text-xs">В этой категории пока нет опубликованных статей.</p>
              <button
                onClick={() => onNavigate('/articles/new')}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-2xs"
              >
                Написать первую статью в рубрику
              </button>
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
  }

  // Categories Directory View
  const mainCats = categories.filter((c) => !c.parentId);

  return (
    <div className="space-y-8 pb-16 font-sans">
      <div className="border-b border-slate-200 dark:border-slate-800 pb-4 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold font-serif text-slate-900 dark:text-white flex items-center gap-3">
            <FolderTree className="w-7 h-7 text-blue-600" />
            <span>Каталог категорий Вайбопедии</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Систематизированное дерево тематических рубрик и подкатегорий
          </p>
        </div>

        {hasRole(['admin', 'moderator']) && (
          <button
            onClick={() => onNavigate('/admin')}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold flex items-center gap-2"
          >
            <FolderPlus className="w-4 h-4" />
            <span>Управление рубриками</span>
          </button>
        )}
      </div>

      {mainCats.length === 0 ? (
        <div className="p-16 text-center text-slate-500 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-3">
          <FolderTree className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="font-bold text-lg font-serif text-slate-800 dark:text-slate-200">
            Категории ещё не добавлены
          </h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Модераторы и администраторы могут создать структуру рубрик и подкатегорий в меню управления.
          </p>
          {hasRole(['admin', 'moderator']) && (
            <button
              onClick={() => onNavigate('/admin')}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold"
            >
              Перейти к созданию рубрик
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {mainCats.map((cat) => {
            const IconComp = CATEGORY_ICONS[cat.iconName] || BookOpen;
            const subCats = categories.filter((c) => c.parentId === cat.id);

            return (
              <div
                key={cat.id}
                onClick={() => onNavigate(`/categories/${cat.slug}`)}
                className="group bg-white dark:bg-slate-900 border border-[#a2a9b1] dark:border-slate-800 rounded-xl p-6 shadow-2xs hover:border-blue-600 transition duration-200 cursor-pointer flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className={`p-3 rounded-xl bg-gradient-to-tr ${cat.color || 'from-blue-600 to-indigo-700'} text-white shadow-xs group-hover:scale-105 transition-transform`}>
                      <IconComp className="w-5 h-5" />
                    </div>
                    <span className="text-xs font-bold px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                      {cat.articleCount || 0} статей
                    </span>
                  </div>

                  <h3 className="font-bold font-serif text-lg text-slate-900 dark:text-white group-hover:text-[#36c] transition mb-2">
                    {cat.name}
                  </h3>

                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed mb-4">
                    {cat.description}
                  </p>

                  {/* Subcategories list */}
                  {subCats.length > 0 && (
                    <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-1 mb-4">
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                        Подкатегории:
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {subCats.map((sub) => (
                          <span
                            key={sub.id}
                            className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded text-[11px] font-semibold"
                          >
                            {sub.name}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="text-xs font-bold text-[#36c] group-hover:underline flex items-center gap-1 pt-2">
                  <span>Перейти в рубрику →</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
