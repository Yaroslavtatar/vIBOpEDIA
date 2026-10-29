import React, { useState, useEffect } from 'react';
import { api } from '../api/client.js';
import { Idea, IdeaCategory, IdeaStatus } from '../types/index.js';
import { useAuth } from '../context/AuthContext.js';
import { useNotification } from '../context/NotificationContext.js';
import {
  Lightbulb,
  Plus,
  ThumbsUp,
  ThumbsDown,
  MessageSquare,
  Sparkles,
  CheckCircle2,
  Clock,
  Wrench,
  XCircle,
  Filter,
  Search,
  Shield,
  Trash2,
  X
} from 'lucide-react';

interface IdeasPageProps {
  onNavigate: (path: string) => void;
}

const CATEGORY_LABELS: Record<IdeaCategory, string> = {
  interface: 'Интерфейс',
  features: 'Новые функции',
  sections: 'Разделы энциклопедии',
  rules: 'Правила и сообщество',
  other: 'Другое'
};

export const IdeasPage: React.FC<IdeasPageProps> = ({ onNavigate }) => {
  const { user, hasRole } = useAuth();
  const { addToast } = useNotification();
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [createModalOpen, setCreateModalOpen] = useState<boolean>(false);
  const [newTitle, setNewTitle] = useState<string>('');
  const [newDescription, setNewDescription] = useState<string>('');
  const [newCategory, setNewCategory] = useState<IdeaCategory>('features');
  const [submitting, setSubmitting] = useState<boolean>(false);

  // Admin status update modal
  const [adminModalOpen, setAdminModalOpen] = useState<boolean>(false);
  const [selectedIdea, setSelectedIdea] = useState<Idea | null>(null);
  const [adminStatus, setAdminStatus] = useState<IdeaStatus>('planned');
  const [adminResponse, setAdminResponse] = useState<string>('');

  const fetchIdeas = async () => {
    try {
      setLoading(true);
      const res = await api.getIdeas();
      setIdeas(res.ideas || []);
    } catch (err: any) {
      addToast('Ошибка', err.message || 'Не удалось загрузить предложенные идеи', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIdeas();
  }, []);

  const handleVote = async (ideaId: string, type: number) => {
    if (!user) {
      addToast('Требуется авторизация', 'Войдите в аккаунт, чтобы голосовать за идеи.', 'warning');
      return;
    }

    try {
      const res = await api.voteIdea(ideaId, type);
      setIdeas((prev) =>
        prev.map((i) => (i.id === ideaId ? { ...i, score: res.score, userVote: res.userVote } : i))
      );
    } catch (err: any) {
      addToast('Ошибка', err.message || 'Не удалось проголосовать', 'error');
    }
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newDescription.trim()) {
      addToast('Внимание', 'Заполните заголовок и описание идеи.', 'warning');
      return;
    }

    try {
      setSubmitting(true);
      await api.createIdea({
        title: newTitle.trim(),
        description: newDescription.trim(),
        category: newCategory
      });
      addToast('Идея опубликована!', 'Ваше предложение создано и открыто для обсуждения.', 'success');
      setCreateModalOpen(false);
      setNewTitle('');
      setNewDescription('');
      fetchIdeas();
    } catch (err: any) {
      addToast('Ошибка', err.message || 'Не удалось отправить идею', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAdminSubmit = async () => {
    if (!selectedIdea) return;
    try {
      await api.updateIdeaStatus(selectedIdea.id, adminStatus, adminResponse.trim());
      addToast('Статус обновлен', 'Решение администрации успешно сохранено.', 'success');
      setAdminModalOpen(false);
      fetchIdeas();
    } catch (err: any) {
      addToast('Ошибка', err.message || 'Не удалось обновить статус', 'error');
    }
  };

  const handleDeleteIdea = async (ideaId: string) => {
    if (!window.confirm('Удалить эту идею?')) return;
    try {
      await api.deleteIdea(ideaId);
      addToast('Идея удалена', 'Предложение удалено из списка.', 'info');
      fetchIdeas();
    } catch (err: any) {
      addToast('Ошибка', err.message || 'Не удалось удалить идею', 'error');
    }
  };

  const isModOrAdmin = hasRole(['admin', 'moderator']);

  const filteredIdeas = ideas.filter((idea) => {
    if (selectedCategory !== 'all' && idea.category !== selectedCategory) return false;
    if (selectedStatus !== 'all' && idea.status !== selectedStatus) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        idea.title.toLowerCase().includes(q) ||
        idea.description.toLowerCase().includes(q) ||
        idea.authorUsername.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const getStatusBadge = (status: IdeaStatus) => {
    switch (status) {
      case 'open':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400 border border-blue-200 dark:border-blue-800">
            <Clock className="w-3.5 h-3.5" />
            <span>Обсуждается</span>
          </span>
        );
      case 'planned':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Запланировано</span>
          </span>
        );
      case 'in_progress':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-400 border border-purple-200 dark:border-purple-800">
            <Wrench className="w-3.5 h-3.5" />
            <span>В разработке</span>
          </span>
        );
      case 'implemented':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Реализовано</span>
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
            <XCircle className="w-3.5 h-3.5" />
            <span>Отклонено</span>
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Header Banner */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Lightbulb className="w-6 h-6 text-amber-500" />
            <h1 className="text-2xl font-serif font-bold text-slate-900 dark:text-white">
              Идеи и предложения сообщества
            </h1>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Предлагайте новые разделы, функции и улучшайте Вайбопедию вместе с администрацией.
          </p>
        </div>

        <button
          onClick={() => {
            if (!user) {
              addToast('Авторизация', 'Войдите в аккаунт для отправки предложения.', 'warning');
              return;
            }
            setCreateModalOpen(true);
          }}
          className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-md shadow-blue-500/20"
        >
          <Plus className="w-4 h-4" />
          <span>Предложить идею</span>
        </button>
      </div>

      {/* Filters & Search */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-2xs space-y-3">
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Поиск по предложениям..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Все категории</option>
              {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>

            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Все статусы</option>
              <option value="open">Обсуждается</option>
              <option value="planned">Запланировано</option>
              <option value="in_progress">В разработке</option>
              <option value="implemented">Реализовано</option>
              <option value="rejected">Отклонено</option>
            </select>
          </div>
        </div>
      </div>

      {/* Ideas List */}
      {loading ? (
        <div className="py-12 text-center text-xs text-slate-400">Загрузка предложений...</div>
      ) : filteredIdeas.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-12 text-center space-y-3">
          <Lightbulb className="w-10 h-10 text-slate-300 mx-auto" />
          <h3 className="font-bold text-slate-800 dark:text-slate-200 text-sm">Идей не найдено</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Будьте первыми! Нажмите кнопку "Предложить идею" и расскажите о нововведении.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredIdeas.map((idea) => (
            <div
              key={idea.id}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm hover:border-blue-500/50 transition flex flex-col sm:flex-row gap-4"
            >
              {/* Vote Buttons Box */}
              <div className="flex sm:flex-col items-center justify-center gap-2 bg-slate-50 dark:bg-slate-800/80 p-3 rounded-2xl shrink-0">
                <button
                  onClick={() => handleVote(idea.id, 1)}
                  className={`p-2 rounded-xl transition ${
                    idea.userVote === 1
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-blue-600 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                  title="Поддерживаю (+1)"
                >
                  <ThumbsUp className="w-4 h-4" />
                </button>

                <span
                  className={`font-mono font-bold text-sm ${
                    idea.score > 0
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : idea.score < 0
                      ? 'text-rose-600 dark:text-rose-400'
                      : 'text-slate-500'
                  }`}
                >
                  {idea.score > 0 ? `+${idea.score}` : idea.score}
                </span>

                <button
                  onClick={() => handleVote(idea.id, -1)}
                  className={`p-2 rounded-xl transition ${
                    idea.userVote === -1
                      ? 'bg-rose-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-rose-600 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                  title="Против (-1)"
                >
                  <ThumbsDown className="w-4 h-4" />
                </button>
              </div>

              {/* Details Box */}
              <div className="flex-1 space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    {getStatusBadge(idea.status)}
                    <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">
                      {CATEGORY_LABELS[idea.category] || idea.category}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {(idea.authorId === user?.id || isModOrAdmin) && (
                      <button
                        onClick={() => handleDeleteIdea(idea.id)}
                        className="p-1 text-slate-400 hover:text-rose-600 transition"
                        title="Удалить предложение"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                <h3 className="font-bold text-base text-slate-900 dark:text-white leading-tight">
                  {idea.title}
                </h3>

                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-line">
                  {idea.description}
                </p>

                {/* Author Info */}
                <div className="flex items-center justify-between pt-2 text-[11px] text-slate-400 border-t border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-1.5">
                    {idea.authorAvatar && (
                      <img src={idea.authorAvatar} alt="" className="w-4 h-4 rounded-full" />
                    )}
                    <span>Предложил @{idea.authorUsername}</span>
                  </div>
                  <span>{new Date(idea.createdAt).toLocaleDateString('ru-RU')}</span>
                </div>

                {/* Admin Reply Box if present */}
                {idea.adminResponse && (
                  <div className="bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/60 rounded-xl p-3 text-xs text-amber-900 dark:text-amber-200 space-y-1 mt-2">
                    <div className="flex items-center gap-1.5 font-bold">
                      <Shield className="w-3.5 h-3.5 text-amber-600" />
                      <span>Ответ администрации:</span>
                    </div>
                    <p className="leading-relaxed pl-5">{idea.adminResponse}</p>
                  </div>
                )}

                {/* Moderator Actions */}
                {isModOrAdmin && (
                  <div className="pt-2 flex justify-end">
                    <button
                      onClick={() => {
                        setSelectedIdea(idea);
                        setAdminStatus(idea.status);
                        setAdminResponse(idea.adminResponse || '');
                        setAdminModalOpen(true);
                      }}
                      className="text-[11px] font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                    >
                      <Shield className="w-3.5 h-3.5" />
                      <span>Управление статусом и ответом</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Proposal Modal */}
      {createModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <form
            onSubmit={handleCreateSubmit}
            className="w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-2xl space-y-4 font-sans"
          >
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Lightbulb className="w-5 h-5 text-amber-500" />
                <h3 className="font-bold text-slate-900 dark:text-white text-base">
                  Новое предложение
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setCreateModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Категория
              </label>
              <select
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value as IdeaCategory)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold outline-none"
              >
                {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
                  <option key={key} value={key}>
                    {label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Заголовок идеи
              </label>
              <input
                type="text"
                placeholder="Например: Добавить ночную тему в редактор..."
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Подробное описание
              </label>
              <textarea
                rows={4}
                placeholder="Опишите суть предложения, какую проблему это решает и как должно работать..."
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
                className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setCreateModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                Отмена
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition disabled:opacity-50"
              >
                Опубликовать предложение
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Admin Response Modal */}
      {adminModalOpen && selectedIdea && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-2xl space-y-4 font-sans">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              Статус идеи "{selectedIdea.title}"
            </h3>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Установить статус:
              </label>
              <select
                value={adminStatus}
                onChange={(e) => setAdminStatus(e.target.value as IdeaStatus)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold outline-none"
              >
                <option value="open">Обсуждается</option>
                <option value="planned">Запланировано</option>
                <option value="in_progress">В разработке</option>
                <option value="implemented">Реализовано</option>
                <option value="rejected">Отклонено</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Официальный ответ администрации:
              </label>
              <textarea
                rows={3}
                placeholder="Официальный ответ от команды Вайбопедии..."
                value={adminResponse}
                onChange={(e) => setAdminResponse(e.target.value)}
                className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={() => setAdminModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                Отмена
              </button>
              <button
                onClick={handleAdminSubmit}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition"
              >
                Сохранить ответ
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
