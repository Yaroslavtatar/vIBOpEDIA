import React, { useEffect, useState } from 'react';
import { api } from '../api/client.js';
import { Category, Article } from '../types/index.js';
import { RichTextEditor } from '../components/RichTextEditor.js';
import { useAuth } from '../context/AuthContext.js';
import { AlertTriangle } from 'lucide-react';

interface ArticleEditPageProps {
  slug?: string; // If set, editing mode. If empty, creation mode.
  onNavigate: (path: string) => void;
}

export const ArticleEditPage: React.FC<ArticleEditPageProps> = ({ slug, onNavigate }) => {
  const { user } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [article, setArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string>('');

  useEffect(() => {
    async function init() {
      try {
        const catRes = await api.getCategories();
        setCategories(catRes.categories);

        if (slug) {
          const artRes = await api.getArticleBySlug(slug);
          setArticle(artRes.article);
        }
      } catch (err: any) {
        setErrorMsg(err.message || 'Ошибка загрузки редактора');
      } finally {
        setLoading(false);
      }
    }

    init();
  }, [slug]);

  if (!user) {
    return (
      <div className="p-12 text-center max-w-md mx-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-lg space-y-4">
        <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto" />
        <h2 className="text-xl font-bold font-serif text-slate-900 dark:text-white">Авторизация обязательна</h2>
        <p className="text-xs text-slate-500">Войдите в аккаунт, чтобы создавать или редактировать статьи.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-16 text-center text-slate-400">
        <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-sm font-semibold">Инициализация энциклопедического редактора...</p>
      </div>
    );
  }

  const handleSubmit = async (data: {
    title: string;
    subtitle: string;
    content: string;
    categoryId: string;
    tags: string[];
    infobox: any[];
    sources: any[];
    coverImage: string;
    editSummary: string;
    status: 'draft' | 'pending' | 'published';
  }) => {
    if (slug && article) {
      const res = await api.editArticle(article.id, { ...data });
      onNavigate(`/articles/${res.article.slug}`);
    } else {
      const res = await api.createArticle({ ...data });
      onNavigate(`/articles/${res.article.slug}`);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {errorMsg && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/20 text-rose-600 rounded-2xl text-xs">
          {errorMsg}
        </div>
      )}

      <RichTextEditor
        initialTitle={article?.title}
        initialSubtitle={article?.subtitle}
        initialContent={article?.content}
        initialCategoryId={article?.categoryId}
        initialTags={article?.tags}
        initialInfobox={article?.infobox}
        initialSources={article?.sources}
        initialCoverImage={article?.coverImage}
        categories={categories}
        onSubmit={handleSubmit}
        isEditing={!!slug}
      />
    </div>
  );
};
