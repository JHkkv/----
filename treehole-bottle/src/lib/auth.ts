import { cookies } from "next/headers";
import { prisma } from "./prisma";

export interface CurrentUser {
  id: string;
  nickname: string;
  isGuest: boolean;
  mbtiType: string | null;
  mbtiConfidence: number | null;
}

export async function getCurrentUser(): Promise<CurrentUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get("treehole_token")?.value;

  if (!token) {
    return null;
  }

  const user = await prisma.user.findUnique({
    where: { cookieToken: token },
    select: {
      id: true,
      nickname: true,
      isGuest: true,
      mbtiType: true,
      mbtiConfidence: true,
    },
  });

  if (!user) {
    return null;
  }

  return {
    id: user.id,
    nickname: user.nickname,
    isGuest: user.isGuest,
    mbtiType: user.mbtiType,
    mbtiConfidence: user.mbtiConfidence,
  };
}

export function setAuthCookie(token: string): {
  name: string;
  value: string;
  options: {
    httpOnly: boolean;
    secure: boolean;
    sameSite: "lax";
    maxAge: number;
    path: string;
  };
} {
  return {
    name: "treehole_token",
    value: token,
    options: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 30 * 24 * 60 * 60, // 30 days
      path: "/",
    },
  };
}
