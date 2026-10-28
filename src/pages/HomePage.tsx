import React, { useEffect, useState } from 'react';
import { api } from '../api/client.js';
import { Article, Category } from '../types/index.js';
import { ArticleCard } from '../components/ArticleCard.js';
import { useAuth } from '../context/AuthContext.js';
import { motion } from 'motion/react';
import {
  BookOpen,
  FolderTree,
  Clock,
  PlusCircle,
  ShieldCheck,
  ArrowRight,
  Search,
  Cpu,
  Globe,
  Palette,
  Zap,
  Sparkles,
  HelpCircle,
  FolderPlus,
  Shield
} from 'lucide-react';

interface HomePageProps {
  onNavigate: (path: string) => void;
  onOpenSearch: () => void;
}

const CATEGORY_ICONS: Record<string, any> = {
  Cpu,
  Globe,
  Palette,
  Zap,
  BookOpen
};

export const HomePage: React.FC<HomePageProps> = ({ onNavigate, onOpenSearch }) => {
  const { user, hasRole } = useAuth();
  const [featuredArticle, setFeaturedArticle] = useState<Article | null>(null);
  const [recentArticles, setRecentArticles] = useState<Article[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    async function loadHomeData() {
      try {
        const [catsRes, articlesRes] = await Promise.all([
          api.getCategories(),
          api.getArticles({ sort: 'newest', limit: 12 })
        ]);

        setCategories(catsRes.categories);
        const published = articlesRes.articles.filter((a) => a.status === 'published');
        const featured = published.find((a) => a.featuredDay) || published[0] || null;

        setFeaturedArticle(featured);
        setRecentArticles(published);
      } catch (err) {
        console.error('Failed to load home page data:', err);
      } finally {
        setLoading(false);
      }
    }

    loadHomeData();
  }, []);

  return (
    <div className="space-y-10 pb-16 font-sans">
      {/* Authentic Wikipedia Main Welcome Banner */}
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="bg-white dark:bg-slate-900 border border-[#a2a9b1] dark:border-slate-800 rounded-xl p-6 sm:p-8 shadow-2xs"
      >
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 border-b border-[#a2a9b1] dark:border-slate-800 pb-6 mb-6">
          <div className="space-y-2 text-center md:text-left">
            <div className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 uppercase tracking-wider">
              <BookOpen className="w-4 h-4 text-blue-600" />
              <span>Свободная энциклопедия вайб-кодинга</span>
            </div>

            <h1 className="text-3xl sm:text-4xl font-bold font-serif text-[#202122] dark:text-white leading-tight">
              Добро пожаловать в Вайбопедию
            </h1>

            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 max-w-2xl leading-relaxed">
              Научно-популярная свободная база знаний о вайб-кодинге, инженерии программного обеспечения с помощью ИИ-агентов, промпт-инжиниринге и архитектуре современных систем.
            </p>
          </div>

          {/* Clean Action Buttons (Search, Create Category & Create Article) */}
          <div className="flex flex-col sm:flex-row items-center gap-3 shrink-0">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onOpenSearch}
              className="w-full sm:w-auto px-4 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition"
            >
              <Search className="w-4 h-4 text-blue-600" />
              <span>Поиск</span>
            </motion.button>

            {hasRole(['admin', 'moderator']) && (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => onNavigate('/admin')}
                className="w-full sm:w-auto px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-bold transition flex items-center justify-center gap-2 shadow-2xs"
              >
                <FolderPlus className="w-4 h-4" />
                <span>Управление рубриками</span>
              </motion.button>
            )}

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onNavigate('/articles/new')}
              className="w-full sm:w-auto px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition flex items-center justify-center gap-2 shadow-2xs"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Написать статью</span>
            </motion.button>
          </div>
        </div>

        {/* Portal Links Bar */}
        {categories.length > 0 ? (
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 text-xs font-semibold">
            <span className="text-slate-500 font-normal mr-1">Рубрики:</span>
            {categories.map((cat) => (
              <motion.button
                key={cat.id}
                whileHover={{ scale: 1.05 }}
                onClick={() => onNavigate(`/categories/${cat.slug}`)}
                className="px-3 py-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-[#36c] rounded-md transition text-xs"
              >
                {cat.name}
              </motion.button>
            ))}
          </div>
        ) : (
          <div className="text-xs text-slate-500 flex items-center justify-between">
            <span>Рубрикатор пуст. Зайдите в кабинет модератора/администратора для добавления категорий.</span>
            {hasRole(['admin', 'moderator']) && (
              <button
                onClick={() => onNavigate('/admin')}
                className="text-[#36c] font-bold hover:underline"
              >
                + Добавить рубрики →
              </button>
            )}
          </div>
        )}
      </motion.section>

      {/* Main Content Grid: Featured Article or Empty State */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Featured Article Column */}
        <div className="lg:col-span-8 space-y-6">
          <div className="flex items-center justify-between border-b border-[#a2a9b1] dark:border-slate-800 pb-2">
            <h2 className="text-xl font-bold font-serif text-[#202122] dark:text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-500" />
              <span>Главный материал</span>
            </h2>
          </div>

          {featuredArticle ? (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.1 }}
            >
              <ArticleCard article={featuredArticle} onNavigate={onNavigate} featured={true} />
            </motion.div>
          ) : (
            <div className="p-10 text-center bg-white dark:bg-slate-900 border border-[#a2a9b1] dark:border-slate-800 rounded-xl space-y-3">
              <BookOpen className="w-10 h-10 text-blue-500 mx-auto" />
              <h3 className="font-serif font-bold text-lg text-slate-900 dark:text-white">
                Энциклопедия свободна для новых публикаций
              </h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
                Начните заполнение Вайбопедии! Зарегистрируйтесь или войдите с правами модератора/администратора, создайте тематические рубрики и опубликуйте первые статьи.
              </p>
              <div className="pt-2 flex items-center justify-center gap-3">
                <button
                  onClick={() => onNavigate('/articles/new')}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition shadow-xs"
                >
                  Создать первую статью
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar: Did you know... + Standards */}
        <div className="lg:col-span-4 space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
            className="bg-[#f8f9fa] dark:bg-slate-900 border border-[#a2a9b1] dark:border-slate-800 rounded-lg p-5 space-y-3"
          >
            <h3 className="font-serif font-bold text-sm text-[#202122] dark:text-white border-b border-slate-300 dark:border-slate-800 pb-2 flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-blue-600" />
              <span>О платформе</span>
            </h3>
            <ul className="list-disc pl-4 space-y-2.5 text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
              <li>
                Вайбопедия — независимая энциклопедия, создаваемая сообществом инженеров и исследователей.
              </li>
              <li>
                Каждая статья проходит независимую модерацию перед публикацией.
              </li>
              <li>
                Все версии правок сохраняются в истории изменений с поддержкой отката версий.
              </li>
            </ul>
          </motion.div>

          {/* Quality Standards Banner */}
          <div className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-lg p-5 space-y-3">
            <h3 className="font-serif font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Рецензирование и качество</span>
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Все публикации подлежат независимой проверке модераторами согласно стандартам Нейтральной Точки Зрения.
            </p>
            <button
              onClick={() => onNavigate('/guidelines')}
              className="text-xs text-[#36c] font-semibold hover:underline block"
            >
              Правила публикации →
            </button>
          </div>
        </div>
      </div>

      {/* Categories Catalog */}
      <section className="space-y-4 pt-4 border-t border-[#a2a9b1] dark:border-slate-800">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold font-serif text-[#202122] dark:text-white flex items-center gap-2">
            <FolderTree className="w-5 h-5 text-purple-600" />
            <span>Рубрики знаний</span>
          </h2>
          <button
            onClick={() => onNavigate('/categories')}
            className="text-xs font-bold text-[#36c] hover:underline flex items-center gap-1"
          >
            <span>Каталог категорий</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {categories.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {categories.map((cat) => {
              const IconComp = CATEGORY_ICONS[cat.iconName] || BookOpen;

              return (
                <motion.div
                  key={cat.id}
                  whileHover={{ y: -3 }}
                  onClick={() => onNavigate(`/categories/${cat.slug}`)}
                  className="group bg-white dark:bg-slate-900 border border-[#a2a9b1] dark:border-slate-800 rounded-lg p-5 hover:border-blue-600 transition cursor-pointer flex flex-col justify-between shadow-2xs"
                >
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <div className="p-2 rounded bg-slate-100 dark:bg-slate-800 text-blue-600">
                        <IconComp className="w-5 h-5" />
                      </div>
                      <h3 className="font-bold font-serif text-sm text-[#202122] dark:text-white group-hover:text-[#36c]">
                        {cat.name}
                      </h3>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed">
                      {cat.description}
                    </p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        ) : (
          <div className="p-8 text-center text-xs text-slate-500 bg-white dark:bg-slate-900 border border-[#a2a9b1] dark:border-slate-800 rounded-lg">
            Категорий пока нет. Модераторы могут добавить первые категории в меню управления.
          </div>
        )}
      </section>

      {/* Recent Published Articles Grid */}
      {recentArticles.length > 0 && (
        <section className="space-y-4 pt-4 border-t border-[#a2a9b1] dark:border-slate-800">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold font-serif text-[#202122] dark:text-white flex items-center gap-2">
              <Clock className="w-5 h-5 text-blue-600" />
              <span>Недавно опубликованные материалы</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {recentArticles.map((art) => (
              <ArticleCard key={art.id} article={art} onNavigate={onNavigate} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
};
