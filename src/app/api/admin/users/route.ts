import { NextResponse } from "next/server";
import { sessionCookieName, requireAdmin } from "@/server/auth-service";
import { getAuthRepository } from "@/server/repositories";
import { toPublicUser } from "@/domain/auth";

export async function GET(request: Request) {
  const token = request.headers.get("cookie")?.match(new RegExp(`${sessionCookieName}=([^;]+)`))?.[1];
  const user = await requireAdmin(token);
  if (!user) return NextResponse.json({ error: "此操作僅限管理員。" }, { status: 403 });
  const users = await getAuthRepository().listUsers();
  return NextResponse.json(users.map(toPublicUser));
}
