import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { computeMbtiSimilarity } from "@/lib/mbti/match";
import type { MbtiScores, BottleFeedItem } from "@/types";

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 50;

export async function GET(request: Request): Promise<NextResponse> {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const rawLimit = Number(searchParams.get("limit"));
    const limit =
      Number.isFinite(rawLimit) && rawLimit > 0
        ? Math.min(Math.floor(rawLimit), MAX_LIMIT)
        : DEFAULT_LIMIT;

    const bottles = await prisma.bottle.findMany({
      where: {
        visibility: "public",
        isDeleted: false,
        userId: { not: user.id },
      },
      select: {
        id: true,
        bottleStyle: true,
        thrownAt: true,
        user: {
          select: {
            nickname: true,
            mbtiType: true,
            mbtiScores: true,
          },
        },
      },
    });

    // Annotate bottles with default neutral similarity
    const annotated = bottles.map((b) => ({ ...b, similarity: 0.5 }));

    // Compute MBTI similarity if user has scores
    const userHasScores =
      user.mbtiConfidence != null && user.mbtiConfidence > 0;

    if (userHasScores) {
      const currentUser = await prisma.user.findUnique({
        where: { id: user.id },
        select: { mbtiScores: true },
      });

      if (currentUser?.mbtiScores) {
        const userScores = currentUser.mbtiScores as MbtiScores;

        for (const item of annotated) {
          if (item.user.mbtiScores) {
            item.similarity = computeMbtiSimilarity(
              userScores,
              item.user.mbtiScores as MbtiScores,
            );
          }
        }
      }
    }

    // Sort: if confidence >= 0.6, sort by similarity desc; otherwise shuffle with slight similarity bias
    const confidence = user.mbtiConfidence ?? 0;
    let sorted: typeof annotated;

    if (confidence >= 0.6) {
      sorted = [...annotated].sort((a, b) => b.similarity - a.similarity);
    } else {
      // Shuffle with slight similarity bias:
      // Give items a biased weight = similarity^2, then shuffle proportionally.
      // For simplicity: shuffle the array then sort with a random+similarity composite key.
      sorted = [...annotated].sort(() => Math.random() - 0.5);
      // Gentle re-sort: items with higher similarity are more likely to appear earlier
      sorted.sort((a, b) => {
        const biasA = a.similarity * Math.random();
        const biasB = b.similarity * Math.random();
        return biasB - biasA;
      });
    }

    const feed: BottleFeedItem[] = sorted.slice(0, limit).map((b) => ({
      id: b.id,
      bottleStyle: b.bottleStyle,
      thrownAt: b.thrownAt.toISOString(),
      user: {
        nickname: b.user.nickname,
        mbtiType: b.user.mbtiType,
      },
    }));

    return NextResponse.json({ feed });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Failed to fetch feed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
