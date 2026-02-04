// Global type definitions for the application

export type Platform = "facebook" | "instagram" | "linkedin";

export type PostStatus =
  | "draft"
  | "publishing"
  | "published"
  | "failed"
  | "partial";

export type PostResultStatus = "pending" | "publishing" | "success" | "failed";

export interface User {
  id: string;
  email: string;
  name?: string | null;
  image?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Account {
  id: string;
  userId: string;
  platform: Platform;
  platformAccountId: string;
  accountName: string;
  accountType?: string | null;
  avatarUrl?: string | null;
  isActive: boolean;
  lastSyncedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Post {
  id: string;
  userId: string;
  content: string;
  imageUrl?: string | null;
  videoUrl?: string | null;
  mediaType?: string | null;
  platforms: Platform[];
  status: PostStatus;
  scheduledFor?: Date | null;
  publishedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
  postResults?: PostResult[];
}

export interface PostResult {
  id: string;
  postId: string;
  accountId: string;
  platform: Platform;
  status: PostResultStatus;
  platformPostId?: string | null;
  platformPostUrl?: string | null;
  errorMessage?: string | null;
  errorCode?: string | null;
  retryCount: number;
  likesCount: number;
  commentsCount: number;
  sharesCount: number;
  reachCount: number;
  impressionsCount: number;
  createdAt: Date;
  updatedAt: Date;
  publishedAt?: Date | null;
  account?: Account;
  comments?: Comment[];
}

export interface Comment {
  id: string;
  postResultId: string;
  platform: Platform;
  platformCommentId: string;
  commenterId: string;
  commenterName: string;
  commenterUsername?: string | null;
  commenterAvatar?: string | null;
  text: string;
  parentCommentId?: string | null;
  isReply: boolean;
  likesCount: number;
  isHidden: boolean;
  isSpam: boolean;
  commentedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface DashboardStats {
  connectedAccounts: number;
  totalPosts: number;
  totalComments: number;
  totalLikes: number;
  totalShares: number;
  totalEngagement: number;
  platformAccounts: Record<Platform, number>;
}

export interface ApiResponse<T = any> {
  data?: T;
  error?: string;
  message?: string;
  details?: any;
}

export interface PaginationParams {
  limit?: number;
  offset?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
}
