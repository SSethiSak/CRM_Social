import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/utils/session";
import prisma from "@/lib/prisma";

// GET /api/dashboard/stats - Get dashboard statistics
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();

    // Get counts
    const [
      accountsCount,
      postsCount,
      commentsCount,
      recentPosts,
      accountsByPlatform,
    ] = await Promise.all([
      // Connected accounts count
      prisma.account.count({
        where: {
          userId: user.id,
          isActive: true,
        },
      }),

      // Total posts count
      prisma.post.count({
        where: { userId: user.id },
      }),

      // Total comments count
      prisma.comment.count({
        where: {
          postResult: {
            post: {
              userId: user.id,
            },
          },
        },
      }),

      // Recent posts (last 10)
      prisma.post.findMany({
        where: { userId: user.id },
        include: {
          postResults: {
            select: {
              platform: true,
              status: true,
              commentsCount: true,
              likesCount: true,
              sharesCount: true,
              platformPostUrl: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        take: 10,
      }),

      // Accounts grouped by platform
      prisma.account.groupBy({
        by: ["platform"],
        where: {
          userId: user.id,
          isActive: true,
        },
        _count: true,
      }),
    ]);

    // Calculate engagement stats
    const totalLikes = recentPosts.reduce(
      (sum, post) =>
        sum + post.postResults.reduce((s, pr) => s + pr.likesCount, 0),
      0
    );

    const totalCommentsFromPosts = recentPosts.reduce(
      (sum, post) =>
        sum + post.postResults.reduce((s, pr) => s + pr.commentsCount, 0),
      0
    );

    const totalShares = recentPosts.reduce(
      (sum, post) =>
        sum + post.postResults.reduce((s, pr) => s + pr.sharesCount, 0),
      0
    );

    // Platform breakdown
    const platformStats = accountsByPlatform.reduce((acc, item) => {
      acc[item.platform] = item._count;
      return acc;
    }, {} as Record<string, number>);

    return NextResponse.json({
      stats: {
        connectedAccounts: accountsCount,
        totalPosts: postsCount,
        totalComments: commentsCount,
        totalLikes: totalLikes,
        totalShares: totalShares,
        totalEngagement: totalLikes + totalCommentsFromPosts + totalShares,
        platformAccounts: platformStats,
      },
      recentPosts: recentPosts.map((post) => ({
        id: post.id,
        content:
          post.content.substring(0, 100) +
          (post.content.length > 100 ? "..." : ""),
        imageUrl: post.imageUrl,
        platforms: post.platforms,
        status: post.status,
        createdAt: post.createdAt,
        publishedAt: post.publishedAt,
        results: post.postResults,
      })),
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
