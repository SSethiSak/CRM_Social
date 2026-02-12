import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/utils/session";
import { FacebookService } from "@/lib/platforms/facebook";
import prisma from "@/lib/prisma";

// POST /api/posts/[id]/metrics - Refresh engagement metrics from platforms
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth();

    const post = await prisma.post.findFirst({
      where: {
        id: params.id,
        userId: user.id,
      },
    });

    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    const postResults = await prisma.postResult.findMany({
      where: {
        postId: params.id,
        status: "success",
      },
      include: {
        account: true,
      },
    });

    const metricsResults = [];

    for (const postResult of postResults) {
      if (!postResult.platformPostId) {
        console.log(`Skipping ${postResult.platform} - no platformPostId`);
        continue;
      }

      try {
        let metrics = { likes: 0, comments: 0, shares: 0 };

        if (
          postResult.platform === "facebook" ||
          postResult.platform === "instagram"
        ) {
          metrics = await FacebookService.getPostMetrics(
            postResult.platformPostId,
            postResult.account.accessToken,
            postResult.platform
          );
        }

        // Update the postResult with new metrics
        await prisma.postResult.update({
          where: { id: postResult.id },
          data: {
            likesCount: metrics.likes,
            commentsCount: metrics.comments,
            sharesCount: metrics.shares,
          },
        });

        metricsResults.push({
          platform: postResult.platform,
          metrics,
          error: null,
        });
      } catch (error: any) {
        console.error(
          `Error fetching metrics for ${postResult.platform}:`,
          error.message
        );
        metricsResults.push({
          platform: postResult.platform,
          metrics: null,
          error: error.message,
        });
      }
    }

    return NextResponse.json({
      message: "Metrics refreshed successfully",
      results: metricsResults,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
