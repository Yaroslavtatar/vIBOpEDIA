import React, { useEffect, useState } from 'react';
import { api } from '../api/client.js';
import { Article, Comment } from '../types/index.js';
import { useAuth } from '../context/AuthContext.js';
import { formatDateTime, getRoleBadgeInfo } from '../utils/formatters.js';
import { MessageSquare, ArrowLeft, Send, Pin, AlertTriangle, CornerDownRight } from 'lucide-react';

interface ArticleDiscussionPageProps {
  slug: string;
  onNavigate: (path: string) => void;
}

export const ArticleDiscussionPage: React.FC<ArticleDiscussionPageProps> = ({ slug, onNavigate }) => {
  const { user } = useAuth();
  const [article, setArticle] = useState<Article | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newCommentText, setNewCommentText] = useState('');
  const [replyParentId, setReplyParentId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    async function loadData() {
      try {
        const artRes = await api.getArticleBySlug(slug);
        setArticle(artRes.article);

        const cmtRes = await api.getComments(artRes.article.id);
        setComments(cmtRes.comments);
      } catch (err: any) {
        setErrorMsg(err.message || 'Ошибка загрузки обсуждений');
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [slug]);

  const handlePostComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      setErrorMsg('Войдите в аккаунт для участия в обсуждении.');
      return;
    }
    if (!newCommentText.trim() || !article) return;

    setSubmitting(true);
    setErrorMsg('');

    try {
      const res = await api.addComment(article.id, newCommentText, replyParentId);
      setComments([...comments, res.comment]);
      setNewCommentText('');
      setReplyParentId(null);
    } catch (err: any) {
      setErrorMsg(err.message || 'Ошибка отправки комментария');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="p-16 text-center text-slate-400">
        <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-sm font-semibold">Загрузка ветки обсуждения...</p>
      </div>
    );
  }

  if (!article) return null;

  // Separate root comments and replies
  const rootComments = comments.filter((c) => !c.parentId);
  const getReplies = (parentId: string) => comments.filter((c) => c.parentId === parentId);

  return (
    <div className="space-y-8 pb-16 max-w-4xl mx-auto">
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
              <MessageSquare className="w-5 h-5 text-purple-500" />
              <span>Обсуждение статьи</span>
            </h1>
            <p className="text-xs text-slate-500 line-clamp-1">{article.title}</p>
          </div>
        </div>

        <button
          onClick={() => onNavigate(`/articles/${article.slug}`)}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition shadow-xs"
        >
          Вернуться к статье
        </button>
      </div>

      {errorMsg && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/20 text-rose-600 rounded-2xl text-xs">
          {errorMsg}
        </div>
      )}

      {/* Comment Form */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-4">
        <h3 className="font-bold text-sm text-slate-900 dark:text-white font-serif">
          {replyParentId ? 'Ответ на сообщение' : 'Оставить комментарий'}
        </h3>

        {replyParentId && (
          <div className="flex items-center justify-between text-xs bg-indigo-50 dark:bg-indigo-950/30 p-2 rounded-xl text-indigo-700 dark:text-indigo-300">
            <span>Вы отвечаете на конкретный комментарий</span>
            <button onClick={() => setReplyParentId(null)} className="font-bold hover:underline">
              Отмена
            </button>
          </div>
        )}

        <form onSubmit={handlePostComment} className="space-y-3">
          <textarea
            rows={3}
            value={newCommentText}
            onChange={(e) => setNewCommentText(e.target.value)}
            placeholder={
              user
                ? 'Напишите конструктивный комментарий или предложение по статье...'
                : 'Войдите в аккаунт, чтобы комментировать'
            }
            disabled={!user || submitting}
            className="w-full p-3.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={!user || submitting || !newCommentText.trim()}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-xs"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{submitting ? 'Отправка...' : 'Опубликовать'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Discussion List */}
      <div className="space-y-4">
        <h3 className="font-bold text-lg font-serif text-slate-900 dark:text-white">
          Комментарии участников ({comments.length})
        </h3>

        {rootComments.length === 0 ? (
          <div className="p-12 text-center text-slate-400 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl">
            Обсуждений пока нет. Будьте первыми!
          </div>
        ) : (
          <div className="space-y-4">
            {rootComments.map((comment) => {
              const replies = getReplies(comment.id);
              const roleInfo = getRoleBadgeInfo(comment.authorRole);

              return (
                <div
                  key={comment.id}
                  className={`bg-white dark:bg-slate-900 border ${
                    comment.isPinned ? 'border-amber-400 shadow-md' : 'border-slate-200 dark:border-slate-800'
                  } rounded-3xl p-5 space-y-3`}
                >
                  {comment.isPinned && (
                    <div className="text-[11px] font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1">
                      <Pin className="w-3.5 h-3.5" /> Закрепленное сообщение модератора
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <img
                        src={comment.authorAvatar}
                        alt={comment.authorDisplayName}
                        className="w-8 h-8 rounded-full object-cover"
                      />
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs text-slate-900 dark:text-white">
                            {comment.authorDisplayName}
                          </span>
                          <span className={`text-[10px] font-bold px-1.5 py-0.1 rounded border ${roleInfo.colorClass} ${roleInfo.borderClass}`}>
                            {roleInfo.label}
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-400">{formatDateTime(comment.createdAt)}</span>
                      </div>
                    </div>

                    <button
                      onClick={() => setReplyParentId(comment.id)}
                      className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold hover:underline"
                    >
                      Ответить
                    </button>
                  </div>

                  <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
                    {comment.content}
                  </p>

                  {/* Threaded Replies */}
                  {replies.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800/80 space-y-3 pl-4 border-l-2 border-indigo-500/30">
                      {replies.map((reply) => {
                        const replyRoleInfo = getRoleBadgeInfo(reply.authorRole);
                        return (
                          <div key={reply.id} className="space-y-1">
                            <div className="flex items-center gap-2">
                              <CornerDownRight className="w-3 h-3 text-indigo-400" />
                              <img
                                src={reply.authorAvatar}
                                alt={reply.authorDisplayName}
                                className="w-6 h-6 rounded-full object-cover"
                              />
                              <span className="font-bold text-xs text-slate-900 dark:text-white">
                                {reply.authorDisplayName}
                              </span>
                              <span className={`text-[9px] font-bold px-1 py-0.1 rounded border ${replyRoleInfo.colorClass}`}>
                                {replyRoleInfo.label}
                              </span>
                              <span className="text-[10px] text-slate-400">{formatDateTime(reply.createdAt)}</span>
                            </div>
                            <p className="text-xs text-slate-600 dark:text-slate-400 pl-5">
                              {reply.content}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
