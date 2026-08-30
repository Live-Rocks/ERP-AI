import { NextResponse } from "next/server";
import { currentUser, sessionCookieName } from "@/server/auth-service";
import { getFactoryProvider } from "@/server/factory-store";

export async function GET(request: Request) {
  const token = request.headers.get("cookie")?.match(new RegExp(`${sessionCookieName}=([^;]+)`))?.[1];
  const user = await currentUser(token);
  if (!user) return NextResponse.json({ error: "未登入。" }, { status: 401 });
  return NextResponse.json(await getFactoryProvider().refresh());
}
