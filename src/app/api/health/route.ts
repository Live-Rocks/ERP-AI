import { NextResponse } from "next/server";
import { checkDatabaseConnection, hasPostgresRuntime } from "@/server/database";

export async function GET() {
  try {
    if (hasPostgresRuntime()) await checkDatabaseConnection();
    return NextResponse.json({ status: "ok", service: "ai-erp-smart-factory", localOnly: true, storage: hasPostgresRuntime() ? "postgresql" : "memory" });
  } catch {
    return NextResponse.json({ status: "unavailable", service: "ai-erp-smart-factory" }, { status: 503 });
  }
}
