import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/utils/session";
import { LinkedInService } from "@/lib/platforms/linkedin";
import { encryptToken } from "@/lib/utils/encryption";
import prisma from "@/lib/prisma";

// POST /api/accounts/linkedin - Connect LinkedIn organizations
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

    // Get user's LinkedIn organizations
    const organizations = await LinkedInService.getUserOrganizations(
      accessToken
    );

    // Store each organization as an account
    const createdAccounts = await Promise.all(
      organizations.map(async (org) => {
        const encryptedToken = encryptToken(accessToken);

        return prisma.account.upsert({
          where: {
            userId_platform_platformAccountId: {
              userId: user.id,
              platform: "linkedin",
              platformAccountId: org.id,
            },
          },
          create: {
            userId: user.id,
            platform: "linkedin",
            platformAccountId: org.id,
            accountName: org.name,
            accountType: "organization",
            avatarUrl: org.avatarUrl,
            accessToken: encryptedToken,
            isActive: true,
            lastSyncedAt: new Date(),
          },
          update: {
            accountName: org.name,
            avatarUrl: org.avatarUrl,
            accessToken: encryptedToken,
            isActive: true,
            lastSyncedAt: new Date(),
          },
        });
      })
    );

    return NextResponse.json({
      message: "LinkedIn organizations connected successfully",
      accounts: createdAccounts.map((a) => ({
        id: a.id,
        platform: a.platform,
        accountName: a.accountName,
        avatarUrl: a.avatarUrl,
      })),
    });
  } catch (error: any) {
    console.error("LinkedIn connection error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to connect LinkedIn organizations" },
      { status: 500 }
    );
  }
}
