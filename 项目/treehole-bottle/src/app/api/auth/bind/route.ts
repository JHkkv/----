import { NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

const bindSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 },
      );
    }

    const body = bindSchema.parse(await request.json());

    const existingUser = await prisma.user.findUnique({
      where: { email: body.email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "Email already in use" },
        { status: 409 },
      );
    }

    const passwordHash = await bcrypt.hash(body.password, 12);

    const updatedUser = await prisma.user.update({
      where: { id: currentUser.id },
      data: {
        email: body.email,
        passwordHash,
        isGuest: false,
      },
      select: {
        id: true,
        nickname: true,
        isGuest: true,
        mbtiType: true,
        mbtiConfidence: true,
      },
    });

    return NextResponse.json({
      user: {
        id: updatedUser.id,
        nickname: updatedUser.nickname,
        isGuest: updatedUser.isGuest,
        mbtiType: updatedUser.mbtiType,
        mbtiConfidence: updatedUser.mbtiConfidence,
      },
    });
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 },
      );
    }

    const message = error instanceof Error ? error.message : "Failed to bind account";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
