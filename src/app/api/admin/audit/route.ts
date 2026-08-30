import { NextResponse } from "next/server";
import { requireAdmin, sessionCookieName } from "@/server/auth-service";
import { listActivity } from "@/server/activity-log";

export async function GET(request: Request) {
  const token = request.headers.get("cookie")?.match(new RegExp(`${sessionCookieName}=([^;]+)`))?.[1];
  if (!await requireAdmin(token)) return NextResponse.json({ error: "此操作僅限管理員。" }, { status: 403 });
  return NextResponse.json(listActivity());
}
