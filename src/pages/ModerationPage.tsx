import React, { useEffect, useState } from 'react';
import { api } from '../api/client.js';
import { Article, ArticleRevision, Report } from '../types/index.js';
import { useAuth } from '../context/AuthContext.js';
import { formatDateTime } from '../utils/formatters.js';
import { MarkdownContent } from '../components/MarkdownContent.js';
import { CategoryManager } from '../components/CategoryManager.js';
import { Shield, CheckCircle, XCircle, AlertCircle, FileText, Flag, FolderTree } from 'lucide-react';

interface ModerationPageProps {
  onNavigate: (path: string) => void;
}

export const ModerationPage: React.FC<ModerationPageProps> = ({ onNavigate }) => {
  const { user, hasRole } = useAuth();
  const [activeTab, setActiveTab] = useState<'queue' | 'categories'>('queue');
  const [pendingArticles, setPendingArticles] = useState<Article[]>([]);
  const [pendingReports, setPendingReports] = useState<Report[]>([]);
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  const [moderatorComment, setModeratorComment] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [actionSuccess, setActionSuccess] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string>('');

  const loadQueue = async () => {
    setLoading(true);
    try {
      const queue = await api.getModerationQueue();
      setPendingArticles(queue.pendingArticles);
      setPendingReports(queue.pendingReports);
      if (queue.pendingArticles.length > 0) {
        setSelectedArticle(queue.pendingArticles[0]);
      } else {
        setSelectedArticle(null);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Не удалось загрузить очередь модерации');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadQueue();
  }, []);

  if (!hasRole(['admin', 'moderator'])) {
    return (
      <div className="p-12 text-center max-w-md mx-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-lg space-y-4">
        <AlertCircle className="w-12 h-12 text-rose-500 mx-auto" />
        <h2 className="text-xl font-bold font-serif text-slate-900 dark:text-white">Доступ ограничен</h2>
        <p className="text-xs text-slate-500">Панель модерации доступна только модераторам и администраторам.</p>
      </div>
    );
  }

  const handleModerationAction = async (action: 'approve' | 'reject' | 'request_changes') => {
    if (!selectedArticle) return;
    try {
      await api.moderationAction({
        targetType: 'article',
        targetId: selectedArticle.id,
        action,
        comment: moderatorComment
      });

      setActionSuccess(`Действие "${action}" успешно выполнено!`);
      setTimeout(() => setActionSuccess(''), 3000);
      setModeratorComment('');
      loadQueue();
    } catch (err: any) {
      setErrorMsg(err.message || 'Ошибка обработки решения');
    }
  };

  return (
    <div className="space-y-8 pb-16">
      {/* Top Header */}
      <div className="border-b border-slate-200 dark:border-slate-800 pb-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold font-serif text-slate-900 dark:text-white flex items-center gap-3">
            <Shield className="w-7 h-7 text-purple-500" />
            <span>Панель модерации и управления структурой</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Проверка новых статей, управление категориями/подкатегориями и рассмотрение жалоб
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl flex items-center gap-1 text-xs font-bold">
          <button
            onClick={() => setActiveTab('queue')}
            className={`px-4 py-2 rounded-xl transition flex items-center gap-1.5 ${
              activeTab === 'queue'
                ? 'bg-white dark:bg-slate-900 text-purple-600 dark:text-purple-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <Shield className="w-3.5 h-3.5 text-purple-500" />
            <span>Очередь правок ({pendingArticles.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('categories')}
            className={`px-4 py-2 rounded-xl transition flex items-center gap-1.5 ${
              activeTab === 'categories'
                ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <FolderTree className="w-3.5 h-3.5 text-blue-500" />
            <span>Управление рубриками</span>
          </button>
        </div>
      </div>

      {actionSuccess && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-2xl text-xs font-bold flex items-center gap-2">
          <CheckCircle className="w-4 h-4" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/20 text-rose-600 rounded-2xl text-xs">
          {errorMsg}
        </div>
      )}

      {/* Tab Content 1: Moderation Queue */}
      {activeTab === 'queue' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Queue Items Column */}
          <div className="lg:col-span-4 space-y-4">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white uppercase tracking-wider font-serif">
              Очередь публикаций ({pendingArticles.length})
            </h3>

            <div className="space-y-2">
              {pendingArticles.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-400 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
                  Очередь публикаций пуста!
                </div>
              ) : (
                pendingArticles.map((art) => (
                  <div
                    key={art.id}
                    onClick={() => setSelectedArticle(art)}
                    className={`p-4 rounded-2xl border transition cursor-pointer ${
                      selectedArticle?.id === art.id
                        ? 'bg-purple-50 dark:bg-purple-950/30 border-purple-500 shadow-sm'
                        : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-purple-300'
                    }`}
                  >
                    <div className="font-bold text-sm text-slate-900 dark:text-white mb-1 line-clamp-1">
                      {art.title}
                    </div>
                    <div className="flex items-center justify-between text-xs text-slate-500">
                      <span>Автор: @{art.authorUsername}</span>
                      <span>{formatDateTime(art.createdAt)}</span>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Pending Reports List */}
            {pendingReports.length > 0 && (
              <div className="space-y-4 pt-4">
                <h3 className="font-bold text-sm text-slate-900 dark:text-white uppercase tracking-wider font-serif flex items-center gap-2">
                  <Flag className="w-4 h-4 text-rose-500" />
                  <span>Жалобы ({pendingReports.length})</span>
                </h3>

                <div className="space-y-2">
                  {pendingReports.map((rep) => (
                    <div key={rep.id} className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-rose-600">{rep.reason}</span>
                        <span className="text-slate-400">{formatDateTime(rep.createdAt)}</span>
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-300">{rep.details || 'Без деталей'}</p>
                      <div className="text-[10px] text-slate-400">Заявитель: @{rep.reporterUsername}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Selected Article Preview & Action Column */}
          <div className="lg:col-span-8 space-y-6">
            {selectedArticle ? (
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-sm">
                <div className="border-b border-slate-200 dark:border-slate-800 pb-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-600 border border-amber-500/20">
                      Статус: На модерации
                    </span>
                    <span className="text-xs text-slate-400">Автор: {selectedArticle.authorDisplayName} (@{selectedArticle.authorUsername})</span>
                  </div>
                  <h2 className="text-2xl font-bold font-serif text-slate-900 dark:text-white">
                    {selectedArticle.title}
                  </h2>
                  <p className="text-xs text-slate-500">{selectedArticle.subtitle}</p>
                </div>

                {/* Article Content Preview */}
                <div className="p-6 bg-slate-50 dark:bg-slate-950/50 rounded-2xl max-h-96 overflow-y-auto border border-slate-200 dark:border-slate-800">
                  <MarkdownContent content={selectedArticle.content} />
                </div>

                {/* Moderator Decision Form */}
                <div className="space-y-4 pt-2">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    Комментарий модератора (причина решения)
                  </label>
                  <textarea
                    rows={2}
                    value={moderatorComment}
                    onChange={(e) => setModeratorComment(e.target.value)}
                    placeholder="Укажите замечания или причину одобрения/отклонения..."
                    className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs"
                  />

                  <div className="flex flex-wrap items-center gap-3">
                    <button
                      onClick={() => handleModerationAction('approve')}
                      className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-xs"
                    >
                      <CheckCircle className="w-4 h-4" />
                      <span>Одобрить и опубликовать</span>
                    </button>

                    <button
                      onClick={() => handleModerationAction('request_changes')}
                      className="px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition"
                    >
                      Вернуть на доработку
                    </button>

                    <button
                      onClick={() => handleModerationAction('reject')}
                      className="px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-2"
                    >
                      <XCircle className="w-4 h-4" />
                      <span>Отклонить</span>
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-16 text-center text-slate-400 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl">
                Выберите элемент из очереди для проверки
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab Content 2: Category Management */}
      {activeTab === 'categories' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm">
          <CategoryManager />
        </div>
      )}
    </div>
  );
};
