import { NextRequest, NextResponse } from "next/server";

// GET /api/accounts/tiktok/callback - OAuth callback handler
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");

  // Redirect to frontend root where AppContext handles OAuth
  const frontendUrl =
    process.env.NEXT_PUBLIC_FRONTEND_URL || "http://localhost:5173";

  if (error) {
    return NextResponse.redirect(
      `${frontendUrl}/?error=${encodeURIComponent(error)}&platform=tiktok`
    );
  }

  if (code) {
    return NextResponse.redirect(
      `${frontendUrl}/?code=${encodeURIComponent(code)}&state=${
        state || ""
      }&platform=tiktok`
    );
  }

  return NextResponse.redirect(`${frontendUrl}/?error=no_code&platform=tiktok`);
}
