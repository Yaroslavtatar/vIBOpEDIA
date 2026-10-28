import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.js';
import { getRoleBadgeInfo } from '../utils/formatters.js';
import { api } from '../api/client.js';
import { Notification } from '../types/index.js';
import { WikipediaGlobeLogo } from './Logos.js';
import {
  Search,
  Plus,
  Shuffle,
  Bell,
  Shield,
  User,
  LogOut,
  FolderTree,
  ChevronDown,
  BookOpen,
  LayoutDashboard,
  Bookmark,
  Menu,
  X,
  Users,
  Keyboard,
  Github,
  Send
} from 'lucide-react';

interface HeaderProps {
  onOpenSearch: () => void;
  onNavigate: (path: string) => void;
  onOpenAuth: () => void;
  onOpenShortcuts?: () => void;
  currentPath?: string;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenSearch,
  onNavigate,
  onOpenAuth,
  onOpenShortcuts,
  currentPath = '/'
}) => {
  const { user, logout, hasRole } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNotifDropdown, setShowNotifDropdown] = useState<boolean>(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState<boolean>(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);
  const [settings, setSettings] = useState<{ githubUrl?: string; telegramUrl?: string }>({});

  useEffect(() => {
    api.getSettings().then((res) => {
      if (res.settings) setSettings(res.settings);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (user) {
      api.getNotifications()
        .then((res) => setNotifications(res.notifications))
        .catch(console.error);
    }
  }, [user]);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const handleRandomArticle = async () => {
    try {
      const res = await api.getRandomArticleSlug();
      onNavigate(`/articles/${res.slug}`);
      setMobileMenuOpen(false);
    } catch {
      onNavigate('/articles');
      setMobileMenuOpen(false);
    }
  };

  const handleMarkNotifRead = async (id: string) => {
    try {
      await api.markNotificationRead(id);
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
    } catch (err) {
      console.error(err);
    }
  };

  const roleInfo = user ? getRoleBadgeInfo(user.role) : null;

  return (
    <header className="sticky top-0 z-40 bg-white/95 dark:bg-slate-950/95 backdrop-blur-md border-b border-[#a2a9b1]/60 dark:border-slate-800 shadow-2xs transition-all">
      {/* Main Responsive Header Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Brand Logo with Wikipedia Globe */}
        <div
          onClick={() => onNavigate('/')}
          className="flex items-center gap-3 cursor-pointer select-none group shrink-0"
        >
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20 group-hover:scale-105 transition-all">
            <WikipediaGlobeLogo className="w-6 h-6" />
          </div>
          <div>
            <div className="text-lg font-bold font-serif text-slate-900 dark:text-white tracking-tight leading-tight group-hover:text-blue-600 transition-colors">
              Вайбопедия
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 hidden sm:block">
              Свободная энциклопедия вайб-кодинга
            </p>
          </div>
        </div>

        {/* Search Bar Input (Desktop) */}
        <div className="flex-1 max-w-md hidden md:block">
          <button
            onClick={onOpenSearch}
            className="w-full flex items-center justify-between px-4 py-2 rounded-xl bg-slate-100/80 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800/80 text-slate-500 dark:text-slate-400 text-xs hover:border-blue-500 transition-all shadow-2xs group"
          >
            <div className="flex items-center gap-2">
              <Search className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-600 transition-colors" />
              <span>Поиск статей и справочников...</span>
            </div>
            <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-mono bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded text-slate-400">
              Ctrl+K
            </kbd>
          </button>
        </div>

        {/* Desktop Header Links & Actions */}
        <div className="flex items-center gap-2 text-xs font-semibold">
          {/* Navigation Links */}
          <nav className="hidden lg:flex items-center gap-4 text-slate-600 dark:text-slate-300 mr-2">
            <button
              onClick={() => onNavigate('/categories')}
              className={`hover:text-blue-600 transition-colors ${
                currentPath.startsWith('/categories') ? 'text-blue-600 font-bold' : ''
              }`}
            >
              Категории
            </button>

            <button
              onClick={() => onNavigate('/developers')}
              className={`hover:text-blue-600 transition-colors flex items-center gap-1 ${
                currentPath === '/developers' ? 'text-blue-600 font-bold' : ''
              }`}
            >
              <Users className="w-3.5 h-3.5 text-blue-500" />
              <span>Разработчики</span>
            </button>

            <button
              onClick={handleRandomArticle}
              className="hover:text-blue-600 transition-colors flex items-center gap-1"
            >
              <Shuffle className="w-3.5 h-3.5 text-slate-400" />
              <span>Случайная</span>
            </button>
          </nav>

          {/* Search trigger icon for Mobile */}
          <button
            onClick={onOpenSearch}
            className="p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl md:hidden"
            title="Поиск"
          >
            <Search className="w-5 h-5" />
          </button>

          {/* Keyboard Shortcuts Button */}
          {onOpenShortcuts && (
            <button
              onClick={onOpenShortcuts}
              className="p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition hidden sm:flex items-center justify-center"
              title="Горячие клавиши (?)"
            >
              <Keyboard className="w-4 h-4 text-slate-500" />
            </button>
          )}

          {/* GitHub & Telegram dynamic links */}
          {settings.githubUrl && (
            <a
              href={settings.githubUrl}
              target="_blank"
              rel="noreferrer"
              className="p-2 text-slate-600 dark:text-slate-300 hover:text-blue-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition hidden sm:flex items-center justify-center"
              title="GitHub репозиторий"
            >
              <Github className="w-4 h-4" />
            </a>
          )}

          {settings.telegramUrl && (
            <a
              href={settings.telegramUrl}
              target="_blank"
              rel="noreferrer"
              className="p-2 text-slate-600 dark:text-slate-300 hover:text-blue-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition hidden sm:flex items-center justify-center"
              title="Telegram сообщество"
            >
              <Send className="w-4 h-4" />
            </a>
          )}

          {/* Create Article Button */}
          <button
            onClick={() => onNavigate('/articles/new')}
            className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-2xs active:scale-98"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Создать статью</span>
          </button>

          {/* Notifications Bell */}
          {user && (
            <div className="relative">
              <button
                onClick={() => setShowNotifDropdown(!showNotifDropdown)}
                className="p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl relative transition"
                title="Уведомления"
              >
                <Bell className="w-4 h-4" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 w-3.5 h-3.5 rounded-full bg-rose-600 text-white text-[9px] font-bold flex items-center justify-center animate-pulse">
                    {unreadCount}
                  </span>
                )}
              </button>

              {showNotifDropdown && (
                <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl py-2 z-50 animate-fade-in">
                  <div className="px-4 py-2 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <span className="font-bold text-xs text-slate-900 dark:text-white">Уведомления</span>
                    <button
                      onClick={() => {
                        onNavigate('/notifications');
                        setShowNotifDropdown(false);
                      }}
                      className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      Все ({notifications.length})
                    </button>
                  </div>
                  <div className="max-h-64 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
                    {notifications.length === 0 ? (
                      <div className="p-4 text-center text-xs text-slate-400">Уведомлений нет</div>
                    ) : (
                      notifications.slice(0, 5).map((n) => (
                        <div
                          key={n.id}
                          onClick={() => {
                            handleMarkNotifRead(n.id);
                            if (n.linkUrl) onNavigate(n.linkUrl);
                            setShowNotifDropdown(false);
                          }}
                          className={`p-3 text-xs cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 transition ${
                            !n.isRead ? 'bg-blue-50/50 dark:bg-blue-950/30' : ''
                          }`}
                        >
                          <div className="font-bold text-slate-900 dark:text-slate-100 mb-0.5">{n.title}</div>
                          <p className="text-slate-600 dark:text-slate-400 text-[11px] line-clamp-2">{n.message}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* User Profile Dropdown */}
          {user ? (
            <div className="relative">
              <button
                onClick={() => setShowProfileDropdown(!showProfileDropdown)}
                className="flex items-center gap-2 p-1 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition border border-transparent"
              >
                <img
                  src={user.avatarUrl}
                  alt={user.displayName}
                  className="w-7 h-7 rounded-lg object-cover ring-2 ring-blue-500/20"
                />
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 hidden lg:block">
                  {user.displayName}
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden lg:block" />
              </button>

              {showProfileDropdown && (
                <div className="absolute right-0 mt-2 w-60 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl py-2 z-50 animate-fade-in space-y-1">
                  <div className="px-4 py-2 border-b border-slate-100 dark:border-slate-800">
                    <p className="text-xs font-bold text-slate-900 dark:text-white">{user.displayName}</p>
                    <p className="text-[10px] text-slate-400">@{user.username}</p>
                    <span className={`mt-1 inline-block text-[10px] font-bold px-2 py-0.5 rounded-full border ${roleInfo?.colorClass} ${roleInfo?.borderClass}`}>
                      {roleInfo?.label}
                    </span>
                  </div>

                  <button
                    onClick={() => {
                      onNavigate(`/user/${user.username}`);
                      setShowProfileDropdown(false);
                    }}
                    className="w-full text-left px-4 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2"
                  >
                    <User className="w-4 h-4 text-blue-600" />
                    <span>Личный кабинет</span>
                  </button>

                  <button
                    onClick={() => {
                      onNavigate('/bookmarks');
                      setShowProfileDropdown(false);
                    }}
                    className="w-full text-left px-4 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2"
                  >
                    <Bookmark className="w-4 h-4 text-amber-500" />
                    <span>Закладки</span>
                  </button>

                  {hasRole(['admin', 'moderator']) && (
                    <button
                      onClick={() => {
                        onNavigate('/moderation');
                        setShowProfileDropdown(false);
                      }}
                      className="w-full text-left px-4 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2"
                    >
                      <Shield className="w-4 h-4 text-purple-600" />
                      <span>Панель модерации</span>
                    </button>
                  )}

                  {hasRole(['admin']) && (
                    <button
                      onClick={() => {
                        onNavigate('/admin');
                        setShowProfileDropdown(false);
                      }}
                      className="w-full text-left px-4 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2"
                    >
                      <LayoutDashboard className="w-4 h-4 text-rose-600" />
                      <span>Меню администратора</span>
                    </button>
                  )}

                  <div className="border-t border-slate-100 dark:border-slate-800 my-1" />

                  <button
                    onClick={() => {
                      logout();
                      setShowProfileDropdown(false);
                    }}
                    className="w-full text-left px-4 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 flex items-center gap-2"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Выйти</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={onOpenAuth}
              className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-xl text-xs font-semibold transition border border-slate-200 dark:border-slate-700"
            >
              Войти
            </button>
          )}

          {/* Mobile Hamburger Drawer Toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl lg:hidden"
            title="Меню"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-b border-slate-200 dark:border-slate-800 px-4 py-4 space-y-3 font-medium text-xs animate-fade-in">
          <button
            onClick={() => {
              onNavigate('/');
              setMobileMenuOpen(false);
            }}
            className="w-full text-left py-2 px-3 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2"
          >
            <BookOpen className="w-4 h-4 text-blue-600" />
            <span>Заглавная страница</span>
          </button>

          <button
            onClick={() => {
              onNavigate('/categories');
              setMobileMenuOpen(false);
            }}
            className="w-full text-left py-2 px-3 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2"
          >
            <FolderTree className="w-4 h-4 text-purple-600" />
            <span>Категории энциклопедии</span>
          </button>

          <button
            onClick={() => {
              onNavigate('/developers');
              setMobileMenuOpen(false);
            }}
            className="w-full text-left py-2 px-3 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2"
          >
            <Users className="w-4 h-4 text-blue-500" />
            <span>Разработчики и команда</span>
          </button>

          <button
            onClick={handleRandomArticle}
            className="w-full text-left py-2 px-3 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2"
          >
            <Shuffle className="w-4 h-4 text-amber-500" />
            <span>Случайная статья</span>
          </button>
        </div>
      )}
    </header>
  );
};
