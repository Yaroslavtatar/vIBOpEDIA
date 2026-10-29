import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import {
  User,
  Category,
  Article,
  ArticleRevision,
  Comment,
  Report,
  Notification,
  AuditLog,
  SiteSettings,
  UserRole,
  ArticleStatus
} from '../types/index.js';

const DATA_DIR = path.resolve('./data');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const DB_FILE = process.env.DATABASE_PATH
  ? path.resolve(process.env.DATABASE_PATH)
  : path.join(DATA_DIR, 'vibopedia.db');
const sqlite = new Database(DB_FILE);

// Enable WAL mode for high performance
sqlite.pragma('journal_mode = WAL');

// Initialize SQLite Tables
sqlite.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL,
    display_name TEXT NOT NULL,
    avatarUrl TEXT,
    bio TEXT,
    registered_at TEXT NOT NULL,
    reputation INTEGER DEFAULT 10,
    is_banned INTEGER DEFAULT 0,
    ban_reason TEXT,
    stats_json TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS categories (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    description TEXT,
    icon_name TEXT,
    color TEXT,
    parent_id TEXT
  );

  CREATE TABLE IF NOT EXISTS articles (
    id TEXT PRIMARY KEY,
    slug TEXT UNIQUE NOT NULL,
    current_revision_id TEXT,
    title TEXT NOT NULL,
    subtitle TEXT,
    content TEXT NOT NULL,
    cover_image TEXT,
    category_id TEXT NOT NULL,
    category_name TEXT,
    category_slug TEXT,
    tags_json TEXT,
    infobox_json TEXT,
    sources_json TEXT,
    author_id TEXT NOT NULL,
    author_username TEXT NOT NULL,
    author_display_name TEXT NOT NULL,
    author_avatar TEXT,
    author_role TEXT NOT NULL,
    contributors_json TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    status TEXT NOT NULL,
    is_protected INTEGER DEFAULT 0,
    views_count INTEGER DEFAULT 0,
    bookmarks_count INTEGER DEFAULT 0,
    revisions_count INTEGER DEFAULT 1,
    discussions_count INTEGER DEFAULT 0,
    featured_day INTEGER DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS revisions (
    id TEXT PRIMARY KEY,
    article_id TEXT NOT NULL,
    version_number INTEGER NOT NULL,
    title TEXT NOT NULL,
    subtitle TEXT,
    content TEXT NOT NULL,
    infobox_json TEXT,
    sources_json TEXT,
    cover_image TEXT,
    category_id TEXT NOT NULL,
    tags_json TEXT,
    author_id TEXT NOT NULL,
    author_name TEXT NOT NULL,
    author_username TEXT NOT NULL,
    created_at TEXT NOT NULL,
    edit_summary TEXT,
    char_diff_count INTEGER DEFAULT 0,
    status TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS comments (
    id TEXT PRIMARY KEY,
    article_id TEXT NOT NULL,
    author_id TEXT NOT NULL,
    author_username TEXT NOT NULL,
    author_display_name TEXT NOT NULL,
    author_avatar TEXT,
    author_role TEXT NOT NULL,
    content TEXT NOT NULL,
    created_at TEXT NOT NULL,
    parent_id TEXT
  );

  CREATE TABLE IF NOT EXISTS reports (
    id TEXT PRIMARY KEY,
    target_type TEXT NOT NULL,
    target_id TEXT NOT NULL,
    reporter_id TEXT NOT NULL,
    reporter_username TEXT NOT NULL,
    reason TEXT NOT NULL,
    details TEXT,
    status TEXT NOT NULL,
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS notifications (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    link_url TEXT,
    is_read INTEGER DEFAULT 0,
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS bookmarks (
    user_id TEXT NOT NULL,
    article_id TEXT NOT NULL,
    created_at TEXT NOT NULL,
    PRIMARY KEY (user_id, article_id)
  );

  CREATE TABLE IF NOT EXISTS audit_logs (
    id TEXT PRIMARY KEY,
    actor_id TEXT NOT NULL,
    actor_username TEXT NOT NULL,
    action TEXT NOT NULL,
    target_type TEXT NOT NULL,
    target_id TEXT NOT NULL,
    details TEXT,
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value_json TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS likes_map (
    article_id TEXT PRIMARY KEY,
    likes INTEGER DEFAULT 0,
    dislikes INTEGER DEFAULT 0
  );
`);

export interface DatabaseSchema {
  users: User[];
  categories: Category[];
  articles: Article[];
  revisions: ArticleRevision[];
  comments: Comment[];
  reports: Report[];
  notifications: Notification[];
  bookmarks: { userId: string; articleId: string; createdAt: string }[];
  auditLogs: AuditLog[];
  settings: SiteSettings;
  likesMap: Record<string, { likes: number; dislikes: number }>;
}

function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password + 'vibo_salt_2026').digest('hex');
}

// Single Default Administrator Account
const SINGLE_ADMIN_USER: User = {
  id: 'usr-admin',
  username: 'admin',
  email: 'admin@vibopedia.ru',
  passwordHash: hashPassword('admin123'),
  role: 'admin',
  displayName: 'Главный Администратор',
  avatarUrl: 'https://api.dicebear.com/7.x/identicon/svg?seed=admin',
  bio: 'Главный администратор платформы Вайбопедия.',
  registeredAt: new Date().toISOString(),
  reputation: 1000,
  stats: { articlesCreated: 0, editsCount: 0, approvedEdits: 0 }
};

// PURGE all legacy mock articles, revisions, categories, and test user accounts from SQLite
function purgeMockDataAndEnsureAdmin() {
  // Wipe all mock articles, revisions, comments and categories
  sqlite.exec(`
    DELETE FROM articles;
    DELETE FROM revisions;
    DELETE FROM comments;
    DELETE FROM categories;
    DELETE FROM likes_map;
    DELETE FROM reports;
    DELETE FROM users WHERE username != 'admin';
  `);

  // Ensure single admin exists
  const adminExists = sqlite.prepare("SELECT COUNT(*) as cnt FROM users WHERE username = 'admin'").get() as any;
  if (!adminExists || adminExists.cnt === 0) {
    const insertAdmin = sqlite.prepare(`
      INSERT INTO users (id, username, email, password_hash, role, display_name, avatarUrl, bio, registered_at, reputation, stats_json)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    insertAdmin.run(
      SINGLE_ADMIN_USER.id,
      SINGLE_ADMIN_USER.username,
      SINGLE_ADMIN_USER.email,
      SINGLE_ADMIN_USER.passwordHash,
      SINGLE_ADMIN_USER.role,
      SINGLE_ADMIN_USER.displayName,
      SINGLE_ADMIN_USER.avatarUrl,
      SINGLE_ADMIN_USER.bio,
      SINGLE_ADMIN_USER.registeredAt,
      SINGLE_ADMIN_USER.reputation,
      JSON.stringify(SINGLE_ADMIN_USER.stats)
    );
  }

  // Ensure default site settings with configurable githubUrl, telegramUrl and allowPublicRegistration
  const existingSettings = sqlite.prepare('SELECT value_json FROM settings WHERE key = ?').get('main_settings') as any;
  if (!existingSettings) {
    sqlite.prepare('INSERT INTO settings (key, value_json) VALUES (?, ?)').run('main_settings', JSON.stringify({
      autoPublishForTrusted: true,
      moderationRequiredForNew: true,
      allowPublicRegistration: true,
      rateLimitEditsPerMinute: 5,
      siteName: 'Вайбопедия',
      siteDescription: 'Свободная научно-популярная энциклопедия о вайб-кодинге',
      githubUrl: 'https://github.com',
      telegramUrl: 'https://t.me'
    }));
  } else {
    try {
      const parsed = JSON.parse(existingSettings.value_json);
      if (parsed.allowPublicRegistration === undefined) {
        parsed.allowPublicRegistration = true;
        sqlite.prepare('UPDATE settings SET value_json = ? WHERE key = ?').run(JSON.stringify(parsed), 'main_settings');
      }
    } catch (e) {
      // ignore
    }
  }
}

purgeMockDataAndEnsureAdmin();

class DatabaseService {
  public getDb(): DatabaseSchema {
    const usersRaw = sqlite.prepare('SELECT * FROM users').all() as any[];
    const users: User[] = usersRaw.map((u) => ({
      id: u.id,
      username: u.username,
      email: u.email,
      passwordHash: u.password_hash,
      role: u.role,
      displayName: u.display_name,
      avatarUrl: u.avatarUrl,
      bio: u.bio,
      registeredAt: u.registered_at,
      reputation: u.reputation,
      isBanned: Boolean(u.is_banned),
      banReason: u.ban_reason,
      stats: JSON.parse(u.stats_json || '{"articlesCreated":0,"editsCount":0,"approvedEdits":0}')
    }));

    const categoriesRaw = sqlite.prepare('SELECT * FROM categories').all() as any[];
    const categories: Category[] = categoriesRaw.map((c) => ({
      id: c.id,
      name: c.name,
      slug: c.slug,
      description: c.description,
      iconName: c.icon_name,
      color: c.color,
      parentId: c.parent_id
    }));

    const articlesRaw = sqlite.prepare('SELECT * FROM articles').all() as any[];
    const articles: Article[] = articlesRaw.map((a) => ({
      id: a.id,
      slug: a.slug,
      currentRevisionId: a.current_revision_id,
      title: a.title,
      subtitle: a.subtitle,
      content: a.content,
      coverImage: a.cover_image,
      categoryId: a.category_id,
      categoryName: a.category_name,
      categorySlug: a.category_slug,
      tags: JSON.parse(a.tags_json || '[]'),
      infobox: JSON.parse(a.infobox_json || '[]'),
      sources: JSON.parse(a.sources_json || '[]'),
      authorId: a.author_id,
      authorUsername: a.author_username,
      authorDisplayName: a.author_display_name,
      authorAvatar: a.author_avatar,
      authorRole: a.author_role,
      contributors: JSON.parse(a.contributors_json || '[]'),
      createdAt: a.created_at,
      updatedAt: a.updated_at,
      status: a.status,
      isProtected: Boolean(a.is_protected),
      viewsCount: a.views_count,
      bookmarksCount: a.bookmarks_count,
      revisionsCount: a.revisions_count,
      discussionsCount: a.discussions_count,
      featuredDay: Boolean(a.featured_day)
    }));

    const revisionsRaw = sqlite.prepare('SELECT * FROM revisions').all() as any[];
    const revisions: ArticleRevision[] = revisionsRaw.map((r) => ({
      id: r.id,
      articleId: r.article_id,
      versionNumber: r.version_number,
      title: r.title,
      subtitle: r.subtitle,
      content: r.content,
      infobox: JSON.parse(r.infobox_json || '[]'),
      sources: JSON.parse(r.sources_json || '[]'),
      coverImage: r.cover_image,
      categoryId: r.category_id,
      tags: JSON.parse(r.tags_json || '[]'),
      authorId: r.author_id,
      authorName: r.author_name,
      authorUsername: r.author_username,
      createdAt: r.created_at,
      editSummary: r.edit_summary,
      charDiffCount: r.char_diff_count,
      status: r.status
    }));

    const commentsRaw = sqlite.prepare('SELECT * FROM comments').all() as any[];
    const comments: Comment[] = commentsRaw.map((c) => ({
      id: c.id,
      articleId: c.article_id,
      authorId: c.author_id,
      authorUsername: c.author_username,
      authorDisplayName: c.author_display_name,
      authorAvatar: c.author_avatar,
      authorRole: c.author_role,
      content: c.content,
      createdAt: c.created_at,
      parentId: c.parent_id
    }));

    const reportsRaw = sqlite.prepare('SELECT * FROM reports').all() as any[];
    const reports: Report[] = reportsRaw.map((rp) => ({
      id: rp.id,
      targetType: rp.target_type,
      targetId: rp.target_id,
      reporterId: rp.reporter_id,
      reporterUsername: rp.reporter_username,
      reason: rp.reason,
      details: rp.details,
      createdAt: rp.created_at,
      status: rp.status
    }));

    const notifsRaw = sqlite.prepare('SELECT * FROM notifications').all() as any[];
    const notifications: Notification[] = notifsRaw.map((n) => ({
      id: n.id,
      userId: n.user_id,
      type: n.type,
      title: n.title,
      message: n.message,
      linkUrl: n.link_url,
      isRead: Boolean(n.is_read),
      createdAt: n.created_at
    }));

    const bookmarksRaw = sqlite.prepare('SELECT * FROM bookmarks').all() as any[];
    const bookmarks = bookmarksRaw.map((b) => ({
      userId: b.user_id,
      articleId: b.article_id,
      createdAt: b.created_at
    }));

    const auditRaw = sqlite.prepare('SELECT * FROM audit_logs ORDER BY created_at DESC').all() as any[];
    const auditLogs: AuditLog[] = auditRaw.map((al) => ({
      id: al.id,
      actorId: al.actor_id,
      actorUsername: al.actor_username,
      action: al.action,
      targetType: al.target_type,
      targetId: al.target_id,
      details: al.details,
      createdAt: al.created_at
    }));

    const settingsRow = sqlite.prepare('SELECT value_json FROM settings WHERE key = ?').get('main_settings') as any;
    const settings: SiteSettings = settingsRow ? JSON.parse(settingsRow.value_json) : {
      autoPublishForTrusted: true,
      moderationRequiredForNew: true,
      allowPublicRegistration: true,
      rateLimitEditsPerMinute: 5,
      siteName: 'Вайбопедия',
      siteDescription: 'Свободная научно-популярная энциклопедия о вайб-кодинге',
      githubUrl: 'https://github.com',
      telegramUrl: 'https://t.me'
    };

    const likesRaw = sqlite.prepare('SELECT * FROM likes_map').all() as any[];
    const likesMap: Record<string, { likes: number; dislikes: number }> = {};
    for (const l of likesRaw) {
      likesMap[l.article_id] = { likes: l.likes, dislikes: l.dislikes };
    }

    return {
      users,
      categories,
      articles,
      revisions,
      comments,
      reports,
      notifications,
      bookmarks,
      auditLogs,
      settings,
      likesMap
    };
  }

  public updateDb(updater: (db: DatabaseSchema) => void) {
    const current = this.getDb();
    updater(current);

    // Save state back to SQLite database using transaction
    const syncAll = sqlite.transaction((dbData: DatabaseSchema) => {
      // Users
      sqlite.prepare('DELETE FROM users').run();
      const insertUser = sqlite.prepare(`
        INSERT INTO users (id, username, email, password_hash, role, display_name, avatarUrl, bio, registered_at, reputation, is_banned, ban_reason, stats_json)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      for (const u of dbData.users) {
        insertUser.run(
          u.id, u.username, u.email, u.passwordHash, u.role, u.displayName, u.avatarUrl, u.bio,
          u.registeredAt, u.reputation, u.isBanned ? 1 : 0, u.banReason || null, JSON.stringify(u.stats)
        );
      }

      // Categories
      sqlite.prepare('DELETE FROM categories').run();
      const insertCat = sqlite.prepare(`
        INSERT INTO categories (id, name, slug, description, icon_name, color, parent_id)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `);
      for (const c of dbData.categories) {
        insertCat.run(c.id, c.name, c.slug, c.description, c.iconName, c.color, c.parentId || null);
      }

      // Articles
      sqlite.prepare('DELETE FROM articles').run();
      const insertArt = sqlite.prepare(`
        INSERT INTO articles (id, slug, current_revision_id, title, subtitle, content, cover_image, category_id, category_name, category_slug, tags_json, infobox_json, sources_json, author_id, author_username, author_display_name, author_avatar, author_role, contributors_json, created_at, updated_at, status, is_protected, views_count, bookmarks_count, revisions_count, discussions_count, featured_day)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      for (const a of dbData.articles) {
        insertArt.run(
          a.id, a.slug, a.currentRevisionId, a.title, a.subtitle, a.content, a.coverImage,
          a.categoryId, a.categoryName, a.categorySlug, JSON.stringify(a.tags), JSON.stringify(a.infobox),
          JSON.stringify(a.sources), a.authorId, a.authorUsername, a.authorDisplayName, a.authorAvatar,
          a.authorRole, JSON.stringify(a.contributors), a.createdAt, a.updatedAt, a.status,
          a.isProtected ? 1 : 0, a.viewsCount, a.bookmarksCount, a.revisionsCount, a.discussionsCount, a.featuredDay ? 1 : 0
        );
      }

      // Revisions
      sqlite.prepare('DELETE FROM revisions').run();
      const insertRev = sqlite.prepare(`
        INSERT INTO revisions (id, article_id, version_number, title, subtitle, content, infobox_json, sources_json, cover_image, category_id, tags_json, author_id, author_name, author_username, created_at, edit_summary, char_diff_count, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      for (const r of dbData.revisions) {
        insertRev.run(
          r.id, r.articleId, r.versionNumber, r.title, r.subtitle, r.content,
          JSON.stringify(r.infobox || []), JSON.stringify(r.sources || []), r.coverImage || null,
          r.categoryId, JSON.stringify(r.tags || []), r.authorId, r.authorName, r.authorUsername,
          r.createdAt, r.editSummary, r.charDiffCount, r.status
        );
      }

      // Comments
      sqlite.prepare('DELETE FROM comments').run();
      const insertCmt = sqlite.prepare(`
        INSERT INTO comments (id, article_id, author_id, author_username, author_display_name, author_avatar, author_role, content, created_at, parent_id)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      for (const c of dbData.comments) {
        insertCmt.run(c.id, c.articleId, c.authorId, c.authorUsername, c.authorDisplayName, c.authorAvatar, c.authorRole, c.content, c.createdAt, c.parentId || null);
      }

      // Reports
      sqlite.prepare('DELETE FROM reports').run();
      const insertRep = sqlite.prepare(`
        INSERT INTO reports (id, target_type, target_id, reporter_id, reporter_username, reason, details, status, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      for (const rp of dbData.reports) {
        insertRep.run(rp.id, rp.targetType, rp.targetId, rp.reporterId, rp.reporterUsername, rp.reason, rp.details || '', rp.status, rp.createdAt);
      }

      // Notifications
      sqlite.prepare('DELETE FROM notifications').run();
      const insertNotif = sqlite.prepare(`
        INSERT INTO notifications (id, user_id, type, title, message, link_url, is_read, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `);
      for (const n of dbData.notifications) {
        insertNotif.run(n.id, n.userId, n.type, n.title, n.message, n.linkUrl || null, n.isRead ? 1 : 0, n.createdAt);
      }

      // Bookmarks
      sqlite.prepare('DELETE FROM bookmarks').run();
      const insertBm = sqlite.prepare(`
        INSERT INTO bookmarks (user_id, article_id, created_at)
        VALUES (?, ?, ?)
      `);
      for (const b of dbData.bookmarks) {
        insertBm.run(b.userId, b.articleId, b.createdAt);
      }

      // Audit Logs
      sqlite.prepare('DELETE FROM audit_logs').run();
      const insertAudit = sqlite.prepare(`
        INSERT INTO audit_logs (id, actor_id, actor_username, action, target_type, target_id, details, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `);
      for (const al of dbData.auditLogs) {
        insertAudit.run(al.id, al.actorId, al.actorUsername, al.action, al.targetType, al.targetId, al.details || '', al.createdAt);
      }

      // Settings
      sqlite.prepare('INSERT OR REPLACE INTO settings (key, value_json) VALUES (?, ?)').run('main_settings', JSON.stringify(dbData.settings));

      // Likes Map
      sqlite.prepare('DELETE FROM likes_map').run();
      const insertLikes = sqlite.prepare(`
        INSERT INTO likes_map (article_id, likes, dislikes)
        VALUES (?, ?, ?)
      `);
      for (const [artId, val] of Object.entries(dbData.likesMap)) {
        insertLikes.run(artId, val.likes, val.dislikes);
      }
    });

    syncAll(current);
  }

  public getUserByEmail(email: string): User | undefined {
    return this.getDb().users.find((u) => u.email.toLowerCase() === email.toLowerCase());
  }

  public getUserByUsername(username: string): User | undefined {
    return this.getDb().users.find((u) => u.username.toLowerCase() === username.toLowerCase());
  }

  public getUserById(id: string): User | undefined {
    return this.getDb().users.find((u) => u.id === id);
  }

  public verifyUserPassword(emailOrUsername: string, pass: string): User | null {
    const clean = emailOrUsername.trim().toLowerCase();
    const user = this.getDb().users.find(
      (u) => u.email.toLowerCase() === clean || u.username.toLowerCase() === clean
    );
    if (!user || !user.passwordHash) return null;
    if (user.passwordHash === hashPassword(pass)) {
      return user;
    }
    return null;
  }

  public createUser(email: string, username: string, pass: string, displayName: string): User {
    const newUser: User = {
      id: 'usr-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7),
      username: username.trim().toLowerCase(),
      email: email.trim().toLowerCase(),
      passwordHash: hashPassword(pass),
      role: 'user',
      displayName: displayName || username,
      avatarUrl: `https://api.dicebear.com/7.x/identicon/svg?seed=${username}`,
      bio: 'Участник сообщества Вайбопедии.',
      registeredAt: new Date().toISOString(),
      reputation: 10,
      stats: { articlesCreated: 0, editsCount: 0, approvedEdits: 0 }
    };
    this.updateDb((db) => {
      db.users.push(newUser);
    });
    return newUser;
  }

  public changeUserPassword(userId: string, newPassword: string): boolean {
    const hashed = hashPassword(newPassword);
    let updated = false;
    this.updateDb((db) => {
      const u = db.users.find((usr) => usr.id === userId);
      if (u) {
        u.passwordHash = hashed;
        updated = true;
      }
    });
    return updated;
  }

  public updateUserRole(userId: string, newRole: UserRole): boolean {
    let updated = false;
    this.updateDb((db) => {
      const u = db.users.find((usr) => usr.id === userId);
      if (u) {
        // Root administrator account cannot be demoted or changed
        if (u.id === 'usr-admin' || u.username === 'admin') {
          return;
        }
        u.role = newRole;
        updated = true;
      }
    });
    return updated;
  }

  public banUser(userId: string, reason?: string): boolean {
    let success = false;
    this.updateDb((db) => {
      const u = db.users.find((usr) => usr.id === userId);
      if (u && u.id !== 'usr-admin' && u.username !== 'admin' && u.role !== 'admin') {
        u.isBanned = true;
        u.banReason = reason || 'Нарушение правил сообщества';
        success = true;
      }
    });
    return success;
  }

  public unbanUser(userId: string) {
    this.updateDb((db) => {
      const u = db.users.find((usr) => usr.id === userId);
      if (u) {
        u.isBanned = false;
        u.banReason = undefined;
      }
    });
  }

  public deleteUser(userId: string): boolean {
    let success = false;
    this.updateDb((db) => {
      const idx = db.users.findIndex((usr) => usr.id === userId);
      if (idx >= 0 && db.users[idx].id !== 'usr-admin' && db.users[idx].username !== 'admin' && db.users[idx].role !== 'admin') {
        db.users.splice(idx, 1);
        db.bookmarks = db.bookmarks.filter((b) => b.userId !== userId);
        db.notifications = db.notifications.filter((n) => n.userId !== userId);
        success = true;
      }
    });
    return success;
  }

  public getPublishedArticles(): Article[] {
    return this.getDb().articles.filter((a) => a.status === 'published');
  }

  public getArticleBySlug(slug: string): Article | undefined {
    return this.getDb().articles.find((a) => a.slug === slug);
  }

  public getArticleById(id: string): Article | undefined {
    return this.getDb().articles.find((a) => a.id === id);
  }

  public getRevisionsForArticle(articleId: string): ArticleRevision[] {
    return this.getDb().revisions
      .filter((r) => r.articleId === articleId)
      .sort((a, b) => b.versionNumber - a.versionNumber);
  }

  public getRevisionById(revId: string): ArticleRevision | undefined {
    return this.getDb().revisions.find((r) => r.id === revId);
  }

  public logAudit(actor: User, action: string, targetType: string, targetId: string, details: string) {
    this.updateDb((db) => {
      db.auditLogs.unshift({
        id: 'log-' + Date.now(),
        actorId: actor.id,
        actorUsername: actor.username,
        action,
        targetType,
        targetId,
        details,
        createdAt: new Date().toISOString()
      });
    });
  }
}

export const dbService = new DatabaseService();
