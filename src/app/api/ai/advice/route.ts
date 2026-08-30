import { NextResponse } from "next/server";
import { currentUser, sessionCookieName } from "@/server/auth-service";
import { getFactoryProvider } from "@/server/factory-store";
import { answerOperationalQuestion } from "@/server/knowledge";
import { recordActivity } from "@/server/activity-log";

export async function POST(request: Request) {
  const token = request.headers.get("cookie")?.match(new RegExp(`${sessionCookieName}=([^;]+)`))?.[1];
  const user = await currentUser(token); const body = await request.json().catch(() => null);
  if (!user) return NextResponse.json({ error: "未登入。" }, { status: 401 });
  if (!body || typeof body.question !== "string" || !body.question.trim()) return NextResponse.json({ error: "請輸入問題。" }, { status: 400 });
  const advice = answerOperationalQuestion(body.question, getFactoryProvider().refresh());
  recordActivity({ actorUserId: user.id, action: "ai.advice", entityType: "ai_chat", entityId: null });
  return NextResponse.json(advice);
}
