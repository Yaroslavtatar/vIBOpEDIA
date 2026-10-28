import React, { useEffect, useState } from 'react';
import { api } from '../api/client.js';
import { User, Article } from '../types/index.js';
import { ArticleCard } from '../components/ArticleCard.js';
import { formatDate, getRoleBadgeInfo } from '../utils/formatters.js';
import { useAuth } from '../context/AuthContext.js';
import {
  User as UserIcon,
  BookOpen,
  Award,
  Edit3,
  Calendar,
  Bookmark,
  Settings,
  CheckCircle2,
  AlertCircle,
  Save,
  Shield,
  FileText
} from 'lucide-react';

interface UserProfilePageProps {
  username: string;
  onNavigate: (path: string) => void;
}

export const UserProfilePage: React.FC<UserProfilePageProps> = ({ username, onNavigate }) => {
  const { user: currentUser, refreshUser } = useAuth();
  const [profileUser, setProfileUser] = useState<User | null>(null);
  const [userArticles, setUserArticles] = useState<Article[]>([]);
  const [bookmarks, setBookmarks] = useState<Article[]>([]);
  const [activeTab, setActiveTab] = useState<'articles' | 'bookmarks' | 'settings'>('articles');
  const [loading, setLoading] = useState(true);

  // Settings Form State (if viewing own personal account)
  const [displayNameInput, setDisplayNameInput] = useState('');
  const [bioInput, setBioInput] = useState('');
  const [avatarUrlInput, setAvatarUrlInput] = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);

  const isOwnAccount = currentUser && currentUser.username.toLowerCase() === username.toLowerCase();

  useEffect(() => {
    async function loadProfileData() {
      setLoading(true);
      try {
        const res = await api.getUserProfile(username);
        setProfileUser(res.user);
        setUserArticles(res.articles);

        setDisplayNameInput(res.user.displayName || '');
        setBioInput(res.user.bio || '');
        setAvatarUrlInput(res.user.avatarUrl || '');

        if (isOwnAccount) {
          const bmRes = await api.getBookmarks();
          setBookmarks(bmRes.articles);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    loadProfileData();
  }, [username, isOwnAccount]);

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    if (!profileUser) return;

    // Local profile update simulation
    setProfileUser({
      ...profileUser,
      displayName: displayNameInput,
      bio: bioInput,
      avatarUrl: avatarUrlInput
    });

    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
    refreshUser();
  };

  if (loading) {
    return (
      <div className="p-16 text-center text-slate-400">
        <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-sm font-semibold">Загрузка личного кабинета...</p>
      </div>
    );
  }

  if (!profileUser) {
    return (
      <div className="p-12 text-center text-slate-400">
        Пользователь @{username} не найден.
      </div>
    );
  }

  const roleInfo = getRoleBadgeInfo(profileUser.role);

  return (
    <div className="space-y-8 pb-16 max-w-5xl mx-auto font-sans">
      {/* Profile Cover Banner */}
      <div className="relative bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800/80 rounded-3xl p-8 shadow-sm overflow-hidden">
        {/* Ambient Top Glow */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/10 dark:bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />

        <div className="relative flex flex-col md:flex-row items-center md:items-start gap-6 text-center md:text-left">
          <img
            src={profileUser.avatarUrl}
            alt={profileUser.displayName}
            className="w-28 h-28 rounded-3xl object-cover ring-4 ring-indigo-500/20 shadow-md"
          />

          <div className="space-y-3 flex-1">
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
              <h1 className="text-2xl sm:text-3xl font-bold font-serif text-slate-900 dark:text-white">
                {profileUser.displayName}
              </h1>
              <span className={`text-xs font-bold px-3 py-1 rounded-full border ${roleInfo.colorClass} ${roleInfo.borderClass}`}>
                {roleInfo.label}
              </span>
            </div>

            <p className="text-xs text-slate-400 font-mono">@{profileUser.username}</p>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 max-w-xl leading-relaxed">
              {profileUser.bio || 'Участник сообщества Вайбопедии.'}
            </p>

            <div className="pt-2 flex flex-wrap items-center justify-center md:justify-start gap-6 text-xs text-slate-500">
              <span className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-indigo-500" />
                Участник с {formatDate(profileUser.registeredAt)}
              </span>
              <span className="flex items-center gap-1.5 text-indigo-600 dark:text-indigo-400 font-bold">
                <Award className="w-4 h-4 text-amber-500" />
                Репутация: {profileUser.reputation} очков
              </span>
            </div>
          </div>
        </div>

        {/* User Stats Pills Bar */}
        <div className="grid grid-cols-3 gap-4 pt-6 mt-6 border-t border-slate-100 dark:border-slate-800 text-center">
          <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/50 dark:border-slate-800/50">
            <span className="block text-2xl font-bold font-serif text-indigo-600 dark:text-indigo-400">
              {profileUser.stats.articlesCreated}
            </span>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Создано статей</span>
          </div>

          <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/50 dark:border-slate-800/50">
            <span className="block text-2xl font-bold font-serif text-purple-600 dark:text-purple-400">
              {profileUser.stats.editsCount}
            </span>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Всего правок</span>
          </div>

          <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/50 dark:border-slate-800/50">
            <span className="block text-2xl font-bold font-serif text-emerald-600 dark:text-emerald-400">
              {profileUser.stats.approvedEdits}
            </span>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Одобрено правок</span>
          </div>
        </div>
      </div>

      {/* Account Navigation Tabs */}
      <div className="bg-slate-100/80 dark:bg-slate-900/80 p-1.5 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 flex items-center gap-2 text-xs font-bold">
        <button
          onClick={() => setActiveTab('articles')}
          className={`flex-1 py-2.5 rounded-xl transition flex items-center justify-center gap-2 ${
            activeTab === 'articles'
              ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>Статьи авторов ({userArticles.length})</span>
        </button>

        {isOwnAccount && (
          <button
            onClick={() => setActiveTab('bookmarks')}
            className={`flex-1 py-2.5 rounded-xl transition flex items-center justify-center gap-2 ${
              activeTab === 'bookmarks'
                ? 'bg-white dark:bg-slate-800 text-amber-500 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <Bookmark className="w-4 h-4" />
            <span>Сохранённые закладки ({bookmarks.length})</span>
          </button>
        )}

        {isOwnAccount && (
          <button
            onClick={() => setActiveTab('settings')}
            className={`flex-1 py-2.5 rounded-xl transition flex items-center justify-center gap-2 ${
              activeTab === 'settings'
                ? 'bg-white dark:bg-slate-800 text-purple-600 dark:text-purple-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <Settings className="w-4 h-4" />
            <span>Настройки профиля</span>
          </button>
        )}
      </div>

      {/* Tab 1: Authored Articles */}
      {activeTab === 'articles' && (
        <div className="space-y-4">
          {userArticles.length === 0 ? (
            <div className="p-12 text-center text-xs text-slate-400 bg-white/80 dark:bg-slate-900/80 rounded-3xl border border-slate-200/60 dark:border-slate-800/60">
              Пользователь пока не опубликовал статей.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {userArticles.map((art) => (
                <ArticleCard key={art.id} article={art} onNavigate={onNavigate} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Bookmarks */}
      {activeTab === 'bookmarks' && isOwnAccount && (
        <div className="space-y-4">
          {bookmarks.length === 0 ? (
            <div className="p-12 text-center text-xs text-slate-400 bg-white/80 dark:bg-slate-900/80 rounded-3xl border border-slate-200/60 dark:border-slate-800/60">
              У вас пока нет сохраненных статей в закладках.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {bookmarks.map((art) => (
                <ArticleCard key={art.id} article={art} onNavigate={onNavigate} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Account Settings */}
      {activeTab === 'settings' && isOwnAccount && (
        <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800/80 rounded-3xl p-6 sm:p-8 space-y-6 shadow-sm">
          <div className="border-b border-slate-100 dark:border-slate-800 pb-4">
            <h3 className="font-bold font-serif text-lg text-slate-900 dark:text-white">
              Редактирование профиля участника
            </h3>
            <p className="text-xs text-slate-500">Управляйте информацией вашего аккаунта и аватаром</p>
          </div>

          {saveSuccess && (
            <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-2xl text-xs font-bold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              <span>Настройки профиля успешно сохранены!</span>
            </div>
          )}

          <form onSubmit={handleSaveSettings} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                Отображаемое имя
              </label>
              <input
                type="text"
                value={displayNameInput}
                onChange={(e) => setDisplayNameInput(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                URL аватара (Изображение)
              </label>
              <input
                type="text"
                value={avatarUrlInput}
                onChange={(e) => setAvatarUrlInput(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                О себе / Краткое био
              </label>
              <textarea
                rows={3}
                value={bioInput}
                onChange={(e) => setBioInput(e.target.value)}
                className="w-full p-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm"
              />
            </div>

            <button
              type="submit"
              className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-md transition transform hover:scale-[1.01]"
            >
              <Save className="w-4 h-4" />
              <span>Сохранить настройки</span>
            </button>
          </form>
        </div>
      )}
    </div>
  );
};
