import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/utils/session";
import { TelegramService } from "@/lib/platforms/telegram";
import { encryptToken } from "@/lib/utils/encryption";
import prisma from "@/lib/prisma";

// POST /api/accounts/telegram - Connect Telegram channel with bot token
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    const { botToken, channelId } = await request.json();

    if (!botToken) {
      return NextResponse.json(
        { error: "Bot token is required" },
        { status: 400 }
      );
    }

    if (!channelId) {
      return NextResponse.json(
        {
          error:
            "Channel ID is required (e.g., @yourchannel or -1001234567890)",
        },
        { status: 400 }
      );
    }

    // Validate bot token
    const botInfo = await TelegramService.validateBotToken(botToken);
    if (!botInfo) {
      return NextResponse.json(
        {
          error: "Invalid bot token. Please check your token from @BotFather.",
        },
        { status: 400 }
      );
    }

    console.log("Bot validated:", botInfo.username);

    // Get channel info
    const channelInfo = await TelegramService.getChatInfo(botToken, channelId);
    if (!channelInfo) {
      return NextResponse.json(
        {
          error:
            "Cannot access channel. Make sure the bot is an admin of the channel with 'Post Messages' permission.",
        },
        { status: 400 }
      );
    }

    console.log("Channel info:", channelInfo);

    // Encrypt the bot token for storage
    const encryptedToken = encryptToken(botToken);

    // Store the channel as an account
    const account = await prisma.account.upsert({
      where: {
        userId_platform_platformAccountId: {
          userId: user.id,
          platform: "telegram",
          platformAccountId: channelInfo.id,
        },
      },
      create: {
        userId: user.id,
        platform: "telegram",
        platformAccountId: channelInfo.id,
        accountName: channelInfo.title,
        accountType: channelInfo.type,
        accessToken: encryptedToken,
        isActive: true,
        lastSyncedAt: new Date(),
        platformData: {
          username: channelInfo.username,
          botUsername: botInfo.username,
          botId: botInfo.id,
        },
      },
      update: {
        accountName: channelInfo.title,
        accountType: channelInfo.type,
        accessToken: encryptedToken,
        isActive: true,
        lastSyncedAt: new Date(),
        platformData: {
          username: channelInfo.username,
          botUsername: botInfo.username,
          botId: botInfo.id,
        },
      },
    });

    return NextResponse.json({
      message: "Telegram channel connected successfully",
      account: {
        id: account.id,
        platform: account.platform,
        accountName: account.accountName,
        channelUsername: channelInfo.username,
      },
    });
  } catch (error: any) {
    console.error("Telegram connection error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to connect Telegram channel" },
      { status: 500 }
    );
  }
}
