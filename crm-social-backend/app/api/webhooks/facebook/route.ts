import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

const VERIFY_TOKEN = process.env.FACEBOOK_WEBHOOK_VERIFY_TOKEN || "smean_crm_webhook_2026";

// GET /api/webhooks/facebook - Webhook verification (Facebook sends this to verify your endpoint)
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  if (mode === "subscribe" && token === VERIFY_TOKEN) {
    console.log("✅ Facebook webhook verified successfully");
    return new NextResponse(challenge, { status: 200 });
  }

  console.warn("❌ Facebook webhook verification failed", { mode, token });
  return NextResponse.json({ error: "Verification failed" }, { status: 403 });
}

// POST /api/webhooks/facebook - Receive webhook events
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    console.log("📩 Facebook webhook received:", JSON.stringify(body, null, 2));

    if (body.object !== "page") {
      return NextResponse.json({ received: true }, { status: 200 });
    }

    // Process each entry
    for (const entry of body.entry || []) {
      const pageId = entry.id;

      for (const change of entry.changes || []) {
        if (change.field === "feed") {
          await handleFeedChange(pageId, change.value);
        }
      }
    }

    // Always return 200 quickly — Facebook will retry if it doesn't get a 200 within 20 seconds
    return NextResponse.json({ received: true }, { status: 200 });
  } catch (error: any) {
    console.error("Webhook processing error:", error.message);
    // Still return 200 to prevent Facebook from retrying
    return NextResponse.json({ received: true }, { status: 200 });
  }
}

async function handleFeedChange(pageId: string, value: any) {
  try {
    const { item, verb, comment_id, from, message, post_id, created_time, reaction_type, parent_id } = value;

    console.log(`📝 Feed change: item=${item}, verb=${verb}, post_id=${post_id}`);

    if (item === "comment" && (verb === "add" || verb === "edited")) {
      await handleNewComment(pageId, {
        commentId: comment_id,
        postId: post_id,
        from,
        message,
        createdTime: created_time,
        parentId: parent_id,
      });
    } else if (item === "reaction" && (verb === "add" || verb === "remove")) {
      await handleReaction(pageId, {
        postId: post_id,
        from,
        reactionType: reaction_type,
        verb,
      });
    } else if (item === "comment" && verb === "remove") {
      await handleCommentRemoved(comment_id);
    }
  } catch (error: any) {
    console.error("Error handling feed change:", error.message);
  }
}

async function handleNewComment(
  pageId: string,
  data: {
    commentId: string;
    postId: string;
    from: { id: string; name: string };
    message: string;
    createdTime: number;
    parentId?: string;
  }
) {
  // Find the post result that matches this platform post
  const postResult = await prisma.postResult.findFirst({
    where: {
      platformPostId: data.postId,
      platform: "facebook",
      status: "success",
    },
  });

  if (!postResult) {
    console.log(`No matching post found for Facebook post ${data.postId}`);
    return;
  }

  // Upsert the comment
  await prisma.comment.upsert({
    where: {
      postResultId_platformCommentId: {
        postResultId: postResult.id,
        platformCommentId: data.commentId,
      },
    },
    create: {
      postResultId: postResult.id,
      platform: "facebook",
      platformCommentId: data.commentId,
      commenterId: data.from.id,
      commenterName: data.from.name,
      text: data.message,
      commentedAt: new Date(data.createdTime * 1000),
      isReply: !!data.parentId,
      parentCommentId: data.parentId,
    },
    update: {
      commenterName: data.from.name,
      text: data.message,
    },
  });

  // Update comments count
  const commentsCount = await prisma.comment.count({
    where: { postResultId: postResult.id },
  });

  await prisma.postResult.update({
    where: { id: postResult.id },
    data: { commentsCount },
  });

  console.log(`✅ Comment saved: "${data.message}" by ${data.from.name}`);
}

async function handleReaction(
  pageId: string,
  data: {
    postId: string;
    from: { id: string; name: string };
    reactionType: string;
    verb: string;
  }
) {
  const postResult = await prisma.postResult.findFirst({
    where: {
      platformPostId: data.postId,
      platform: "facebook",
      status: "success",
    },
  });

  if (!postResult) {
    console.log(`No matching post found for Facebook post ${data.postId}`);
    return;
  }

  // Increment or decrement likes count
  await prisma.postResult.update({
    where: { id: postResult.id },
    data: {
      likesCount: {
        increment: data.verb === "add" ? 1 : -1,
      },
    },
  });

  console.log(`✅ Reaction ${data.verb}: ${data.reactionType} by ${data.from.name}`);
}

async function handleCommentRemoved(commentId: string) {
  try {
    await prisma.comment.deleteMany({
      where: { platformCommentId: commentId },
    });
    console.log(`✅ Comment removed: ${commentId}`);
  } catch (e) {
    // Comment may not exist in our DB
  }
}
