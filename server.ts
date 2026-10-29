import express, { Request, Response, NextFunction } from 'express';
import cookieParser from 'cookie-parser';
import { createServer as createViteServer } from 'vite';
import fs from 'fs';
import path from 'path';
import { GoogleGenAI } from '@google/genai';
import { dbService } from './src/server/db.js';
import { User, Article, ArticleRevision, ArticleStatus, UserRole } from './src/types/index.js';

const app = express();

// Secure Cookie Parser & Body Parser
app.use(cookieParser());
app.use(express.json({ limit: '10mb' }));

// Serve Uploaded Files
app.use('/uploads', express.static(path.resolve('./uploads')));

// CORS & Production Security Headers
app.use((req: Request, res: Response, next: NextFunction) => {
  const origin = req.headers.origin;
  if (origin) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
  }
  res.setHeader(
    'Access-Control-Allow-Methods',
    'GET, POST, PUT, DELETE, OPTIONS, PATCH'
  );
  res.setHeader(
    'Access-Control-Allow-Headers',
    'Origin, X-Requested-With, Content-Type, Accept, Authorization, X-User-Id'
  );

  // Security Headers against common attacks
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }
  next();
});

// In-Memory Sliding-Window Rate Limiter for Auth Routes (brute-force defense)
interface RateLimitRecord {
  count: number;
  resetAt: number;
}
const authRateLimits = new Map<string, RateLimitRecord>();

function authRateLimiter(req: Request, res: Response, next: NextFunction) {
  const ip = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || 'unknown';
  const now = Date.now();
  const windowMs = 60 * 1000; // 1 minute
  const maxAttempts = 20; // 20 attempts per minute

  const record = authRateLimits.get(ip);
  if (!record || now > record.resetAt) {
    authRateLimits.set(ip, { count: 1, resetAt: now + windowMs });
    return next();
  }

  record.count += 1;
  if (record.count > maxAttempts) {
    const retryAfter = Math.ceil((record.resetAt - now) / 1000);
    res.setHeader('Retry-After', retryAfter.toString());
    return res.status(429).json({
      error: `Слишком много попыток. В целях безопасности подождите ${retryAfter} сек.`
    });
  }

  next();
}

function setSessionCookie(res: Response, userId: string) {
  const isProd = process.env.NODE_ENV === 'production';
  res.cookie('vibopedia_session', userId, {
    httpOnly: true,
    secure: isProd,
    sameSite: 'lax',
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    path: '/'
  });
}

// Auth Token Resolution via HTTP-only Cookie, Bearer Header or X-User-Id
function getAuthenticatedUser(req: Request): User | null {
  // 1. Check HTTP-only secure cookie
  const cookieToken = req.cookies?.vibopedia_session;
  if (cookieToken) {
    const user = dbService.getDb().users.find((u) => u.id === cookieToken || u.username === cookieToken);
    if (user && !user.isBanned) return user;
  }

  // 2. Check Authorization Bearer Header
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    const user = dbService.getDb().users.find((u) => u.id === token || u.username === token);
    if (user && !user.isBanned) return user;
  }

  // 3. Fallback to custom header
  const customUserId = req.headers['x-user-id'] as string;
  if (customUserId) {
    const user = dbService.getDb().users.find((u) => u.id === customUserId || u.username === customUserId);
    if (user && !user.isBanned) return user;
  }
  return null;
}

// Check Role Middleware Helper
function requireRole(roles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = getAuthenticatedUser(req);
    if (!user) {
      return res.status(401).json({ error: 'Требуется авторизация.' });
    }
    if (!roles.includes(user.role)) {
      return res.status(403).json({ error: 'Недостаточно прав для выполнения действия.' });
    }
    (req as any).user = user;
    next();
  };
}

// --- API ROUTES ---

// Auth Routes
app.get('/api/auth/me', (req: Request, res: Response) => {
  const user = getAuthenticatedUser(req);
  if (!user) return res.json({ user: null });
  const { passwordHash, ...safeUser } = user;
  res.json({ user: safeUser });
});

app.post('/api/auth/login', authRateLimiter, (req: Request, res: Response) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Укажите email/логин и пароль.' });
  }
  const user = dbService.verifyUserPassword(email, password);
  if (!user) {
    return res.status(400).json({ error: 'Неверный email/логин или пароль.' });
  }
  if (user.isBanned) {
    return res.status(403).json({ error: `Ваш аккаунт заблокирован: ${user.banReason || 'Нарушение правил'}` });
  }

  // Set HTTP-only secure session cookie
  setSessionCookie(res, user.id);

  const { passwordHash, ...safeUser } = user;
  res.json({ user: safeUser, token: user.id });
});

app.post('/api/auth/logout', (req: Request, res: Response) => {
  res.clearCookie('vibopedia_session', { path: '/' });
  res.json({ success: true, message: 'Сессия успешно завершена.' });
});

app.post('/api/auth/register', authRateLimiter, (req: Request, res: Response) => {
  // Check if public registration is allowed by administrator
  const settings = dbService.getDb().settings;
  if (settings.allowPublicRegistration === false) {
    return res.status(403).json({
      error: 'Свободная регистрация новых пользователей временно закрыта администратором.'
    });
  }

  const { email, username, password, displayName } = req.body;
  if (!email || !username || !password) {
    return res.status(400).json({ error: 'Заполните обязательные поля: email, логин и пароль.' });
  }

  if (password.length < 8) {
    return res.status(400).json({ error: 'Пароль должен содержать как минимум 8 символов.' });
  }

  if (dbService.getUserByEmail(email)) {
    return res.status(400).json({ error: 'Пользователь с таким email уже зарегистрирован.' });
  }
  if (dbService.getUserByUsername(username)) {
    return res.status(400).json({ error: 'Пользователь с таким логином уже существует.' });
  }
  const newUser = dbService.createUser(email, username, password, displayName);

  // Set HTTP-only secure session cookie
  setSessionCookie(res, newUser.id);

  const { passwordHash, ...safeUser } = newUser;
  res.json({ user: safeUser, token: newUser.id });
});

// Change Password Endpoint (requires current password verification)
app.post('/api/auth/change-password', authRateLimiter, (req: Request, res: Response) => {
  const user = getAuthenticatedUser(req);
  if (!user) return res.status(401).json({ error: 'Требуется авторизация.' });

  const { currentPassword, newPassword, confirmPassword } = req.body;
  if (!currentPassword || !newPassword) {
    return res.status(400).json({ error: 'Укажите текущий и новый пароль.' });
  }

  if (newPassword.length < 8) {
    return res.status(400).json({ error: 'Новый пароль должен содержать не менее 8 символов.' });
  }

  if (confirmPassword && newPassword !== confirmPassword) {
    return res.status(400).json({ error: 'Подтверждение пароля не совпадает с новым паролем.' });
  }

  // Verify current password against database
  const verified = dbService.verifyUserPassword(user.username, currentPassword);
  if (!verified) {
    return res.status(400).json({ error: 'Неверно указан текущий пароль.' });
  }

  const changed = dbService.changeUserPassword(user.id, newPassword);
  if (!changed) {
    return res.status(500).json({ error: 'Не удалось обновить пароль в базе данных.' });
  }

  dbService.logAudit(user, 'CHANGE_PASSWORD', 'user', user.id, 'Пользователь успешно изменил пароль');
  res.json({ success: true, message: 'Пароль успешно изменен.' });
});

// Category Routes
app.get('/api/categories', (req: Request, res: Response) => {
  const categories = dbService.getDb().categories.map((c) => {
    const count = dbService.getDb().articles.filter(
      (a) => a.categoryId === c.id && a.status === 'published'
    ).length;
    return { ...c, articleCount: count };
  });
  res.json({ categories });
});

app.post('/api/categories', requireRole(['admin', 'moderator']), (req: Request, res: Response) => {
  const { name, slug, description, iconName, color, parentId } = req.body;
  if (!name) return res.status(400).json({ error: 'Название категории обязательно.' });

  const catSlug = slug || name.toLowerCase().replace(/[^\w\u0400-\u04FF\s-]/g, '').trim().replace(/\s+/g, '-') || ('cat-' + Date.now());

  const newCat = {
    id: 'cat-' + Date.now(),
    name,
    slug: catSlug,
    description: description || '',
    iconName: iconName || 'BookOpen',
    color: color || 'from-blue-600 to-indigo-700',
    parentId: parentId || null
  };

  dbService.updateDb((db) => {
    db.categories.push(newCat);
  });

  const actor = (req as any).user as User;
  dbService.logAudit(actor, 'CREATE_CATEGORY', 'category', newCat.id, `Создана рубрика "${name}"`);

  res.json({ category: newCat });
});

app.put('/api/categories/:id', requireRole(['admin', 'moderator']), (req: Request, res: Response) => {
  const { id } = req.params;
  const { name, slug, description, iconName, color, parentId } = req.body;

  let updatedCat: any = null;
  dbService.updateDb((db) => {
    const cat = db.categories.find((c) => c.id === id);
    if (cat) {
      if (name) cat.name = name;
      if (slug) cat.slug = slug;
      if (description !== undefined) cat.description = description;
      if (iconName !== undefined) cat.iconName = iconName;
      if (color !== undefined) cat.color = color;
      if (parentId !== undefined) cat.parentId = parentId;
      updatedCat = cat;
    }
  });

  if (!updatedCat) return res.status(404).json({ error: 'Категория не найдена.' });

  const actor = (req as any).user as User;
  dbService.logAudit(actor, 'UPDATE_CATEGORY', 'category', id, `Обновлена рубрика "${updatedCat.name}"`);

  res.json({ category: updatedCat });
});

app.delete('/api/categories/:id', requireRole(['admin', 'moderator']), (req: Request, res: Response) => {
  const { id } = req.params;

  dbService.updateDb((db) => {
    const idx = db.categories.findIndex((c) => c.id === id);
    if (idx >= 0) {
      const removed = db.categories[idx];
      db.categories.splice(idx, 1);

      // Remove parentId reference for any child categories
      db.categories.forEach((c) => {
        if (c.parentId === id) c.parentId = null;
      });
    }
  });

  const actor = (req as any).user as User;
  dbService.logAudit(actor, 'DELETE_CATEGORY', 'category', id, 'Удалена рубрика');

  res.json({ success: true });
});

// Articles Routes
app.get('/api/articles', (req: Request, res: Response) => {
  const { status, category, tag, search, sort = 'newest', page = '1', limit = '12' } = req.query;
  const user = getAuthenticatedUser(req);

  let list = dbService.getDb().articles;

  // Filter by status: Guests and normal users see published. Authors see their drafts/pending. Mods/Admins see all.
  if (status) {
    list = list.filter((a) => a.status === status);
  } else {
    list = list.filter((a) => {
      if (a.status === 'published') return true;
      if (user && (user.role === 'admin' || user.role === 'moderator' || a.authorId === user.id)) {
        return true;
      }
      return false;
    });
  }

  // Category filter
  if (category) {
    list = list.filter((a) => a.categoryId === category || a.categorySlug === category);
  }

  // Tag filter
  if (tag) {
    list = list.filter((a) => a.tags.some((t) => t.toLowerCase() === (tag as string).toLowerCase()));
  }

  // Search filter (in title, subtitle, content, tags)
  if (search) {
    const q = (search as string).toLowerCase().trim();
    list = list.filter(
      (a) =>
        a.title.toLowerCase().includes(q) ||
        a.subtitle.toLowerCase().includes(q) ||
        a.content.toLowerCase().includes(q) ||
        a.tags.some((t) => t.toLowerCase().includes(q))
    );
  }

  // Sorting
  if (sort === 'popular') {
    list.sort((a, b) => b.viewsCount - a.viewsCount);
  } else if (sort === 'oldest') {
    list.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  } else if (sort === 'updated') {
    list.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  } else {
    // Default newest
    list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  const pageNum = Math.max(1, parseInt(page as string, 10));
  const limitNum = Math.max(1, parseInt(limit as string, 10));
  const total = list.length;
  const totalPages = Math.ceil(total / limitNum);
  const items = list.slice((pageNum - 1) * limitNum, pageNum * limitNum);

  res.json({ articles: items, pagination: { page: pageNum, totalPages, total } });
});

// Random article
app.get('/api/articles/random', (req: Request, res: Response) => {
  const published = dbService.getPublishedArticles();
  if (published.length === 0) return res.status(404).json({ error: 'Статей не найдено' });
  const randomArticle = published[Math.floor(Math.random() * published.length)];
  res.json({ slug: randomArticle.slug });
});

// Single Article by Slug
app.get('/api/articles/slug/:slug', (req: Request, res: Response) => {
  const { slug } = req.params;
  const article = dbService.getArticleBySlug(slug);
  if (!article) return res.status(404).json({ error: 'Статья не найдена.' });

  const user = getAuthenticatedUser(req);
  if (
    article.status !== 'published' &&
    (!user || (user.role !== 'admin' && user.role !== 'moderator' && article.authorId !== user.id))
  ) {
    return res.status(403).json({ error: 'Эта статья находится на модерации или скрыта.' });
  }

  // Increment view count for published articles
  if (article.status === 'published') {
    dbService.updateDb((db) => {
      const target = db.articles.find((a) => a.id === article.id);
      if (target) target.viewsCount += 1;
    });
  }

  const category = dbService.getDb().categories.find((c) => c.id === article.categoryId);
  const revisionsCount = dbService.getRevisionsForArticle(article.id).length;
  const discussionsCount = dbService.getDb().comments.filter((c) => c.articleId === article.id).length;
  const votes = dbService.getDb().likesMap[article.id] || { likes: 0, dislikes: 0 };

  res.json({
    article: {
      ...article,
      categoryName: category?.name || article.categoryName,
      categorySlug: category?.slug || article.categorySlug,
      revisionsCount,
      discussionsCount,
      likes: votes.likes,
      dislikes: votes.dislikes
    }
  });
});

// Vote Likes/Dislikes
app.post('/api/articles/:id/vote', (req: Request, res: Response) => {
  const { id } = req.params;
  const { type } = req.body; // 'like' | 'dislike'

  let updatedVotes = { likes: 0, dislikes: 0 };

  dbService.updateDb((db) => {
    if (!db.likesMap[id]) {
      db.likesMap[id] = { likes: 0, dislikes: 0 };
    }
    if (type === 'like') {
      db.likesMap[id].likes += 1;
    } else if (type === 'dislike') {
      db.likesMap[id].dislikes += 1;
    }
    updatedVotes = { ...db.likesMap[id] };
  });

  res.json({ votes: updatedVotes });
});

// Create Article (POST)
app.post('/api/articles', (req: Request, res: Response) => {
  const user = getAuthenticatedUser(req);
  if (!user) return res.status(401).json({ error: 'Авторизуйтесь для создания статьи.' });

  const { title, subtitle, content, categoryId, tags, infobox, sources, coverImage, status = 'pending' } = req.body;

  if (!title || !content || !categoryId) {
    return res.status(400).json({ error: 'Укажите заголовок, категорию и содержание статьи.' });
  }

  // Generate unique slug
  let slug = title
    .toLowerCase()
    .replace(/[^\w\u0400-\u04FF\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-');
  if (!slug) slug = 'article-' + Date.now();

  let existing = dbService.getArticleBySlug(slug);
  if (existing) {
    slug = `${slug}-${Math.random().toString(36).substring(2, 6)}`;
  }

  const category = dbService.getDb().categories.find((c) => c.id === categoryId);

  // Determine initial status:
  // Admin & Trusted Users publish directly, standard users go to pending unless saved as draft
  let finalStatus: ArticleStatus = status === 'draft' ? 'draft' : 'pending';
  const settings = dbService.getDb().settings;

  if (status !== 'draft') {
    if (user.role === 'admin' || user.role === 'moderator') {
      finalStatus = 'published';
    } else if (user.role === 'experienced_user' && settings.autoPublishForTrusted) {
      finalStatus = 'published';
    }
  }

  const articleId = 'art-' + Date.now();
  const revId = 'rev-' + Date.now() + '-v1';

  const newArticle: Article = {
    id: articleId,
    slug,
    currentRevisionId: revId,
    title,
    subtitle: subtitle || '',
    content,
    coverImage: coverImage || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1200&q=80',
    categoryId,
    categoryName: category?.name,
    categorySlug: category?.slug,
    tags: Array.isArray(tags) ? tags : [],
    infobox: Array.isArray(infobox) ? infobox : [],
    sources: Array.isArray(sources) ? sources : [],
    authorId: user.id,
    authorUsername: user.username,
    authorDisplayName: user.displayName,
    authorAvatar: user.avatarUrl,
    authorRole: user.role,
    contributors: [user.username],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    status: finalStatus,
    isProtected: false,
    viewsCount: 0,
    bookmarksCount: 0,
    revisionsCount: 1,
    discussionsCount: 0,
    featuredDay: false
  };

  const firstRev: ArticleRevision = {
    id: revId,
    articleId,
    versionNumber: 1,
    title,
    subtitle: subtitle || '',
    content,
    infobox: newArticle.infobox,
    sources: newArticle.sources,
    coverImage: newArticle.coverImage,
    categoryId,
    tags: newArticle.tags,
    authorId: user.id,
    authorName: user.displayName,
    authorUsername: user.username,
    createdAt: new Date().toISOString(),
    editSummary: finalStatus === 'draft' ? 'Сохранение черновика' : 'Первоначальная создание статьи',
    charDiffCount: content.length,
    status: finalStatus
  };

  dbService.updateDb((db) => {
    db.articles.push(newArticle);
    db.revisions.push(firstRev);
    // update user stats
    const u = db.users.find((usr) => usr.id === user.id);
    if (u) {
      u.stats.articlesCreated += 1;
      u.stats.editsCount += 1;
      if (finalStatus === 'published') u.stats.approvedEdits += 1;
    }
  });

  dbService.logAudit(user, 'CREATE_ARTICLE', 'article', articleId, `Статья "${title}" сгенерирована [${finalStatus}]`);

  res.json({ article: newArticle });
});

// Edit Article (PUT /api/articles/:id)
app.put('/api/articles/:id', (req: Request, res: Response) => {
  const user = getAuthenticatedUser(req);
  if (!user) return res.status(401).json({ error: 'Авторизуйтесь для редактирования.' });

  const { id } = req.params;
  const article = dbService.getArticleById(id);
  if (!article) return res.status(404).json({ error: 'Статья не найдена.' });

  if (article.isProtected && user.role !== 'admin' && user.role !== 'moderator') {
    return res.status(403).json({ error: 'Статья защищена от изменений администрацией.' });
  }

  const { title, subtitle, content, categoryId, tags, infobox, sources, coverImage, editSummary = 'Обновление содержания' } = req.body;

  const revisions = dbService.getRevisionsForArticle(id);
  const nextVersionNum = (revisions[0]?.versionNumber || 0) + 1;
  const newRevId = 'rev-' + Date.now() + `-v${nextVersionNum}`;

  const category = dbService.getDb().categories.find((c) => c.id === (categoryId || article.categoryId));

  const settings = dbService.getDb().settings;
  let newStatus: ArticleStatus = article.status;

  // Non-admins editing published articles might trigger pending approval unless trusted
  if (user.role === 'admin' || user.role === 'moderator' || (user.role === 'experienced_user' && settings.autoPublishForTrusted)) {
    newStatus = 'published';
  } else {
    newStatus = 'pending';
  }

  const charDiffCount = (content?.length || 0) - article.content.length;

  const newRevision: ArticleRevision = {
    id: newRevId,
    articleId: id,
    versionNumber: nextVersionNum,
    title: title || article.title,
    subtitle: subtitle !== undefined ? subtitle : article.subtitle,
    content: content || article.content,
    infobox: infobox || article.infobox,
    sources: sources || article.sources,
    coverImage: coverImage || article.coverImage,
    categoryId: categoryId || article.categoryId,
    tags: tags || article.tags,
    authorId: user.id,
    authorName: user.displayName,
    authorUsername: user.username,
    createdAt: new Date().toISOString(),
    editSummary,
    charDiffCount,
    status: newStatus
  };

  dbService.updateDb((db) => {
    db.revisions.push(newRevision);

    const art = db.articles.find((a) => a.id === id);
    if (art) {
      if (newStatus === 'published') {
        art.title = newRevision.title;
        art.subtitle = newRevision.subtitle;
        art.content = newRevision.content;
        art.infobox = newRevision.infobox;
        art.sources = newRevision.sources;
        art.coverImage = newRevision.coverImage;
        art.categoryId = newRevision.categoryId;
        art.categoryName = category?.name || art.categoryName;
        art.categorySlug = category?.slug || art.categorySlug;
        art.tags = newRevision.tags;
        art.currentRevisionId = newRevId;
        art.updatedAt = new Date().toISOString();
      }
      art.status = newStatus;
      if (!art.contributors.includes(user.username)) {
        art.contributors.push(user.username);
      }
      art.revisionsCount += 1;
    }

    const u = db.users.find((usr) => usr.id === user.id);
    if (u) {
      u.stats.editsCount += 1;
      if (newStatus === 'published') u.stats.approvedEdits += 1;
    }
  });

  dbService.logAudit(user, 'EDIT_ARTICLE', 'article', id, `Редактирование v${nextVersionNum} [${newStatus}]`);

  res.json({ article: dbService.getArticleById(id), revision: newRevision });
});

// Revisions for article
app.get('/api/articles/:id/revisions', (req: Request, res: Response) => {
  const { id } = req.params;
  const revisions = dbService.getRevisionsForArticle(id);
  res.json({ revisions });
});

// Rollback to specific revision
app.post('/api/articles/:id/rollback', requireRole(['admin', 'moderator', 'experienced_user']), (req: Request, res: Response) => {
  const user = (req as any).user as User;
  const { id } = req.params;
  const { revisionId } = req.body;

  const targetRev = dbService.getRevisionById(revisionId);
  if (!targetRev || targetRev.articleId !== id) {
    return res.status(404).json({ error: 'Указанная версия не найдена.' });
  }

  const revisions = dbService.getRevisionsForArticle(id);
  const nextNum = (revisions[0]?.versionNumber || 0) + 1;
  const newRevId = 'rev-' + Date.now() + `-v${nextNum}`;

  const rollbackRev: ArticleRevision = {
    id: newRevId,
    articleId: id,
    versionNumber: nextNum,
    title: targetRev.title,
    subtitle: targetRev.subtitle,
    content: targetRev.content,
    infobox: targetRev.infobox,
    sources: targetRev.sources,
    coverImage: targetRev.coverImage,
    categoryId: targetRev.categoryId,
    tags: targetRev.tags,
    authorId: user.id,
    authorName: user.displayName,
    authorUsername: user.username,
    createdAt: new Date().toISOString(),
    editSummary: `Откат изменений к версии v${targetRev.versionNumber}`,
    charDiffCount: 0,
    status: 'published'
  };

  dbService.updateDb((db) => {
    db.revisions.push(rollbackRev);
    const art = db.articles.find((a) => a.id === id);
    if (art) {
      art.title = rollbackRev.title;
      art.subtitle = rollbackRev.subtitle;
      art.content = rollbackRev.content;
      art.infobox = rollbackRev.infobox;
      art.sources = rollbackRev.sources;
      art.coverImage = rollbackRev.coverImage;
      art.categoryId = rollbackRev.categoryId;
      art.tags = rollbackRev.tags;
      art.currentRevisionId = newRevId;
      art.status = 'published';
      art.updatedAt = new Date().toISOString();
      art.revisionsCount += 1;
    }
  });

  dbService.logAudit(user, 'ROLLBACK_ARTICLE', 'article', id, `Откат к версии v${targetRev.versionNumber}`);

  res.json({ article: dbService.getArticleById(id), revision: rollbackRev });
});

// Moderation Queue & Actions
app.get('/api/moderation/queue', requireRole(['admin', 'moderator']), (req: Request, res: Response) => {
  const pendingArticles = dbService.getDb().articles.filter((a) => a.status === 'pending');
  const pendingRevisions = dbService.getDb().revisions.filter((r) => r.status === 'pending');
  const pendingReports = dbService.getDb().reports.filter((rep) => rep.status === 'pending');

  res.json({
    pendingArticles,
    pendingRevisions,
    pendingReports,
    queueTotal: pendingArticles.length + pendingReports.length
  });
});

app.post('/api/moderation/action', requireRole(['admin', 'moderator']), (req: Request, res: Response) => {
  const user = (req as any).user as User;
  const { targetType, targetId, action, comment } = req.body; // action: 'approve' | 'reject' | 'request_changes' | 'protect'

  if (targetType === 'article') {
    const article = dbService.getArticleById(targetId);
    if (!article) return res.status(404).json({ error: 'Статья не найдена' });

    dbService.updateDb((db) => {
      const art = db.articles.find((a) => a.id === targetId);
      if (!art) return;

      if (action === 'approve') {
        art.status = 'published';
        art.updatedAt = new Date().toISOString();
        db.notifications.push({
          id: 'notif-' + Date.now(),
          userId: art.authorId,
          title: 'Статья одобрена!',
          message: `Ваша статья "${art.title}" была успешно проверена и опубликована.`,
          type: 'article_approved',
          linkUrl: `/articles/${art.slug}`,
          isRead: false,
          createdAt: new Date().toISOString()
        });
      } else if (action === 'reject') {
        art.status = 'rejected';
        db.notifications.push({
          id: 'notif-' + Date.now(),
          userId: art.authorId,
          title: 'Статья отклонена',
          message: `Статья "${art.title}" отклонена модератором. Причина: ${comment || 'Не соответствует правилам'}`,
          type: 'article_rejected',
          isRead: false,
          createdAt: new Date().toISOString()
        });
      } else if (action === 'request_changes') {
        art.status = 'needs_revision';
      } else if (action === 'toggle_protect') {
        art.isProtected = !art.isProtected;
      }
    });

    dbService.logAudit(user, `MODERATE_${action.toUpperCase()}`, 'article', targetId, comment || action);
  }

  res.json({ success: true });
});

// Comments & Discussions
app.get('/api/articles/:id/comments', (req: Request, res: Response) => {
  const { id } = req.params;
  const comments = dbService.getDb().comments
    .filter((c) => c.articleId === id)
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  res.json({ comments });
});

app.post('/api/articles/:id/comments', (req: Request, res: Response) => {
  const user = getAuthenticatedUser(req);
  if (!user) return res.status(401).json({ error: 'Авторизуйтесь для комментариев.' });

  const { id } = req.params;
  const { content, parentId } = req.body;

  if (!content || !content.trim()) {
    return res.status(400).json({ error: 'Текст комментария не может быть пустым.' });
  }

  const newComment = {
    id: 'cmt-' + Date.now(),
    articleId: id,
    authorId: user.id,
    authorUsername: user.username,
    authorDisplayName: user.displayName,
    authorAvatar: user.avatarUrl,
    authorRole: user.role,
    content: content.trim(),
    createdAt: new Date().toISOString(),
    parentId: parentId || null
  };

  dbService.updateDb((db) => {
    db.comments.push(newComment);
    const art = db.articles.find((a) => a.id === id);
    if (art) art.discussionsCount += 1;
  });

  res.json({ comment: newComment });
});

// Reports
app.post('/api/reports', (req: Request, res: Response) => {
  const user = getAuthenticatedUser(req);
  if (!user) return res.status(401).json({ error: 'Авторизуйтесь для отправки жалобы.' });

  const { targetType, targetId, reason, details } = req.body;
  if (!targetId || !reason) return res.status(400).json({ error: 'Укажите причину жалобы.' });

  const newReport = {
    id: 'rep-' + Date.now(),
    targetType: targetType || 'article',
    targetId,
    reporterId: user.id,
    reporterUsername: user.username,
    reason,
    details: details || '',
    createdAt: new Date().toISOString(),
    status: 'pending' as const
  };

  dbService.updateDb((db) => {
    db.reports.push(newReport);
  });

  res.json({ report: newReport });
});

// Bookmarks
app.get('/api/bookmarks', (req: Request, res: Response) => {
  const user = getAuthenticatedUser(req);
  if (!user) return res.status(401).json({ error: 'Требуется авторизация.' });

  const userBookmarkIds = dbService
    .getDb()
    .bookmarks.filter((b) => b.userId === user.id)
    .map((b) => b.articleId);

  const bookmarkedArticles = dbService
    .getDb()
    .articles.filter((a) => userBookmarkIds.includes(a.id) && a.status === 'published');

  res.json({ articles: bookmarkedArticles });
});

app.post('/api/bookmarks/toggle', (req: Request, res: Response) => {
  const user = getAuthenticatedUser(req);
  if (!user) return res.status(401).json({ error: 'Требуется авторизация.' });

  const { articleId } = req.body;
  let isBookmarked = false;

  dbService.updateDb((db) => {
    const idx = db.bookmarks.findIndex((b) => b.userId === user.id && b.articleId === articleId);
    const art = db.articles.find((a) => a.id === articleId);

    if (idx >= 0) {
      db.bookmarks.splice(idx, 1);
      if (art && art.bookmarksCount > 0) art.bookmarksCount -= 1;
      isBookmarked = false;
    } else {
      db.bookmarks.push({ userId: user.id, articleId, createdAt: new Date().toISOString() });
      if (art) art.bookmarksCount += 1;
      isBookmarked = true;
    }
  });

  res.json({ isBookmarked });
});

// Notifications
app.get('/api/notifications', (req: Request, res: Response) => {
  const user = getAuthenticatedUser(req);
  if (!user) return res.status(401).json({ error: 'Требуется авторизация.' });

  const userNotifs = dbService
    .getDb()
    .notifications.filter((n) => n.userId === user.id)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  res.json({ notifications: userNotifs });
});

app.post('/api/notifications/:id/read', (req: Request, res: Response) => {
  const user = getAuthenticatedUser(req);
  if (!user) return res.status(401).json({ error: 'Требуется авторизация.' });

  dbService.updateDb((db) => {
    const n = db.notifications.find((notif) => notif.id === req.params.id && notif.userId === user.id);
    if (n) n.isRead = true;
  });

  res.json({ success: true });
});

// Public User Profile
app.get('/api/users/:username', (req: Request, res: Response) => {
  const { username } = req.params;
  const user = dbService.getUserByUsername(username);
  if (!user) return res.status(404).json({ error: 'Пользователь не найден' });

  const { passwordHash, email, ...safeUser } = user;
  const publishedArticles = dbService.getDb().articles.filter(
    (a) => a.authorUsername.toLowerCase() === username.toLowerCase() && a.status === 'published'
  );

  res.json({ user: safeUser, articles: publishedArticles });
});

// Admin API
app.get('/api/admin/stats', requireRole(['admin']), (req: Request, res: Response) => {
  const db = dbService.getDb();
  res.json({
    totalArticles: db.articles.filter((a) => a.status === 'published').length,
    pendingArticles: db.articles.filter((a) => a.status === 'pending').length,
    totalUsers: db.users.length,
    pendingReports: db.reports.filter((r) => r.status === 'pending').length,
    totalEdits: db.revisions.length,
    settings: db.settings
  });
});

app.get('/api/admin/users', requireRole(['admin']), (req: Request, res: Response) => {
  const users = dbService.getDb().users.map(({ passwordHash, ...u }) => u);
  res.json({ users });
});

app.put('/api/admin/users/:id/role', requireRole(['admin']), (req: Request, res: Response) => {
  const { id } = req.params;
  const { role } = req.body;
  const actor = (req as any).user as User;

  const target = dbService.getUserById(id);
  if (!target) return res.status(404).json({ error: 'Пользователь не найден' });

  if (target.id === 'usr-admin' || target.username === 'admin') {
    return res.status(403).json({ error: 'Нельзя изменить или понизить роль главного администратора.' });
  }

  const updated = dbService.updateUserRole(id, role as UserRole);
  if (!updated) {
    return res.status(400).json({ error: 'Не удалось обновить роль пользователя.' });
  }

  dbService.logAudit(actor, 'CHANGE_USER_ROLE', 'user', id, `Новая роль для @${target.username}: ${role}`);
  res.json({ success: true });
});

app.get('/api/admin/audit', requireRole(['admin']), (req: Request, res: Response) => {
  res.json({ auditLogs: dbService.getDb().auditLogs });
});

// Ban User
app.post('/api/admin/users/:id/ban', requireRole(['admin']), (req: Request, res: Response) => {
  const { id } = req.params;
  const { reason } = req.body;
  const actor = (req as any).user as User;

  const target = dbService.getUserById(id);
  if (!target) return res.status(404).json({ error: 'Пользователь не найден' });
  if (target.id === 'usr-admin' || target.username === 'admin' || target.role === 'admin') {
    return res.status(403).json({ error: 'Нельзя заблокировать учетную запись администратора.' });
  }

  dbService.banUser(id, reason);
  dbService.logAudit(actor, 'BAN_USER', 'user', id, `Пользователь @${target.username} заблокирован. Причина: ${reason || 'Нарушение правил'}`);
  res.json({ success: true });
});

// Unban User
app.post('/api/admin/users/:id/unban', requireRole(['admin']), (req: Request, res: Response) => {
  const { id } = req.params;
  const actor = (req as any).user as User;

  const target = dbService.getUserById(id);
  if (!target) return res.status(404).json({ error: 'Пользователь не найден' });

  dbService.unbanUser(id);
  dbService.logAudit(actor, 'UNBAN_USER', 'user', id, `Пользователь @${target.username} разблокирован`);
  res.json({ success: true });
});

// Kick User (Revoke active session)
app.post('/api/admin/users/:id/kick', requireRole(['admin']), (req: Request, res: Response) => {
  const { id } = req.params;
  const actor = (req as any).user as User;

  const target = dbService.getUserById(id);
  if (!target) return res.status(404).json({ error: 'Пользователь не найден' });
  if (target.id === 'usr-admin' || target.username === 'admin') {
    return res.status(403).json({ error: 'Нельзя сбросить сессию главного администратора.' });
  }

  dbService.logAudit(actor, 'KICK_USER', 'user', id, `Сессия пользователя @${target.username} принудительно завершена`);
  res.json({ success: true, message: 'Сессия пользователя сброшена' });
});

// Delete User
app.delete('/api/admin/users/:id', requireRole(['admin']), (req: Request, res: Response) => {
  const { id } = req.params;
  const actor = (req as any).user as User;

  const target = dbService.getUserById(id);
  if (!target) return res.status(404).json({ error: 'Пользователь не найден' });
  if (target.id === 'usr-admin' || target.username === 'admin' || target.role === 'admin') {
    return res.status(403).json({ error: 'Нельзя удалить учетную запись администратора' });
  }

  const success = dbService.deleteUser(id);
  if (success) {
    dbService.logAudit(actor, 'DELETE_USER', 'user', id, `Пользователь @${target.username} (${target.displayName}) удален`);
  }
  res.json({ success });
});

// Public Settings API (GitHub & Telegram Links, Site Metadata)
app.get('/api/settings', (req: Request, res: Response) => {
  res.json({ settings: dbService.getDb().settings });
});

// Update Settings (Admin only)
app.put('/api/admin/settings', requireRole(['admin']), (req: Request, res: Response) => {
  const actor = (req as any).user as User;
  const {
    githubUrl,
    telegramUrl,
    siteName,
    siteDescription,
    autoPublishForTrusted,
    moderationRequiredForNew,
    allowPublicRegistration
  } = req.body;

  dbService.updateDb((db) => {
    if (githubUrl !== undefined) db.settings.githubUrl = githubUrl;
    if (telegramUrl !== undefined) db.settings.telegramUrl = telegramUrl;
    if (siteName !== undefined) db.settings.siteName = siteName;
    if (siteDescription !== undefined) db.settings.siteDescription = siteDescription;
    if (autoPublishForTrusted !== undefined) db.settings.autoPublishForTrusted = Boolean(autoPublishForTrusted);
    if (moderationRequiredForNew !== undefined) db.settings.moderationRequiredForNew = Boolean(moderationRequiredForNew);
    if (allowPublicRegistration !== undefined) db.settings.allowPublicRegistration = Boolean(allowPublicRegistration);
  });

  dbService.logAudit(
    actor,
    'UPDATE_SETTINGS',
    'settings',
    'main_settings',
    `Обновлены настройки (Регистрация открыта: ${allowPublicRegistration ?? 'не изменено'}, GitHub: ${githubUrl || 'не изменен'}, Telegram: ${telegramUrl || 'не изменен'})`
  );
  res.json({ settings: dbService.getDb().settings });
});

// Gemini AI Assistant helper (optional smart features)
app.post('/api/gemini/assist', async (req: Request, res: Response) => {
  try {
    const { task, content, title } = req.body;
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return res.status(400).json({ error: 'GEMINI_API_KEY не задан в переменных окружения.' });
    }

    const ai = new GoogleGenAI({ apiKey });

    let prompt = '';
    if (task === 'summary') {
      prompt = `Напиши 2-3 предложения емкой аннотации для энциклопедической статьи "${title}".\nСодержание статьи:\n${content.substring(0, 3000)}`;
    } else if (task === 'suggest_tags') {
      prompt = `Предложи 5 ключевых тегов (разделенных запятой) для энциклопедической статьи "${title}". Содержание:\n${content.substring(0, 2000)}`;
    } else {
      prompt = `Дай советы по улучшению энциклопедического стиля статьи "${title}". Содержание:\n${content.substring(0, 2000)}`;
    }

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt
    });

    res.json({ result: response.text });
  } catch (err: any) {
    console.error('Gemini API Error:', err);
    res.status(500).json({ error: 'Ошибка генерации ответа ИИ' });
  }
});

// --- REAL-TIME SERVER-SENT EVENTS (SSE) SYSTEM ---
interface SSEClient {
  id: string;
  userId?: string;
  res: Response;
}
const sseClients = new Map<string, SSEClient>();

function broadcastSSE(event: string, data: any, targetUserId?: string) {
  const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
  for (const client of sseClients.values()) {
    if (!targetUserId || client.userId === targetUserId) {
      try {
        client.res.write(payload);
      } catch (err) {
        // ignore broken client socket
      }
    }
  }
}

app.get('/api/events', (req: Request, res: Response) => {
  const user = getAuthenticatedUser(req);
  const clientId = 'sse-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7);

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  res.write(`event: connected\ndata: ${JSON.stringify({ clientId, userId: user?.id || null })}\n\n`);

  sseClients.set(clientId, { id: clientId, userId: user?.id, res });

  const keepAliveInterval = setInterval(() => {
    try {
      res.write(': keep-alive\n\n');
    } catch {
      clearInterval(keepAliveInterval);
    }
  }, 20000);

  req.on('close', () => {
    clearInterval(keepAliveInterval);
    sseClients.delete(clientId);
  });
});

// --- IMAGE FILE UPLOAD ENDPOINT ---
app.post('/api/upload', (req: Request, res: Response) => {
  const user = getAuthenticatedUser(req);
  if (!user) {
    return res.status(401).json({ error: 'Авторизуйтесь для загрузки медиафайлов.' });
  }

  const { image, fileName } = req.body;
  if (!image) {
    return res.status(400).json({ error: 'Файл изображения не передан.' });
  }

  try {
    let base64Data = image;
    let mimeType = 'image/png';
    let ext = 'png';

    const match = image.match(/^data:(image\/[a-zA-Z0-9\+\-\.]+);base64,(.+)$/);
    if (match) {
      mimeType = match[1];
      base64Data = match[2];

      if (mimeType === 'image/jpeg' || mimeType === 'image/jpg') ext = 'jpg';
      else if (mimeType === 'image/png') ext = 'png';
      else if (mimeType === 'image/webp') ext = 'webp';
      else if (mimeType === 'image/gif') ext = 'gif';
      else if (mimeType === 'image/svg+xml') ext = 'svg';
      else {
        return res.status(400).json({ error: 'Поддерживаются только форматы PNG, JPG, WEBP, GIF и SVG.' });
      }
    }

    const buffer = Buffer.from(base64Data, 'base64');

    // Limit size to 10MB
    if (buffer.length > 10 * 1024 * 1024) {
      return res.status(400).json({ error: 'Размер файла превышает допустимый лимит 10 МБ.' });
    }

    const safeName = (fileName || 'image')
      .toLowerCase()
      .replace(/[^\w\u0400-\u04FF\s-]/g, '')
      .trim()
      .replace(/\s+/g, '-');

    const generatedFileName = `img-${Date.now()}-${Math.random().toString(36).substring(2, 6)}-${safeName || 'upload'}.${ext}`;
    const uploadPath = path.resolve('./uploads', generatedFileName);

    fs.writeFileSync(uploadPath, buffer);

    const fileUrl = `/uploads/${generatedFileName}`;
    res.json({ url: fileUrl, fileName: generatedFileName });
  } catch (err: any) {
    console.error('Upload error:', err);
    res.status(500).json({ error: 'Ошибка сохранения изображения на сервере.' });
  }
});

// --- ARTICLES UNDER REVIEW & MODERATION EXTENSIONS ---
app.get('/api/articles/pending', (req: Request, res: Response) => {
  const user = getAuthenticatedUser(req);
  if (!user) return res.status(401).json({ error: 'Требуется авторизация.' });

  const isModOrAdmin = user.role === 'admin' || user.role === 'moderator';
  const allArticles = dbService.getDb().articles;

  const pendingList = allArticles.filter((a) => {
    if (isModOrAdmin) {
      return a.status === 'pending' || a.status === 'needs_revision' || a.status === 'rejected';
    }
    // Author sees their own pending/needs_revision/rejected/draft articles
    return a.authorId === user.id && (a.status === 'pending' || a.status === 'needs_revision' || a.status === 'rejected' || a.status === 'draft');
  });

  res.json({ articles: pendingList });
});

// Retract article back to draft
app.post('/api/articles/:id/retract', (req: Request, res: Response) => {
  const user = getAuthenticatedUser(req);
  if (!user) return res.status(401).json({ error: 'Требуется авторизация.' });

  const { id } = req.params;
  const article = dbService.getArticleById(id);
  if (!article) return res.status(404).json({ error: 'Статья не найдена.' });

  if (article.authorId !== user.id && user.role !== 'admin') {
    return res.status(403).json({ error: 'У вас нет прав для забора этой статьи.' });
  }

  let updatedArt: Article | null = null;
  dbService.updateDb((db) => {
    const art = db.articles.find((a) => a.id === id);
    if (art) {
      art.status = 'draft';
      art.updatedAt = new Date().toISOString();
      updatedArt = art;

      db.notifications.push({
        id: 'notif-' + Date.now(),
        userId: user.id,
        title: 'Статья отозвана на доработку',
        message: `Вы забрали статью "${art.title}" на редактирование. Ей присвоен статус черновика.`,
        type: 'article_retracted',
        linkUrl: `/articles/${art.slug}/edit`,
        isRead: false,
        createdAt: new Date().toISOString()
      });
    }
  });

  broadcastSSE('article_retracted', { articleId: id, authorId: user.id });

  res.json({ success: true, article: updatedArt });
});

// Detailed Article Review (Approve / Reject with feedback / Request Changes)
app.post('/api/articles/:id/review', requireRole(['admin', 'moderator']), (req: Request, res: Response) => {
  const reviewer = (req as any).user as User;
  const { id } = req.params;
  const { status, feedback } = req.body; // status: 'published' | 'rejected' | 'needs_revision'

  const article = dbService.getArticleById(id);
  if (!article) return res.status(404).json({ error: 'Статья не найдена.' });

  if (!['published', 'rejected', 'needs_revision'].includes(status)) {
    return res.status(400).json({ error: 'Неверный статус проверки.' });
  }

  let updatedArt: Article | null = null;

  dbService.updateDb((db) => {
    const art = db.articles.find((a) => a.id === id);
    if (!art) return;

    art.status = status;
    art.updatedAt = new Date().toISOString();
    (art as any).reviewFeedback = feedback || null;
    (art as any).reviewedBy = reviewer.displayName;
    (art as any).reviewedAt = new Date().toISOString();
    updatedArt = art;

    let notifTitle = '';
    let notifMessage = '';
    let notifType: any = 'system';

    if (status === 'published') {
      notifTitle = 'Ваша статья успешно опубликована! 🎉';
      notifMessage = `Модератор ${reviewer.displayName} одобрил вашу статью "${art.title}".`;
      notifType = 'article_approved';
    } else if (status === 'rejected') {
      notifTitle = 'Статья отклонена модерацией ❌';
      notifMessage = `Статья "${art.title}" отклонена. Причина: ${feedback || 'Не соответствует правилам'}`;
      notifType = 'article_rejected';
    } else if (status === 'needs_revision') {
      notifTitle = 'Требуются правки в статье ✏️';
      notifMessage = `Модератор запросил изменения статьи "${art.title}". Замечания: ${feedback || 'Пожалуйста, проверьте факты и оформление'}`;
      notifType = 'article_pending';
    }

    db.notifications.push({
      id: 'notif-' + Date.now(),
      userId: art.authorId,
      title: notifTitle,
      message: notifMessage,
      type: notifType,
      linkUrl: status === 'published' ? `/articles/${art.slug}` : `/review`,
      isRead: false,
      createdAt: new Date().toISOString()
    });
  });

  dbService.logAudit(reviewer, `REVIEW_ARTICLE_${status.toUpperCase()}`, 'article', id, feedback || status);

  // Broadcast real-time SSE notification to the author
  broadcastSSE('article_reviewed', {
    articleId: id,
    title: article.title,
    status,
    feedback,
    reviewer: reviewer.displayName,
    authorId: article.authorId
  }, article.authorId);

  res.json({ success: true, article: updatedArt });
});

// Delete Article Endpoint (for author or admin)
app.delete('/api/articles/:id', (req: Request, res: Response) => {
  const user = getAuthenticatedUser(req);
  if (!user) return res.status(401).json({ error: 'Требуется авторизация.' });

  const { id } = req.params;
  const article = dbService.getArticleById(id);
  if (!article) return res.status(404).json({ error: 'Статья не найдена.' });

  if (article.authorId !== user.id && user.role !== 'admin') {
    return res.status(403).json({ error: 'У вас нет прав для удаления этой статьи.' });
  }

  dbService.updateDb((db) => {
    db.articles = db.articles.filter((a) => a.id !== id);
    db.revisions = db.revisions.filter((r) => r.articleId !== id);
    db.comments = db.comments.filter((c) => c.articleId !== id);
    delete db.likesMap[id];
  });

  dbService.logAudit(user, 'DELETE_ARTICLE', 'article', id, `Статья "${article.title}" удалена`);

  broadcastSSE('article_deleted', { articleId: id });

  res.json({ success: true });
});

// --- IDEAS & PROPOSALS API ROUTES ---
app.get('/api/ideas', (req: Request, res: Response) => {
  const user = getAuthenticatedUser(req);
  const db = dbService.getDb();

  const userVotesMap = new Map<string, number>();
  if (user) {
    db.ideaVotes.filter((v) => v.userId === user.id).forEach((v) => userVotesMap.set(v.ideaId, v.voteType));
  }

  const ideasList = db.ideas.map((idea) => ({
    ...idea,
    userVote: userVotesMap.get(idea.id) || 0
  })).sort((a, b) => b.score - a.score || new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  res.json({ ideas: ideasList });
});

app.post('/api/ideas', (req: Request, res: Response) => {
  const user = getAuthenticatedUser(req);
  if (!user) return res.status(401).json({ error: 'Авторизуйтесь для создания идеи.' });

  const { title, description, category } = req.body;
  if (!title || !description) {
    return res.status(400).json({ error: 'Заполните название и описание идеи.' });
  }

  const newIdea = {
    id: 'idea-' + Date.now(),
    title: title.trim(),
    description: description.trim(),
    category: category || 'features',
    status: 'open' as const,
    authorId: user.id,
    authorUsername: user.username,
    authorDisplayName: user.displayName,
    authorAvatar: user.avatarUrl,
    score: 1, // Author automatically upvotes their own proposal
    adminResponse: '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  dbService.updateDb((db) => {
    db.ideas.push(newIdea);
    db.ideaVotes.push({
      ideaId: newIdea.id,
      userId: user.id,
      voteType: 1,
      createdAt: new Date().toISOString()
    });
  });

  dbService.logAudit(user, 'CREATE_IDEA', 'idea', newIdea.id, `Предложена идея: "${newIdea.title}"`);

  broadcastSSE('new_idea', { idea: newIdea });

  res.json({ idea: newIdea });
});

app.post('/api/ideas/:id/vote', (req: Request, res: Response) => {
  const user = getAuthenticatedUser(req);
  if (!user) return res.status(401).json({ error: 'Авторизуйтесь для голосования.' });

  const { id } = req.params;
  const { voteType } = req.body; // +1 or -1

  if (voteType !== 1 && voteType !== -1) {
    return res.status(400).json({ error: 'Неверный тип голоса.' });
  }

  let newScore = 0;
  let currentUserVote = 0;

  dbService.updateDb((db) => {
    const idea = db.ideas.find((i) => i.id === id);
    if (!idea) return;

    const existingIndex = db.ideaVotes.findIndex((v) => v.ideaId === id && v.userId === user.id);

    if (existingIndex >= 0) {
      const prev = db.ideaVotes[existingIndex];
      if (prev.voteType === voteType) {
        // Toggle off vote
        db.ideaVotes.splice(existingIndex, 1);
        idea.score -= voteType;
        currentUserVote = 0;
      } else {
        // Change vote from +1 to -1 or vice versa
        idea.score += voteType - prev.voteType;
        prev.voteType = voteType;
        currentUserVote = voteType;
      }
    } else {
      // New vote
      db.ideaVotes.push({
        ideaId: id,
        userId: user.id,
        voteType,
        createdAt: new Date().toISOString()
      });
      idea.score += voteType;
      currentUserVote = voteType;
    }

    idea.updatedAt = new Date().toISOString();
    newScore = idea.score;
  });

  broadcastSSE('idea_voted', { ideaId: id, score: newScore });

  res.json({ score: newScore, userVote: currentUserVote });
});

// Update idea status or admin response
app.patch('/api/ideas/:id/status', requireRole(['admin', 'moderator']), (req: Request, res: Response) => {
  const actor = (req as any).user as User;
  const { id } = req.params;
  const { status, adminResponse } = req.body;

  let updatedIdea: any = null;

  dbService.updateDb((db) => {
    const idea = db.ideas.find((i) => i.id === id);
    if (!idea) return;

    if (status) idea.status = status;
    if (adminResponse !== undefined) idea.adminResponse = adminResponse;
    idea.updatedAt = new Date().toISOString();
    updatedIdea = idea;

    // Send notification to author
    db.notifications.push({
      id: 'notif-' + Date.now(),
      userId: idea.authorId,
      title: 'Статус вашей идеи обновлен!💡',
      message: `Администратор оценил идею "${idea.title}". Статус: ${status || idea.status}`,
      type: 'idea_status',
      linkUrl: `/ideas`,
      isRead: false,
      createdAt: new Date().toISOString()
    });
  });

  dbService.logAudit(actor, 'UPDATE_IDEA_STATUS', 'idea', id, `Статус: ${status}, Ответ: ${adminResponse}`);

  broadcastSSE('idea_updated', { idea: updatedIdea });

  res.json({ success: true, idea: updatedIdea });
});

app.delete('/api/ideas/:id', (req: Request, res: Response) => {
  const user = getAuthenticatedUser(req);
  if (!user) return res.status(401).json({ error: 'Требуется авторизация.' });

  const { id } = req.params;
  const db = dbService.getDb();
  const idea = db.ideas.find((i) => i.id === id);

  if (!idea) return res.status(404).json({ error: 'Идея не найдена.' });

  if (idea.authorId !== user.id && user.role !== 'admin') {
    return res.status(403).json({ error: 'Недостаточно прав для удаления идеи.' });
  }

  dbService.updateDb((d) => {
    d.ideas = d.ideas.filter((i) => i.id !== id);
    d.ideaVotes = d.ideaVotes.filter((v) => v.ideaId !== id);
  });

  broadcastSSE('idea_deleted', { ideaId: id });

  res.json({ success: true });
});

// --- VITE DEV / PRODUCTION STATIC SERVER INTEGRATION ---
async function startServer() {
  const PORT = Number(process.env.PORT) || 3000;

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'custom'
    });
    app.use(vite.middlewares);
    app.use('*', async (req, res, next) => {
      const url = req.originalUrl;
      try {
        let template = fs.readFileSync(path.resolve('./index.html'), 'utf-8');
        template = await vite.transformIndexHtml(url, template);
        res.status(200).set({ 'Content-Type': 'text/html' }).end(template);
      } catch (e) {
        vite.ssrFixStacktrace(e as Error);
        next(e);
      }
    });
  } else {
    app.use(express.static('dist'));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.resolve('dist/index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Vibopedia] Server operating on http://0.0.0.0:${PORT}`);
  });
}

startServer();
