import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/utils/session";
import prisma from "@/lib/prisma";

// GET /api/accounts/[id] - Get single account details
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth();

    const account = await prisma.account.findFirst({
      where: {
        id: params.id,
        userId: user.id,
      },
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
    });

    if (!account) {
      return NextResponse.json({ error: "Account not found" }, { status: 404 });
    }

    return NextResponse.json({ account });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE /api/accounts/[id] - Disconnect account
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth();

    const account = await prisma.account.findFirst({
      where: {
        id: params.id,
        userId: user.id,
      },
    });

    if (!account) {
      return NextResponse.json({ error: "Account not found" }, { status: 404 });
    }

    await prisma.account.delete({
      where: { id: params.id },
    });

    return NextResponse.json({
      message: "Account disconnected successfully",
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PATCH /api/accounts/[id] - Update account status
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth();
    const { isActive } = await request.json();

    const account = await prisma.account.findFirst({
      where: {
        id: params.id,
        userId: user.id,
      },
    });

    if (!account) {
      return NextResponse.json({ error: "Account not found" }, { status: 404 });
    }

    const updatedAccount = await prisma.account.update({
      where: { id: params.id },
      data: { isActive },
    });

    return NextResponse.json({
      message: "Account updated successfully",
      account: {
        id: updatedAccount.id,
        isActive: updatedAccount.isActive,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
