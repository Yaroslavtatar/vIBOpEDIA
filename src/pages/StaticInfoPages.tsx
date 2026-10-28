import React from 'react';
import { BookOpen, ShieldCheck, FileText, Info } from 'lucide-react';

interface StaticPageProps {
  type: 'about' | 'guidelines' | 'privacy';
}

export const StaticInfoPage: React.FC<StaticPageProps> = ({ type }) => {
  if (type === 'about') {
    return (
      <div className="space-y-8 max-w-4xl mx-auto pb-16">
        <div className="border-b border-slate-200 dark:border-slate-800 pb-4">
          <h1 className="text-3xl font-bold font-serif text-slate-900 dark:text-white flex items-center gap-3">
            <Info className="w-7 h-7 text-indigo-500" />
            <span>О проекте «Вайбопедия»</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Свободная пользовательская энциклопедия с открытой модерацией и гарантией версионности.
          </p>
        </div>

        <div className="prose dark:prose-invert max-w-none text-sm leading-relaxed space-y-4 text-slate-700 dark:text-slate-300">
          <p>
            <strong>Вайбопедия (Vibopedia)</strong> — это независимая платформа открытых знаний, объединяющая независимых исследователей, инженеров, дизайнеров и увлечённых читателей.
          </p>
          <h3 className="text-lg font-bold font-serif text-slate-900 dark:text-white">Ключевые ценности:</h3>
          <ul className="list-disc pl-5 space-y-2">
            <li><strong>Прозрачность истории:</strong> Каждое изменение сохраняется в неизменяемой цепочке ревизий с подсветкой diff.</li>
            <li><strong>Многоуровневое рецензирование:</strong> Опыт сообщества и независимая модерация защищают материалы от вандализма.</li>
            <li><strong>Современный стиль:</strong> Минималистичный и быстродействующий интерфейс с удобной типографикой.</li>
          </ul>
        </div>
      </div>
    );
  }

  if (type === 'guidelines') {
    return (
      <div className="space-y-8 max-w-4xl mx-auto pb-16">
        <div className="border-b border-slate-200 dark:border-slate-800 pb-4">
          <h1 className="text-3xl font-bold font-serif text-slate-900 dark:text-white flex items-center gap-3">
            <ShieldCheck className="w-7 h-7 text-emerald-500" />
            <span>Правила публикации и редактирования</span>
          </h1>
        </div>

        <div className="space-y-4 text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
          <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-2">
            <h3 className="font-bold text-slate-900 dark:text-white">1. Нейтральная точка зрения (НТЗ)</h3>
            <p className="text-xs">Все статьи должны излагаться объективно, с обязательным указанием первоисточников и без субъективных оценок.</p>
          </div>

          <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-2">
            <h3 className="font-bold text-slate-900 dark:text-white">2. Подтверждаемость и источники</h3>
            <p className="text-xs">Факты должны подкрепляться сносками на авторитетные научные или отраслевые материалы.</p>
          </div>

          <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-2">
            <h3 className="font-bold text-slate-900 dark:text-white">3. Запрет вандализма и спама</h3>
            <p className="text-xs">Заведомо ложные правки, спам и оскорбительные материалы приводят к блокировке аккаунта.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-4xl mx-auto pb-16">
      <div className="border-b border-slate-200 dark:border-slate-800 pb-4">
        <h1 className="text-3xl font-bold font-serif text-slate-900 dark:text-white flex items-center gap-3">
          <FileText className="w-7 h-7 text-purple-500" />
          <span>Политика конфиденциальности</span>
        </h1>
      </div>

      <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
        Платформа Вайбопедия хранит минимально необходимые данные участников для обеспечения аутентификации и истории авторства. Публичные профили не раскрывают приватный email или пароли. Все передаваемые данные шифруются по стандартным протоколам.
      </p>
    </div>
  );
};
