import { NextResponse } from "next/server";
import { requireAdmin, sessionCookieName } from "@/server/auth-service";
import { getProductionTaskStore } from "@/server/execution-store";
import { getQualityRecordStore } from "@/server/quality-store";

const tokenFor = (request: Request): string | undefined => request.headers.get("cookie")?.match(new RegExp(`${sessionCookieName}=([^;]+)`))?.[1];

export async function GET(request: Request) {
  const admin = await requireAdmin(tokenFor(request));
  if (!admin) return NextResponse.json({ error: "此操作僅限管理員。" }, { status: 403 });
  const batchOrSerial = new URL(request.url).searchParams.get("batchOrSerial")?.trim();
  if (!batchOrSerial) return NextResponse.json({ error: "請提供批次／序號。" }, { status: 400 });
  const records = await getQualityRecordStore().trace(batchOrSerial); const tasks = await getProductionTaskStore().list();
  const withDetails = await Promise.all(records.map(async (record) => ({ ...record, task: tasks.find((task) => task.id === record.productionTaskId) ?? null, history: await getQualityRecordStore().historyFor(record.id) })));
  return NextResponse.json({ batchOrSerial, records: withDetails });
}
