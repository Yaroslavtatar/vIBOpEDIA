import React, { useEffect, useState } from 'react';
import { api } from '../api/client.js';
import { Article, Comment } from '../types/index.js';
import { MarkdownContent } from '../components/MarkdownContent.js';
import { TableOfContents } from '../components/TableOfContents.js';
import { ArticleInfobox } from '../components/ArticleInfobox.js';
import { formatDate, estimateReadingTime, getRoleBadgeInfo } from '../utils/formatters.js';
import { useAuth } from '../context/AuthContext.js';
import {
  Eye,
  Bookmark,
  Clock,
  History,
  MessageSquare,
  Edit3,
  Flag,
  Share2,
  BookOpen,
  Check,
  AlertTriangle,
  Send,
  X,
  User,
  Shield
} from 'lucide-react';

interface ArticleViewPageProps {
  slug: string;
  onNavigate: (path: string) => void;
}

export const ArticleViewPage: React.FC<ArticleViewPageProps> = ({ slug, onNavigate }) => {
  const { user } = useAuth();
  const [article, setArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [isBookmarked, setIsBookmarked] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);

  // Report modal state
  const [showReportModal, setShowReportModal] = useState<boolean>(false);
  const [reportReason, setReportReason] = useState<string>('');
  const [reportDetails, setReportDetails] = useState<string>('');
  const [reportSuccess, setReportSuccess] = useState<boolean>(false);

  useEffect(() => {
    setLoading(true);
    api.getArticleBySlug(slug)
      .then((res) => setArticle(res.article))
      .catch((err) => setErrorMsg(err.message || 'Ошибка загрузки статьи'))
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) {
    return (
      <div className="p-16 text-center text-slate-400">
        <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-sm font-semibold">Загрузка статьи...</p>
      </div>
    );
  }

  if (errorMsg || !article) {
    return (
      <div className="p-12 text-center max-w-md mx-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-lg space-y-4">
        <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto" />
        <h2 className="text-xl font-bold font-serif text-slate-900 dark:text-white">Статья не найдена</h2>
        <p className="text-xs text-slate-500">{errorMsg || 'Запрошенный материал отсутствует или заблокирован.'}</p>
        <button
          onClick={() => onNavigate('/articles/new?title=' + encodeURIComponent(slug))}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition"
        >
          Создать статью «{slug}»
        </button>
      </div>
    );
  }

  const readingTime = estimateReadingTime(article.content);
  const authorRoleInfo = getRoleBadgeInfo(article.authorRole);

  const handleCopyShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleBookmarkToggle = async () => {
    if (!user) return;
    try {
      const res = await api.toggleBookmark(article.id);
      setIsBookmarked(res.isBookmarked);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSubmitReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportReason) return;
    try {
      await api.submitReport({
        targetType: 'article',
        targetId: article.id,
        reason: reportReason,
        details: reportDetails
      });
      setReportSuccess(true);
      setTimeout(() => {
        setShowReportModal(false);
        setReportSuccess(false);
      }, 2000);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <article className="space-y-8 pb-16">
      {/* Authentic Wikipedia Article Tab Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#a2a9b1] dark:border-slate-800 pb-0 text-xs font-sans font-medium">
        {/* Left Tabs */}
        <div className="flex items-center -mb-px">
          <button
            className="px-4 py-2 border border-b-0 border-[#a2a9b1] dark:border-slate-700 bg-white dark:bg-slate-950 font-bold text-[#202122] dark:text-white rounded-t"
          >
            Статья
          </button>
          <button
            onClick={() => onNavigate(`/article/${article.slug}/discussion`)}
            className="px-4 py-2 text-[#36c] dark:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 transition"
          >
            Обсуждение ({article.discussionsCount})
          </button>
        </div>

        {/* Right Action Tabs */}
        <div className="flex items-center -mb-px">
          <button
            className="px-3 py-2 border border-b-0 border-[#a2a9b1] dark:border-slate-700 bg-white dark:bg-slate-950 font-bold text-[#202122] dark:text-white rounded-t"
          >
            Читать
          </button>
          <button
            onClick={() => onNavigate(`/articles/${article.slug}/edit`)}
            className="px-3 py-2 text-[#36c] dark:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 transition flex items-center gap-1"
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>Править</span>
          </button>
          <button
            onClick={() => onNavigate(`/article/${article.slug}/history`)}
            className="px-3 py-2 text-[#36c] dark:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 transition flex items-center gap-1"
          >
            <History className="w-3.5 h-3.5" />
            <span>История ({article.revisionsCount})</span>
          </button>
          <button
            onClick={handleBookmarkToggle}
            className={`px-3 py-2 transition flex items-center gap-1 ${
              isBookmarked ? 'text-amber-600 font-bold' : 'text-[#36c] hover:bg-slate-100 dark:hover:bg-slate-800/60'
            }`}
          >
            <Bookmark className="w-3.5 h-3.5" />
            <span>{isBookmarked ? 'В закладках' : 'В закладки'}</span>
          </button>
          <button
            onClick={handleCopyShare}
            className="px-3 py-2 text-[#36c] hover:bg-slate-100 dark:hover:bg-slate-800/60 transition flex items-center gap-1"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Share2 className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Main Title & Editorial Subtitle */}
      <div className="space-y-4">
        <h1 className="text-3xl sm:text-5xl font-bold font-serif text-slate-900 dark:text-white leading-tight">
          {article.title}
        </h1>

        {article.subtitle && (
          <p className="text-lg text-slate-600 dark:text-slate-300 font-serif italic border-l-2 border-indigo-500 pl-4 py-1">
            {article.subtitle}
          </p>
        )}

        {/* Author Metadata Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 pt-2 text-xs text-slate-500 dark:text-slate-400 border-t border-b border-slate-100 dark:border-slate-800/80 py-3">
          <div className="flex items-center gap-3">
            <img
              src={article.authorAvatar}
              alt={article.authorDisplayName}
              className="w-10 h-10 rounded-full object-cover ring-2 ring-indigo-500/20"
            />
            <div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => onNavigate(`/user/${article.authorUsername}`)}
                  className="font-bold text-slate-900 dark:text-white hover:text-indigo-600 dark:hover:text-indigo-400 transition"
                >
                  {article.authorDisplayName}
                </button>
                <span className={`text-[10px] font-bold px-2 py-0.2 rounded border ${authorRoleInfo.colorClass} ${authorRoleInfo.borderClass}`}>
                  {authorRoleInfo.label}
                </span>
              </div>
              <div className="text-[11px] text-slate-400">
                Создано {formatDate(article.createdAt)} • Обновлено {formatDate(article.updatedAt)}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <Clock className="w-4 h-4 text-slate-400" />
              {readingTime} мин чтения
            </span>
            <span className="flex items-center gap-1">
              <Eye className="w-4 h-4 text-slate-400" />
              {article.viewsCount} просмотров
            </span>
            <button
              onClick={() => setShowReportModal(true)}
              className="text-slate-400 hover:text-rose-500 transition flex items-center gap-1"
              title="Пожаловаться"
            >
              <Flag className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Cover Image */}
      {article.coverImage && (
        <div className="relative rounded-3xl overflow-hidden shadow-lg bg-slate-100 dark:bg-slate-800 max-h-96">
          <img
            src={article.coverImage}
            alt={article.title}
            className="w-full h-full object-cover max-h-96"
          />
        </div>
      )}

      {/* Article Body Grid (Content + Table of Contents + Infobox) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 pt-4">
        {/* Content Column */}
        <div className="lg:col-span-8 space-y-8">
          <MarkdownContent
            content={article.content}
            onWikiLinkClick={(targetSlug) => onNavigate(`/articles/${targetSlug}`)}
            onEditSection={(section) => onNavigate(`/articles/${article.slug}/edit?section=${encodeURIComponent(section)}`)}
          />

          {/* Sources & Literature Bibliography */}
          {article.sources && article.sources.length > 0 && (
            <div id="wikipedia-references" className="pt-8 border-t border-[#a2a9b1] dark:border-slate-800 space-y-3">
              <h3 className="text-lg font-bold font-serif text-[#202122] dark:text-white flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-blue-600" />
                <span>Примечания и источники</span>
              </h3>
              <ol className="list-decimal pl-5 space-y-1.5 text-xs text-slate-700 dark:text-slate-300 font-sans">
                {article.sources.map((src, idx) => (
                  <li key={idx}>
                    <span className="font-semibold text-[#202122] dark:text-slate-200">{src.title}</span>
                    {src.author && <span> — {src.author}</span>}
                    {src.year && <span className="text-slate-500"> ({src.year})</span>}
                    {src.url && (
                      <a
                        href={src.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="ml-2 text-[#36c] dark:text-blue-400 hover:underline"
                      >
                        [Ссылка]
                      </a>
                    )}
                  </li>
                ))}
              </ol>
            </div>
          )}

          {/* Wikipedia Bottom Category Footer Box */}
          <div className="mt-8 border border-[#a2a9b1] dark:border-slate-800 bg-[#f8f9fa] dark:bg-slate-900/60 p-3 text-xs font-sans rounded space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-bold text-[#202122] dark:text-slate-300">Категории:</span>
              <button
                onClick={() => onNavigate(`/categories/${article.categorySlug}`)}
                className="text-[#36c] dark:text-blue-400 hover:underline"
              >
                {article.categoryName || 'Вайб-кодинг'}
              </button>
              {article.tags && article.tags.map((tag) => (
                <React.Fragment key={tag}>
                  <span className="text-slate-400">|</span>
                  <button
                    onClick={() => onNavigate(`/search?tag=${encodeURIComponent(tag)}`)}
                    className="text-[#36c] dark:text-blue-400 hover:underline"
                  >
                    {tag}
                  </button>
                </React.Fragment>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar Column (Table of Contents & Infobox) */}
        <div className="lg:col-span-4 space-y-6">
          <ArticleInfobox items={article.infobox} title={article.title} />
          <TableOfContents content={article.content} />
        </div>
      </div>

      {/* Report Modal */}
      {showReportModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-lg font-serif text-slate-900 dark:text-white">
                Пожаловаться на статью
              </h3>
              <button onClick={() => setShowReportModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {reportSuccess ? (
              <div className="p-6 text-center text-emerald-600 font-bold text-sm">
                Жалоба отправлена на рассмотрение модераторам.
              </div>
            ) : (
              <form onSubmit={handleSubmitReport} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Причина *</label>
                  <select
                    required
                    value={reportReason}
                    onChange={(e) => setReportReason(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border rounded-xl text-xs"
                  >
                    <option value="">Выберите причину...</option>
                    <option value="Спам или реклама">Спам или реклама</option>
                    <option value="Недостоверные сведения">Недостоверные сведения / вандализм</option>
                    <option value="Оскорбления или токсичность">Оскорбления или токсичность</option>
                    <option value="Нарушение авторских прав">Нарушение авторских прав</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Подробности</label>
                  <textarea
                    rows={3}
                    value={reportDetails}
                    onChange={(e) => setReportDetails(e.target.value)}
                    placeholder="Укажите конкретный раздел или сноску..."
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border rounded-xl text-xs"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-md transition"
                >
                  Отправить жалобу
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </article>
  );
};
