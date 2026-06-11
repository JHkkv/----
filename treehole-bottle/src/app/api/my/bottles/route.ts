import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function GET(): Promise<NextResponse> {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const bottles = await prisma.bottle.findMany({
      where: {
        userId: user.id,
        isDeleted: false,
      },
      include: {
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
        },
      },
      orderBy: { thrownAt: "desc" },
    });

    const result = bottles.map((b) => ({
      id: b.id,
      content: b.content,
      visibility: b.visibility,
      allowComments: b.allowComments,
      openCount: b.openCount,
      thrownAt: b.thrownAt.toISOString(),
      comments: b.comments.map((c) => ({
        id: c.id,
        content: c.content,
        createdAt: c.createdAt.toISOString(),
        commenter: { nickname: c.commenter.nickname },
      })),
    }));

    return NextResponse.json({ bottles: result });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Failed to fetch bottles";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
