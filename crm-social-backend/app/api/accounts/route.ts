import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/utils/session";
import prisma from "@/lib/prisma";

// GET /api/accounts - List all connected accounts
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();

    const accounts = await prisma.account.findMany({
      where: { userId: user.id },
      select: {
        id: true,
        platform: true,
        platformAccountId: true,
        accountName: true,
        accountType: true,
        avatarUrl: true,
        isActive: true,
        lastSyncedAt: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ accounts });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 401 });
  }
}
