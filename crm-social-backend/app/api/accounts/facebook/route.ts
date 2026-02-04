import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/utils/session";
import { FacebookService } from "@/lib/platforms/facebook";
import { encryptToken } from "@/lib/utils/encryption";
import prisma from "@/lib/prisma";

// POST /api/accounts/facebook - Connect Facebook pages
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    const { accessToken } = await request.json();

    if (!accessToken) {
      return NextResponse.json(
        { error: "Access token is required" },
        { status: 400 }
      );
    }

    // Get user's Facebook pages
    const pages = await FacebookService.getUserPages(accessToken);

    // Store each page as an account
    const createdAccounts = await Promise.all(
      pages.map(async (page) => {
        const encryptedToken = encryptToken(page.accessToken);

        return prisma.account.upsert({
          where: {
            userId_platform_platformAccountId: {
              userId: user.id,
              platform: "facebook",
              platformAccountId: page.id,
            },
          },
          create: {
            userId: user.id,
            platform: "facebook",
            platformAccountId: page.id,
            accountName: page.name,
            accountType: "page",
            avatarUrl: page.avatarUrl,
            accessToken: encryptedToken,
            isActive: true,
            lastSyncedAt: new Date(),
            platformData: {
              instagramAccountId: page.instagramAccountId,
            },
          },
          update: {
            accountName: page.name,
            avatarUrl: page.avatarUrl,
            accessToken: encryptedToken,
            isActive: true,
            lastSyncedAt: new Date(),
            platformData: {
              instagramAccountId: page.instagramAccountId,
            },
          },
        });
      })
    );

    return NextResponse.json({
      message: "Facebook pages connected successfully",
      accounts: createdAccounts.map((a) => ({
        id: a.id,
        platform: a.platform,
        accountName: a.accountName,
        avatarUrl: a.avatarUrl,
      })),
    });
  } catch (error: any) {
    console.error("Facebook connection error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to connect Facebook pages" },
      { status: 500 }
    );
  }
}
