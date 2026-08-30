import { NextResponse } from "next/server";
import { currentUser, requireAdmin, sessionCookieName } from "@/server/auth-service";
import { getAuthRepository } from "@/server/repositories";
import { getProductionTaskStore, isFixedLineId } from "@/server/execution-store";

const tokenFor = (request: Request): string | undefined => request.headers.get("cookie")?.match(new RegExp(`${sessionCookieName}=([^;]+)`))?.[1];

export async function GET(request: Request) {
  const user = await currentUser(tokenFor(request));
  if (!user) return NextResponse.json({ error: "未登入。" }, { status: 401 });
  const tasks = await getProductionTaskStore().list(user.id, user.role);
  const withHistory = await Promise.all(tasks.map(async (task) => ({ ...task, history: await getProductionTaskStore().historyFor(task.id) })));
  return NextResponse.json(withHistory);
}

export async function POST(request: Request) {
  const admin = await requireAdmin(tokenFor(request)); const body = await request.json().catch(() => null);
  if (!admin) return NextResponse.json({ error: "此操作僅限管理員。" }, { status: 403 });
  if (!body || typeof body.lineId !== "string" || !isFixedLineId(body.lineId) || typeof body.title !== "string") return NextResponse.json({ error: "請提供固定產線與作業名稱。" }, { status: 400 });
  let technicianUserId: string | null = null;
  if (body.technicianUserId !== undefined) {
    if (typeof body.technicianUserId !== "string") return NextResponse.json({ error: "技術員資料無效。" }, { status: 400 });
    const technician = await getAuthRepository().findUserById(body.technicianUserId);
    if (technician?.role !== "technician") return NextResponse.json({ error: "只能指派既有技術員。" }, { status: 400 });
    technicianUserId = technician.id;
  }
  const task = await getProductionTaskStore().create(body.lineId, body.title, admin.id, technicianUserId);
  return task ? NextResponse.json(task, { status: 201 }) : NextResponse.json({ error: "無法建立作業。" }, { status: 400 });
}
