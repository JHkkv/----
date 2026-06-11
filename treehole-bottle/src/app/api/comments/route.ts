import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

const createCommentSchema = z.object({
  bottleId: z.string().uuid(),
  content: z.string().min(1).max(500),
});

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = createCommentSchema.safeParse(await request.json());

    if (!body.success) {
      return NextResponse.json(
        { error: "Invalid request body", details: body.error.issues },
        { status: 400 },
      );
    }

    const { bottleId, content } = body.data;

    const bottle = await prisma.bottle.findUnique({
      where: { id: bottleId },
      select: { id: true, allowComments: true, isDeleted: true },
    });

    if (!bottle || bottle.isDeleted) {
      return NextResponse.json(
        { error: "Bottle not found" },
        { status: 404 },
      );
    }

    if (!bottle.allowComments) {
      return NextResponse.json(
        { error: "Comments are disabled for this bottle" },
        { status: 403 },
      );
    }

    const comment = await prisma.comment.create({
      data: {
        bottleId,
        commenterId: user.id,
        content,
      },
      select: {
        id: true,
        content: true,
        createdAt: true,
      },
    });

    return NextResponse.json(
      {
        comment: {
          id: comment.id,
          content: comment.content,
          createdAt: comment.createdAt.toISOString(),
        },
      },
      { status: 201 },
    );
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Failed to create comment";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
