import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/utils/session";
import { FacebookService } from "@/lib/platforms/facebook";
import { encryptToken, decryptToken } from "@/lib/utils/encryption";
import prisma from "@/lib/prisma";

// POST /api/accounts/instagram - Connect Instagram accounts
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();

    // Get all Facebook pages first
    const facebookAccounts = await prisma.account.findMany({
      where: {
        userId: user.id,
        platform: "facebook",
        isActive: true,
      },
    });

    if (facebookAccounts.length === 0) {
      return NextResponse.json(
        { error: "Please connect Facebook pages first" },
        { status: 400 }
      );
    }

    // Get Instagram accounts for each Facebook page
    const instagramAccounts = [];

    for (const fbAccount of facebookAccounts) {
      const decryptedToken = decryptToken(fbAccount.accessToken);
      const igAccount = await FacebookService.getInstagramAccounts(
        decryptedToken,
        fbAccount.platformAccountId
      );

      if (igAccount) {
        const encryptedToken = encryptToken(igAccount.pageAccessToken);

        const account = await prisma.account.upsert({
          where: {
            userId_platform_platformAccountId: {
              userId: user.id,
              platform: "instagram",
              platformAccountId: igAccount.id,
            },
          },
          create: {
            userId: user.id,
            platform: "instagram",
            platformAccountId: igAccount.id,
            accountName: `@${igAccount.username}`,
            accountType: "business",
            avatarUrl: igAccount.avatarUrl,
            accessToken: encryptedToken,
            isActive: true,
            lastSyncedAt: new Date(),
          },
          update: {
            accountName: `@${igAccount.username}`,
            avatarUrl: igAccount.avatarUrl,
            accessToken: encryptedToken,
            isActive: true,
            lastSyncedAt: new Date(),
          },
        });

        instagramAccounts.push(account);
      }
    }

    if (instagramAccounts.length === 0) {
      return NextResponse.json(
        {
          error:
            "No Instagram Business accounts found. Please link an Instagram Business account to your Facebook Page.",
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: "Instagram accounts connected successfully",
      accounts: instagramAccounts.map((a) => ({
        id: a.id,
        platform: a.platform,
        accountName: a.accountName,
        avatarUrl: a.avatarUrl,
      })),
    });
  } catch (error: any) {
    console.error("Instagram connection error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to connect Instagram accounts" },
      { status: 500 }
    );
  }
}
