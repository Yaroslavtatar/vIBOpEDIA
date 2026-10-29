import React, { useState, useEffect } from 'react';
import { api } from '../api/client.js';
import { Category } from '../types/index.js';
import {
  FolderPlus,
  Plus,
  Edit2,
  Trash2,
  FolderTree,
  Check,
  X,
  Layers,
  Cpu,
  Globe,
  Palette,
  Zap,
  BookOpen,
  Terminal,
  Sparkles,
  ChevronRight,
  Tag
} from 'lucide-react';

interface CategoryManagerProps {
  onCategoryChanged?: () => void;
}

const AVAILABLE_ICONS = [
  { name: 'Cpu', label: 'Процессор (Cpu)' },
  { name: 'Globe', label: 'Сеть (Globe)' },
  { name: 'Palette', label: 'Дизайн (Palette)' },
  { name: 'Zap', label: 'Молния (Zap)' },
  { name: 'BookOpen', label: 'Книга (BookOpen)' },
  { name: 'Terminal', label: 'Терминал (Terminal)' },
  { name: 'Sparkles', label: 'Искры (Sparkles)' },
  { name: 'Layers', label: 'Слои (Layers)' }
];

const AVAILABLE_COLORS = [
  { value: 'from-blue-600 to-indigo-700', label: 'Синий — Индиго' },
  { value: 'from-purple-600 to-indigo-800', label: 'Фиолетовый — Индиго' },
  { value: 'from-emerald-600 to-teal-700', label: 'Изумрудный — Бирюзовый' },
  { value: 'from-amber-600 to-orange-700', label: 'Янтарный — Оранжевый' },
  { value: 'from-rose-600 to-pink-700', label: 'Розовый — Красный' },
  { value: 'from-slate-700 to-slate-900', label: 'Тёмный градиент' }
];

export const CategoryManager: React.FC<CategoryManagerProps> = ({ onCategoryChanged }) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [editingCat, setEditingCat] = useState<Category | null>(null);
  const [isCreating, setIsCreating] = useState<boolean>(false);

  // Form states
  const [formName, setFormName] = useState<string>('');
  const [formSlug, setFormSlug] = useState<string>('');
  const [formDescription, setFormDescription] = useState<string>('');
  const [formParentId, setFormParentId] = useState<string>('');
  const [formIcon, setFormIcon] = useState<string>('BookOpen');
  const [formColor, setFormColor] = useState<string>('from-blue-600 to-indigo-700');

  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const loadCategories = async () => {
    setLoading(true);
    try {
      const res = await api.getCategories();
      setCategories(res.categories);
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Ошибка загрузки категорий' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  const resetForm = () => {
    setFormName('');
    setFormSlug('');
    setFormDescription('');
    setFormParentId('');
    setFormIcon('BookOpen');
    setFormColor('from-blue-600 to-indigo-700');
    setEditingCat(null);
    setIsCreating(false);
  };

  const handleStartCreate = (parentId: string = '') => {
    resetForm();
    setFormParentId(parentId);
    setIsCreating(true);
  };

  const handleStartEdit = (cat: Category) => {
    setEditingCat(cat);
    setFormName(cat.name);
    setFormSlug(cat.slug);
    setFormDescription(cat.description || '');
    setFormParentId(cat.parentId || '');
    setFormIcon(cat.iconName || 'BookOpen');
    setFormColor(cat.color || 'from-blue-600 to-indigo-700');
    setIsCreating(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      setMessage({ type: 'error', text: 'Укажите название категории.' });
      return;
    }

    try {
      const payload = {
        name: formName.trim(),
        slug: formSlug.trim() || undefined,
        description: formDescription.trim(),
        parentId: formParentId || null,
        iconName: formIcon,
        color: formColor
      };

      if (editingCat) {
        await api.updateCategory(editingCat.id, payload);
        setMessage({ type: 'success', text: `Категория "${formName}" успешно обновлена!` });
      } else {
        await api.createCategory(payload);
        setMessage({ type: 'success', text: `Новая категория "${formName}" создана!` });
      }

      resetForm();
      await loadCategories();
      if (onCategoryChanged) onCategoryChanged();
      setTimeout(() => setMessage(null), 3000);
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Ошибка сохранения категории' });
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Вы действительно хотите удалить категорию "${name}"?`)) return;

    try {
      await api.deleteCategory(id);
      setMessage({ type: 'success', text: `Категория "${name}" была удалена.` });
      await loadCategories();
      if (onCategoryChanged) onCategoryChanged();
      setTimeout(() => setMessage(null), 3000);
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Ошибка удаления категории' });
    }
  };

  // Organize parent categories and nested subcategories
  const mainCategories = categories.filter((c) => !c.parentId);
  const getSubcategories = (parentId: string) => categories.filter((c) => c.parentId === parentId);

  return (
    <div className="space-y-6">
      {/* Header and Add Button */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <h2 className="text-xl font-bold font-serif text-slate-900 dark:text-white flex items-center gap-2">
            <FolderTree className="w-5 h-5 text-blue-600" />
            <span>Управление рубриками и подкатегориями</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Создавайте главные категории и подкатегории энциклопедии, редактируйте описания и стили
          </p>
        </div>

        {!isCreating && !editingCat && (
          <button
            onClick={() => handleStartCreate('')}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-2xs"
          >
            <FolderPlus className="w-4 h-4" />
            <span>Создать главную рубрику</span>
          </button>
        )}
      </div>

      {message && (
        <div
          className={`p-4 rounded-xl text-xs font-bold flex items-center gap-2 ${
            message.type === 'success'
              ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400'
              : 'bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400'
          }`}
        >
          {message.type === 'success' ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
          <span>{message.text}</span>
        </div>
      )}

      {/* Category Create/Edit Form Modal or Inline Card */}
      {(isCreating || editingCat) && (
        <form
          onSubmit={handleSubmit}
          className="p-6 bg-white dark:bg-slate-900 border-2 border-blue-500 rounded-2xl space-y-4 shadow-md animate-fade-in"
        >
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
            <h3 className="font-bold font-serif text-sm text-slate-900 dark:text-white">
              {editingCat ? `Редактирование категории "${editingCat.name}"` : 'Создание новой категории'}
            </h3>
            <button
              type="button"
              onClick={resetForm}
              className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Название категории *
              </label>
              <input
                type="text"
                required
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="Например: Вайб-кодинг и Методология"
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Родительская рубрика (для создания подкатегории)
              </label>
              <select
                value={formParentId}
                onChange={(e) => setFormParentId(e.target.value)}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-semibold"
              >
                <option value="">-- Нет (Главная верхнеуровневая рубрика) --</option>
                {mainCategories
                  .filter((c) => editingCat ? c.id !== editingCat.id : true)
                  .map((c) => (
                    <option key={c.id} value={c.id}>
                      📁 {c.name}
                    </option>
                  ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Иконка категории
              </label>
              <select
                value={formIcon}
                onChange={(e) => setFormIcon(e.target.value)}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs"
              >
                {AVAILABLE_ICONS.map((ic) => (
                  <option key={ic.name} value={ic.name}>
                    {ic.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Цветовой стиль плашки
              </label>
              <select
                value={formColor}
                onChange={(e) => setFormColor(e.target.value)}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-semibold"
              >
                {AVAILABLE_COLORS.map((col) => (
                  <option key={col.value} value={col.value}>
                    {col.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Энциклопедическое описание
            </label>
            <textarea
              rows={2}
              value={formDescription}
              onChange={(e) => setFormDescription(e.target.value)}
              placeholder="Краткое описание сущности данной рубрики..."
              className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={resetForm}
              className="px-4 py-2 border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300 rounded-xl text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              Отмена
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition shadow-xs"
            >
              {editingCat ? 'Сохранить изменения' : 'Создать рубрику'}
            </button>
          </div>
        </form>
      )}

      {/* Existing Categories Tree */}
      {loading ? (
        <div className="p-8 text-center text-xs text-slate-400">Загрузка рубрик...</div>
      ) : categories.length === 0 ? (
        <div className="p-12 text-center text-slate-500 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-3">
          <Layers className="w-10 h-10 text-slate-300 mx-auto" />
          <h3 className="font-bold text-sm text-slate-800 dark:text-slate-200">
            Категории ещё не созданы
          </h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Как модератор или администратор, создайте первую рубрику, чтобы авторы могли направить в неё статьи!
          </p>
          <button
            onClick={() => handleStartCreate('')}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold"
          >
            Создать первую рубрику
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {mainCategories.map((mainCat) => {
            const subCats = getSubcategories(mainCat.id);

            return (
              <div
                key={mainCat.id}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-4 shadow-xs"
              >
                {/* Main Category Row */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
                  <div className="flex items-center gap-3">
                    <div className={`p-2.5 rounded-xl bg-gradient-to-tr ${mainCat.color} text-white font-bold text-xs shadow-xs`}>
                      <FolderTree className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold font-serif text-base text-slate-900 dark:text-white">
                          {mainCat.name}
                        </h3>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                          {mainCat.articleCount || 0} статей
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">{mainCat.description}</p>
                    </div>
                  </div>

                  {/* Actions for Main Category */}
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => handleStartCreate(mainCat.id)}
                      className="px-2.5 py-1.5 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 hover:bg-blue-100 rounded-lg text-[11px] font-bold flex items-center gap-1 transition"
                      title="Добавить подкатегорию"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Подкатегория</span>
                    </button>

                    <button
                      onClick={() => handleStartEdit(mainCat)}
                      className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition"
                      title="Редактировать"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => handleDelete(mainCat.id, mainCat.name)}
                      className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition"
                      title="Удалить"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Nested Subcategories List */}
                {subCats.length > 0 && (
                  <div className="pl-4 border-l-2 border-blue-500/30 space-y-2 pt-1">
                    <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                      Подкатегории:
                    </div>
                    {subCats.map((subCat) => (
                      <div
                        key={subCat.id}
                        className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200/60 dark:border-slate-800"
                      >
                        <div className="flex items-center gap-2">
                          <ChevronRight className="w-3.5 h-3.5 text-blue-500" />
                          <Tag className="w-3.5 h-3.5 text-slate-400" />
                          <span className="font-bold text-xs text-slate-800 dark:text-slate-200">
                            {subCat.name}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            ({subCat.articleCount || 0} статей)
                          </span>
                        </div>

                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleStartEdit(subCat)}
                            className="p-1 text-slate-400 hover:text-blue-600 rounded"
                          >
                            <Edit2 className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => handleDelete(subCat.id, subCat.name)}
                            className="p-1 text-slate-400 hover:text-rose-600 rounded"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
