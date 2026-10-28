import React from 'react';
import { ChatGptLogo, ClaudeLogo, GeminiLogo } from '../components/Logos.js';
import { Users, Code, ShieldCheck, Sparkles, Bot, Terminal, Award, Heart } from 'lucide-react';

interface DevelopersPageProps {
  onNavigate: (path: string) => void;
}

export const DevelopersPage: React.FC<DevelopersPageProps> = ({ onNavigate }) => {
  return (
    <div className="space-y-10 pb-16 max-w-5xl mx-auto font-sans px-4 sm:px-6">
      {/* Page Header */}
      <div className="border-b border-slate-200 dark:border-slate-800 pb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2.5 rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
            <Users className="w-7 h-7" />
          </div>
          <h1 className="text-2xl sm:text-4xl font-bold font-serif text-slate-900 dark:text-white">
            Разработчики и Команда Вайбопедии
          </h1>
        </div>
        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed max-w-3xl">
          Информация об авторах платформы, административном составе и нейросетевых моделях, участвовавших в создании и поддержке энциклопедии
        </p>
      </div>

      {/* Section 1: AI Models & Neural Networks */}
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <Bot className="w-5 h-5 text-purple-600" />
          <h2 className="text-xl sm:text-2xl font-bold font-serif text-slate-900 dark:text-white">
            Нейросети, участвовавшие в разработке
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* ChatGPT Card with Official OpenAI Logo */}
          <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800/80 rounded-3xl p-6 shadow-xs hover:shadow-md transition-all duration-300 flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-center gap-3.5 mb-4">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 flex items-center justify-center shrink-0">
                  <ChatGptLogo className="w-7 h-7" />
                </div>
                <div>
                  <h3 className="font-bold font-serif text-lg text-slate-900 dark:text-white">ChatGPT</h3>
                  <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                    OpenAI
                  </span>
                </div>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-sans">
                Сбор информации, планирование архитектуры, проработка категорий и систематизация энциклопедических спецификаций.
              </p>
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-500 flex items-center gap-1.5 font-semibold">
              <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
              <span>Архитектура & Спецификации</span>
            </div>
          </div>

          {/* Claude Card with Official Anthropic Logo */}
          <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800/80 rounded-3xl p-6 shadow-xs hover:shadow-md transition-all duration-300 flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-center gap-3.5 mb-4">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-600 border border-amber-500/20 flex items-center justify-center shrink-0">
                  <ClaudeLogo className="w-7 h-7" />
                </div>
                <div>
                  <h3 className="font-bold font-serif text-lg text-slate-900 dark:text-white">Claude</h3>
                  <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                    Anthropic
                  </span>
                </div>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-sans">
                Разработка компонентов фронтенда, построение бэкенд-сервера на Node.js/Express, версионность и рефакторинг кода.
              </p>
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-500 flex items-center gap-1.5 font-semibold">
              <Code className="w-3.5 h-3.5 text-amber-500" />
              <span>Фронтенд & Бэкенд</span>
            </div>
          </div>

          {/* Gemini Card with Official Google Gemini Star Logo */}
          <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800/80 rounded-3xl p-6 shadow-xs hover:shadow-md transition-all duration-300 flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-center gap-3.5 mb-4">
                <div className="w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-600 border border-blue-500/20 flex items-center justify-center shrink-0">
                  <GeminiLogo className="w-7 h-7" />
                </div>
                <div>
                  <h3 className="font-bold font-serif text-lg text-slate-900 dark:text-white">Gemini</h3>
                  <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-full border border-blue-500/20">
                    Google DeepMind
                  </span>
                </div>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-sans">
                Интерактивный ИИ-ассистент редактора, автосуммаризация статей, генерация тегов и интеграционный анализ.
              </p>
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-500 flex items-center gap-1.5 font-semibold">
              <Terminal className="w-3.5 h-3.5 text-blue-500" />
              <span>ИИ-Ассистент & Анализ</span>
            </div>
          </div>
        </div>
      </div>

      {/* Section 2: Human Administration Team */}
      <div className="space-y-6 pt-6 border-t border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-rose-600" />
          <h2 className="text-xl sm:text-2xl font-bold font-serif text-slate-900 dark:text-white">
            Администрация платформы
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Yaroslav T. Card */}
          <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800/80 rounded-3xl p-6 shadow-xs hover:shadow-md transition-all duration-300 flex items-center gap-5">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white font-serif font-bold text-2xl shadow-md shrink-0">
              ЯТ
            </div>
            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="font-bold font-serif text-lg text-slate-900 dark:text-white">Ярослав Т.</h3>
                <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-rose-500/10 text-rose-600 border border-rose-500/20">
                  Главный администратор
                </span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-sans">
                Основатель Вайбопедии, руководитель развития платформы и главный редактор.
              </p>
              <div className="text-[11px] text-slate-500 flex items-center gap-1.5 font-semibold pt-1">
                <Award className="w-3.5 h-3.5 text-amber-500" />
                <span>Основатель проекта</span>
              </div>
            </div>
          </div>

          {/* Bober X. Card */}
          <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800/80 rounded-3xl p-6 shadow-xs hover:shadow-md transition-all duration-300 flex items-center gap-5">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-purple-600 to-pink-600 flex items-center justify-center text-white font-serif font-bold text-2xl shadow-md shrink-0">
              БХ
            </div>
            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="font-bold font-serif text-lg text-slate-900 dark:text-white">Бобёр Х.</h3>
                <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-purple-500/10 text-purple-600 border border-purple-500/20">
                  Со-администратор
                </span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-sans">
                Главный инженер инфраструктуры, контроль качества кода и проверка безопасности.
              </p>
              <div className="text-[11px] text-slate-500 flex items-center gap-1.5 font-semibold pt-1">
                <Code className="w-3.5 h-3.5 text-purple-500" />
                <span>Главный инженер</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
