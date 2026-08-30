import { NextResponse } from "next/server";

export function GET() {
  return NextResponse.json({ status: "ok", service: "ai-erp-smart-factory", localOnly: true });
}
