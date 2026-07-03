import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import type { MbtiScores, MbtiType } from "@/types";

/**
 * Maps each MBTI type to its canonical MbtiScores.
 * For each dimension pair, the dominant letter gets 1.0 and the opposite gets 0.0.
 */
const TYPE_MAP: Record<MbtiType, MbtiScores> = {
  INTJ: { E: 0, I: 1, S: 0, N: 1, T: 1, F: 0, J: 1, P: 0 },
  INTP: { E: 0, I: 1, S: 0, N: 1, T: 1, F: 0, J: 0, P: 1 },
  ENTJ: { E: 1, I: 0, S: 0, N: 1, T: 1, F: 0, J: 1, P: 0 },
  ENTP: { E: 1, I: 0, S: 0, N: 1, T: 1, F: 0, J: 0, P: 1 },
  INFJ: { E: 0, I: 1, S: 0, N: 1, T: 0, F: 1, J: 1, P: 0 },
  INFP: { E: 0, I: 1, S: 0, N: 1, T: 0, F: 1, J: 0, P: 1 },
  ENFJ: { E: 1, I: 0, S: 0, N: 1, T: 0, F: 1, J: 1, P: 0 },
  ENFP: { E: 1, I: 0, S: 0, N: 1, T: 0, F: 1, J: 0, P: 1 },
  ISTJ: { E: 0, I: 1, S: 1, N: 0, T: 1, F: 0, J: 1, P: 0 },
  ISFJ: { E: 0, I: 1, S: 1, N: 0, T: 0, F: 1, J: 1, P: 0 },
  ESTJ: { E: 1, I: 0, S: 1, N: 0, T: 1, F: 0, J: 1, P: 0 },
  ESFJ: { E: 1, I: 0, S: 1, N: 0, T: 0, F: 1, J: 1, P: 0 },
  ISTP: { E: 0, I: 1, S: 1, N: 0, T: 1, F: 0, J: 0, P: 1 },
  ISFP: { E: 0, I: 1, S: 1, N: 0, T: 0, F: 1, J: 0, P: 1 },
  ESTP: { E: 1, I: 0, S: 1, N: 0, T: 1, F: 0, J: 0, P: 1 },
  ESFP: { E: 1, I: 0, S: 1, N: 0, T: 0, F: 1, J: 0, P: 1 },
};

const directSchema = z.object({
  type: z.enum([
    "INTJ", "INTP", "ENTJ", "ENTP",
    "INFJ", "INFP", "ENFJ", "ENFP",
    "ISTJ", "ISFJ", "ESTJ", "ESFJ",
    "ISTP", "ISFP", "ESTP", "ESFP",
  ]),
});

export async function POST(
  request: Request,
): Promise<NextResponse> {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = directSchema.safeParse(await request.json());

    if (!body.success) {
      return NextResponse.json(
        { error: "Invalid request body", details: body.error.issues },
        { status: 400 },
      );
    }

    const mbtiType = body.data.type;
    const scores = TYPE_MAP[mbtiType];

    // Create 4 answer records (one per dimension) with scores from the type map
    const dimensionAnswers: { dimension: string; score: number }[] = [
      { dimension: "EI", score: scores.E > scores.I ? 1.0 : -1.0 },
      { dimension: "SN", score: scores.S > scores.N ? 1.0 : -1.0 },
      { dimension: "TF", score: scores.T > scores.F ? 1.0 : -1.0 },
      { dimension: "JP", score: scores.J > scores.P ? 1.0 : -1.0 },
    ];

    for (const da of dimensionAnswers) {
      await prisma.mbtiAnswer.create({
        data: {
          userId: user.id,
          questionId: `direct-${da.dimension}`,
          dimension: da.dimension,
          score: da.score,
          source: "direct",
        },
      });
    }

    // Update user with full confidence
    await prisma.user.update({
      where: { id: user.id },
      data: {
        mbtiScores: scores as Record<string, number>,
        mbtiType: mbtiType,
        mbtiConfidence: 1.0,
      },
    });

    return NextResponse.json({
      type: mbtiType,
      confidence: 1.0,
      scores,
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Failed to set MBTI type";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
