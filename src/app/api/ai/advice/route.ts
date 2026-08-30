import { NextResponse } from "next/server";
import { currentUser, sessionCookieName } from "@/server/auth-service";
import { getFactoryProvider } from "@/server/factory-store";
import { answerOperationalQuestion, LocalAiUnavailableError } from "@/server/knowledge";
import { recordActivity } from "@/server/activity-log";

export async function POST(request: Request) {
  const token = request.headers.get("cookie")?.match(new RegExp(`${sessionCookieName}=([^;]+)`))?.[1];
  const user = await currentUser(token); const body = await request.json().catch(() => null);
  if (!user) return NextResponse.json({ error: "未登入。" }, { status: 401 });
  if (!body || typeof body.question !== "string" || !body.question.trim()) return NextResponse.json({ error: "請輸入問題。" }, { status: 400 });
  try {
    const advice = await answerOperationalQuestion(body.question, await getFactoryProvider().refresh());
    await recordActivity({ actorUserId: user.id, action: "ai.advice", entityType: "ai_chat", entityId: null });
    return NextResponse.json(advice);
  } catch (error) {
    if (error instanceof LocalAiUnavailableError) return NextResponse.json({ error: error.message }, { status: 503 });
    throw error;
  }
}
