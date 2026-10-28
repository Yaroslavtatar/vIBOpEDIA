import React, { useEffect, useState } from 'react';
import { api } from '../api/client.js';
import { User, AuditLog, UserRole, Article, Report, SiteSettings } from '../types/index.js';
import { useAuth } from '../context/AuthContext.js';
import { formatDateTime, getRoleBadgeInfo } from '../utils/formatters.js';
import { MarkdownContent } from '../components/MarkdownContent.js';
import { CategoryManager } from '../components/CategoryManager.js';
import {
  Sparkles,
  Users,
  FileText,
  Shield,
  AlertTriangle,
  Settings,
  CheckCircle2,
  XCircle,
  BarChart2,
  UserCheck,
  History,
  Check,
  Flag,
  FolderTree,
  Ban,
  UserX,
  LogOut,
  Trash2,
  ExternalLink,
  Save,
  Globe,
  Send
} from 'lucide-react';

interface AdminPageProps {
  onNavigate: (path: string) => void;
}

export const AdminPage: React.FC<AdminPageProps> = ({ onNavigate }) => {
  const { user, hasRole } = useAuth();
  const [stats, setStats] = useState<any>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [pendingArticles, setPendingArticles] = useState<Article[]>([]);
  const [pendingReports, setPendingReports] = useState<Report[]>([]);
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  const [moderatorComment, setModeratorComment] = useState('');

  // Settings form states
  const [githubUrl, setGithubUrl] = useState('');
  const [telegramUrl, setTelegramUrl] = useState('');
  const [siteName, setSiteName] = useState('');
  const [siteDescription, setSiteDescription] = useState('');
  const [autoPublishForTrusted, setAutoPublishForTrusted] = useState(true);
  const [moderationRequiredForNew, setModerationRequiredForNew] = useState(true);

  const [activeTab, setActiveTab] = useState<'stats' | 'categories' | 'moderation' | 'users' | 'settings' | 'audit'>('stats');
  const [loading, setLoading] = useState(true);
  const [actionSuccess, setActionSuccess] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const loadAdminData = async () => {
    setLoading(true);
    try {
      const [stRes, usRes, logRes, modRes, settingsRes] = await Promise.all([
        api.getAdminStats(),
        api.getAdminUsers(),
        api.getAdminAuditLogs(),
        api.getModerationQueue(),
        api.getSettings()
      ]);

      setStats(stRes);
      setUsers(usRes.users);
      setAuditLogs(logRes.auditLogs);
      setPendingArticles(modRes.pendingArticles);
      setPendingReports(modRes.pendingReports);

      if (settingsRes.settings) {
        setGithubUrl(settingsRes.settings.githubUrl || 'https://github.com');
        setTelegramUrl(settingsRes.settings.telegramUrl || 'https://t.me');
        setSiteName(settingsRes.settings.siteName || 'Вайбопедия');
        setSiteDescription(settingsRes.settings.siteDescription || 'Свободная научно-популярная энциклопедия о вайб-кодинге');
        setAutoPublishForTrusted(settingsRes.settings.autoPublishForTrusted ?? true);
        setModerationRequiredForNew(settingsRes.settings.moderationRequiredForNew ?? true);
      }

      if (modRes.pendingArticles.length > 0) {
        setSelectedArticle(modRes.pendingArticles[0]);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Ошибка загрузки админ-панели');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAdminData();
  }, []);

  if (!hasRole(['admin', 'moderator'])) {
    return (
      <div className="p-12 text-center max-w-md mx-auto bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200 dark:border-slate-800 rounded-3xl shadow-lg space-y-4">
        <AlertTriangle className="w-12 h-12 text-rose-500 mx-auto" />
        <h2 className="text-xl font-bold font-serif text-slate-900 dark:text-white">Админ-доступ ограничен</h2>
        <p className="text-xs text-slate-500">Панель управления доступна только модераторам и администраторам.</p>
      </div>
    );
  }

  const handleRoleChange = async (userId: string, newRole: UserRole) => {
    try {
      await api.updateUserRole(userId, newRole);
      setActionSuccess(`Роль пользователя успешно изменена на "${newRole}"`);
      setTimeout(() => setActionSuccess(''), 3000);
      loadAdminData();
    } catch (err: any) {
      setErrorMsg(err.message || 'Ошибка обновления роли');
    }
  };

  const handleBanUser = async (userId: string, username: string) => {
    const reason = prompt(`Укажите причину блокировки пользователя @${username}:`, 'Нарушение правил сообщества');
    if (reason === null) return;

    try {
      await api.banUser(userId, reason || 'Нарушение правил сообщества');
      setActionSuccess(`Пользователь @${username} успешно заблокирован.`);
      setTimeout(() => setActionSuccess(''), 3000);
      loadAdminData();
    } catch (err: any) {
      setErrorMsg(err.message || 'Ошибка блокировки пользователя');
    }
  };

  const handleUnbanUser = async (userId: string, username: string) => {
    try {
      await api.unbanUser(userId);
      setActionSuccess(`Пользователь @${username} разблокирован.`);
      setTimeout(() => setActionSuccess(''), 3000);
      loadAdminData();
    } catch (err: any) {
      setErrorMsg(err.message || 'Ошибка разблокировки');
    }
  };

  const handleKickUser = async (userId: string, username: string) => {
    if (!confirm(`Принудительно сбросить сессию пользователя @${username}?`)) return;

    try {
      await api.kickUser(userId);
      setActionSuccess(`Пользователь @${username} кикнут (сессия завершена).`);
      setTimeout(() => setActionSuccess(''), 3000);
      loadAdminData();
    } catch (err: any) {
      setErrorMsg(err.message || 'Ошибка выполнения действия');
    }
  };

  const handleDeleteUser = async (userId: string, username: string) => {
    if (!confirm(`ВНИМАНИЕ! Полностью удалить пользователя @${username} из базы данных? Это действие необратимо!`)) return;

    try {
      await api.deleteUser(userId);
      setActionSuccess(`Пользователь @${username} полностью удален из базы.`);
      setTimeout(() => setActionSuccess(''), 3000);
      loadAdminData();
    } catch (err: any) {
      setErrorMsg(err.message || 'Ошибка удаления пользователя');
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.updateSettings({
        githubUrl: githubUrl.trim(),
        telegramUrl: telegramUrl.trim(),
        siteName: siteName.trim(),
        siteDescription: siteDescription.trim(),
        autoPublishForTrusted,
        moderationRequiredForNew
      });
      setActionSuccess('Настройки платформы, ссылки на GitHub и Telegram успешно обновлены!');
      setTimeout(() => setActionSuccess(''), 3000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Ошибка сохранения настроек');
    }
  };

  const handleModerationAction = async (action: 'approve' | 'reject' | 'request_changes') => {
    if (!selectedArticle) return;
    try {
      await api.moderationAction({
        targetType: 'article',
        targetId: selectedArticle.id,
        action,
        comment: moderatorComment
      });

      setActionSuccess(`Решение по статье "${selectedArticle.title}" принято!`);
      setTimeout(() => setActionSuccess(''), 3000);
      setModeratorComment('');
      loadAdminData();
    } catch (err: any) {
      setErrorMsg(err.message || 'Ошибка отправки решения');
    }
  };

  if (loading) {
    return (
      <div className="p-16 text-center text-slate-400">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-sm font-semibold">Загрузка панели администратора...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-16 font-sans max-w-6xl mx-auto">
      {/* Control Deck Header */}
      <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800/80 rounded-3xl p-6 sm:p-8 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-2 rounded-xl bg-blue-600 text-white font-bold text-xs shadow-xs">
              <Shield className="w-4 h-4" />
            </span>
            <h1 className="text-2xl sm:text-3xl font-bold font-serif text-slate-900 dark:text-white">
              Кабинет Администратора
            </h1>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Полный контроль платформы: рубрики, модерация, пользователи (бан/кик/удаление) и ссылки GitHub/Telegram
          </p>
        </div>

        {/* Tab Buttons */}
        <div className="bg-slate-100 dark:bg-slate-800 p-1.5 rounded-2xl flex flex-wrap items-center gap-1 text-xs font-bold">
          <button
            onClick={() => setActiveTab('stats')}
            className={`px-3.5 py-2 rounded-xl transition flex items-center gap-1.5 ${
              activeTab === 'stats'
                ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <BarChart2 className="w-3.5 h-3.5" />
            <span>Обзор</span>
          </button>

          <button
            onClick={() => setActiveTab('categories')}
            className={`px-3.5 py-2 rounded-xl transition flex items-center gap-1.5 ${
              activeTab === 'categories'
                ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <FolderTree className="w-3.5 h-3.5 text-blue-500" />
            <span>Рубрики</span>
          </button>

          <button
            onClick={() => setActiveTab('moderation')}
            className={`px-3.5 py-2 rounded-xl transition flex items-center gap-1.5 ${
              activeTab === 'moderation'
                ? 'bg-white dark:bg-slate-900 text-purple-600 dark:text-purple-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <Shield className="w-3.5 h-3.5 text-purple-500" />
            <span>Модерация ({pendingArticles.length})</span>
          </button>

          {hasRole(['admin']) && (
            <button
              onClick={() => setActiveTab('users')}
              className={`px-3.5 py-2 rounded-xl transition flex items-center gap-1.5 ${
                activeTab === 'users'
                  ? 'bg-white dark:bg-slate-900 text-rose-600 dark:text-rose-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Пользователи ({users.length})</span>
            </button>
          )}

          {hasRole(['admin']) && (
            <button
              onClick={() => setActiveTab('settings')}
              className={`px-3.5 py-2 rounded-xl transition flex items-center gap-1.5 ${
                activeTab === 'settings'
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <Settings className="w-3.5 h-3.5 text-indigo-500" />
              <span>Настройки путей</span>
            </button>
          )}

          {hasRole(['admin']) && (
            <button
              onClick={() => setActiveTab('audit')}
              className={`px-3.5 py-2 rounded-xl transition flex items-center gap-1.5 ${
                activeTab === 'audit'
                  ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <History className="w-3.5 h-3.5" />
              <span>Аудит</span>
            </button>
          )}
        </div>
      </div>

      {actionSuccess && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-2xl text-xs font-bold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/20 text-rose-600 rounded-2xl text-xs">
          {errorMsg}
        </div>
      )}

      {/* Tab 1: Overview */}
      {activeTab === 'stats' && stats && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-6 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800/80 rounded-3xl space-y-2 shadow-xs">
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Опубликовано статей</div>
              <div className="text-3xl font-bold font-serif text-blue-600 dark:text-blue-400">{stats.totalArticles}</div>
              <p className="text-[11px] text-slate-500">Доступно читателям</p>
            </div>

            <div className="p-6 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800/80 rounded-3xl space-y-2 shadow-xs">
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">В очереди модерации</div>
              <div className="text-3xl font-bold font-serif text-amber-500">{stats.pendingArticles}</div>
              <p className="text-[11px] text-slate-500">Ожидают рецензии</p>
            </div>

            <div className="p-6 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800/80 rounded-3xl space-y-2 shadow-xs">
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Пользователей</div>
              <div className="text-3xl font-bold font-serif text-purple-600 dark:text-purple-400">{stats.totalUsers}</div>
              <p className="text-[11px] text-slate-500">Учетных записей</p>
            </div>

            <div className="p-6 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800/80 rounded-3xl space-y-2 shadow-xs">
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Сохраненных версий</div>
              <div className="text-3xl font-bold font-serif text-rose-600 dark:text-rose-400">{stats.totalEdits}</div>
              <p className="text-[11px] text-slate-500">В истории правок</p>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Category Management */}
      {activeTab === 'categories' && (
        <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800/80 rounded-3xl p-6 sm:p-8 shadow-sm">
          <CategoryManager onCategoryChanged={loadAdminData} />
        </div>
      )}

      {/* Tab 3: Moderation Queue */}
      {activeTab === 'moderation' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-4 space-y-4">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white uppercase tracking-wider font-serif">
              Очередь материалов ({pendingArticles.length})
            </h3>

            <div className="space-y-2">
              {pendingArticles.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-400 bg-white/80 dark:bg-slate-900/80 rounded-3xl border border-slate-200/60 dark:border-slate-800/60">
                  Все статьи проверены!
                </div>
              ) : (
                pendingArticles.map((art) => (
                  <div
                    key={art.id}
                    onClick={() => setSelectedArticle(art)}
                    className={`p-4 rounded-2xl border transition cursor-pointer ${
                      selectedArticle?.id === art.id
                        ? 'bg-purple-500/10 border-purple-500 shadow-sm'
                        : 'bg-white/80 dark:bg-slate-900/80 border-slate-200/80 dark:border-slate-800/80 hover:border-purple-300'
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
          </div>

          <div className="lg:col-span-8 space-y-6">
            {selectedArticle ? (
              <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800/80 rounded-3xl p-6 sm:p-8 space-y-6 shadow-sm">
                <div className="border-b border-slate-100 dark:border-slate-800 pb-4">
                  <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-600 border border-amber-500/20 mb-2 inline-block">
                    На модерации
                  </span>
                  <h2 className="text-2xl font-bold font-serif text-slate-900 dark:text-white">
                    {selectedArticle.title}
                  </h2>
                  <p className="text-xs text-slate-500">{selectedArticle.subtitle}</p>
                </div>

                <div className="p-6 bg-slate-50 dark:bg-slate-950/50 rounded-2xl max-h-96 overflow-y-auto border border-slate-200/60 dark:border-slate-800/60">
                  <MarkdownContent content={selectedArticle.content} />
                </div>

                <div className="space-y-3">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    Замечания модератора
                  </label>
                  <textarea
                    rows={2}
                    value={moderatorComment}
                    onChange={(e) => setModeratorComment(e.target.value)}
                    placeholder="Укажите замечания..."
                    className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs"
                  />

                  <div className="flex flex-wrap items-center gap-3">
                    <button
                      onClick={() => handleModerationAction('approve')}
                      className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-xs"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Одобрить</span>
                    </button>

                    <button
                      onClick={() => handleModerationAction('request_changes')}
                      className="px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition"
                    >
                      На доработку
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
              <div className="p-16 text-center text-slate-400 bg-white/80 dark:bg-slate-900/80 rounded-3xl border border-slate-200/60 dark:border-slate-800/60">
                Выберите статью из очереди для проверки
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 4: Users Administration (Bans, Kicks, Deletions, Roles) */}
      {activeTab === 'users' && hasRole(['admin']) && (
        <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800/80 rounded-3xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <div>
              <h3 className="font-bold font-serif text-lg text-slate-900 dark:text-white">
                Администрирование пользователей
              </h3>
              <p className="text-xs text-slate-500">
                Управление ролями, блокировки (бан), принудительный кик сессии и полное удаление учетных записей
              </p>
            </div>
            <span className="text-xs font-bold px-3 py-1 bg-slate-100 dark:bg-slate-800 rounded-full text-slate-700 dark:text-slate-300">
              Всего пользователей: {users.length}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold uppercase tracking-wider">
                <tr>
                  <th className="p-3">Пользователь</th>
                  <th className="p-3">Email</th>
                  <th className="p-3">Статус</th>
                  <th className="p-3">Роль</th>
                  <th className="p-3 text-right">Действия администратора</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {users.map((usr) => {
                  const roleInfo = getRoleBadgeInfo(usr.role);
                  const isRootAdmin = usr.role === 'admin';

                  return (
                    <tr key={usr.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                      <td className="p-3 font-bold text-slate-900 dark:text-white flex items-center gap-2.5">
                        <img src={usr.avatarUrl} alt={usr.displayName} className="w-8 h-8 rounded-xl object-cover bg-slate-200" />
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span>{usr.displayName}</span>
                            {isRootAdmin && (
                              <span className="text-[10px] font-bold text-blue-600 bg-blue-50 dark:bg-blue-950 px-1.5 py-0.5 rounded">
                                Root Admin
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] text-slate-400 font-normal">@{usr.username}</div>
                        </div>
                      </td>

                      <td className="p-3 text-slate-500">{usr.email}</td>

                      <td className="p-3">
                        {usr.isBanned ? (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-600 border border-rose-500/30 flex items-center gap-1 w-fit" title={usr.banReason}>
                            <Ban className="w-3 h-3" />
                            <span>Заблокирован</span>
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 border border-emerald-500/30 flex items-center gap-1 w-fit">
                            <Check className="w-3 h-3" />
                            <span>Активен</span>
                          </span>
                        )}
                      </td>

                      <td className="p-3">
                        {isRootAdmin ? (
                          <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${roleInfo.colorClass} ${roleInfo.borderClass}`}>
                            {roleInfo.label}
                          </span>
                        ) : (
                          <select
                            value={usr.role}
                            onChange={(e) => handleRoleChange(usr.id, e.target.value as UserRole)}
                            className="p-1.5 bg-slate-50 dark:bg-slate-800 border rounded-xl text-xs font-semibold"
                          >
                            <option value="user">Участник</option>
                            <option value="experienced_user">Опытный участник</option>
                            <option value="moderator">Модератор</option>
                            <option value="admin">Администратор</option>
                          </select>
                        )}
                      </td>

                      <td className="p-3 text-right">
                        {!isRootAdmin ? (
                          <div className="flex items-center justify-end gap-1.5">
                            {usr.isBanned ? (
                              <button
                                onClick={() => handleUnbanUser(usr.id, usr.username)}
                                className="px-2.5 py-1 bg-emerald-50 dark:bg-emerald-950 text-emerald-600 hover:bg-emerald-100 rounded-lg text-[11px] font-bold transition"
                                title="Разблокировать пользователя"
                              >
                                Разбанить
                              </button>
                            ) : (
                              <button
                                onClick={() => handleBanUser(usr.id, usr.username)}
                                className="px-2.5 py-1 bg-rose-50 dark:bg-rose-950 text-rose-600 hover:bg-rose-100 rounded-lg text-[11px] font-bold transition flex items-center gap-1"
                                title="Заблокировать пользователя"
                              >
                                <Ban className="w-3 h-3" />
                                <span>Бан</span>
                              </button>
                            )}

                            <button
                              onClick={() => handleKickUser(usr.id, usr.username)}
                              className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 rounded-lg text-[11px] font-bold transition flex items-center gap-1"
                              title="Принудительно сбросить сессию (кик)"
                            >
                              <LogOut className="w-3 h-3 text-amber-500" />
                              <span>Кик</span>
                            </button>

                            <button
                              onClick={() => handleDeleteUser(usr.id, usr.username)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-lg transition"
                              title="Удалить пользователя из базы"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <span className="text-[11px] text-slate-400 font-medium">Главный аккаунт</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 5: Site Settings (GitHub Repo & Telegram Links) */}
      {activeTab === 'settings' && hasRole(['admin']) && (
        <form
          onSubmit={handleSaveSettings}
          className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800/80 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6"
        >
          <div className="border-b border-slate-100 dark:border-slate-800 pb-4">
            <h3 className="font-bold font-serif text-lg text-slate-900 dark:text-white flex items-center gap-2">
              <Settings className="w-5 h-5 text-indigo-500" />
              <span>Настройки путей GitHub, Telegram и параметров платформы</span>
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Администратор может изменить путь до репозитория на GitHub, ссылку на Telegram-канал и название энциклопедии
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                Ссылка / Путь до GitHub репозитория
              </label>
              <div className="relative">
                <Globe className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
                <input
                  type="url"
                  required
                  value={githubUrl}
                  onChange={(e) => setGithubUrl(e.target.value)}
                  placeholder="https://github.com/vibe-coding/vibopedia"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-mono font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                Используется для кнопок перехода в репозиторий проекта в шапке и подвале.
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                Ссылка / Путь до Telegram-канала или сообщества
              </label>
              <div className="relative">
                <Send className="w-4 h-4 absolute left-3.5 top-3.5 text-blue-500" />
                <input
                  type="url"
                  required
                  value={telegramUrl}
                  onChange={(e) => setTelegramUrl(e.target.value)}
                  placeholder="https://t.me/vibopedia"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-mono font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                Ссылка для прямого перехода в Telegram-чат или информационный канал платформы.
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                Название сайта
              </label>
              <input
                type="text"
                required
                value={siteName}
                onChange={(e) => setSiteName(e.target.value)}
                placeholder="Вайбопедия"
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                Описание платформы
              </label>
              <input
                type="text"
                required
                value={siteDescription}
                onChange={(e) => setSiteDescription(e.target.value)}
                placeholder="Свободная научно-популярная энциклопедия о вайб-кодинге"
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="pt-2 flex items-center justify-end">
            <button
              type="submit"
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md transition flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              <span>Сохранить настройки</span>
            </button>
          </div>
        </form>
      )}

      {/* Tab 6: Audit Logs */}
      {activeTab === 'audit' && hasRole(['admin']) && (
        <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800/80 rounded-3xl p-6 shadow-sm space-y-3">
          <h3 className="font-bold font-serif text-lg text-slate-900 dark:text-white">
            Журнал аудита действий администрации
          </h3>

          <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
            {auditLogs.map((log) => (
              <div key={log.id} className="py-3 flex items-center justify-between gap-4">
                <div>
                  <div className="font-bold text-slate-900 dark:text-white">
                    <span className="text-blue-600 font-mono">[{log.action}]</span> {log.details}
                  </div>
                  <div className="text-slate-400 text-[10px]">
                    Исполнитель: @{log.actorUsername} • {formatDateTime(log.createdAt)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
