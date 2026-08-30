import { NextResponse } from "next/server";
import { recordLogout, sessionCookieName } from "@/server/auth-service";

export async function POST(request: Request) {
  await recordLogout(request.headers.get("cookie")?.match(new RegExp(`${sessionCookieName}=([^;]+)`))?.[1]);
  const response = new NextResponse(null, { status: 204 });
  response.cookies.set(sessionCookieName, "", { httpOnly: true, sameSite: "lax", path: "/", maxAge: 0 });
  return response;
}
