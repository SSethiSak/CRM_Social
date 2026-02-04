import axios from "axios";
import {
  PublishResult,
  PlatformComment,
  PostContent,
  FacebookPage,
  InstagramAccount,
} from "./types";
import { decryptToken } from "../utils/encryption";

const GRAPH_API_VERSION = process.env.FACEBOOK_API_VERSION || "v19.0";
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

      const postId = response.data.id || response.data.post_id;

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
   */
  static async getPostComments(
    postId: string,
    encryptedAccessToken: string
  ): Promise<PlatformComment[]> {
    try {
      const accessToken = decryptToken(encryptedAccessToken);

      const response = await axios.get(`${GRAPH_API_URL}/${postId}/comments`, {
        params: {
          access_token: accessToken,
          fields: "id,from{id,name},message,created_time,like_count",
          limit: 100,
        },
      });

      return response.data.data.map((comment: any) => ({
        id: comment.id,
        authorId: comment.from?.id || "unknown",
        authorName: comment.from?.name || "Unknown User",
        text: comment.message,
        createdAt: new Date(comment.created_time),
        likesCount: comment.like_count || 0,
      }));
    } catch (error: any) {
      console.error(
        "Error fetching Facebook comments:",
        error.response?.data || error.message
      );
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

      const response = await axios.get(`${GRAPH_API_URL}/${mediaId}/comments`, {
        params: {
          access_token: accessToken,
          fields: "id,username,text,timestamp,like_count",
          limit: 100,
        },
      });

      return response.data.data.map((comment: any) => ({
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
        "Error fetching Instagram comments:",
        error.response?.data || error.message
      );
      return [];
    }
  }

  /**
   * Get post insights/metrics
   */
  static async getPostMetrics(postId: string, encryptedAccessToken: string) {
    try {
      const accessToken = decryptToken(encryptedAccessToken);

      const response = await axios.get(`${GRAPH_API_URL}/${postId}`, {
        params: {
          access_token: accessToken,
          fields: "likes.summary(true),comments.summary(true),shares",
        },
      });

      return {
        likes: response.data.likes?.summary?.total_count || 0,
        comments: response.data.comments?.summary?.total_count || 0,
        shares: response.data.shares?.count || 0,
      };
    } catch (error: any) {
      console.error(
        "Error fetching Facebook metrics:",
        error.response?.data || error.message
      );
      return { likes: 0, comments: 0, shares: 0 };
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
