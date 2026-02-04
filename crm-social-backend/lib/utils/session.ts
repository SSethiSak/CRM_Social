import { cookies, headers } from "next/headers";
import { jwtVerify } from "jose";
import prisma from "@/lib/prisma";

const JWT_SECRET = new TextEncoder().encode(
  process.env.NEXTAUTH_SECRET || "fallback-secret-change-me"
);

export async function getCurrentUser() {
  try {
    // Get token from Authorization header first, then fall back to cookie
    const headersList = headers();
    const authHeader = headersList.get("authorization");
    let token = authHeader?.replace("Bearer ", "");

    // If no Authorization header, try cookie
    if (!token) {
      const cookieStore = cookies();
      token = cookieStore.get("auth-token")?.value;
    }

    if (!token) {
      return null;
    }

    // Verify JWT
    const { payload } = await jwtVerify(token, JWT_SECRET);

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { id: payload.id as string },
      select: {
        id: true,
        email: true,
        name: true,
        image: true,
      },
    });

    return user;
  } catch (error) {
    console.error("Session error:", error);
    return null;
  }
}

export async function requireAuth() {
  const user = await getCurrentUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  return user;
}

export async function getUserId(): Promise<string> {
  const user = await requireAuth();
  return user.id as string;
}
