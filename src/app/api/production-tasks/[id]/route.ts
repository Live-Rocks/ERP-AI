import { NextResponse } from "next/server";
import type { ProductionTaskStatus } from "@/domain/execution";
import { currentUser, requireAdmin, sessionCookieName } from "@/server/auth-service";
import { getAuthRepository } from "@/server/repositories";
import { getProductionTaskStore } from "@/server/execution-store";

const statuses = new Set<ProductionTaskStatus>(["in_progress", "paused", "completed"]);
const tokenFor = (request: Request): string | undefined => request.headers.get("cookie")?.match(new RegExp(`${sessionCookieName}=([^;]+)`))?.[1];
const isCount = (value: unknown): value is number => typeof value === "number" && Number.isInteger(value) && value >= 0;

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params; const body = await request.json().catch(() => null);
  if (body?.action === "assign" && typeof body.technicianUserId === "string") {
    const admin = await requireAdmin(tokenFor(request)); const technician = await getAuthRepository().findUserById(body.technicianUserId);
    if (!admin) return NextResponse.json({ error: "此操作僅限管理員。" }, { status: 403 });
    if (technician?.role !== "technician") return NextResponse.json({ error: "只能指派既有技術員。" }, { status: 400 });
    const task = await getProductionTaskStore().assign(id, technician.id, admin.id);
    return task ? NextResponse.json(task) : NextResponse.json({ error: "作業目前無法指派。" }, { status: 409 });
  }
  if (body?.action === "report") {
    const technician = await currentUser(tokenFor(request));
    if (!technician || technician.role !== "technician") return NextResponse.json({ error: "此操作僅限技術員。" }, { status: 403 });
    if (!statuses.has(body.status) || !isCount(body.goodUnits) || !isCount(body.rejectedUnits) || (body.downtimeReason !== undefined && typeof body.downtimeReason !== "string")) return NextResponse.json({ error: "作業回報資料無效。" }, { status: 400 });
    const task = await getProductionTaskStore().report(id, technician.id, body.status, body.goodUnits, body.rejectedUnits, body.downtimeReason ?? null);
    return task ? NextResponse.json(task) : NextResponse.json({ error: "作業未指派給此技術員，或狀態／停機原因無效。" }, { status: 409 });
  }
  return NextResponse.json({ error: "無效作業操作。" }, { status: 400 });
}
