import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";

export async function GET(): Promise<NextResponse> {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return NextResponse.json({
      type: user.mbtiType,
      confidence: user.mbtiConfidence,
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Failed to get MBTI status";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
