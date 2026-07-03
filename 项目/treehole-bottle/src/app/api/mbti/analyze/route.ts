import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { computeScores, deriveType } from "@/lib/mbti/scoring";
import { analyzeEmotionForMbti } from "@/lib/mbti/ai";
import type { MbtiScores } from "@/types";

const analyzeSchema = z.object({
  text: z.string().min(1).max(5000),
});

function mergeScores(
  choiceScores: MbtiScores | null,
  choiceCount: number,
  aiScores: MbtiScores,
): MbtiScores {
  if (!choiceScores || choiceCount === 0) {
    return { ...aiScores };
  }

  const aiWeight = 0.3;
  const choiceWeight = 0.7;

  return {
    E: choiceScores.E * choiceWeight + aiScores.E * aiWeight,
    I: choiceScores.I * choiceWeight + aiScores.I * aiWeight,
    S: choiceScores.S * choiceWeight + aiScores.S * aiWeight,
    N: choiceScores.N * choiceWeight + aiScores.N * aiWeight,
    T: choiceScores.T * choiceWeight + aiScores.T * aiWeight,
    F: choiceScores.F * choiceWeight + aiScores.F * aiWeight,
    J: choiceScores.J * choiceWeight + aiScores.J * aiWeight,
    P: choiceScores.P * choiceWeight + aiScores.P * aiWeight,
  };
}

export async function POST(
  request: Request,
): Promise<NextResponse> {
  try {
    // Check user count gate: disable AI analysis if > 20 users
    const totalUsers = await prisma.user.count();
    if (totalUsers > 20) {
      return NextResponse.json(
        { skipped: true, message: "AI analysis disabled (user limit reached). Use choice-based MBTI instead." },
        { status: 200 }
      );
    }

    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = analyzeSchema.safeParse(await request.json());

    if (!body.success) {
      return NextResponse.json(
        { error: "Invalid request body", details: body.error.issues },
        { status: 400 },
      );
    }

    const { text } = body.data;

    // Try AI analysis — returns null if CLAUDE_API_KEY not set or API fails
    const aiResult = await analyzeEmotionForMbti(text);

    if (!aiResult) {
      // AI analysis not available, return existing scores if any
      const existingResult = await computeScores(user.id);
      if (existingResult.confidence === 0) {
        return NextResponse.json({
          type: null,
          confidence: 0,
          scores: null,
          message: "AI analysis unavailable and no prior MBTI data exists",
        });
      }
      return NextResponse.json({
        type: existingResult.type,
        confidence: existingResult.confidence,
        scores: existingResult.scores,
      });
    }

    // Save AI-generated answers (one per dimension)
    const dimensionMap: Record<string, { dim: string; score: number }> = {
      EI: { dim: "EI", score: aiResult.scores.E > aiResult.scores.I ? 1.0 : -1.0 },
      SN: { dim: "SN", score: aiResult.scores.S > aiResult.scores.N ? 1.0 : -1.0 },
      TF: { dim: "TF", score: aiResult.scores.T > aiResult.scores.F ? 1.0 : -1.0 },
      JP: { dim: "JP", score: aiResult.scores.J > aiResult.scores.P ? 1.0 : -1.0 },
    };

    for (const entry of Object.values(dimensionMap)) {
      await prisma.mbtiAnswer.create({
        data: {
          userId: user.id,
          questionId: `ai-${entry.dim}`,
          dimension: entry.dim,
          score: entry.score,
          source: "ai",
        },
      });
    }

    // Get choice-based answers to merge
    const choiceAnswers = await prisma.mbtiAnswer.findMany({
      where: { userId: user.id, source: "choice" },
    });

    const choiceScores = choiceAnswers.length > 0
      ? (await computeScores(user.id)).scores
      : null;

    // Merge AI scores (0.3 weight) with choice scores (0.7 weight)
    const merged = mergeScores(choiceScores, choiceAnswers.length, aiResult.scores);
    const finalType = deriveType(merged);

    // Confidence: weighted average between AI confidence and choice confidence
    const choiceConfidence = choiceAnswers.length > 0
      ? aiResult.confidence * 0.3 + 0.7
      : aiResult.confidence;
    const finalConfidence = Math.min(choiceConfidence, 1);

    // Update user
    await prisma.user.update({
      where: { id: user.id },
      data: {
        mbtiScores: merged as Record<string, number>,
        mbtiType: finalType,
        mbtiConfidence: finalConfidence,
      },
    });

    return NextResponse.json({
      type: finalType,
      confidence: finalConfidence,
      scores: merged,
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Failed to analyze text";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
