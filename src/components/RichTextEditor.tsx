import React, { useState, useEffect } from 'react';
import { Category, ArticleInfoboxItem, ArticleSource } from '../types/index.js';
import { MarkdownContent } from './MarkdownContent.js';
import { ArticleInfobox } from './ArticleInfobox.js';
import { api } from '../api/client.js';
import {
  Bold,
  Italic,
  Heading2,
  Heading3,
  Quote,
  Table,
  Link,
  Code,
  Sparkles,
  Eye,
  Edit3,
  Plus,
  Trash2,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

interface RichTextEditorProps {
  initialTitle?: string;
  initialSubtitle?: string;
  initialContent?: string;
  initialCategoryId?: string;
  initialTags?: string[];
  initialInfobox?: ArticleInfoboxItem[];
  initialSources?: ArticleSource[];
  initialCoverImage?: string;
  categories: Category[];
  onSubmit: (data: {
    title: string;
    subtitle: string;
    content: string;
    categoryId: string;
    tags: string[];
    infobox: ArticleInfoboxItem[];
    sources: ArticleSource[];
    coverImage: string;
    editSummary: string;
    status: 'draft' | 'pending' | 'published';
  }) => Promise<void>;
  isEditing?: boolean;
}

export const RichTextEditor: React.FC<RichTextEditorProps> = ({
  initialTitle = '',
  initialSubtitle = '',
  initialContent = '',
  initialCategoryId = '',
  initialTags = [],
  initialInfobox = [],
  initialSources = [],
  initialCoverImage = '',
  categories,
  onSubmit,
  isEditing = false
}) => {
  const [title, setTitle] = useState(initialTitle);
  const [subtitle, setSubtitle] = useState(initialSubtitle);
  const [content, setContent] = useState(initialContent);
  const [categoryId, setCategoryId] = useState(initialCategoryId || (categories[0]?.id || ''));
  const [tagsInput, setTagsInput] = useState(initialTags.join(', '));
  const [coverImage, setCoverImage] = useState(initialCoverImage);
  const [infobox, setInfobox] = useState<ArticleInfoboxItem[]>(initialInfobox);
  const [sources, setSources] = useState<ArticleSource[]>(initialSources);
  const [editSummary, setEditSummary] = useState('');
  const [mode, setMode] = useState<'write' | 'preview' | 'split'>('write');
  const [autoSaveStatus, setAutoSaveStatus] = useState<string>('Готов к сохранению');
  const [submitting, setSubmitting] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Live text metrics
  const wordCount = content.trim() ? content.trim().split(/\s+/).filter(Boolean).length : 0;
  const charCount = content.length;
  const readingTime = Math.max(1, Math.ceil(wordCount / 180));

  // Auto-save draft timer in localStorage
  useEffect(() => {
    if (!title && !content) return;

    const timer = setTimeout(() => {
      const draftData = { title, subtitle, content, categoryId, tagsInput, coverImage, savedAt: new Date().toLocaleTimeString() };
      localStorage.setItem('vibo_article_draft', JSON.stringify(draftData));
      setAutoSaveStatus(`Черновик сохранён в ${draftData.savedAt}`);
    }, 2000);

    return () => clearTimeout(timer);
  }, [title, subtitle, content, categoryId, tagsInput, coverImage]);

  // Insert formatting at cursor position in textarea
  const insertFormatting = (prefix: string, suffix: string = '') => {
    const textarea = document.getElementById('editor-textarea') as HTMLTextAreaElement;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = content.substring(start, end) || 'текст';
    const newText = content.substring(0, start) + prefix + selectedText + suffix + content.substring(end);

    setContent(newText);
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + prefix.length, end + prefix.length);
    }, 0);
  };

  const handleAddInfoboxItem = () => {
    setInfobox([...infobox, { label: '', value: '' }]);
  };

  const handleAddSourceItem = () => {
    setSources([...sources, { title: '', author: '', year: '' }]);
  };

  const handleFormSubmit = async (targetStatus: 'draft' | 'pending' | 'published') => {
    if (!title.trim()) {
      setErrorMsg('Заполните заголовок статьи');
      return;
    }
    if (!content.trim()) {
      setErrorMsg('Напишите содержание статьи');
      return;
    }

    setSubmitting(true);
    setErrorMsg('');

    const parsedTags = tagsInput
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    try {
      await onSubmit({
        title: title.trim(),
        subtitle: subtitle.trim(),
        content: content.trim(),
        categoryId: categoryId || categories[0]?.id || 'cat-tech',
        tags: parsedTags,
        infobox: infobox.filter((i) => i.label && i.value),
        sources: sources.filter((s) => s.title),
        coverImage: coverImage.trim() || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1200&q=80',
        editSummary: editSummary.trim() || (isEditing ? 'Редактирование статьи' : 'Создание новой статьи'),
        status: targetStatus
      });
      localStorage.removeItem('vibo_article_draft');
    } catch (err: any) {
      setErrorMsg(err.message || 'Ошибка сохранения статьи');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-lg p-6 sm:p-8 space-y-6">
      {/* Editor Header & Mode Toggle */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#a2a9b1] dark:border-slate-800 pb-4">
        <div>
          <h1 className="text-2xl font-bold font-serif text-[#202122] dark:text-white">
            {isEditing ? 'Редактирование статьи' : 'Создание новой статьи'}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-2">
            <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
            <span>{autoSaveStatus}</span>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Mode Switcher */}
          <div className="bg-slate-100 dark:bg-slate-800 p-1 rounded-lg flex items-center gap-1 text-xs font-semibold border border-slate-200 dark:border-slate-700">
            <button
              onClick={() => setMode('write')}
              className={`px-3 py-1 rounded-md flex items-center gap-1.5 transition ${
                mode === 'write'
                  ? 'bg-white dark:bg-slate-900 text-[#202122] dark:text-white shadow-2xs font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Редактор</span>
            </button>
            <button
              onClick={() => setMode('split')}
              className={`px-3 py-1 rounded-md hidden sm:flex items-center gap-1.5 transition ${
                mode === 'split'
                  ? 'bg-white dark:bg-slate-900 text-[#202122] dark:text-white shadow-2xs font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <span>Двухпанельный</span>
            </button>
            <button
              onClick={() => setMode('preview')}
              className={`px-3 py-1 rounded-md flex items-center gap-1.5 transition ${
                mode === 'preview'
                  ? 'bg-white dark:bg-slate-900 text-[#202122] dark:text-white shadow-2xs font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Просмотр</span>
            </button>
          </div>
        </div>
      </div>

      {errorMsg && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 rounded-2xl text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {mode === 'write' ? (
        <div className="space-y-6">
          {/* Main Title & Subtitle */}
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                Заголовок статьи *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Например: Квантовые вычисления и будущее шифрования"
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl text-lg font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                Краткое описание / Аннотация
              </label>
              <input
                type="text"
                value={subtitle}
                onChange={(e) => setSubtitle(e.target.value)}
                placeholder="Подзаголовок для карточек и поиска..."
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Category, Cover Image URL, Tags */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                Категория *
              </label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
              >
                {categories.length === 0 ? (
                  <option value="">-- Выберите категорию --</option>
                ) : (
                  categories
                    .filter((c) => !c.parentId)
                    .map((mainCat) => {
                      const subCats = categories.filter((c) => c.parentId === mainCat.id);
                      return (
                        <React.Fragment key={mainCat.id}>
                          <option value={mainCat.id} className="font-bold text-slate-900">
                            📁 {mainCat.name}
                          </option>
                          {subCats.map((sub) => (
                            <option key={sub.id} value={sub.id} className="pl-4 text-slate-700">
                              &nbsp;&nbsp;&nbsp;&nbsp;↳ {sub.name}
                            </option>
                          ))}
                        </React.Fragment>
                      );
                    })
                )}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                Обложка (URL картинки)
              </label>
              <input
                type="text"
                value={coverImage}
                onChange={(e) => setCoverImage(e.target.value)}
                placeholder="https://images.unsplash.com/..."
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                Теги (через запятую)
              </label>
              <input
                type="text"
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
                placeholder="ИИ, Технологии, Будущее"
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Editor Formatting Toolbar */}
          <div className="border border-[#a2a9b1] dark:border-slate-800 rounded-xl overflow-hidden shadow-2xs">
            <div className="bg-[#eaecf0] dark:bg-slate-800 p-2 border-b border-[#a2a9b1] dark:border-slate-700 flex flex-wrap items-center gap-1.5 text-slate-800 dark:text-slate-200 font-sans text-xs">
              <button
                type="button"
                onClick={() => insertFormatting('**', '**')}
                className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-700 rounded font-bold"
                title="Жирный шрифт"
              >
                <Bold className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => insertFormatting('*', '*')}
                className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-700 rounded font-italic"
                title="Курсив"
              >
                <Italic className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => insertFormatting('## ')}
                className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-700 rounded"
                title="Заголовок раздела (H2)"
              >
                <Heading2 className="w-4 h-4 text-blue-600" />
              </button>
              <button
                type="button"
                onClick={() => insertFormatting('### ')}
                className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-700 rounded"
                title="Подраздел (H3)"
              >
                <Heading3 className="w-4 h-4 text-indigo-600" />
              </button>
              <button
                type="button"
                onClick={() => insertFormatting('[[', '|Название страницы]]')}
                className="px-2 py-1 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded text-xs font-bold text-[#36c] dark:text-blue-400 hover:underline"
                title="Вики-ссылка на другую статью [[slug|Название]]"
              >
                [[Вики-ссылка]]
              </button>
              <button
                type="button"
                onClick={() => insertFormatting('<ref>', '</ref>')}
                className="px-2 py-1 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50"
                title="Сноска на источник <ref>..."
              >
                &lt;ref&gt;Сноска
              </button>
              <button
                type="button"
                onClick={() => insertFormatting('\n| Заголовок 1 | Заголовок 2 |\n| :--- | :--- |\n| Ячейка 1 | Ячейка 2 |\n')}
                className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-700 rounded"
                title="Вставить Вики-таблицу"
              >
                <Table className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => insertFormatting('> ')}
                className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-700 rounded"
                title="Цитата"
              >
                <Quote className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => insertFormatting('`', '`')}
                className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-700 rounded"
                title="Код"
              >
                <Code className="w-4 h-4" />
              </button>
            </div>

            <textarea
              id="editor-textarea"
              rows={14}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Напишите энциклопедический текст статьи с разделами (## Заголовок), внутренними ссылками [[slug|Текст]] и сносками <ref>Источник</ref>..."
              className="w-full p-4 bg-white dark:bg-slate-950 text-[#202122] dark:text-slate-100 font-sans text-sm focus:outline-none leading-relaxed"
            />

            {/* Live Text Metrics Bar */}
            <div className="bg-[#f8f9fa] dark:bg-slate-900 px-4 py-2 border-t border-[#a2a9b1]/60 dark:border-slate-800 flex flex-wrap items-center justify-between gap-4 text-xs font-sans text-slate-600 dark:text-slate-400">
              <div className="flex items-center gap-4">
                <span>Слов: <strong className="text-slate-800 dark:text-slate-200">{wordCount}</strong></span>
                <span>Символов: <strong className="text-slate-800 dark:text-slate-200">{charCount}</strong></span>
                <span>Время чтения: <strong className="text-slate-800 dark:text-slate-200">~{readingTime} мин</strong></span>
              </div>
              <div className="text-[11px] text-slate-400">
                Форматирование: Вики-разметка / Markdown
              </div>
            </div>
          </div>

          {/* Infobox Builder */}
          <div className="border border-slate-200 dark:border-slate-800 rounded-2xl p-4 bg-slate-50/50 dark:bg-slate-800/30">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                Справочные факты (Инфобокс)
              </span>
              <button
                type="button"
                onClick={handleAddInfoboxItem}
                className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                Добавить факт
              </button>
            </div>

            <div className="space-y-2">
              {infobox.map((item, index) => (
                <div key={index} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={item.label}
                    onChange={(e) => {
                      const updated = [...infobox];
                      updated[index].label = e.target.value;
                      setInfobox(updated);
                    }}
                    placeholder="Параметр (напр: Год открытия)"
                    className="w-1/2 px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs"
                  />
                  <input
                    type="text"
                    value={item.value}
                    onChange={(e) => {
                      const updated = [...infobox];
                      updated[index].value = e.target.value;
                      setInfobox(updated);
                    }}
                    placeholder="Значение (напр: 2026 г.)"
                    className="w-1/2 px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs"
                  />
                  <button
                    type="button"
                    onClick={() => setInfobox(infobox.filter((_, i) => i !== index))}
                    className="p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Edit Summary note field */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
              Комментарий к правке (что было изменено)
            </label>
            <input
              type="text"
              value={editSummary}
              onChange={(e) => setEditSummary(e.target.value)}
              placeholder="Например: добавление источников, исправление опечаток..."
              className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white"
            />
          </div>
        </div>
      ) : mode === 'split' ? (
        /* Split View Mode (Side-by-side Editor & Live Preview) */
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-4 border border-[#a2a9b1] dark:border-slate-800 rounded-xl p-4 bg-white dark:bg-slate-900">
            <h3 className="font-bold text-xs uppercase tracking-wider text-slate-500 mb-2">Исходный текст (Вики-код)</h3>
            <textarea
              rows={18}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Напишите текст статьи..."
              className="w-full p-3 bg-slate-50 dark:bg-slate-950 font-mono text-xs border border-slate-300 dark:border-slate-800 rounded focus:outline-none leading-relaxed"
            />
          </div>

          <div className="border border-[#a2a9b1] dark:border-slate-800 rounded-xl p-6 bg-[#f8f9fa] dark:bg-slate-950/40 space-y-4">
            <h3 className="font-bold text-xs uppercase tracking-wider text-slate-500 border-b border-[#a2a9b1] pb-2">Живой предпросмотр</h3>
            <h1 className="text-2xl font-bold font-serif text-[#202122] dark:text-white border-b border-[#a2a9b1] pb-1">
              {title || 'Заголовок статьи'}
            </h1>
            {subtitle && <p className="text-xs text-slate-600 font-serif italic mb-2">{subtitle}</p>}
            <MarkdownContent content={content || '*Введите текст статьи слева для отображения предпросмотра...*'} />
          </div>
        </div>
      ) : (
        /* Preview Tab */
        <div className="space-y-6 font-sans">
          <div className="border border-[#a2a9b1] dark:border-slate-800 rounded-xl p-6 sm:p-8 bg-white dark:bg-slate-900">
            <h1 className="text-3xl font-bold font-serif text-[#202122] dark:text-white mb-2 border-b border-[#a2a9b1] pb-2">
              {title || 'Заголовок статьи'}
            </h1>
            {subtitle && <p className="text-slate-600 dark:text-slate-300 text-sm font-serif italic mb-4">{subtitle}</p>}

            {coverImage && (
              <img
                src={coverImage}
                alt={title}
                className="w-full h-64 object-cover rounded-lg mb-6 shadow-2xs border border-slate-200"
              />
            )}

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              <div className="lg:col-span-8">
                <MarkdownContent content={content || 'Нет содержимого для предпросмотра.'} />
              </div>
              <div className="lg:col-span-4">
                <ArticleInfobox items={infobox} title={title || 'Статья'} />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Submit Action Buttons */}
      <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-4">
        <button
          type="button"
          disabled={submitting}
          onClick={() => handleFormSubmit('draft')}
          className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-semibold transition"
        >
          Сохранить черновик
        </button>

        <div className="flex items-center gap-3">
          <button
            type="button"
            disabled={submitting}
            onClick={() => handleFormSubmit('pending')}
            className="px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-xl text-xs font-bold shadow-md transition transform hover:scale-[1.02]"
          >
            {submitting ? 'Отправка...' : 'Отправить на модерацию / Публикация'}
          </button>
        </div>
      </div>
    </div>
  );
};
