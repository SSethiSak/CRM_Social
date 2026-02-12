import { Platform, PostContent, PublishResult } from "../platforms/types";
import { FacebookService } from "../platforms/facebook";
import { LinkedInService } from "../platforms/linkedin";
import { TelegramService } from "../platforms/telegram";
import prisma from "../prisma";

export class PublisherService {
  /**
   * Publish content to multiple platforms simultaneously
   */
  static async publishToMultiplePlatforms(
    userId: string,
    content: PostContent,
    platforms: Platform[],
    accountIds?: string[] // Optional: specific account IDs to post to
  ) {
    // Create post record
    const post = await prisma.post.create({
      data: {
        userId,
        content: content.text,
        imageUrl: content.imageUrl,
        videoUrl: content.videoUrl,
        mediaType: content.imageUrl
          ? "image"
          : content.videoUrl
          ? "video"
          : "none",
        platforms,
        status: "publishing",
      },
    });

    // Get user's connected accounts for selected platforms
    // If accountIds provided, filter by those specific accounts
    const accounts = await prisma.account.findMany({
      where: {
        userId,
        platform: { in: platforms },
        isActive: true,
        ...(accountIds && accountIds.length > 0
          ? { id: { in: accountIds } }
          : {}),
      },
    });

    if (accounts.length === 0) {
      await prisma.post.update({
        where: { id: post.id },
        data: { status: "failed" },
      });

      throw new Error("No active accounts found for selected platforms");
    }

    // Publish to each platform in parallel
    const publishPromises = accounts.map((account) =>
      this.publishToSinglePlatform(post.id, account.id, account, content)
    );

    const results = await Promise.allSettled(publishPromises);

    // Update post status based on results
    const allSuccessful = results.every(
      (r) => r.status === "fulfilled" && r.value.success
    );
    const allFailed = results.every(
      (r) =>
        r.status === "rejected" ||
        (r.status === "fulfilled" && !r.value.success)
    );

    const finalStatus = allSuccessful
      ? "published"
      : allFailed
      ? "failed"
      : "partial";

    await prisma.post.update({
      where: { id: post.id },
      data: {
        status: finalStatus,
        publishedAt: allSuccessful ? new Date() : null,
      },
    });

    return {
      postId: post.id,
      results: results.map((r, index) => ({
        account: accounts[index],
        result:
          r.status === "fulfilled"
            ? r.value
            : { success: false, error: "Unexpected error" },
      })),
    };
  }

  /**
   * Publish to a single platform
   */
  private static async publishToSinglePlatform(
    postId: string,
    accountId: string,
    account: any,
    content: PostContent
  ): Promise<PublishResult> {
    // Create post result record
    const postResult = await prisma.postResult.create({
      data: {
        postId,
        accountId,
        platform: account.platform,
        status: "publishing",
      },
    });

    try {
      let result: PublishResult;

      // Route to appropriate platform service
      switch (account.platform) {
        case "facebook":
          result = await FacebookService.postToPage(
            account.platformAccountId,
            account.accessToken,
            content
          );
          break;

        case "instagram":
          result = await FacebookService.postToInstagram(
            account.platformAccountId,
            account.accessToken,
            content
          );
          break;

        case "linkedin":
          result = await LinkedInService.postToOrganization(
            account.platformAccountId,
            account.accessToken,
            content
          );
          break;

        case "telegram":
          result = await TelegramService.postToChannel(
            account.accessToken,
            account.platformAccountId,
            content
          );
          break;

        case "tiktok":
          // TikTok requires video - skip if no video provided
          if (!content.videoUrl) {
            result = {
              success: false,
              error: "TikTok requires a video to post",
            };
          } else {
            // TikTok posting not fully implemented yet
            result = {
              success: false,
              error: "TikTok posting requires API approval",
            };
          }
          break;

        default:
          throw new Error(`Unsupported platform: ${account.platform}`);
      }

      // Update post result
      await prisma.postResult.update({
        where: { id: postResult.id },
        data: {
          status: result.success ? "success" : "failed",
          platformPostId: result.postId,
          platformPostUrl: result.postUrl,
          errorMessage: result.error,
          errorCode: result.errorCode,
          publishedAt: result.success ? new Date() : null,
        },
      });

      return result;
    } catch (error: any) {
      // Update post result with error
      await prisma.postResult.update({
        where: { id: postResult.id },
        data: {
          status: "failed",
          errorMessage: error.message,
          retryCount: { increment: 1 },
        },
      });

      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Retry failed publishing attempt
   */
  static async retryPublish(postResultId: string) {
    const postResult = await prisma.postResult.findUnique({
      where: { id: postResultId },
      include: {
        post: true,
        account: true,
      },
    });

    if (!postResult) {
      throw new Error("Post result not found");
    }

    if (postResult.status === "success") {
      throw new Error("This post was already published successfully");
    }

    if (postResult.retryCount >= 3) {
      throw new Error("Maximum retry attempts reached");
    }

    const content: PostContent = {
      text: postResult.post.content,
      imageUrl: postResult.post.imageUrl || undefined,
      videoUrl: postResult.post.videoUrl || undefined,
    };

    return this.publishToSinglePlatform(
      postResult.postId,
      postResult.accountId,
      postResult.account,
      content
    );
  }
}
