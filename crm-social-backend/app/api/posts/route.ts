import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/utils/session";
import prisma from "@/lib/prisma";

// GET /api/posts - List user's posts
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "20");
    const offset = parseInt(searchParams.get("offset") || "0");
    const status = searchParams.get("status");

    const whereClause: any = { userId: user.id };
    if (status) {
      whereClause.status = status;
    }

    const [posts, total] = await Promise.all([
      prisma.post.findMany({
        where: whereClause,
        include: {
          postResults: {
            select: {
              id: true,
              platform: true,
              status: true,
              platformPostUrl: true,
              commentsCount: true,
              likesCount: true,
              sharesCount: true,
              errorMessage: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        take: limit,
        skip: offset,
      }),
      prisma.post.count({ where: whereClause }),
    ]);

    return NextResponse.json({
      posts,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + posts.length < total,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
