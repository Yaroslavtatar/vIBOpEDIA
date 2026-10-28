import React, { useState } from 'react';
import * as diff from 'diff';
import { ArticleRevision } from '../types/index.js';
import { formatDateTime } from '../utils/formatters.js';

interface DiffViewerProps {
  oldRev: ArticleRevision;
  newRev: ArticleRevision;
  onRollback?: (revId: string) => void;
  canRollback?: boolean;
}

export const DiffViewer: React.FC<DiffViewerProps> = ({ oldRev, newRev, onRollback, canRollback }) => {
  const [diffMode, setDiffMode] = useState<'words' | 'lines'>('words');

  const diffResult = diffMode === 'words'
    ? diff.diffWords(oldRev.content, newRev.content)
    : diff.diffLines(oldRev.content, newRev.content);

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
      {/* Header comparing versions */}
      <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-6 text-sm">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-rose-500 inline-block"></span>
            <div>
              <span className="font-semibold text-slate-800 dark:text-slate-200">
                Версия {oldRev.versionNumber}
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400 block">
                {oldRev.authorName} • {formatDateTime(oldRev.createdAt)}
              </span>
            </div>
          </div>

          <span className="text-slate-400">→</span>

          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block"></span>
            <div>
              <span className="font-semibold text-slate-800 dark:text-slate-200">
                Версия {newRev.versionNumber}
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400 block">
                {newRev.authorName} • {formatDateTime(newRev.createdAt)}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="inline-flex rounded-lg bg-slate-200 dark:bg-slate-700 p-1 text-xs font-medium">
            <button
              onClick={() => setDiffMode('words')}
              className={`px-3 py-1 rounded-md transition ${
                diffMode === 'words'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              По словам
            </button>
            <button
              onClick={() => setDiffMode('lines')}
              className={`px-3 py-1 rounded-md transition ${
                diffMode === 'lines'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              По строкам
            </button>
          </div>

          {canRollback && onRollback && (
            <button
              onClick={() => onRollback(oldRev.id)}
              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold transition"
            >
              Откатить к v{oldRev.versionNumber}
            </button>
          )}
        </div>
      </div>

      {/* Edit Summary note */}
      <div className="px-4 py-2 bg-indigo-50/50 dark:bg-indigo-950/20 border-b border-indigo-100 dark:border-indigo-900/30 text-xs text-indigo-700 dark:text-indigo-300">
        <span className="font-semibold">Описание правки (v{newRev.versionNumber}):</span>{' '}
        {newRev.editSummary || 'Без описания'}
      </div>

      {/* Diff content view */}
      <div className="p-6 font-mono text-sm leading-relaxed whitespace-pre-wrap overflow-x-auto bg-slate-900/5 dark:bg-slate-950/50 max-h-[500px]">
        {diffResult.map((part, index) => {
          if (part.added) {
            return (
              <mark
                key={index}
                className="bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 underline decoration-emerald-500 decoration-2 px-1 rounded-xs"
              >
                {part.value}
              </mark>
            );
          }
          if (part.removed) {
            return (
              <del
                key={index}
                className="bg-rose-500/20 text-rose-800 dark:text-rose-300 line-through px-1 rounded-xs opacity-80"
              >
                {part.value}
              </del>
            );
          }
          return <span key={index} className="text-slate-700 dark:text-slate-300">{part.value}</span>;
        })}
      </div>
    </div>
  );
};
