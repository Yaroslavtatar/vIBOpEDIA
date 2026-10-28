import React, { useEffect, useState } from 'react';
import { api } from '../api/client.js';
import { Article, ArticleRevision } from '../types/index.js';
import { DiffViewer } from '../components/DiffViewer.js';
import { formatDateTime } from '../utils/formatters.js';
import { useAuth } from '../context/AuthContext.js';
import { History, ArrowLeft, RotateCcw, GitCompare, CheckCircle2 } from 'lucide-react';

interface ArticleHistoryPageProps {
  slug: string;
  onNavigate: (path: string) => void;
}

export const ArticleHistoryPage: React.FC<ArticleHistoryPageProps> = ({ slug, onNavigate }) => {
  const { user, hasRole } = useAuth();
  const [article, setArticle] = useState<Article | null>(null);
  const [revisions, setRevisions] = useState<ArticleRevision[]>([]);
  const [selectedRevA, setSelectedRevA] = useState<ArticleRevision | null>(null);
  const [selectedRevB, setSelectedRevB] = useState<ArticleRevision | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [rollbackSuccess, setRollbackSuccess] = useState<string>('');

  useEffect(() => {
    async function loadHistory() {
      try {
        const artRes = await api.getArticleBySlug(slug);
        setArticle(artRes.article);

        const revRes = await api.getRevisions(artRes.article.id);
        setRevisions(revRes.revisions);

        if (revRes.revisions.length >= 2) {
          setSelectedRevA(revRes.revisions[1]); // Old
          setSelectedRevB(revRes.revisions[0]); // New
        } else if (revRes.revisions.length === 1) {
          setSelectedRevA(revRes.revisions[0]);
          setSelectedRevB(revRes.revisions[0]);
        }
      } catch (err: any) {
        setErrorMsg(err.message || 'Ошибка загрузки истории правок');
      } finally {
        setLoading(false);
      }
    }

    loadHistory();
  }, [slug]);

  const handleRollback = async (targetRevId: string) => {
    if (!article) return;
    try {
      const res = await api.rollbackRevision(article.id, targetRevId);
      setRollbackSuccess(`Успешно откачено к версии v${res.revision.versionNumber}!`);
      setTimeout(() => setRollbackSuccess(''), 3000);

      // Reload revisions
      const revRes = await api.getRevisions(article.id);
      setRevisions(revRes.revisions);
      if (revRes.revisions.length >= 2) {
        setSelectedRevA(revRes.revisions[1]);
        setSelectedRevB(revRes.revisions[0]);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Ошибка выполнения отката');
    }
  };

  if (loading) {
    return (
      <div className="p-16 text-center text-slate-400">
        <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-sm font-semibold">Загрузка хронологии версий...</p>
      </div>
    );
  }

  if (!article) return null;

  return (
    <div className="space-y-8 pb-16 max-w-5xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => onNavigate(`/articles/${article.slug}`)}
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-2xl font-bold font-serif text-slate-900 dark:text-white flex items-center gap-2">
              <History className="w-5 h-5 text-indigo-500" />
              <span>История версий статьи</span>
            </h1>
            <p className="text-xs text-slate-500 line-clamp-1">{article.title}</p>
          </div>
        </div>

        <button
          onClick={() => onNavigate(`/articles/${article.slug}`)}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition shadow-xs"
        >
          Вернуться к чтению
        </button>
      </div>

      {rollbackSuccess && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-2xl text-xs font-bold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" />
          <span>{rollbackSuccess}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/20 text-rose-600 rounded-2xl text-xs">
          {errorMsg}
        </div>
      )}

      {/* Revisions Comparison Diff View */}
      {selectedRevA && selectedRevB && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-wider">
            <GitCompare className="w-4 h-4 text-purple-500" />
            <span>Сравнение выбранных ревизий</span>
          </div>

          <DiffViewer
            oldRev={selectedRevA}
            newRev={selectedRevB}
            onRollback={handleRollback}
            canRollback={hasRole(['admin', 'moderator', 'experienced_user']) || article.authorId === user?.id}
          />
        </div>
      )}

      {/* Revision Timeline Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-sm p-6 space-y-4">
        <h3 className="font-bold font-serif text-lg text-slate-900 dark:text-white">
          Все сохранённые ревизии ({revisions.length})
        </h3>

        <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
          {revisions.map((rev) => {
            const isA = selectedRevA?.id === rev.id;
            const isB = selectedRevB?.id === rev.id;

            return (
              <div
                key={rev.id}
                className={`py-3 px-2 flex flex-wrap items-center justify-between gap-4 transition rounded-xl ${
                  isA || isB ? 'bg-indigo-50/50 dark:bg-indigo-950/20' : 'hover:bg-slate-50 dark:hover:bg-slate-800/40'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white font-bold flex items-center justify-center shrink-0">
                    v{rev.versionNumber}
                  </span>

                  <div>
                    <div className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <span>{rev.authorName}</span>
                      <span className="text-[10px] text-slate-400 font-normal">@{rev.authorUsername}</span>
                    </div>
                    <p className="text-slate-500 text-[11px] mt-0.5">
                      {rev.editSummary || 'Без описания'} • {formatDateTime(rev.createdAt)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {rev.charDiffCount !== 0 && (
                    <span
                      className={`font-mono font-bold text-xs ${
                        rev.charDiffCount > 0 ? 'text-emerald-600' : 'text-rose-600'
                      }`}
                    >
                      {rev.charDiffCount > 0 ? `+${rev.charDiffCount}` : rev.charDiffCount}
                    </span>
                  )}

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setSelectedRevA(rev)}
                      className={`px-2.5 py-1 rounded-lg border text-[11px] font-semibold transition ${
                        isA
                          ? 'bg-indigo-600 text-white border-indigo-600'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      Сравнить A
                    </button>
                    <button
                      onClick={() => setSelectedRevB(rev)}
                      className={`px-2.5 py-1 rounded-lg border text-[11px] font-semibold transition ${
                        isB
                          ? 'bg-purple-600 text-white border-purple-600'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      Сравнить B
                    </button>
                  </div>

                  {(hasRole(['admin', 'moderator']) || article.authorId === user?.id) && (
                    <button
                      onClick={() => handleRollback(rev.id)}
                      className="p-1.5 text-slate-400 hover:text-indigo-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                      title="Откатить к этой ревизии"
                    >
                      <RotateCcw className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
