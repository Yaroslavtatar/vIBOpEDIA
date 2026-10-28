import React, { useState, useEffect } from 'react';
import { ShieldCheck, BookOpen, ExternalLink, Globe, Users, Sun, Moon } from 'lucide-react';
import { api } from '../api/client.js';

interface FooterProps {
  onNavigate: (path: string) => void;
  theme?: 'light' | 'dark';
  onToggleTheme?: (theme: 'light' | 'dark') => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate, theme = 'light', onToggleTheme }) => {
  const [settings, setSettings] = useState<{ githubUrl?: string; telegramUrl?: string }>({});

  useEffect(() => {
    api.getSettings().then((res) => {
      if (res.settings) setSettings(res.settings);
    }).catch(() => {});
  }, []);
  return (
    <footer className="bg-[#eaecf0] dark:bg-slate-950 text-slate-700 dark:text-slate-400 border-t border-[#a2a9b1] dark:border-slate-800 pt-10 pb-8 mt-16 text-xs font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Brand Info */}
          <div className="md:col-span-2 space-y-3">
            <div className="flex items-center gap-2 cursor-pointer" onClick={() => onNavigate('/')}>
              <div className="w-8 h-8 rounded bg-white dark:bg-slate-800 border border-[#a2a9b1] flex items-center justify-center font-serif font-bold text-slate-900 dark:text-white">
                W
              </div>
              <span className="text-lg font-serif font-bold text-slate-900 dark:text-white">
                Вайбопедия
              </span>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed max-w-lg">
              Текст доступен по лицензии <strong>Creative Commons Attribution-ShareAlike (CC BY-SA 4.0)</strong>; в отдельных случаях могут действовать дополнительные условия.
            </p>

            {/* Theme Switcher Controls in Footer */}
            <div className="pt-2 flex items-center gap-2">
              <span className="text-xs font-bold text-[#202122] dark:text-slate-300">Оформление:</span>
              <div className="inline-flex rounded-md shadow-2xs border border-[#a2a9b1] dark:border-slate-700 bg-white dark:bg-slate-900 p-0.5">
                <button
                  onClick={() => onToggleTheme && onToggleTheme('light')}
                  className={`px-2.5 py-1 text-xs rounded font-medium flex items-center gap-1.5 transition ${
                    theme === 'light'
                      ? 'bg-[#36c] text-white font-bold'
                      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                  title="Переключить на классическую светлую тему Wikipedia"
                >
                  <Sun className="w-3.5 h-3.5" />
                  <span>Светлая (Wikipedia)</span>
                </button>
                <button
                  onClick={() => onToggleTheme && onToggleTheme('dark')}
                  className={`px-2.5 py-1 text-xs rounded font-medium flex items-center gap-1.5 transition ${
                    theme === 'dark'
                      ? 'bg-slate-800 text-white font-bold'
                      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                  title="Переключить на тёмную тему"
                >
                  <Moon className="w-3.5 h-3.5" />
                  <span>Тёмная</span>
                </button>
              </div>
            </div>
          </div>

          {/* Navigation Links */}
          <div>
            <h4 className="font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-3 font-serif">
              Навигация
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <button onClick={() => onNavigate('/')} className="hover:underline text-[#36c]">
                  Заглавная страница
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('/categories')} className="hover:underline text-[#36c]">
                  Рубрикация и категории
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('/articles/new')} className="hover:underline text-[#36c]">
                  Создать статью
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('/developers')} className="hover:underline text-[#36c] font-semibold flex items-center gap-1">
                  <Users className="w-3.5 h-3.5" />
                  <span>Разработчики</span>
                </button>
              </li>
            </ul>
          </div>

          {/* Community & Legal */}
          <div>
            <h4 className="font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-3 font-serif">
              Сообщество
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <button onClick={() => onNavigate('/about')} className="hover:underline text-[#36c]">
                  О проекте
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('/guidelines')} className="hover:underline text-[#36c]">
                  Правила и критерии качества
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('/moderation')} className="hover:underline text-[#36c]">
                  Панель рецензирования
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('/privacy')} className="hover:underline text-[#36c]">
                  Политика конфиденциальности
                </button>
              </li>
              {settings.githubUrl && (
                <li>
                  <a
                    href={settings.githubUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="hover:underline text-[#36c] flex items-center gap-1"
                  >
                    <span>GitHub репозиторий</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </li>
              )}
              {settings.telegramUrl && (
                <li>
                  <a
                    href={settings.telegramUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="hover:underline text-[#36c] flex items-center gap-1"
                  >
                    <span>Telegram сообщество</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </li>
              )}
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-6 border-t border-slate-300 dark:border-slate-800 flex flex-wrap items-center justify-between gap-4 text-[11px] text-slate-500">
          <div>© 2026 Вайбопедия. Администрация: Ярослав Т. и Бобёр Х.</div>
          <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
            <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
            <span>Фонд свободных знаний</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
