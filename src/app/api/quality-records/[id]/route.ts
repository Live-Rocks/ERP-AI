import { NextResponse } from "next/server";
import { currentUser, requireAdmin, sessionCookieName } from "@/server/auth-service";
import { getProductionTaskStore } from "@/server/execution-store";
import { getQualityRecordStore } from "@/server/quality-store";

const tokenFor = (request: Request): string | undefined => request.headers.get("cookie")?.match(new RegExp(`${sessionCookieName}=([^;]+)`))?.[1];

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params; const body = await request.json().catch(() => null);
  if (body?.action === "correct") {
    const technician = await currentUser(tokenFor(request));
    if (!technician || technician.role !== "technician") return NextResponse.json({ error: "此操作僅限技術員。" }, { status: 403 });
    if (typeof body.correctiveAction !== "string") return NextResponse.json({ error: "請填寫矯正處置。" }, { status: 400 });
    const record = await getQualityRecordStore().get(id); const assignedTaskIds = new Set((await getProductionTaskStore().list(technician.id, technician.role)).map((task) => task.id));
    if (!record || !assignedTaskIds.has(record.productionTaskId)) return NextResponse.json({ error: "此品質紀錄未指派給目前技術員。" }, { status: 403 });
    const updated = await getQualityRecordStore().correct(id, body.correctiveAction, technician.id);
    return updated ? NextResponse.json(updated) : NextResponse.json({ error: "品質紀錄目前無法填寫矯正處置。" }, { status: 409 });
  }
  if (body?.action === "close") {
    const admin = await requireAdmin(tokenFor(request));
    if (!admin) return NextResponse.json({ error: "此操作僅限管理員。" }, { status: 403 });
    const updated = await getQualityRecordStore().close(id, admin.id);
    return updated ? NextResponse.json(updated) : NextResponse.json({ error: "品質紀錄須先有技術員矯正處置才可結案。" }, { status: 409 });
  }
  return NextResponse.json({ error: "無效品質紀錄操作。" }, { status: 400 });
}
