import axios from "axios";
import {
  PublishResult,
  PlatformComment,
  PostContent,
  FacebookPage,
  InstagramAccount,
} from "./types";
import { decryptToken } from "../utils/encryption";

const GRAPH_API_VERSION = process.env.FACEBOOK_API_VERSION || "v21.0";
const GRAPH_API_URL = `https://graph.facebook.com/${GRAPH_API_VERSION}`;

export class FacebookService {
  /**
   * Get user's Facebook Pages
   */
  static async getUserPages(userAccessToken: string): Promise<FacebookPage[]> {
    try {
      const response = await axios.get(`${GRAPH_API_URL}/me/accounts`, {
        params: {
          access_token: userAccessToken,
          fields: "id,name,access_token,picture,instagram_business_account",
        },
      });

      return response.data.data.map((page: any) => ({
        id: page.id,
        name: page.name,
        accessToken: page.access_token,
        avatarUrl: page.picture?.data?.url,
        instagramAccountId: page.instagram_business_account?.id,
      }));
    } catch (error: any) {
      console.error(
        "Error fetching Facebook pages:",
        error.response?.data || error.message
      );
      throw new Error("Failed to fetch Facebook pages");
    }
  }

  /**
   * Get Instagram Business accounts linked to Facebook Pages
   */
  static async getInstagramAccounts(
    pageAccessToken: string,
    pageId: string
  ): Promise<InstagramAccount | null> {
    try {
      const response = await axios.get(`${GRAPH_API_URL}/${pageId}`, {
        params: {
          access_token: pageAccessToken,
          fields: "instagram_business_account{id,username,profile_picture_url}",
        },
      });

      const igAccount = response.data.instagram_business_account;

      if (!igAccount) {
        return null;
      }

      return {
        id: igAccount.id,
        username: igAccount.username,
        avatarUrl: igAccount.profile_picture_url,
        pageAccessToken: pageAccessToken,
      };
    } catch (error: any) {
      console.error(
        "Error fetching Instagram account:",
        error.response?.data || error.message
      );
      return null;
    }
  }

  /**
   * Post to Facebook Page
   */
  static async postToPage(
    pageId: string,
    encryptedAccessToken: string,
    content: PostContent
  ): Promise<PublishResult> {
    try {
      const accessToken = decryptToken(encryptedAccessToken);

      let response;

      // Post with image
      if (content.imageUrl) {
        response = await axios.post(`${GRAPH_API_URL}/${pageId}/photos`, {
          url: content.imageUrl,
          caption: content.text,
          access_token: accessToken,
          published: true,
        });
      }
      // Post text only
      else {
        response = await axios.post(`${GRAPH_API_URL}/${pageId}/feed`, {
          message: content.text,
          access_token: accessToken,
        });
      }

      // For photo posts, post_id is the feed post ID (pageId_postId format)
      // For feed posts, id is the post ID
      // Always prefer post_id over id for photos, as id is just the photo object ID
      const postId = response.data.post_id || response.data.id;

      console.log("Facebook post response:", {
        id: response.data.id,
        post_id: response.data.post_id,
        resolved_postId: postId,
        isPhoto: !!content.imageUrl,
      });

      return {
        success: true,
        postId: postId,
        postUrl: `https://www.facebook.com/${postId.replace("_", "/posts/")}`,
      };
    } catch (error: any) {
      console.error(
        "Error posting to Facebook:",
        error.response?.data || error.message
      );

      return {
        success: false,
        error:
          error.response?.data?.error?.message || "Failed to post to Facebook",
        errorCode: error.response?.data?.error?.code?.toString(),
      };
    }
  }

  /**
   * Post to Instagram
   */
  static async postToInstagram(
    instagramAccountId: string,
    encryptedAccessToken: string,
    content: PostContent
  ): Promise<PublishResult> {
    try {
      if (!content.imageUrl) {
        return {
          success: false,
          error: "Instagram requires an image",
          errorCode: "MISSING_IMAGE",
        };
      }

      const accessToken = decryptToken(encryptedAccessToken);

      // Step 1: Create media container
      const containerResponse = await axios.post(
        `${GRAPH_API_URL}/${instagramAccountId}/media`,
        {
          image_url: content.imageUrl,
          caption: content.text,
          access_token: accessToken,
        }
      );

      const creationId = containerResponse.data.id;

      // Step 2: Publish container
      const publishResponse = await axios.post(
        `${GRAPH_API_URL}/${instagramAccountId}/media_publish`,
        {
          creation_id: creationId,
          access_token: accessToken,
        }
      );

      const postId = publishResponse.data.id;

      return {
        success: true,
        postId: postId,
        postUrl: `https://www.instagram.com/p/${postId}`,
      };
    } catch (error: any) {
      console.error(
        "Error posting to Instagram:",
        error.response?.data || error.message
      );

      return {
        success: false,
        error:
          error.response?.data?.error?.message || "Failed to post to Instagram",
        errorCode: error.response?.data?.error?.code?.toString(),
      };
    }
  }

  /**
   * Get comments from Facebook post
   * NOTE: In Development Mode, the /comments edge on Page posts requires
   * Advanced Access for pages_read_engagement. Falls back gracefully.
   */
  static async getPostComments(
    postId: string,
    encryptedAccessToken: string
  ): Promise<PlatformComment[]> {
    try {
      const accessToken = decryptToken(encryptedAccessToken);

      console.log("Fetching Facebook comments for postId:", postId);

      const response = await axios.get(`${GRAPH_API_URL}/${postId}/comments`, {
        params: {
          access_token: accessToken,
          fields: "id,from{id,name,picture},message,created_time,like_count",
          limit: 100,
        },
      });

      console.log(
        "Facebook comments response:",
        JSON.stringify(response.data, null, 2)
      );

      return (response.data.data || []).map((comment: any) => ({
        id: comment.id,
        authorId: comment.from?.id || "unknown",
        authorName: comment.from?.name || "Unknown User",
        text: comment.message,
        createdAt: new Date(comment.created_time),
        likesCount: comment.like_count || 0,
      }));
    } catch (error: any) {
      const errorData = error.response?.data?.error;
      if (errorData?.code === 200) {
        console.warn(
          "Facebook comments require Advanced Access for pages_read_engagement.",
          "Submit your app for App Review at https://developers.facebook.com to enable this.",
          "Alternatively, set up Webhooks to receive comments in real-time."
        );
      } else {
        console.error(
          "Error fetching Facebook comments for postId:",
          postId,
          error.response?.data || error.message
        );
      }
      return [];
    }
  }

  /**
   * Get comments from Instagram post
   */
  static async getInstagramComments(
    mediaId: string,
    encryptedAccessToken: string
  ): Promise<PlatformComment[]> {
    try {
      const accessToken = decryptToken(encryptedAccessToken);

      console.log("Fetching Instagram comments for mediaId:", mediaId);

      const response = await axios.get(`${GRAPH_API_URL}/${mediaId}/comments`, {
        params: {
          access_token: accessToken,
          fields: "id,username,text,timestamp,like_count",
          limit: 100,
        },
      });

      console.log(
        "Instagram comments response:",
        JSON.stringify(response.data, null, 2)
      );

      return (response.data.data || []).map((comment: any) => ({
        id: comment.id,
        authorId: comment.username,
        authorName: comment.username,
        authorUsername: comment.username,
        text: comment.text,
        createdAt: new Date(comment.timestamp),
        likesCount: comment.like_count || 0,
      }));
    } catch (error: any) {
      console.error(
        "Error fetching Instagram comments for mediaId:",
        mediaId,
        error.response?.data || error.message
      );
      return [];
    }
  }

  /**
   * Get post insights/metrics
   * Uses /reactions endpoint (works in Dev Mode) instead of likes.summary
   * which requires Advanced Access.
   */
  static async getPostMetrics(
    postId: string,
    encryptedAccessToken: string,
    platform: string = "facebook"
  ) {
    try {
      const accessToken = decryptToken(encryptedAccessToken);

      console.log(`Fetching ${platform} metrics for postId:`, postId);

      if (platform === "instagram") {
        // Instagram uses different fields
        const response = await axios.get(`${GRAPH_API_URL}/${postId}`, {
          params: {
            access_token: accessToken,
            fields: "like_count,comments_count",
          },
        });

        console.log(
          "Instagram metrics response:",
          JSON.stringify(response.data, null, 2)
        );

        return {
          likes: response.data.like_count || 0,
          comments: response.data.comments_count || 0,
          shares: 0,
        };
      }

      // Facebook: Use /reactions endpoint (works in Development Mode)
      // and /sharedposts for shares count
      const [reactionsResp, sharesResp] = await Promise.all([
        axios.get(`${GRAPH_API_URL}/${postId}/reactions`, {
          params: {
            access_token: accessToken,
            summary: "total_count",
          },
        }),
        axios.get(`${GRAPH_API_URL}/${postId}`, {
          params: {
            access_token: accessToken,
            fields: "shares",
          },
        }),
      ]);

      const likes =
        reactionsResp.data.summary?.total_count ||
        reactionsResp.data.data?.length ||
        0;
      const shares = sharesResp.data.shares?.count || 0;

      // Try to get comments count, but this may fail in Dev Mode
      let commentsCount = 0;
      try {
        const commentsResp = await axios.get(
          `${GRAPH_API_URL}/${postId}/comments`,
          {
            params: {
              access_token: accessToken,
              summary: "total_count",
              limit: 0,
            },
          }
        );
        commentsCount = commentsResp.data.summary?.total_count || 0;
      } catch (e: any) {
        // Comments edge requires Advanced Access in Dev Mode — skip gracefully
        console.log("Comments count unavailable (requires Advanced Access)");
      }

      console.log(
        `Facebook metrics: likes=${likes}, comments=${commentsCount}, shares=${shares}`
      );

      return {
        likes,
        comments: commentsCount,
        shares,
      };
    } catch (error: any) {
      console.error(
        `Error fetching ${platform} metrics for postId:`,
        postId,
        error.response?.data || error.message
      );
      return { likes: 0, comments: 0, shares: 0 };
    }
  }

  /**
   * Get detailed reactions (who liked/reacted) for a Facebook post
   * Works in Development Mode
   */
  static async getPostReactions(postId: string, encryptedAccessToken: string) {
    try {
      const accessToken = decryptToken(encryptedAccessToken);

      const response = await axios.get(`${GRAPH_API_URL}/${postId}/reactions`, {
        params: {
          access_token: accessToken,
          fields: "id,name,type,pic_small",
          summary: "total_count",
          limit: 100,
        },
      });

      return {
        total: response.data.summary?.total_count || response.data.data?.length || 0,
        reactions: (response.data.data || []).map((r: any) => ({
          id: r.id,
          name: r.name,
          type: r.type, // LIKE, LOVE, HAHA, WOW, SAD, ANGRY
          avatar: r.pic_small || null,
        })),
      };
    } catch (error: any) {
      console.error("Error fetching reactions:", error.response?.data || error.message);
      return { total: 0, reactions: [] };
    }
  }

  /**
   * Get shared posts (who shared) for a Facebook post
   * Works in Development Mode
   */
  static async getPostSharedPosts(postId: string, encryptedAccessToken: string) {
    try {
      const accessToken = decryptToken(encryptedAccessToken);

      const response = await axios.get(`${GRAPH_API_URL}/${postId}/sharedposts`, {
        params: {
          access_token: accessToken,
          fields: "from{id,name,picture},created_time",
          limit: 100,
        },
      });

      return {
        total: response.data.data?.length || 0,
        shares: (response.data.data || []).map((s: any) => ({
          id: s.from?.id || "unknown",
          name: s.from?.name || "Unknown User",
          avatar: s.from?.picture?.data?.url || null,
          sharedAt: s.created_time,
        })),
      };
    } catch (error: any) {
      console.error("Error fetching shared posts:", error.response?.data || error.message);
      return { total: 0, shares: [] };
    }
  }

  /**
   * Validate access token
   */
  static async validateToken(encryptedAccessToken: string): Promise<boolean> {
    try {
      const accessToken = decryptToken(encryptedAccessToken);

      const response = await axios.get(`${GRAPH_API_URL}/me`, {
        params: { access_token: accessToken },
      });

      return !!response.data.id;
    } catch (error) {
      return false;
    }
  }
}
