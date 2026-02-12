export type Platform =
  | "facebook"
  | "instagram"
  | "linkedin"
  | "tiktok"
  | "telegram";

export interface PlatformAccount {
  id: string;
  name: string;
  platform: Platform;
  platformId: string;
  avatarUrl?: string;
  accessToken: string;
  refreshToken?: string;
  expiresAt?: Date;
}

export interface PostContent {
  text: string;
  imageUrl?: string;
  videoUrl?: string;
}

export interface PublishResult {
  success: boolean;
  postId?: string;
  postUrl?: string;
  error?: string;
  errorCode?: string;
}

export interface PlatformComment {
  id: string;
  authorId: string;
  authorName: string;
  authorUsername?: string;
  text: string;
  createdAt: Date;
  likesCount?: number;
  isReply?: boolean;
}

export interface PlatformMetrics {
  likes: number;
  comments: number;
  shares: number;
  reach?: number;
  impressions?: number;
}

export interface FacebookPage {
  id: string;
  name: string;
  accessToken: string;
  avatarUrl?: string;
  instagramAccountId?: string;
}

export interface InstagramAccount {
  id: string;
  username: string;
  avatarUrl?: string;
  pageAccessToken: string;
}

export interface LinkedInOrganization {
  id: string;
  name: string;
  avatarUrl?: string;
}

export interface TikTokAccount {
  id: string;
  username: string;
  displayName: string;
  avatarUrl?: string;
  accessToken: string;
  refreshToken?: string;
  expiresAt?: Date;
}

export interface TikTokVideoInfo {
  videoId: string;
  shareUrl: string;
  embedLink?: string;
}

export interface TelegramChannel {
  id: string;
  title: string;
  username?: string;
  type: string;
}
