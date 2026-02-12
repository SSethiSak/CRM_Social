import axios from "axios";
import {
  PublishResult,
  PlatformComment,
  PostContent,
  TikTokAccount,
  TikTokVideoInfo,
} from "./types";
import { decryptToken } from "../utils/encryption";

const TIKTOK_API_URL = "https://open.tiktokapis.com/v2";
const TIKTOK_AUTH_URL = "https://www.tiktok.com/v2/auth/authorize";

export class TikTokService {
  /**
   * Generate OAuth authorization URL
   */
  static getAuthorizationUrl(redirectUri: string, state: string): string {
    const clientKey = process.env.TIKTOK_CLIENT_KEY;
    const scope = "user.info.basic,video.publish,video.list";

    const params = new URLSearchParams({
      client_key: clientKey!,
      redirect_uri: redirectUri,
      response_type: "code",
      scope: scope,
      state: state,
    });

    return `${TIKTOK_AUTH_URL}?${params.toString()}`;
  }

  /**
   * Exchange authorization code for access token
   */
  static async exchangeCodeForToken(
    code: string,
    redirectUri: string
  ): Promise<{
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
    openId: string;
  }> {
    try {
      const response = await axios.post(
        `${TIKTOK_API_URL}/oauth/token/`,
        new URLSearchParams({
          client_key: process.env.TIKTOK_CLIENT_KEY!,
          client_secret: process.env.TIKTOK_CLIENT_SECRET!,
          code: code,
          grant_type: "authorization_code",
          redirect_uri: redirectUri,
        }),
        {
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
        }
      );

      const data = response.data;

      return {
        accessToken: data.access_token,
        refreshToken: data.refresh_token,
        expiresIn: data.expires_in,
        openId: data.open_id,
      };
    } catch (error: any) {
      console.error(
        "Error exchanging TikTok code:",
        error.response?.data || error.message
      );
      throw new Error("Failed to exchange TikTok authorization code");
    }
  }

  /**
   * Refresh access token
   */
  static async refreshAccessToken(encryptedRefreshToken: string): Promise<{
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
  }> {
    try {
      const refreshToken = decryptToken(encryptedRefreshToken);

      const response = await axios.post(
        `${TIKTOK_API_URL}/oauth/token/`,
        new URLSearchParams({
          client_key: process.env.TIKTOK_CLIENT_KEY!,
          client_secret: process.env.TIKTOK_CLIENT_SECRET!,
          refresh_token: refreshToken,
          grant_type: "refresh_token",
        }),
        {
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
        }
      );

      const data = response.data;

      return {
        accessToken: data.access_token,
        refreshToken: data.refresh_token,
        expiresIn: data.expires_in,
      };
    } catch (error: any) {
      console.error(
        "Error refreshing TikTok token:",
        error.response?.data || error.message
      );
      throw new Error("Failed to refresh TikTok access token");
    }
  }

  /**
   * Get user info
   */
  static async getUserInfo(
    encryptedAccessToken: string
  ): Promise<TikTokAccount | null> {
    try {
      const accessToken = decryptToken(encryptedAccessToken);

      const response = await axios.get(`${TIKTOK_API_URL}/user/info/`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        params: {
          fields: "open_id,union_id,avatar_url,display_name,username",
        },
      });

      const user = response.data.data.user;

      return {
        id: user.open_id,
        username: user.username || user.display_name,
        displayName: user.display_name,
        avatarUrl: user.avatar_url,
        accessToken: accessToken,
      };
    } catch (error: any) {
      console.error(
        "Error fetching TikTok user info:",
        error.response?.data || error.message
      );
      return null;
    }
  }

  /**
   * Initialize video upload (Direct Post)
   * TikTok requires a 2-step process: init upload, then upload video
   */
  static async initVideoUpload(
    encryptedAccessToken: string,
    videoSize: number
  ): Promise<{ uploadUrl: string; publishId: string } | null> {
    try {
      const accessToken = decryptToken(encryptedAccessToken);

      const response = await axios.post(
        `${TIKTOK_API_URL}/post/publish/video/init/`,
        {
          post_info: {
            title: "", // Will be set during upload
            privacy_level: "PUBLIC_TO_EVERYONE",
            disable_duet: false,
            disable_comment: false,
            disable_stitch: false,
          },
          source_info: {
            source: "FILE_UPLOAD",
            video_size: videoSize,
            chunk_size: videoSize,
            total_chunk_count: 1,
          },
        },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
        }
      );

      const data = response.data.data;

      return {
        uploadUrl: data.upload_url,
        publishId: data.publish_id,
      };
    } catch (error: any) {
      console.error(
        "Error initializing TikTok upload:",
        error.response?.data || error.message
      );
      return null;
    }
  }

  /**
   * Post video to TikTok
   * Note: TikTok only supports video content, not images or text-only posts
   */
  static async postVideo(
    encryptedAccessToken: string,
    content: PostContent
  ): Promise<PublishResult> {
    try {
      if (!content.videoUrl) {
        return {
          success: false,
          error:
            "TikTok requires a video. Images and text-only posts are not supported.",
          errorCode: "MISSING_VIDEO",
        };
      }

      const accessToken = decryptToken(encryptedAccessToken);

      // For URL-based video posting (if video is already hosted)
      const response = await axios.post(
        `${TIKTOK_API_URL}/post/publish/video/init/`,
        {
          post_info: {
            title: content.text?.substring(0, 150) || "", // TikTok title limit
            privacy_level: "PUBLIC_TO_EVERYONE",
            disable_duet: false,
            disable_comment: false,
            disable_stitch: false,
          },
          source_info: {
            source: "PULL_FROM_URL",
            video_url: content.videoUrl,
          },
        },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
        }
      );

      const publishId = response.data.data.publish_id;

      // Poll for publish status
      const videoInfo = await this.waitForPublishComplete(
        accessToken,
        publishId
      );

      if (videoInfo) {
        return {
          success: true,
          postId: videoInfo.videoId,
          postUrl: videoInfo.shareUrl,
        };
      }

      return {
        success: true,
        postId: publishId,
        postUrl: undefined, // URL will be available after processing
      };
    } catch (error: any) {
      console.error(
        "Error posting to TikTok:",
        error.response?.data || error.message
      );

      const errorData = error.response?.data?.error;
      return {
        success: false,
        error: errorData?.message || "Failed to post to TikTok",
        errorCode: errorData?.code?.toString(),
      };
    }
  }

  /**
   * Wait for video publish to complete and get video info
   */
  private static async waitForPublishComplete(
    accessToken: string,
    publishId: string,
    maxAttempts: number = 10
  ): Promise<TikTokVideoInfo | null> {
    for (let i = 0; i < maxAttempts; i++) {
      await new Promise((resolve) => setTimeout(resolve, 3000)); // Wait 3 seconds

      try {
        const response = await axios.post(
          `${TIKTOK_API_URL}/post/publish/status/fetch/`,
          { publish_id: publishId },
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
              "Content-Type": "application/json",
            },
          }
        );

        const status = response.data.data.status;

        if (status === "PUBLISH_COMPLETE") {
          return {
            videoId: response.data.data.video_id,
            shareUrl: `https://www.tiktok.com/@/video/${response.data.data.video_id}`,
          };
        } else if (status === "FAILED") {
          console.error(
            "TikTok publish failed:",
            response.data.data.fail_reason
          );
          return null;
        }
        // If PROCESSING_UPLOAD or PROCESSING_DOWNLOAD, continue polling
      } catch (error) {
        console.error("Error checking publish status:", error);
      }
    }

    return null;
  }

  /**
   * Get user's videos
   */
  static async getUserVideos(
    encryptedAccessToken: string,
    maxCount: number = 20
  ): Promise<TikTokVideoInfo[]> {
    try {
      const accessToken = decryptToken(encryptedAccessToken);

      const response = await axios.post(
        `${TIKTOK_API_URL}/video/list/`,
        { max_count: maxCount },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          params: {
            fields:
              "id,title,video_description,duration,cover_image_url,share_url,like_count,comment_count,share_count,view_count",
          },
        }
      );

      return response.data.data.videos.map((video: any) => ({
        videoId: video.id,
        shareUrl: video.share_url,
        embedLink: video.embed_link,
      }));
    } catch (error: any) {
      console.error(
        "Error fetching TikTok videos:",
        error.response?.data || error.message
      );
      return [];
    }
  }

  /**
   * Get video comments
   * Note: TikTok API has limited comment access
   */
  static async getVideoComments(
    videoId: string,
    encryptedAccessToken: string
  ): Promise<PlatformComment[]> {
    try {
      const accessToken = decryptToken(encryptedAccessToken);

      const response = await axios.post(
        `${TIKTOK_API_URL}/video/comment/list/`,
        { video_id: videoId, max_count: 50 },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
        }
      );

      return response.data.data.comments.map((comment: any) => ({
        id: comment.id,
        authorId: comment.user.open_id,
        authorName: comment.user.display_name,
        authorUsername: comment.user.username,
        text: comment.text,
        createdAt: new Date(comment.create_time * 1000),
        likesCount: comment.like_count || 0,
        isReply: !!comment.parent_comment_id,
      }));
    } catch (error: any) {
      console.error(
        "Error fetching TikTok comments:",
        error.response?.data || error.message
      );
      return [];
    }
  }

  /**
   * Get video metrics
   */
  static async getVideoMetrics(
    videoId: string,
    encryptedAccessToken: string
  ): Promise<{
    likes: number;
    comments: number;
    shares: number;
    views: number;
  }> {
    try {
      const accessToken = decryptToken(encryptedAccessToken);

      const response = await axios.post(
        `${TIKTOK_API_URL}/video/query/`,
        {
          filters: { video_ids: [videoId] },
        },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          params: {
            fields: "like_count,comment_count,share_count,view_count",
          },
        }
      );

      const video = response.data.data.videos[0];

      return {
        likes: video?.like_count || 0,
        comments: video?.comment_count || 0,
        shares: video?.share_count || 0,
        views: video?.view_count || 0,
      };
    } catch (error: any) {
      console.error(
        "Error fetching TikTok metrics:",
        error.response?.data || error.message
      );
      return { likes: 0, comments: 0, shares: 0, views: 0 };
    }
  }

  /**
   * Validate access token
   */
  static async validateToken(encryptedAccessToken: string): Promise<boolean> {
    try {
      const userInfo = await this.getUserInfo(encryptedAccessToken);
      return !!userInfo;
    } catch (error) {
      return false;
    }
  }
}
