import { UserRole } from '../types/index.js';

export function formatDate(isoString: string): string {
  try {
    const d = new Date(isoString);
    return new Intl.DateTimeFormat('ru-RU', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    }).format(d);
  } catch {
    return isoString;
  }
}

export function formatDateTime(isoString: string): string {
  try {
    const d = new Date(isoString);
    return new Intl.DateTimeFormat('ru-RU', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(d);
  } catch {
    return isoString;
  }
}

export function estimateReadingTime(content: string): number {
  const wordsPerMinute = 180;
  const wordCount = content.trim().split(/\s+/).length;
  return Math.max(1, Math.ceil(wordCount / wordsPerMinute));
}

export function getRoleBadgeInfo(role: UserRole): { label: string; colorClass: string; borderClass: string } {
  switch (role) {
    case 'admin':
      return {
        label: 'Администратор',
        colorClass: 'bg-rose-500/10 text-rose-600 dark:text-rose-400',
        borderClass: 'border-rose-500/20'
      };
    case 'moderator':
      return {
        label: 'Модератор',
        colorClass: 'bg-purple-500/10 text-purple-600 dark:text-purple-400',
        borderClass: 'border-purple-500/20'
      };
    case 'experienced_user':
      return {
        label: 'Опытный участник',
        colorClass: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
        borderClass: 'border-amber-500/20'
      };
    case 'user':
      return {
        label: 'Участник',
        colorClass: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
        borderClass: 'border-blue-500/20'
      };
    default:
      return {
        label: 'Гость',
        colorClass: 'bg-slate-500/10 text-slate-600 dark:text-slate-400',
        borderClass: 'border-slate-500/20'
      };
  }
}
