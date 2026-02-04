import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/utils/session";
import { CommentCollectorService } from "@/lib/services/commentCollector";
import prisma from "@/lib/prisma";

// GET /api/posts/[id]/comments - Get comments for a post
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth();

    // Verify post belongs to user
    const post = await prisma.post.findFirst({
      where: {
        id: params.id,
        userId: user.id,
      },
    });

    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    // Get comments from database
    const postResults = await prisma.postResult.findMany({
      where: { postId: params.id },
      include: {
        comments: {
          orderBy: { commentedAt: "desc" },
        },
        account: {
          select: {
            platform: true,
            accountName: true,
          },
        },
      },
    });

    const comments = postResults.flatMap((pr) =>
      pr.comments.map((comment) => ({
        ...comment,
        platform: pr.platform,
        accountName: pr.account.accountName,
      }))
    );

    return NextResponse.json({ comments });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/posts/[id]/comments - Refresh comments from platforms
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth();

    // Verify post belongs to user
    const post = await prisma.post.findFirst({
      where: {
        id: params.id,
        userId: user.id,
      },
    });

    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    // Collect comments from platforms
    const result = await CommentCollectorService.collectPostComments(params.id);

    return NextResponse.json({
      message: "Comments refreshed successfully",
      totalComments: result.totalComments,
      details: result.results.map((r) => ({
        platform: r.postResult.platform,
        commentsCount: r.comments.length,
        error: r.error,
      })),
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
