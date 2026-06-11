import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateNickname } from "@/lib/nickname";
import { setAuthCookie } from "@/lib/auth";

export async function POST(): Promise<NextResponse> {
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
