import { NextResponse } from "next/server";
import type { InspectionResult } from "@/domain/quality";
import { currentUser, requireAdmin, sessionCookieName } from "@/server/auth-service";
import { getProductionTaskStore, isFixedLineId } from "@/server/execution-store";
import { getQualityRecordStore } from "@/server/quality-store";

const tokenFor = (request: Request): string | undefined => request.headers.get("cookie")?.match(new RegExp(`${sessionCookieName}=([^;]+)`))?.[1];
const isResult = (value: unknown): value is InspectionResult => value === "pass" || value === "fail";

export async function GET(request: Request) {
  const user = await currentUser(tokenFor(request));
  if (!user) return NextResponse.json({ error: "未登入。" }, { status: 401 });
  const tasks = await getProductionTaskStore().list(user.id, user.role);
  const records = await getQualityRecordStore().list(user.role === "technician" ? tasks.map((task) => task.id) : undefined);
  const withDetails = await Promise.all(records.map(async (record) => ({ ...record, history: await getQualityRecordStore().historyFor(record.id), task: tasks.find((task) => task.id === record.productionTaskId) ?? null })));
  return NextResponse.json(withDetails);
}

export async function POST(request: Request) {
  const admin = await requireAdmin(tokenFor(request)); const body = await request.json().catch(() => null);
  if (!admin) return NextResponse.json({ error: "此操作僅限管理員。" }, { status: 403 });
  if (!body || typeof body.productionTaskId !== "string" || typeof body.lineId !== "string" || !isFixedLineId(body.lineId) || typeof body.batchOrSerial !== "string" || !isResult(body.inspectionResult) || (body.defectDescription !== undefined && typeof body.defectDescription !== "string")) return NextResponse.json({ error: "品質紀錄資料無效。" }, { status: 400 });
  const task = (await getProductionTaskStore().list()).find((item) => item.id === body.productionTaskId);
  if (!task || task.lineId !== body.lineId) return NextResponse.json({ error: "作業與產線不相符。" }, { status: 400 });
  const record = await getQualityRecordStore().create(task.id, task.lineId, body.batchOrSerial, body.inspectionResult, body.defectDescription ?? null, admin.id);
  return record ? NextResponse.json(record, { status: 201 }) : NextResponse.json({ error: "不合格需有缺陷描述；同一作業內的批次／序號不得重複。" }, { status: 400 });
}
