import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/utils/session";
import prisma from "@/lib/prisma";

// GET /api/posts/[id] - Get single post details
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
      include: {
        postResults: {
          include: {
            account: {
              select: {
                id: true,
                platform: true,
                accountName: true,
                avatarUrl: true,
              },
            },
            comments: {
              orderBy: { commentedAt: "desc" },
              take: 50,
            },
          },
        },
      },
    });

    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    return NextResponse.json({ post });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE /api/posts/[id] - Delete a post
export async function DELETE(
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

    await prisma.post.delete({
      where: { id: params.id },
    });

    return NextResponse.json({
      message: "Post deleted successfully",
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
