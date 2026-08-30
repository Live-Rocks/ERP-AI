import { NextResponse } from "next/server";
import { authenticate, sessionCookieName } from "@/server/auth-service";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  if (!body || typeof body.username !== "string" || typeof body.password !== "string") {
    return NextResponse.json({ error: "請提供帳號與密碼。" }, { status: 400 });
  }
  const result = await authenticate(body.username, body.password);
  if (!result) return NextResponse.json({ error: "帳號或密碼不正確。" }, { status: 401 });
  const response = NextResponse.json(result.user);
  response.cookies.set(sessionCookieName, result.token, { httpOnly: true, sameSite: "lax", path: "/", secure: process.env.NODE_ENV === "production", maxAge: 60 * 60 * 8 });
  return response;
}
