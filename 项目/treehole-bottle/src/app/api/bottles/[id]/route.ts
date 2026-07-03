import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import type { BottleDetail } from "@/types";

export async function GET(
  _request: Request,
  { params }: { params: { id: string } },
): Promise<NextResponse> {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const bottle = await prisma.bottle.findFirst({
      where: {
        id: params.id,
        isDeleted: false,
        OR: [
          { visibility: "public" },
          { userId: user.id },
        ],
      },
      include: {
        user: {
          select: {
            nickname: true,
            mbtiType: true,
          },
        },
        comments: {
          select: {
            id: true,
            content: true,
            createdAt: true,
            commenter: {
              select: {
                nickname: true,
              },
            },
          },
          orderBy: { createdAt: "asc" },
        },
      },
    });

    if (!bottle) {
      return NextResponse.json(
        { error: "Bottle not found" },
        { status: 404 },
      );
    }

    // Increment openCount
    await prisma.bottle.update({
      where: { id: params.id },
      data: { openCount: { increment: 1 } },
    });

    const isOwner = bottle.userId === user.id;

    const detail: BottleDetail = {
      id: bottle.id,
      content: bottle.content,
      visibility: bottle.visibility,
      allowComments: bottle.allowComments,
      openCount: bottle.openCount + 1, // reflect the increment just performed
      thrownAt: bottle.thrownAt.toISOString(),
      isOwner,
      user: {
        nickname: bottle.user.nickname,
        mbtiType: bottle.user.mbtiType,
      },
      comments: isOwner
        ? bottle.comments.map((c) => ({
            id: c.id,
            content: c.content,
            createdAt: c.createdAt.toISOString(),
            commenter: { nickname: c.commenter.nickname },
          }))
        : [],
    };

    return NextResponse.json(detail);
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Failed to fetch bottle";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
