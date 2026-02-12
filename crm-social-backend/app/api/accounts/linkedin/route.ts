import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/utils/session";
import { LinkedInService } from "@/lib/platforms/linkedin";
import { encryptToken } from "@/lib/utils/encryption";
import prisma from "@/lib/prisma";
import axios from "axios";

const LINKEDIN_AUTH_URL = "https://www.linkedin.com/oauth/v2/authorization";
const LINKEDIN_TOKEN_URL = "https://www.linkedin.com/oauth/v2/accessToken";

// GET /api/accounts/linkedin - Get LinkedIn authorization URL
export async function GET(request: NextRequest) {
  try {
    await requireAuth();

    const redirectUri = `${process.env.NEXTAUTH_URL}/api/accounts/linkedin/callback`;
    const state = crypto.randomUUID();

    // Basic scopes for personal profile (organization scopes require Marketing Developer Platform approval)
    const scope = "openid profile email";

    const params = new URLSearchParams({
      response_type: "code",
      client_id: process.env.LINKEDIN_CLIENT_ID!,
      redirect_uri: redirectUri,
      state: state,
      scope: scope,
    });

    const authUrl = `${LINKEDIN_AUTH_URL}?${params.toString()}`;

    console.log("LinkedIn Auth URL:", authUrl);
    console.log("Redirect URI:", redirectUri);

    return NextResponse.json({ authUrl, state });
  } catch (error: any) {
    console.error("LinkedIn auth URL error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to generate LinkedIn auth URL" },
      { status: 500 }
    );
  }
}

// POST /api/accounts/linkedin - Connect LinkedIn account (with code or token)
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await request.json();
    const { accessToken, code, redirectUri } = body;

    let token = accessToken;

    // If code is provided, exchange it for access token
    if (code && !accessToken) {
      const callbackUri =
        redirectUri ||
        `${process.env.NEXTAUTH_URL}/api/accounts/linkedin/callback`;

      console.log("Exchanging LinkedIn code for token...");

      try {
        const tokenResponse = await axios.post(
          LINKEDIN_TOKEN_URL,
          new URLSearchParams({
            grant_type: "authorization_code",
            code: code,
            redirect_uri: callbackUri,
            client_id: process.env.LINKEDIN_CLIENT_ID!,
            client_secret: process.env.LINKEDIN_CLIENT_SECRET!,
          }),
          {
            headers: {
              "Content-Type": "application/x-www-form-urlencoded",
            },
          }
        );

        console.log("Token exchange successful");
        token = tokenResponse.data.access_token;
      } catch (tokenError: any) {
        console.error(
          "Token exchange failed:",
          tokenError.response?.status,
          tokenError.response?.data
        );
        return NextResponse.json(
          {
            error:
              tokenError.response?.data?.error_description ||
              "Failed to exchange authorization code",
          },
          { status: 400 }
        );
      }
    }

    if (!token) {
      return NextResponse.json(
        { error: "Access token or authorization code is required" },
        { status: 400 }
      );
    }

    // Get user's LinkedIn profile
    const profile = await LinkedInService.getUserProfile(token);
    const encryptedToken = encryptToken(token);

    const account = await prisma.account.upsert({
      where: {
        userId_platform_platformAccountId: {
          userId: user.id,
          platform: "linkedin",
          platformAccountId: profile.id,
        },
      },
      create: {
        userId: user.id,
        platform: "linkedin",
        platformAccountId: profile.id,
        accountName: profile.name,
        accountType: "profile",
        avatarUrl: profile.avatarUrl,
        accessToken: encryptedToken,
        isActive: true,
        lastSyncedAt: new Date(),
        platformData: { email: profile.email },
      },
      update: {
        accountName: profile.name,
        avatarUrl: profile.avatarUrl,
        accessToken: encryptedToken,
        isActive: true,
        lastSyncedAt: new Date(),
        platformData: { email: profile.email },
      },
    });

    return NextResponse.json({
      message: "LinkedIn connected successfully",
      accounts: [
        {
          id: account.id,
          platform: account.platform,
          accountName: account.accountName,
          avatarUrl: account.avatarUrl,
        },
      ],
    });
  } catch (error: any) {
    console.error("LinkedIn connection error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to connect LinkedIn account" },
      { status: 500 }
    );
  }
}
