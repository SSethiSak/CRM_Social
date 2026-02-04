import { FacebookService } from "../platforms/facebook";
import { LinkedInService } from "../platforms/linkedin";
import prisma from "../prisma";

export class CommentCollectorService {
  /**
   * Collect comments for a specific post across all platforms
   */
  static async collectPostComments(postId: string) {
    const postResults = await prisma.postResult.findMany({
      where: {
        postId,
        status: "success",
      },
      include: {
        account: true,
      },
    });

    const collectionPromises = postResults.map((postResult) =>
      this.collectCommentsForPlatform(postResult)
    );

    const results = await Promise.allSettled(collectionPromises);

    const totalComments = results.reduce((sum, r) => {
      if (r.status === "fulfilled") {
        return sum + r.value.length;
      }
      return sum;
    }, 0);

    return {
      postId,
      totalComments,
      results: results.map((r, index) => ({
        postResult: postResults[index],
        comments: r.status === "fulfilled" ? r.value : [],
        error: r.status === "rejected" ? (r.reason as Error).message : null,
      })),
    };
  }

  /**
   * Collect comments from a single platform
   */
  private static async collectCommentsForPlatform(postResult: any) {
    if (!postResult.platformPostId) {
      return [];
    }

    let platformComments: any[] = [];

    try {
      switch (postResult.platform) {
        case "facebook":
          platformComments = await FacebookService.getPostComments(
            postResult.platformPostId,
            postResult.account.accessToken
          );
          break;

        case "instagram":
          platformComments = await FacebookService.getInstagramComments(
            postResult.platformPostId,
            postResult.account.accessToken
          );
          break;

        case "linkedin":
          platformComments = await LinkedInService.getPostComments(
            postResult.platformPostId,
            postResult.account.accessToken
          );
          break;
      }

      // Store comments in database
      const storedComments = await Promise.all(
        platformComments.map((comment) =>
          prisma.comment.upsert({
            where: {
              postResultId_platformCommentId: {
                postResultId: postResult.id,
                platformCommentId: comment.id,
              },
            },
            create: {
              postResultId: postResult.id,
              platform: postResult.platform,
              platformCommentId: comment.id,
              commenterId: comment.authorId,
              commenterName: comment.authorName,
              commenterUsername: comment.authorUsername,
              text: comment.text,
              commentedAt: comment.createdAt,
              likesCount: comment.likesCount || 0,
            },
            update: {
              commenterName: comment.authorName,
              text: comment.text,
              likesCount: comment.likesCount || 0,
            },
          })
        )
      );

      // Update post result comment count
      await prisma.postResult.update({
        where: { id: postResult.id },
        data: {
          commentsCount: storedComments.length,
        },
      });

      return storedComments;
    } catch (error: any) {
      console.error(
        `Error collecting comments for ${postResult.platform}:`,
        error.message
      );
      return [];
    }
  }

  /**
   * Collect comments for all recent posts (background job)
   */
  static async collectAllRecentComments(userId: string, hours: number = 24) {
    const cutoffDate = new Date(Date.now() - hours * 60 * 60 * 1000);

    const recentPosts = await prisma.post.findMany({
      where: {
        userId,
        status: { in: ["published", "partial"] },
        publishedAt: { gte: cutoffDate },
      },
    });

    const collectionPromises = recentPosts.map((post) =>
      this.collectPostComments(post.id)
    );

    return Promise.allSettled(collectionPromises);
  }
}
