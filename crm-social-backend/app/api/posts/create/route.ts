import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAuth } from "@/lib/utils/session";
import { PublisherService } from "@/lib/services/publisher";
import { Platform } from "@/lib/platforms/types";

// Validation schema
const createPostSchema = z.object({
  content: z.string().min(1).max(5000),
  imageUrl: z.string().url().optional().nullable(),
  videoUrl: z.string().url().optional().nullable(),
  platforms: z.array(z.enum(["facebook", "instagram", "linkedin"])).min(1),
});

// POST /api/posts/create - Create and publish post
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await request.json();

    // Validate input
    const validatedData = createPostSchema.parse(body);

    // Publish to platforms
    const result = await PublisherService.publishToMultiplePlatforms(
      user.id,
      {
        text: validatedData.content,
        imageUrl: validatedData.imageUrl || undefined,
        videoUrl: validatedData.videoUrl || undefined,
      },
      validatedData.platforms as Platform[]
    );

    return NextResponse.json({
      message: "Post published",
      postId: result.postId,
      results: result.results.map((r) => ({
        platform: r.account.platform,
        accountName: r.account.accountName,
        success: r.result.success,
        postUrl: r.result.postUrl,
        error: r.result.error,
      })),
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 }
      );
    }

    console.error("Post creation error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create post" },
      { status: 500 }
    );
  }
}
