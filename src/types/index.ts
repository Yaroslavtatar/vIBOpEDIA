export type UserRole = 'guest' | 'user' | 'experienced_user' | 'moderator' | 'admin';

export interface User {
  id: string;
  username: string;
  email: string;
  passwordHash?: string;
  role: UserRole;
  displayName: string;
  avatarUrl: string;
  bio: string;
  registeredAt: string;
  isBanned?: boolean;
  banReason?: string;
  reputation: number;
  stats: {
    articlesCreated: number;
    editsCount: number;
    approvedEdits: number;
  };
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
  iconName: string;
  color: string;
  articleCount?: number;
  parentId?: string | null;
}

export type ArticleStatus = 'draft' | 'pending' | 'needs_revision' | 'published' | 'rejected' | 'hidden' | 'archived';

export interface ArticleInfoboxItem {
  label: string;
  value: string;
}

export interface ArticleSource {
  title: string;
  url?: string;
  author?: string;
  year?: string;
}

export interface ArticleRevision {
  id: string;
  articleId: string;
  versionNumber: number;
  title: string;
  subtitle: string;
  content: string;
  infobox: ArticleInfoboxItem[];
  sources: ArticleSource[];
  coverImage?: string;
  categoryId: string;
  tags: string[];
  authorId: string;
  authorName: string;
  authorUsername: string;
  createdAt: string;
  editSummary: string;
  charDiffCount: number; // e.g. +120 or -45
  status: ArticleStatus;
  moderatorComment?: string;
}

export interface Article {
  id: string;
  slug: string;
  currentRevisionId: string;
  title: string;
  subtitle: string;
  content: string; // Markdown/rich markup
  coverImage?: string;
  categoryId: string;
  categoryName?: string;
  categorySlug?: string;
  tags: string[];
  infobox: ArticleInfoboxItem[];
  sources: ArticleSource[];
  authorId: string;
  authorUsername: string;
  authorDisplayName: string;
  authorAvatar: string;
  authorRole: UserRole;
  contributors: string[]; // usernames
  createdAt: string;
  updatedAt: string;
  status: ArticleStatus;
  isProtected?: boolean; // locked from editing by non-moderators
  viewsCount: number;
  bookmarksCount: number;
  revisionsCount: number;
  discussionsCount: number;
  featuredDay?: boolean; // Featured as "Article of the day"
  likes?: number;
  dislikes?: number;
}

export interface Comment {
  id: string;
  articleId: string;
  authorId: string;
  authorUsername: string;
  authorDisplayName: string;
  authorAvatar: string;
  authorRole: UserRole;
  content: string;
  createdAt: string;
  updatedAt?: string;
  isPinned?: boolean;
  parentId?: string | null; // For threaded replies
  reportsCount?: number;
}

export type ReportTargetType = 'article' | 'comment' | 'revision';

export interface Report {
  id: string;
  targetType: ReportTargetType;
  targetId: string;
  articleSlug?: string;
  reporterId: string;
  reporterUsername: string;
  reason: string;
  details?: string;
  createdAt: string;
  status: 'pending' | 'resolved' | 'dismissed';
  resolvedBy?: string;
  resolvedAt?: string;
  moderatorNotes?: string;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'article_approved' | 'article_rejected' | 'article_pending' | 'article_retracted' | 'comment_reply' | 'system' | 'role_change' | 'idea_status' | 'idea_response';
  linkUrl?: string;
  isRead: boolean;
  createdAt: string;
}

export type IdeaStatus = 'open' | 'planned' | 'in_progress' | 'implemented' | 'rejected';
export type IdeaCategory = 'interface' | 'features' | 'sections' | 'rules' | 'other';

export interface Idea {
  id: string;
  title: string;
  description: string;
  category: IdeaCategory;
  status: IdeaStatus;
  authorId: string;
  authorUsername: string;
  authorDisplayName: string;
  authorAvatar?: string;
  score: number;
  userVote?: number; // +1, -1, or 0
  adminResponse?: string;
  createdAt: string;
  updatedAt: string;
}

export interface UploadResponse {
  url: string;
  fileName: string;
}

export interface AuditLog {
  id: string;
  actorId: string;
  actorUsername: string;
  action: string;
  targetType: string;
  targetId: string;
  details: string;
  ipAddress?: string;
  createdAt: string;
}

export interface SiteSettings {
  autoPublishForTrusted: boolean;
  moderationRequiredForNew: boolean;
  allowPublicRegistration: boolean;
  rateLimitEditsPerMinute: number;
  siteName: string;
  siteDescription: string;
  githubUrl?: string;
  telegramUrl?: string;
}

