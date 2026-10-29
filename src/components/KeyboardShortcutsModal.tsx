import React from 'react';
import { X, Keyboard, Command } from 'lucide-react';

interface KeyboardShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SHORTCUTS = [
  { key: 'Ctrl + K', description: 'Открыть быстрый поиск по энциклопедии' },
  { key: 'Ctrl + N', description: 'Перейти к созданию новой статьи' },
  { key: 'Ctrl + H', description: 'Перейти на Заглавную страницу' },
  { key: 'Ctrl + I', description: 'Открыть Банк Идей и Предложений' },
  { key: 'Ctrl + P', description: 'Открыть Статьи На Рассмотрении' },
  { key: 'Ctrl + Shift + R', description: 'Открыть случайную статью' },
  { key: 'Esc', description: 'Закрыть окно или поиск' },
  { key: '?', description: 'Показать справку по горячим клавишам' },
];

export const KeyboardShortcutsModal: React.FC<KeyboardShortcutsModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-6 font-sans space-y-6">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
          <div className="flex items-center gap-2 text-slate-900 dark:text-white">
            <Keyboard className="w-5 h-5 text-blue-600" />
            <h3 className="font-serif font-bold text-lg">Горячие клавиши</h3>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-3">
          {SHORTCUTS.map((sc, idx) => (
            <div key={idx} className="flex items-center justify-between text-xs">
              <span className="text-slate-600 dark:text-slate-300 font-medium">{sc.description}</span>
              <kbd className="px-2 py-1 font-mono font-bold text-[11px] bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded border border-slate-200 dark:border-slate-700 shadow-2xs">
                {sc.key}
              </kbd>
            </div>
          ))}
        </div>

        <div className="pt-3 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-400 text-center">
          Нажмите <kbd className="px-1.5 py-0.5 font-mono bg-slate-100 dark:bg-slate-800 rounded">?</kbd> в любом месте для вызова справки
        </div>
      </div>
    </div>
  );
};
