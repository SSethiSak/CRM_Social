import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/utils/session";
import { TikTokService } from "@/lib/platforms/tiktok";
import { encryptToken } from "@/lib/utils/encryption";
import prisma from "@/lib/prisma";

// GET /api/accounts/tiktok - Get TikTok authorization URL
export async function GET(request: NextRequest) {
  try {
    await requireAuth();

    const redirectUri = `${process.env.NEXTAUTH_URL}/api/accounts/tiktok/callback`;
    const state = crypto.randomUUID(); // You may want to store this for validation

    const authUrl = TikTokService.getAuthorizationUrl(redirectUri, state);

    return NextResponse.json({ authUrl, state });
  } catch (error: any) {
    console.error("TikTok auth URL error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to generate TikTok auth URL" },
      { status: 500 }
    );
  }
}

// POST /api/accounts/tiktok - Connect TikTok account with code
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    const { code, redirectUri } = await request.json();

    if (!code) {
      return NextResponse.json(
        { error: "Authorization code is required" },
        { status: 400 }
      );
    }

    const callbackUri =
      redirectUri || `${process.env.NEXTAUTH_URL}/api/accounts/tiktok/callback`;

    // Exchange code for tokens
    const tokenData = await TikTokService.exchangeCodeForToken(
      code,
      callbackUri
    );

    // Get user info
    const encryptedToken = encryptToken(tokenData.accessToken);
    const userInfo = await TikTokService.getUserInfo(encryptedToken);

    if (!userInfo) {
      return NextResponse.json(
        { error: "Failed to get TikTok user info" },
        { status: 400 }
      );
    }

    // Calculate token expiration
    const expiresAt = new Date(Date.now() + tokenData.expiresIn * 1000);

    // Store the account
    const account = await prisma.account.upsert({
      where: {
        userId_platform_platformAccountId: {
          userId: user.id,
          platform: "tiktok",
          platformAccountId: tokenData.openId,
        },
      },
      create: {
        userId: user.id,
        platform: "tiktok",
        platformAccountId: tokenData.openId,
        accountName: userInfo.displayName,
        accountType: "profile",
        avatarUrl: userInfo.avatarUrl,
        accessToken: encryptedToken,
        refreshToken: tokenData.refreshToken
          ? encryptToken(tokenData.refreshToken)
          : null,
        expiresAt: expiresAt,
        isActive: true,
        lastSyncedAt: new Date(),
        platformData: {
          username: userInfo.username,
        },
      },
      update: {
        accountName: userInfo.displayName,
        avatarUrl: userInfo.avatarUrl,
        accessToken: encryptedToken,
        refreshToken: tokenData.refreshToken
          ? encryptToken(tokenData.refreshToken)
          : null,
        expiresAt: expiresAt,
        isActive: true,
        lastSyncedAt: new Date(),
        platformData: {
          username: userInfo.username,
        },
      },
    });

    return NextResponse.json({
      message: "TikTok account connected successfully",
      account: {
        id: account.id,
        platform: account.platform,
        accountName: account.accountName,
        avatarUrl: account.avatarUrl,
      },
    });
  } catch (error: any) {
    console.error("TikTok connection error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to connect TikTok account" },
      { status: 500 }
    );
  }
}
