import React, { useState, useEffect } from 'react';
import { api } from '../api/client.js';
import { Article } from '../types/index.js';
import { useAuth } from '../context/AuthContext.js';
import { useNotification } from '../context/NotificationContext.js';
import {
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  RotateCcw,
  Edit3,
  Trash2,
  FileText,
  ShieldCheck,
  MessageSquare,
  Sparkles,
  Search,
  ExternalLink
} from 'lucide-react';

interface PendingReviewPageProps {
  onNavigate: (path: string) => void;
}

export const PendingReviewPage: React.FC<PendingReviewPageProps> = ({ onNavigate }) => {
  const { user, hasRole } = useAuth();
  const { addToast } = useNotification();
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  const [reviewModalOpen, setReviewModalOpen] = useState<boolean>(false);
  const [reviewAction, setReviewAction] = useState<'published' | 'rejected' | 'needs_revision'>('published');
  const [reviewFeedback, setReviewFeedback] = useState<string>('');
  const [actionLoading, setActionLoading] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [tab, setTab] = useState<'my' | 'all'>('my');

  const fetchArticles = async () => {
    try {
      setLoading(true);
      const res = await api.getPendingArticles();
      setArticles(res.articles || []);
    } catch (err: any) {
      addToast('Ошибка', err.message || 'Не удалось загрузить статьи на проверке', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchArticles();
  }, []);

  const handleRetract = async (articleId: string) => {
    if (!window.confirm('Забрать статью на доработку? Ей будет присвоен статус черновика.')) return;
    try {
      await api.retractArticle(articleId);
      addToast('Статья отозвана', 'Статья переведена в статус черновика. Вы можете продолжить редактирование.', 'success');
      fetchArticles();
    } catch (err: any) {
      addToast('Ошибка', err.message || 'Не удалось забрать статью', 'error');
    }
  };

  const handleDelete = async (articleId: string) => {
    if (!window.confirm('Вы уверены, что хотите полностью удалить эту статью? Это действие нельзя отменить.')) return;
    try {
      await api.deleteArticle(articleId);
      addToast('Статья удалена', 'Статья успешно удалена из системы.', 'info');
      fetchArticles();
    } catch (err: any) {
      addToast('Ошибка', err.message || 'Не удалось удалить статью', 'error');
    }
  };

  const handleOpenReviewModal = (art: Article, action: 'published' | 'rejected' | 'needs_revision') => {
    setSelectedArticle(art);
    setReviewAction(action);
    setReviewFeedback('');
    setReviewModalOpen(true);
  };

  const handleSubmitReview = async () => {
    if (!selectedArticle) return;
    if ((reviewAction === 'rejected' || reviewAction === 'needs_revision') && !reviewFeedback.trim()) {
      addToast('Внимание', 'Укажите причину или пояснение к решению модератора.', 'warning');
      return;
    }

    try {
      setActionLoading(true);
      await api.reviewArticle(selectedArticle.id, reviewAction, reviewFeedback.trim());
      addToast('Проверка завершена', `Статус статьи успешно изменен на: ${reviewAction}`, 'success');
      setReviewModalOpen(false);
      setSelectedArticle(null);
      fetchArticles();
    } catch (err: any) {
      addToast('Ошибка модерации', err.message || 'Не удалось сохранить вердикт', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const isModOrAdmin = hasRole(['admin', 'moderator']);

  const filteredArticles = articles.filter((a) => {
    if (tab === 'my' && a.authorId !== user?.id) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return a.title.toLowerCase().includes(q) || a.content.toLowerCase().includes(q) || a.authorUsername.toLowerCase().includes(q);
    }
    return true;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
            <Clock className="w-3.5 h-3.5" />
            <span>На рассмотрении</span>
          </span>
        );
      case 'needs_revision':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-400 border border-purple-200 dark:border-purple-800">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Требуются правки</span>
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400 border border-rose-200 dark:border-rose-800">
            <XCircle className="w-3.5 h-3.5" />
            <span>Отклонено</span>
          </span>
        );
      case 'draft':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
            <FileText className="w-3.5 h-3.5" />
            <span>Черновик</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
            <CheckCircle className="w-3.5 h-3.5" />
            <span>Опубликовано</span>
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Page Header */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <ShieldCheck className="w-6 h-6 text-blue-600" />
            <h1 className="text-2xl font-serif font-bold text-slate-900 dark:text-white">
              Статьи на рассмотрении
            </h1>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Модерация публикаций, отслеживание замечаний редакции и отзыв статей на доработку.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs font-semibold">
          <button
            onClick={() => setTab('my')}
            className={`px-3 py-1.5 rounded-lg transition ${
              tab === 'my' ? 'bg-white dark:bg-slate-900 text-blue-600 shadow-2xs font-bold' : 'text-slate-500'
            }`}
          >
            Мои статьи
          </button>
          {isModOrAdmin && (
            <button
              onClick={() => setTab('all')}
              className={`px-3 py-1.5 rounded-lg transition ${
                tab === 'all' ? 'bg-white dark:bg-slate-900 text-blue-600 shadow-2xs font-bold' : 'text-slate-500'
              }`}
            >
              Все в очереди ({articles.length})
            </button>
          )}
        </div>
      </div>

      {/* Search Input */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
        <input
          type="text"
          placeholder="Поиск по статьям на проверке..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Articles List */}
      {loading ? (
        <div className="py-12 text-center text-xs text-slate-400">Загрузка статей...</div>
      ) : filteredArticles.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-12 text-center space-y-3">
          <Clock className="w-10 h-10 text-slate-300 mx-auto" />
          <h3 className="font-bold text-slate-800 dark:text-slate-200 text-sm">
            Нет статей на проверке
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            {tab === 'my'
              ? 'У вас пока нет отправленных статей на модерации или требующих вашего ответа.'
              : 'Очередь модерации пуста! Все статьи были успешно проверены.'}
          </p>
          <button
            onClick={() => onNavigate('/articles/new')}
            className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 transition"
          >
            Написать новую статью
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredArticles.map((art) => (
            <div
              key={art.id}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm hover:border-blue-500/50 transition space-y-4"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    {getStatusBadge(art.status)}
                    <span className="text-[11px] text-slate-400 font-mono">ID: {art.id}</span>
                  </div>
                  <h3
                    onClick={() => onNavigate(`/articles/${art.slug}`)}
                    className="font-serif font-bold text-lg text-slate-900 dark:text-white hover:text-blue-600 transition cursor-pointer"
                  >
                    {art.title}
                  </h3>
                </div>

                <div className="flex items-center gap-2 text-xs font-semibold shrink-0">
                  {/* Author controls */}
                  {(art.authorId === user?.id || isModOrAdmin) && (
                    <>
                      <button
                        onClick={() => onNavigate(`/articles/${art.slug}/edit`)}
                        className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl transition flex items-center gap-1.5"
                      >
                        <Edit3 className="w-3.5 h-3.5 text-blue-500" />
                        <span>Редактировать</span>
                      </button>

                      {art.status !== 'draft' && (
                        <button
                          onClick={() => handleRetract(art.id)}
                          className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300 rounded-xl transition flex items-center gap-1.5"
                          title="Забрать на доработку в статус черновика"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>Забрать с проверки</span>
                        </button>
                      )}

                      <button
                        onClick={() => handleDelete(art.id)}
                        className="p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-xl transition"
                        title="Удалить статью"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Subtitle / Excerpt */}
              {art.subtitle && (
                <p className="text-xs text-slate-600 dark:text-slate-300 italic">{art.subtitle}</p>
              )}

              {/* Review Feedback / Rejection Notes if present */}
              {(art as any).reviewFeedback && (
                <div className="bg-rose-50/70 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/60 rounded-xl p-3.5 text-xs text-rose-800 dark:text-rose-300 space-y-1">
                  <div className="flex items-center gap-1.5 font-bold">
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>Замечания модератора ({(art as any).reviewedBy || 'Редакция'}):</span>
                  </div>
                  <p className="leading-relaxed pl-5">{(art as any).reviewFeedback}</p>
                </div>
              )}

              {/* Moderator Decision Bar */}
              {isModOrAdmin && art.status === 'pending' && (
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
                  <span className="text-[11px] text-slate-400 font-medium">Действия модератора:</span>
                  <div className="flex items-center gap-2 text-xs font-bold">
                    <button
                      onClick={() => handleOpenReviewModal(art, 'published')}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl transition flex items-center gap-1.5"
                    >
                      <CheckCircle className="w-3.5 h-3.5" />
                      <span>Одобрить</span>
                    </button>
                    <button
                      onClick={() => handleOpenReviewModal(art, 'needs_revision')}
                      className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl transition flex items-center gap-1.5"
                    >
                      <AlertTriangle className="w-3.5 h-3.5" />
                      <span>Запросить правки</span>
                    </button>
                    <button
                      onClick={() => handleOpenReviewModal(art, 'rejected')}
                      className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl transition flex items-center gap-1.5"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      <span>Отклонить</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Review Decision Modal */}
      {reviewModalOpen && selectedArticle && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-2xl space-y-4 font-sans">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              Решение по статье "{selectedArticle.title}"
            </h3>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Причина / Комментарий автору:
              </label>
              <textarea
                rows={4}
                placeholder="Укажите замечания по тексту, правилам оформления или причину отклонения..."
                value={reviewFeedback}
                onChange={(e) => setReviewFeedback(e.target.value)}
                className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={() => setReviewModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                Отмена
              </button>
              <button
                onClick={handleSubmitReview}
                disabled={actionLoading}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition disabled:opacity-50"
              >
                Сохранить вердикт
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
