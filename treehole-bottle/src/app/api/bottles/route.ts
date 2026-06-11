import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

const createBottleSchema = z.object({
  content: z.string().min(1).max(2000),
  visibility: z.enum(["public", "private"]),
  allowComments: z.boolean(),
});

export async function POST(
  request: Request,
): Promise<NextResponse> {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = createBottleSchema.safeParse(await request.json());

    if (!body.success) {
      return NextResponse.json(
        { error: "Invalid request body", details: body.error.issues },
        { status: 400 },
      );
    }

    const { content, visibility, allowComments } = body.data;
    const bottleStyle = Math.floor(Math.random() * 5) + 1;

    const bottle = await prisma.bottle.create({
      data: {
        userId: user.id,
        content,
        visibility,
        allowComments,
        bottleStyle,
      },
      select: {
        id: true,
        bottleStyle: true,
        thrownAt: true,
      },
    });

    return NextResponse.json(
      { bottle: { id: bottle.id, bottleStyle: bottle.bottleStyle, thrownAt: bottle.thrownAt.toISOString() } },
      { status: 201 },
    );
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Failed to create bottle";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
