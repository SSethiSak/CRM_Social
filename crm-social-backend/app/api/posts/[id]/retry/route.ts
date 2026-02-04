import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/utils/session";
import { PublisherService } from "@/lib/services/publisher";
import prisma from "@/lib/prisma";

// POST /api/posts/[id]/retry - Retry failed post publishing
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth();

    // Get post result to retry
    const postResult = await prisma.postResult.findFirst({
      where: {
        id: params.id,
        post: {
          userId: user.id,
        },
      },
      include: {
        post: true,
      },
    });

    if (!postResult) {
      return NextResponse.json(
        { error: "Post result not found" },
        { status: 404 }
      );
    }

    if (postResult.status === "success") {
      return NextResponse.json(
        { error: "This post was already published successfully" },
        { status: 400 }
      );
    }

    if (postResult.retryCount >= 3) {
      return NextResponse.json(
        { error: "Maximum retry attempts reached" },
        { status: 400 }
      );
    }

    // Retry publishing
    const result = await PublisherService.retryPublish(params.id);

    return NextResponse.json({
      message: result.success
        ? "Post published successfully"
        : "Post publishing failed",
      success: result.success,
      postUrl: result.postUrl,
      error: result.error,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
