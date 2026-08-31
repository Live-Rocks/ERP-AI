"use client";

import { type FormEvent, useCallback, useEffect, useState } from "react";
import { Bot, Database, FileText, ShieldCheck, Sparkles } from "lucide-react";

import { DataTable } from "@/components/factory/data-table";
import { PageHeader } from "@/components/factory/page-header";
import { formatLocalTime } from "@/components/factory/overview-model";
import { StatusBadge } from "@/components/factory/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type PublicUser = { id: string; username: string; displayName: string; role: "admin" | "technician" };
type Advice = { answer: string; sources: Array<{ type: "sop" | "alert" | "work_order"; id: string; title: string }> };
type ActivityEvent = { id: string; actorUserId: string | null; action: string; entityType: string; entityId: string | null; createdAt: string };

const controlClass = "mt-1 min-h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/30";
const sourceLabel: Record<Advice["sources"][number]["type"], string> = { sop: "SOP", alert: "告警", work_order: "工單" };

function Notice({ message }: { message: string }) {
  return message ? <p role="alert" className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-red-100">{message}</p> : null;
}

function useCurrentUser() {
  const [user, setUser] = useState<PublicUser | null>(null);
  const [error, setError] = useState("");
  const load = useCallback(async () => {
    const response = await fetch("/api/auth/me", { cache: "no-store" });
    if (!response.ok) throw new Error("無法讀取目前帳號。請重新登入後再試。");
    setUser(await response.json() as PublicUser);
  }, []);
  useEffect(() => { void load().catch((caught) => setError(caught instanceof Error ? caught.message : "無法讀取目前帳號。")); }, [load]);
  return { user, error };
}

export function CopilotPageContent() {
  const { user, error: userError } = useCurrentUser();
  const [question, setQuestion] = useState("產線出現溫度異常時，建議先檢查哪些項目？");
  const [advice, setAdvice] = useState<Advice | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [requestError, setRequestError] = useState("");

  async function ask(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const normalized = question.trim();
    if (!normalized) { setRequestError("請輸入要查詢的現場問題。"); return; }
    setSubmitting(true); setRequestError(""); setAdvice(null);
    try {
      const response = await fetch("/api/ai/advice", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ question: normalized }) });
      const body = await response.json().catch(() => null) as Advice | { error?: string } | null;
      if (!response.ok) throw new Error(body && "error" in body ? body.error ?? "本機 AI 暫時不可用。" : "本機 AI 暫時不可用。");
      setAdvice(body as Advice);
    } catch (caught) {
      setRequestError(caught instanceof Error ? caught.message : "本機 AI 暫時不可用。");
    } finally { setSubmitting(false); }
  }

  return <div className="space-y-6">
    <PageHeader eyebrow="Local assistance" title="AI Copilot" description="依既有本機 SOP、告警與工單提供可追溯的繁中建議；系統不會控制設備。" />
    <Notice message={userError || requestError} />
    <Card className="border border-border bg-card shadow-none"><CardHeader><CardTitle className="flex items-center gap-2"><Bot aria-hidden="true" className="size-4 text-primary" />詢問本機處置建議</CardTitle><CardDescription>{user ? `目前帳號：${user.displayName}` : "正在確認目前帳號…"}</CardDescription></CardHeader><CardContent><form className="space-y-3" onSubmit={ask}><label className="block text-sm font-medium" htmlFor="copilot-question">現場問題<textarea id="copilot-question" className={controlClass} rows={4} value={question} onChange={(event) => setQuestion(event.target.value)} placeholder="描述告警、產線或維修問題" /></label><Button type="submit" disabled={submitting || !!userError}><Sparkles aria-hidden="true" className="size-4" />{submitting ? "正在向本機模型請求建議…" : "取得本機建議"}</Button></form></CardContent></Card>
    <Card className="border border-border bg-card shadow-none"><CardHeader><CardTitle>建議與來源</CardTitle><CardDescription>來源由 application server 固定提供，不由模型自行宣稱。</CardDescription></CardHeader><CardContent>{advice ? <div className="space-y-5"><p className="whitespace-pre-wrap rounded-lg bg-muted/60 p-4 text-sm leading-7">{advice.answer}</p><section aria-labelledby="advice-sources-title"><h2 id="advice-sources-title" className="text-sm font-medium">可追溯來源</h2><ul className="mt-3 space-y-2">{advice.sources.map((source) => <li key={`${source.type}-${source.id}`} className="flex flex-wrap items-center gap-2 rounded-md border border-border p-3 text-sm"><StatusBadge tone="neutral">{sourceLabel[source.type]}</StatusBadge><span className="font-medium">{source.title}</span><span className="text-xs text-muted-foreground">{source.id}</span></li>)}</ul></section></div> : <p className="rounded-md border border-dashed border-border p-5 text-sm text-muted-foreground">送出問題後，這裡只會顯示既有本機 API 回傳的建議與來源；模型不可用時不會提供捏造答案。</p>}</CardContent></Card>
    <p className="text-sm text-muted-foreground">所有建議僅供人員參考；確認與設備相關的行動仍由合格人員執行。本頁沒有設備寫入或控制功能。</p>
  </div>;
}

export function AuditPageContent() {
  const { user, error: userError } = useCurrentUser();
  const [events, setEvents] = useState<ActivityEvent[]>([]);
  const [auditError, setAuditError] = useState("");

  useEffect(() => {
    if (!user) return;
    void (async () => {
      const response = await fetch("/api/admin/audit", { cache: "no-store" });
      if (!response.ok) { const body = await response.json().catch(() => null) as { error?: string } | null; setAuditError(body?.error ?? "無法讀取稽核紀錄。"); return; }
      setEvents(await response.json() as ActivityEvent[]);
    })();
  }, [user]);

  const denied = user?.role === "technician" || auditError.includes("僅限管理員");
  return <div className="space-y-6">
    <PageHeader eyebrow="Governance" title="Audit Log" description="重要操作由既有 server-side audit API 保留；本頁不提供刪除或修改操作。" />
    <Notice message={userError} />
    {denied ? <Card className="border border-amber-300/25 bg-amber-300/10 shadow-none"><CardHeader><CardTitle className="flex items-center gap-2"><ShieldCheck aria-hidden="true" className="size-4 text-amber-100" />僅限管理員查看</CardTitle><CardDescription>目前技術員帳號無法讀取稽核紀錄。此限制由 `/api/admin/audit` 在 server-side 驗證。</CardDescription></CardHeader></Card> : <><Notice message={auditError} /><DataTable caption="系統稽核紀錄" rows={events} emptyMessage="目前沒有可顯示的稽核紀錄。" columns={[{ key: "time", header: "時間", className: "whitespace-nowrap", render: (event) => formatLocalTime(event.createdAt) }, { key: "action", header: "事件", render: (event) => <span className="font-medium">{event.action}</span> }, { key: "entity", header: "對象", render: (event) => `${event.entityType}${event.entityId ? ` · ${event.entityId}` : ""}` }, { key: "actor", header: "執行者", render: (event) => event.actorUserId ?? "system" }]} /></>}
  </div>;
}

export function SettingsPageContent() {
  const { user, error } = useCurrentUser();
  return <div className="space-y-6">
    <PageHeader eyebrow="Account & deployment" title="Settings" description="此版本只呈現既有帳號與部署安全邊界；沒有未實作的可寫設定。" />
    <Notice message={error} />
    <section className="grid gap-4 lg:grid-cols-2"><Card className="border border-border bg-card shadow-none"><CardHeader><CardTitle className="flex items-center gap-2"><ShieldCheck aria-hidden="true" className="size-4 text-primary" />目前帳號</CardTitle></CardHeader><CardContent>{user ? <dl className="space-y-3 text-sm"><div><dt className="text-muted-foreground">顯示名稱</dt><dd className="mt-1 font-medium">{user.displayName}</dd></div><div><dt className="text-muted-foreground">帳號</dt><dd className="mt-1 font-medium">{user.username}</dd></div><div><dt className="text-muted-foreground">角色</dt><dd className="mt-1"><StatusBadge tone={user.role === "admin" ? "running" : "neutral"}>{user.role === "admin" ? "管理員" : "技術員"}</StatusBadge></dd></div></dl> : <p className="text-sm text-muted-foreground">正在讀取目前帳號…</p>}</CardContent></Card><Card className="border border-border bg-card shadow-none"><CardHeader><CardTitle className="flex items-center gap-2"><Database aria-hidden="true" className="size-4 text-primary" />部署邊界</CardTitle></CardHeader><CardContent><ul className="space-y-3 text-sm leading-6 text-muted-foreground"><li>固定五線資料由本機模擬 provider 提供；沒有真實 PLC／OPC UA 連線。</li><li>正式 runtime 使用 PostgreSQL 與本機 Ollama；AI 只提供有來源的建議。</li><li>沒有雲端 AI、雲端資料同步、設備控制或可寫部署設定。</li></ul></CardContent></Card></section>
    <Card className="border border-dashed border-border bg-card shadow-none"><CardHeader><CardTitle className="flex items-center gap-2"><FileText aria-hidden="true" className="size-4 text-primary" />設定變更</CardTitle><CardDescription>帳號、部署祕密、模型與網路設定須依廠內操作程序處理。本頁刻意不提供不存在的寫入介面。</CardDescription></CardHeader></Card>
  </div>;
}
