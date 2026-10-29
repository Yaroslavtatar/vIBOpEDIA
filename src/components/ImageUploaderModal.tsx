import React, { useState, useRef } from 'react';
import { X, Upload, Image as ImageIcon, Link as LinkIcon, Check, Loader2 } from 'lucide-react';
import { api } from '../api/client.js';

interface ImageUploaderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectImage: (imageUrl: string) => void;
}

export const ImageUploaderModal: React.FC<ImageUploaderModalProps> = ({
  isOpen,
  onClose,
  onSelectImage
}) => {
  const [tab, setTab] = useState<'upload' | 'url'>('upload');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [externalUrl, setExternalUrl] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (!file.type.startsWith('image/')) {
        setError('Пожалуйста, выберите файл формата изображения (PNG, JPG, WEBP, GIF, SVG).');
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        setError('Файл слишком большой. Максимальный размер 10 МБ.');
        return;
      }
      setError('');
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onload = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUploadSubmit = async () => {
    if (tab === 'url') {
      if (!externalUrl.trim()) {
        setError('Введите ссылку на изображение.');
        return;
      }
      onSelectImage(externalUrl.trim());
      onClose();
      return;
    }

    if (!selectedFile || !previewUrl) {
      setError('Выберите файл изображения для загрузки.');
      return;
    }

    try {
      setLoading(true);
      setError('');
      const res = await api.uploadImage(previewUrl, selectedFile.name);
      onSelectImage(res.url);
      setSelectedFile(null);
      setPreviewUrl('');
      onClose();
    } catch (err: any) {
      setError(err.message || 'Ошибка загрузки файла на сервер.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-6 font-sans space-y-5">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <ImageIcon className="w-5 h-5 text-blue-600" />
            <h3 className="font-bold text-slate-900 dark:text-white text-base">Загрузка изображения</h3>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs font-semibold">
          <button
            onClick={() => setTab('upload')}
            className={`flex-1 py-1.5 rounded-lg transition flex items-center justify-center gap-1.5 ${
              tab === 'upload' ? 'bg-white dark:bg-slate-900 text-blue-600 shadow-2xs' : 'text-slate-500'
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Локальный файл</span>
          </button>
          <button
            onClick={() => setTab('url')}
            className={`flex-1 py-1.5 rounded-lg transition flex items-center justify-center gap-1.5 ${
              tab === 'url' ? 'bg-white dark:bg-slate-900 text-blue-600 shadow-2xs' : 'text-slate-500'
            }`}
          >
            <LinkIcon className="w-3.5 h-3.5" />
            <span>Прямая ссылка</span>
          </button>
        </div>

        {error && (
          <div className="p-3 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900 rounded-xl text-rose-600 dark:text-rose-400 text-xs">
            {error}
          </div>
        )}

        {tab === 'upload' ? (
          <div className="space-y-4">
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />

            {previewUrl ? (
              <div className="relative group rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 max-h-48 flex items-center justify-center bg-slate-50 dark:bg-slate-950">
                <img src={previewUrl} alt="Preview" className="max-h-48 object-contain" />
                <button
                  onClick={() => {
                    setSelectedFile(null);
                    setPreviewUrl('');
                  }}
                  className="absolute top-2 right-2 bg-slate-900/80 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-blue-500 rounded-2xl p-8 text-center cursor-pointer transition bg-slate-50/50 dark:bg-slate-950/50 group"
              >
                <Upload className="w-8 h-8 mx-auto text-slate-400 group-hover:text-blue-500 transition mb-2" />
                <p className="text-xs font-bold text-slate-700 dark:text-slate-200">
                  Нажмите для выбора файла
                </p>
                <p className="text-[11px] text-slate-400 mt-1">PNG, JPG, WEBP, GIF, SVG до 10 МБ</p>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
              URL адреса изображения
            </label>
            <input
              type="url"
              placeholder="https://images.unsplash.com/photo-..."
              value={externalUrl}
              onChange={(e) => setExternalUrl(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
        )}

        <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            Отмена
          </button>
          <button
            onClick={handleUploadSubmit}
            disabled={loading}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white transition flex items-center gap-1.5 disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
            <span>Применить</span>
          </button>
        </div>
      </div>
    </div>
  );
};
