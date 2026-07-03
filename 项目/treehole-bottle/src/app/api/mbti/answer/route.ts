import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { computeScores } from "@/lib/mbti/scoring";

const answerSchema = z.object({
  questionId: z.string().min(1),
  dimension: z.enum(["EI", "SN", "TF", "JP"]),
  score: z.number().min(-1).max(1),
});

export async function POST(
  request: Request,
): Promise<NextResponse> {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = answerSchema.safeParse(await request.json());

    if (!body.success) {
      return NextResponse.json(
        { error: "Invalid request body", details: body.error.issues },
        { status: 400 },
      );
    }

    const { questionId, dimension, score } = body.data;

    // Create the answer record
    await prisma.mbtiAnswer.create({
      data: {
        userId: user.id,
        questionId,
        dimension,
        score,
        source: "choice",
      },
    });

    // Recompute scores from all answers
    const result = await computeScores(user.id);

    // Update user with latest MBTI data
    await prisma.user.update({
      where: { id: user.id },
      data: {
        mbtiScores: result.scores as Record<string, number>,
        mbtiType: result.type,
        mbtiConfidence: result.confidence,
      },
    });

    return NextResponse.json({
      type: result.type,
      confidence: result.confidence,
      scores: result.scores,
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Failed to record answer";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
