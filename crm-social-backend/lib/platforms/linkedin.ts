import axios from "axios";
import {
  PublishResult,
  PlatformComment,
  PostContent,
  LinkedInOrganization,
} from "./types";
import { decryptToken } from "../utils/encryption";

const LINKEDIN_API_URL = "https://api.linkedin.com/v2";

export interface LinkedInProfile {
  id: string;
  name: string;
  email?: string;
  avatarUrl?: string;
}

export class LinkedInService {
  /**
   * Get user's LinkedIn profile using OpenID Connect
   */
  static async getUserProfile(
    userAccessToken: string
  ): Promise<LinkedInProfile> {
    try {
      console.log(
        "Fetching LinkedIn profile with token:",
        userAccessToken.substring(0, 20) + "..."
      );

      // Try the OpenID Connect userinfo endpoint first
      const response = await axios.get("https://api.linkedin.com/v2/userinfo", {
        headers: {
          Authorization: `Bearer ${userAccessToken}`,
        },
      });

      console.log("LinkedIn userinfo response:", response.data);

      return {
        id: response.data.sub,
        name:
          response.data.name ||
          response.data.given_name + " " + response.data.family_name,
        email: response.data.email,
        avatarUrl: response.data.picture,
      };
    } catch (error: any) {
      console.error(
        "Error fetching LinkedIn profile from userinfo:",
        error.response?.status,
        error.response?.data || error.message
      );

      // Fallback: Try the /me endpoint
      try {
        console.log("Trying fallback /me endpoint...");
        const meResponse = await axios.get("https://api.linkedin.com/v2/me", {
          headers: {
            Authorization: `Bearer ${userAccessToken}`,
            "X-Restli-Protocol-Version": "2.0.0",
          },
          params: {
            projection:
              "(id,localizedFirstName,localizedLastName,profilePicture(displayImage~:playableStreams))",
          },
        });

        console.log("LinkedIn /me response:", meResponse.data);

        const profilePicture =
          meResponse.data.profilePicture?.["displayImage~"]?.elements?.[0]
            ?.identifiers?.[0]?.identifier;

        return {
          id: meResponse.data.id,
          name: `${meResponse.data.localizedFirstName} ${meResponse.data.localizedLastName}`,
          avatarUrl: profilePicture,
        };
      } catch (fallbackError: any) {
        console.error(
          "Error fetching LinkedIn profile from /me:",
          fallbackError.response?.status,
          fallbackError.response?.data || fallbackError.message
        );
        throw new Error("Failed to fetch LinkedIn profile");
      }
    }
  }

  /**
   * Get user's LinkedIn organizations (company pages)
   */
  static async getUserOrganizations(
    userAccessToken: string
  ): Promise<LinkedInOrganization[]> {
    try {
      const response = await axios.get(`${LINKEDIN_API_URL}/organizationAcls`, {
        params: {
          q: "roleAssignee",
          projection:
            "(elements*(organization~(id,localizedName,logoV2(original~:playableStreams))))",
        },
        headers: {
          Authorization: `Bearer ${userAccessToken}`,
          "X-Restli-Protocol-Version": "2.0.0",
        },
      });

      return response.data.elements.map((acl: any) => {
        const org = acl["organization~"];
        const logo =
          org.logoV2?.["original~"]?.elements?.[0]?.identifiers?.[0]
            ?.identifier;

        return {
          id: org.id,
          name: org.localizedName,
          avatarUrl: logo,
        };
      });
    } catch (error: any) {
      console.error(
        "Error fetching LinkedIn organizations:",
        error.response?.data || error.message
      );
      throw new Error("Failed to fetch LinkedIn organizations");
    }
  }

  /**
   * Upload image to LinkedIn (required before posting)
   */
  private static async uploadImage(
    organizationId: string,
    imageUrl: string,
    accessToken: string
  ): Promise<string> {
    try {
      // Step 1: Register upload
      const registerResponse = await axios.post(
        `${LINKEDIN_API_URL}/assets?action=registerUpload`,
        {
          registerUploadRequest: {
            recipes: ["urn:li:digitalmediaRecipe:feedshare-image"],
            owner: `urn:li:organization:${organizationId}`,
            serviceRelationships: [
              {
                relationshipType: "OWNER",
                identifier: "urn:li:userGeneratedContent",
              },
            ],
          },
        },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
            "X-Restli-Protocol-Version": "2.0.0",
          },
        }
      );

      const uploadUrl =
        registerResponse.data.value.uploadMechanism[
          "com.linkedin.digitalmedia.uploading.MediaUploadHttpRequest"
        ].uploadUrl;

      const asset = registerResponse.data.value.asset;

      // Step 2: Download image
      const imageResponse = await axios.get(imageUrl, {
        responseType: "arraybuffer",
      });

      // Step 3: Upload to LinkedIn
      await axios.put(uploadUrl, imageResponse.data, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/octet-stream",
        },
      });

      return asset;
    } catch (error: any) {
      console.error(
        "Error uploading image to LinkedIn:",
        error.response?.data || error.message
      );
      throw new Error("Failed to upload image to LinkedIn");
    }
  }

  /**
   * Post to LinkedIn organization page
   */
  static async postToOrganization(
    organizationId: string,
    encryptedAccessToken: string,
    content: PostContent
  ): Promise<PublishResult> {
    try {
      const accessToken = decryptToken(encryptedAccessToken);

      let media: any = undefined;

      // Upload image if provided
      if (content.imageUrl) {
        const assetUrn = await this.uploadImage(
          organizationId,
          content.imageUrl,
          accessToken
        );

        media = [
          {
            status: "READY",
            media: assetUrn,
          },
        ];
      }

      // Create post payload
      const postData: any = {
        author: `urn:li:organization:${organizationId}`,
        lifecycleState: "PUBLISHED",
        specificContent: {
          "com.linkedin.ugc.ShareContent": {
            shareCommentary: {
              text: content.text,
            },
            shareMediaCategory: content.imageUrl ? "IMAGE" : "NONE",
          },
        },
        visibility: {
          "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC",
        },
      };

      // Add media if exists
      if (media) {
        postData.specificContent["com.linkedin.ugc.ShareContent"].media = media;
      }

      // Post to LinkedIn
      const response = await axios.post(
        `${LINKEDIN_API_URL}/ugcPosts`,
        postData,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
            "X-Restli-Protocol-Version": "2.0.0",
          },
        }
      );

      const shareId = response.data.id;

      return {
        success: true,
        postId: shareId,
        postUrl: `https://www.linkedin.com/feed/update/${shareId}`,
      };
    } catch (error: any) {
      console.error(
        "Error posting to LinkedIn:",
        error.response?.data || error.message
      );

      return {
        success: false,
        error: error.response?.data?.message || "Failed to post to LinkedIn",
        errorCode: error.response?.data?.status?.toString(),
      };
    }
  }

  /**
   * Get comments from LinkedIn post
   */
  static async getPostComments(
    shareUrn: string,
    encryptedAccessToken: string
  ): Promise<PlatformComment[]> {
    try {
      const accessToken = decryptToken(encryptedAccessToken);

      const response = await axios.get(
        `${LINKEDIN_API_URL}/socialActions/${encodeURIComponent(
          shareUrn
        )}/comments`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "X-Restli-Protocol-Version": "2.0.0",
          },
        }
      );

      return response.data.elements.map((comment: any) => ({
        id: comment.id || comment["$URN"],
        authorId: comment.actor,
        authorName: comment.actor,
        text: comment.message?.text || "",
        createdAt: new Date(comment.created?.time || Date.now()),
        likesCount: comment.likesSummary?.totalLikes || 0,
      }));
    } catch (error: any) {
      console.error(
        "Error fetching LinkedIn comments:",
        error.response?.data || error.message
      );
      return [];
    }
  }

  /**
   * Validate access token
   */
  static async validateToken(encryptedAccessToken: string): Promise<boolean> {
    try {
      const accessToken = decryptToken(encryptedAccessToken);

      const response = await axios.get(`${LINKEDIN_API_URL}/me`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      return !!response.data.id;
    } catch (error) {
      return false;
    }
  }
}
