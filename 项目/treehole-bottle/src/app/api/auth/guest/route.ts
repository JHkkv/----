import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateNickname } from "@/lib/nickname";
import { setAuthCookie } from "@/lib/auth";

const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_MAX = 10; // max 10 requests
const RATE_LIMIT_WINDOW = 60 * 1000; // per 60 seconds

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW });
    return true;
  }
  if (entry.count >= RATE_LIMIT_MAX) return false;
  entry.count++;
  return true;
}

export async function POST(request: Request): Promise<NextResponse> {
  const ip = request.headers.get("x-forwarded-for") || "unknown";
  if (!checkRateLimit(ip)) {
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      { status: 429 }
    );
  }

  try {
    const cookieToken = crypto.randomUUID();
    const nickname = generateNickname();

    const user = await prisma.user.create({
      data: {
        nickname,
        cookieToken,
        isGuest: true,
      },
      select: {
        id: true,
        nickname: true,
        isGuest: true,
        mbtiType: true,
        mbtiConfidence: true,
      },
    });

    // Soft gate: if total users exceed 20, AI analysis should be disabled
    const totalUsers = await prisma.user.count();
    if (totalUsers > 20) {
      console.warn(
        `[AI Gate] Total users (${totalUsers}) exceed soft limit of 20. ` +
          `AI analysis should be disabled to manage costs.`,
      );
      // NOTE: This is a soft gate — guest creation is NOT blocked.
    }

    const cookieConfig = setAuthCookie(cookieToken);
    const response = NextResponse.json({
      user: {
        id: user.id,
        nickname: user.nickname,
        isGuest: user.isGuest,
        mbtiType: user.mbtiType,
        mbtiConfidence: user.mbtiConfidence,
      },
    });

    response.cookies.set(
      cookieConfig.name,
      cookieConfig.value,
      cookieConfig.options,
    );

    return response;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to create guest user";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
