import { NextResponse } from "next/server";
import { currentUser, requireAdmin, sessionCookieName } from "@/server/auth-service";
import { getAuthRepository } from "@/server/repositories";
import { getFactoryStore } from "@/server/factory-store";

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const token = request.headers.get("cookie")?.match(new RegExp(`${sessionCookieName}=([^;]+)`))?.[1];
  const body = await request.json().catch(() => null);
  const { id } = await context.params;
  if (body?.action === "assign" && typeof body.technicianUserId === "string") {
    const admin = await requireAdmin(token);
    const technician = await getAuthRepository().findUserById(body.technicianUserId);
    if (!admin || technician?.role !== "technician") return NextResponse.json({ error: "此操作僅限管理員。" }, { status: 403 });
    const workOrder = getFactoryStore().assignWorkOrder(id, technician.id, admin.id);
    return workOrder ? NextResponse.json(workOrder) : NextResponse.json({ error: "工單目前無法指派。" }, { status: 409 });
  }
  if (body?.action === "resolve" && typeof body.resolution === "string") {
    const technician = await currentUser(token);
    if (!technician || technician.role !== "technician") return NextResponse.json({ error: "此操作僅限技術員。" }, { status: 403 });
    const workOrder = getFactoryStore().resolveWorkOrder(id, technician.id, body.resolution);
    return workOrder ? NextResponse.json(workOrder) : NextResponse.json({ error: "工單未指派給此技術員或處置內容無效。" }, { status: 409 });
  }
  return NextResponse.json({ error: "無效工單操作。" }, { status: 400 });
}
