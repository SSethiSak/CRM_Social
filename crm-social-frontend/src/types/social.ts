export type Platform = 'facebook' | 'instagram' | 'linkedin';

export interface ConnectedAccount {
  id: string;
  platform: Platform;
  accountName: string;
  isConnected: boolean;
  lastActivity: Date | null;
  avatar?: string;
}

export interface Post {
  id: string;
  content: string;
  imageUrl?: string;
  platforms: Platform[];
  createdAt: Date;
  status: {
    facebook?: 'pending' | 'success' | 'failed';
    instagram?: 'pending' | 'success' | 'failed';
    linkedin?: 'pending' | 'success' | 'failed';
  };
  postUrls?: {
    facebook?: string;
    instagram?: string;
    linkedin?: string;
  };
  commentCount: number;
}

export interface Comment {
  id: string;
  postId: string;
  platform: Platform;
  commenterName: string;
  commenterAvatar?: string;
  text: string;
  createdAt: Date;
}

export interface PublishingStatus {
  platform: Platform;
  status: 'pending' | 'publishing' | 'success' | 'failed';
  postUrl?: string;
  error?: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
}
