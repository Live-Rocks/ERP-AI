"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { ClipboardCheck, Search } from "lucide-react";

import { DataTable } from "@/components/factory/data-table";
import { PageHeader } from "@/components/factory/page-header";
import { formatLocalTime } from "@/components/factory/overview-model";
import { StatusBadge, type StatusTone } from "@/components/factory/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ProductionTask } from "@/domain/execution";
import type { QualityHistoryEntry, QualityRecord, QualityStatus } from "@/domain/quality";

type User = { id: string; displayName: string; role: "admin" | "technician" };
type QualityRecordWithDetails = QualityRecord & { history: QualityHistoryEntry[]; task: ProductionTask | null };
type TraceResult = { batchOrSerial: string; records: QualityRecordWithDetails[] };

const controlClass = "mt-1 h-9 w-full rounded-md border border-input bg-background px-2 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/30";
const qualityTone: Record<QualityStatus, StatusTone> = { open: "warning", corrected: "running", closed: "complete" };
const qualityLabel: Record<QualityStatus, string> = { open: "待矯正", corrected: "待結案", closed: "已結案" };

function Notice({ message }: { message: string }) {
  return message ? <p role="alert" className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-red-100">{message}</p> : null;
}

function History({ entries }: { entries: QualityHistoryEntry[] }) {
  return <ol className="mt-4 space-y-2 border-l border-border pl-4 text-sm text-muted-foreground">{entries.map((entry) => <li key={entry.id} className="relative"><span aria-hidden="true" className="absolute -left-[1.33rem] top-1.5 size-2 rounded-full bg-primary" /><span className="font-medium text-foreground">{qualityLabel[entry.status]}</span><span className="mx-1.5 text-muted-foreground">·</span>{entry.note}<span className="ml-2 text-xs">{formatLocalTime(entry.at)}</span></li>)}</ol>;
}

export function QualityPageContent() {
  const [user, setUser] = useState<User | null>(null);
  const [tasks, setTasks] = useState<ProductionTask[]>([]);
  const [records, setRecords] = useState<QualityRecordWithDetails[]>([]);
  const [error, setError] = useState("");
  const [taskId, setTaskId] = useState("");
  const [batchOrSerial, setBatchOrSerial] = useState("");
  const [inspectionResult, setInspectionResult] = useState<"pass" | "fail">("pass");
  const [defectDescription, setDefectDescription] = useState("");
  const [correctiveDrafts, setCorrectiveDrafts] = useState<Record<string, string>>({});
  const [traceQuery, setTraceQuery] = useState("");
  const [traceResult, setTraceResult] = useState<TraceResult | null>(null);

  const load = useCallback(async () => {
    const [meResponse, taskResponse, recordResponse] = await Promise.all([
      fetch("/api/auth/me", { cache: "no-store" }),
      fetch("/api/production-tasks", { cache: "no-store" }),
      fetch("/api/quality-records", { cache: "no-store" }),
    ]);
    if (!meResponse.ok || !taskResponse.ok || !recordResponse.ok) throw new Error("無法讀取品質資料。");
    const [nextUser, nextTasks, nextRecords] = await Promise.all([meResponse.json(), taskResponse.json(), recordResponse.json()]);
    setUser(nextUser as User); setTasks(nextTasks as ProductionTask[]); setRecords(nextRecords as QualityRecordWithDetails[]);
  }, []);

  useEffect(() => { void load().catch((caught) => setError(caught instanceof Error ? caught.message : "無法讀取品質資料。")); }, [load]);

  const selectedTask = useMemo(() => tasks.find((task) => task.id === taskId) ?? null, [taskId, tasks]);

  async function createRecord(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError("");
    if (!selectedTask) { setError("請選擇既有人工現場作業。"); return; }
    const response = await fetch("/api/quality-records", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ productionTaskId: selectedTask.id, lineId: selectedTask.lineId, batchOrSerial, inspectionResult, defectDescription: defectDescription || undefined }) });
    if (!response.ok) { const result = await response.json().catch(() => ({ error: "無法建立品質紀錄。" })); setError(result.error ?? "無法建立品質紀錄。"); return; }
    setBatchOrSerial(""); setDefectDescription(""); setInspectionResult("pass"); await load();
  }

  async function updateRecord(recordId: string, body: object) {
    setError("");
    const response = await fetch(`/api/quality-records/${recordId}`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
    if (!response.ok) { const result = await response.json().catch(() => ({ error: "品質紀錄更新失敗。" })); setError(result.error ?? "品質紀錄更新失敗。"); return; }
    await load();
    if (traceResult) await trace(traceResult.batchOrSerial);
  }

  async function trace(query = traceQuery) {
    const normalized = query.trim(); if (!normalized) { setError("請輸入批次／序號。"); return; }
    setError("");
    const response = await fetch(`/api/traceability?batchOrSerial=${encodeURIComponent(normalized)}`, { cache: "no-store" });
    if (!response.ok) { const result = await response.json().catch(() => ({ error: "無法查詢批次追溯。" })); setError(result.error ?? "無法查詢批次追溯。"); return; }
    setTraceResult(await response.json() as TraceResult);
  }

  return <div className="space-y-6">
    <PageHeader eyebrow="Quality assurance" title="Quality" description="檢驗、不合格矯正與批次／序號追溯全部使用既有本機品質 API，角色限制由 server-side RBAC 驗證。" />
    <Notice message={error} />
    {user?.role === "admin" && <Card className="border border-border bg-card shadow-none"><CardHeader><CardTitle className="flex items-center gap-2"><ClipboardCheck aria-hidden="true" className="size-4 text-primary" />建立檢驗紀錄</CardTitle></CardHeader><CardContent><form className="grid gap-3 md:grid-cols-2 xl:grid-cols-4" onSubmit={createRecord}>
      <label className="text-sm">人工現場作業<select aria-label="選擇人工現場作業" className={controlClass} required value={taskId} onChange={(event) => setTaskId(event.target.value)}><option value="">選擇既有作業</option>{tasks.map((task) => <option key={task.id} value={task.id}>{task.title} · {task.lineId}</option>)}</select></label>
      <label className="text-sm">批次／序號<input aria-label="批次或序號" className={controlClass} required value={batchOrSerial} onChange={(event) => setBatchOrSerial(event.target.value)} placeholder="例：LOT-20260831-A" /></label>
      <label className="text-sm">檢驗結果<select aria-label="檢驗結果" className={controlClass} value={inspectionResult} onChange={(event) => setInspectionResult(event.target.value as "pass" | "fail")}><option value="pass">通過</option><option value="fail">不合格</option></select></label>
      <label className="text-sm">缺陷描述{inspectionResult === "fail" ? "（必填）" : "（選填）"}<input aria-label="缺陷描述" className={controlClass} required={inspectionResult === "fail"} value={defectDescription} onChange={(event) => setDefectDescription(event.target.value)} placeholder="不合格時說明缺陷" /></label>
      <div className="md:col-span-2 xl:col-span-4"><Button type="submit">建立檢驗紀錄</Button></div>
    </form></CardContent></Card>}

    <DataTable caption="品質檢驗紀錄" rows={records} emptyMessage="目前沒有可檢視的品質紀錄。" columns={[
      { key: "batch", header: "批次／序號", render: (record) => <span className="font-medium">{record.batchOrSerial}</span> },
      { key: "task", header: "作業／產線", render: (record) => <span>{record.task?.title ?? record.productionTaskId}<span className="block text-xs text-muted-foreground">{record.lineId}</span></span> },
      { key: "inspection", header: "檢驗", render: (record) => record.inspectionResult === "pass" ? "通過" : "不合格" },
      { key: "status", header: "處置狀態", render: (record) => <StatusBadge tone={qualityTone[record.status]}>{qualityLabel[record.status]}</StatusBadge> },
      { key: "updated", header: "最後更新", render: (record) => formatLocalTime(record.updatedAt) },
    ]} />

    <section className="grid gap-4 xl:grid-cols-2">
      <Card className="border border-border bg-card shadow-none"><CardHeader><CardTitle>品質處置與歷程</CardTitle></CardHeader><CardContent className="space-y-4">{records.length === 0 ? <p className="text-sm text-muted-foreground">建立品質紀錄後會在這裡顯示處置及不可變歷程。</p> : records.map((record) => <article key={record.id} className="rounded-lg border border-border p-4"><div className="flex flex-wrap items-start justify-between gap-2"><div><h2 className="font-medium">{record.batchOrSerial}</h2><p className="mt-1 text-sm text-muted-foreground">{record.inspectionResult === "fail" ? `缺陷：${record.defectDescription}` : "檢驗通過"}</p></div><StatusBadge tone={qualityTone[record.status]}>{qualityLabel[record.status]}</StatusBadge></div>{record.correctiveAction && <p className="mt-3 rounded-md bg-muted/60 p-3 text-sm">矯正處置：{record.correctiveAction}</p>}{user?.role === "technician" && record.status === "open" && <form className="mt-4 flex flex-col gap-2 sm:flex-row" onSubmit={(event) => { event.preventDefault(); void updateRecord(record.id, { action: "correct", correctiveAction: correctiveDrafts[record.id] ?? "" }); }}><input aria-label={`${record.batchOrSerial} 矯正處置`} className={controlClass.replace("mt-1 ", "")} required value={correctiveDrafts[record.id] ?? ""} onChange={(event) => setCorrectiveDrafts({ ...correctiveDrafts, [record.id]: event.target.value })} placeholder="記錄矯正處置" /><Button type="submit">提交矯正處置</Button></form>}{user?.role === "admin" && record.status === "corrected" && <Button className="mt-4" onClick={() => void updateRecord(record.id, { action: "close" })}>確認矯正並結案</Button>}<History entries={record.history} /></article>)}</CardContent></Card>
      {user?.role === "admin" && <Card className="border border-border bg-card shadow-none"><CardHeader><CardTitle>Batch / Serial Traceability</CardTitle></CardHeader><CardContent><form className="flex flex-col gap-2 sm:flex-row" onSubmit={(event) => { event.preventDefault(); void trace(); }}><label className="sr-only" htmlFor="traceability-query">批次／序號</label><input id="traceability-query" className={controlClass.replace("mt-1 ", "")} value={traceQuery} onChange={(event) => setTraceQuery(event.target.value)} placeholder="輸入批次／序號" /><Button type="submit"><Search aria-hidden="true" className="size-4" />查詢追溯</Button></form>{traceResult && <div className="mt-5 space-y-4"><p className="text-sm text-muted-foreground">「{traceResult.batchOrSerial}」共 {traceResult.records.length} 筆品質紀錄。</p>{traceResult.records.length === 0 ? <p className="rounded-md border border-dashed border-border p-4 text-sm text-muted-foreground">找不到相符的批次／序號。</p> : traceResult.records.map((record) => <article key={record.id} className="rounded-lg border border-border p-4"><h2 className="font-medium">{record.task?.title ?? "已保留的作業"}</h2><p className="mt-1 text-sm text-muted-foreground">{record.lineId} · {record.inspectionResult === "pass" ? "檢驗通過" : `不合格：${record.defectDescription}`}</p>{record.correctiveAction && <p className="mt-3 text-sm">矯正處置：{record.correctiveAction}</p>}<History entries={record.history} /></article>)}</div>}</CardContent></Card>}
    </section>
  </div>;
}
