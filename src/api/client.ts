import {
  User,
  Category,
  Article,
  ArticleRevision,
  Comment,
  Report,
  Notification,
  AuditLog,
  SiteSettings
} from '../types/index.js';

const API_BASE = '/api';

export function getStoredToken(): string | null {
  return localStorage.getItem('vibo_token');
}

export function setStoredToken(token: string | null) {
  if (token) {
    localStorage.setItem('vibo_token', token);
  } else {
    localStorage.removeItem('vibo_token');
  }
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getStoredToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {})
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    credentials: 'include',
    headers
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Произошла ошибка при выполнении запроса');
  }

  return data as T;
}

export const api = {
  // Auth
  getMe: () => request<{ user: User | null }>('/auth/me'),
  login: (email: string, pass: string) =>
    request<{ user: User; token: string }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password: pass })
    }),
  register: (email: string, username: string, pass: string, displayName: string) =>
    request<{ user: User; token: string }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, username, password: pass, displayName })
    }),
  logout: () =>
    request<{ success: boolean }>('/auth/logout', {
      method: 'POST'
    }),
  changePassword: (currentPassword: string, newPassword: string, confirmPassword?: string) =>
    request<{ success: boolean; message: string }>('/auth/change-password', {
      method: 'POST',
      body: JSON.stringify({ currentPassword, newPassword, confirmPassword })
    }),

  // Categories
  getCategories: () => request<{ categories: Category[] }>('/categories'),
  createCategory: (data: Partial<Category>) =>
    request<{ category: Category }>('/categories', {
      method: 'POST',
      body: JSON.stringify(data)
    }),
  updateCategory: (id: string, data: Partial<Category>) =>
    request<{ category: Category }>(`/categories/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    }),
  deleteCategory: (id: string) =>
    request<{ success: boolean }>(`/categories/${id}`, {
      method: 'DELETE'
    }),

  // Articles
  getArticles: (params?: {
    status?: string;
    category?: string;
    tag?: string;
    search?: string;
    sort?: string;
    page?: number;
    limit?: number;
  }) => {
    const q = new URLSearchParams();
    if (params?.status) q.append('status', params.status);
    if (params?.category) q.append('category', params.category);
    if (params?.tag) q.append('tag', params.tag);
    if (params?.search) q.append('search', params.search);
    if (params?.sort) q.append('sort', params.sort);
    if (params?.page) q.append('page', params.page.toString());
    if (params?.limit) q.append('limit', params.limit.toString());
    return request<{ articles: Article[]; pagination: { page: number; totalPages: number; total: number } }>(
      `/articles?${q.toString()}`
    );
  },
  getArticleBySlug: (slug: string) => request<{ article: Article }>(`/articles/slug/${slug}`),
  getRandomArticleSlug: () => request<{ slug: string }>('/articles/random'),
  createArticle: (data: Partial<Article> & { status?: string }) =>
    request<{ article: Article }>('/articles', {
      method: 'POST',
      body: JSON.stringify(data)
    }),
  editArticle: (id: string, data: Partial<Article> & { editSummary?: string }) =>
    request<{ article: Article; revision: ArticleRevision }>(`/articles/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    }),
  voteArticle: (id: string, type: 'like' | 'dislike') =>
    request<{ votes: { likes: number; dislikes: number } }>(`/articles/${id}/vote`, {
      method: 'POST',
      body: JSON.stringify({ type })
    }),

  // Revisions & Rollback
  getRevisions: (articleId: string) => request<{ revisions: ArticleRevision[] }>(`/articles/${articleId}/revisions`),
  rollbackRevision: (articleId: string, revisionId: string) =>
    request<{ article: Article; revision: ArticleRevision }>(`/articles/${articleId}/rollback`, {
      method: 'POST',
      body: JSON.stringify({ revisionId })
    }),

  // Moderation
  getModerationQueue: () =>
    request<{
      pendingArticles: Article[];
      pendingRevisions: ArticleRevision[];
      pendingReports: Report[];
      queueTotal: number;
    }>('/moderation/queue'),
  moderationAction: (data: { targetType: string; targetId: string; action: string; comment?: string }) =>
    request<{ success: boolean }>('/moderation/action', {
      method: 'POST',
      body: JSON.stringify(data)
    }),

  // Comments
  getComments: (articleId: string) => request<{ comments: Comment[] }>(`/articles/${articleId}/comments`),
  addComment: (articleId: string, content: string, parentId?: string | null) =>
    request<{ comment: Comment }>(`/articles/${articleId}/comments`, {
      method: 'POST',
      body: JSON.stringify({ content, parentId })
    }),

  // Reports
  submitReport: (data: { targetType: string; targetId: string; reason: string; details?: string }) =>
    request<{ report: Report }>('/reports', {
      method: 'POST',
      body: JSON.stringify(data)
    }),

  // Bookmarks
  getBookmarks: () => request<{ articles: Article[] }>('/bookmarks'),
  toggleBookmark: (articleId: string) =>
    request<{ isBookmarked: boolean }>('/bookmarks/toggle', {
      method: 'POST',
      body: JSON.stringify({ articleId })
    }),

  // Notifications
  getNotifications: () => request<{ notifications: Notification[] }>('/notifications'),
  markNotificationRead: (id: string) => request<{ success: boolean }>(`/notifications/${id}/read`, { method: 'POST' }),

  // Public User Profile
  getUserProfile: (username: string) => request<{ user: User; articles: Article[] }>(`/users/${username}`),

  // Admin
  getAdminStats: () =>
    request<{
      totalArticles: number;
      pendingArticles: number;
      totalUsers: number;
      pendingReports: number;
      totalEdits: number;
      settings: SiteSettings;
    }>('/admin/stats'),
  getAdminUsers: () => request<{ users: User[] }>('/admin/users'),
  updateUserRole: (userId: string, role: string) =>
    request<{ success: boolean }>(`/admin/users/${userId}/role`, {
      method: 'PUT',
      body: JSON.stringify({ role })
    }),
  getAdminAuditLogs: () => request<{ auditLogs: AuditLog[] }>('/admin/audit'),
  banUser: (userId: string, reason?: string) =>
    request<{ success: boolean }>(`/admin/users/${userId}/ban`, {
      method: 'POST',
      body: JSON.stringify({ reason })
    }),
  unbanUser: (userId: string) =>
    request<{ success: boolean }>(`/admin/users/${userId}/unban`, {
      method: 'POST'
    }),
  kickUser: (userId: string) =>
    request<{ success: boolean; message: string }>(`/admin/users/${userId}/kick`, {
      method: 'POST'
    }),
  deleteUser: (userId: string) =>
    request<{ success: boolean }>(`/admin/users/${userId}`, {
      method: 'DELETE'
    }),

  // Settings
  getSettings: () => request<{ settings: SiteSettings }>('/settings'),
  updateSettings: (data: Partial<SiteSettings>) =>
    request<{ settings: SiteSettings }>('/admin/settings', {
      method: 'PUT',
      body: JSON.stringify(data)
    }),

  // Gemini AI Assistant
  geminiAssist: (task: 'summary' | 'suggest_tags' | 'review', title: string, content: string) =>
    request<{ result: string }>('/gemini/assist', {
      method: 'POST',
      body: JSON.stringify({ task, title, content })
    })
};
