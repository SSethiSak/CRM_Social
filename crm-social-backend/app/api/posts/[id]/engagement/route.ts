import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/utils/session";
import { FacebookService } from "@/lib/platforms/facebook";
import prisma from "@/lib/prisma";

// GET /api/posts/[id]/engagement - Get detailed reactions and shares
export async function GET(
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

    const engagement: {
      reactions: any[];
      shares: any[];
      totalReactions: number;
      totalShares: number;
    } = {
      reactions: [],
      shares: [],
      totalReactions: 0,
      totalShares: 0,
    };

    for (const postResult of postResults) {
      if (!postResult.platformPostId) continue;

      if (postResult.platform === "facebook") {
        const [reactionsData, sharesData] = await Promise.all([
          FacebookService.getPostReactions(
            postResult.platformPostId,
            postResult.account.accessToken
          ),
          FacebookService.getPostSharedPosts(
            postResult.platformPostId,
            postResult.account.accessToken
          ),
        ]);

        engagement.reactions.push(
          ...reactionsData.reactions.map((r: any) => ({
            ...r,
            platform: "facebook",
          }))
        );
        engagement.shares.push(
          ...sharesData.shares.map((s: any) => ({
            ...s,
            platform: "facebook",
          }))
        );
        engagement.totalReactions += reactionsData.total;
        engagement.totalShares += sharesData.total;
      }
    }

    return NextResponse.json({ engagement });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
