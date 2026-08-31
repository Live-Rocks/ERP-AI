"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { AlertTriangle, ChartNoAxesCombined, Gauge, PackageCheck, TimerOff } from "lucide-react";
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { AlertList } from "@/components/factory/alert-list";
import { DataTable } from "@/components/factory/data-table";
import { PageHeader } from "@/components/factory/page-header";
import { ProductionLineCard } from "@/components/factory/production-line-card";
import { StatCard } from "@/components/factory/stat-card";
import { StatusBadge } from "@/components/factory/status-badge";
import { appendSessionTrend, calculateOverviewMetrics, formatLocalTime, linePresentation, type SessionTrendPoint, workOrderPresentation } from "@/components/factory/overview-model";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { FactoryOverview } from "@/domain/factory";

const pollIntervalMs = 5_000;

function LoadingOverview() {
  return <div className="space-y-6" aria-live="polite"><PageHeader eyebrow="Overview" title="工廠總覽" description="正在讀取本機五線模擬資料…" /><div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">{Array.from({ length: 5 }, (_, index) => <div key={index} className="h-32 animate-pulse rounded-xl border border-border bg-card" />)}</div><div className="h-80 animate-pulse rounded-xl border border-border bg-card" /></div>;
}

function ErrorOverview({ retry }: { retry: () => void }) {
  return <div className="space-y-6"><PageHeader eyebrow="Overview" title="工廠總覽" description="本機 overview API 暫時無法讀取。" /><Card className="border border-destructive/30 bg-destructive/10 shadow-none"><CardContent className="flex min-h-44 flex-col items-start justify-center"><AlertTriangle aria-hidden="true" className="size-5 text-red-200" /><h2 className="mt-3 font-semibold">無法取得產線總覽</h2><p className="mt-1 max-w-xl text-sm leading-6 text-muted-foreground">請確認本機登入狀態與 API 後重試；系統不會用快取或捏造的營運資料替代失敗回應。</p><Button className="mt-4" variant="outline" onClick={retry}>重新讀取</Button></CardContent></Card></div>;
}

export function OverviewDashboard() {
  const [overview, setOverview] = useState<FactoryOverview | null>(null);
  const [sessionTrend, setSessionTrend] = useState<SessionTrendPoint[]>([]);
  const [hasError, setHasError] = useState(false);

  const loadOverview = useCallback(async () => {
    try {
      const response = await fetch("/api/factory/overview", { cache: "no-store" });
      if (!response.ok) throw new Error(`Overview request failed: ${response.status}`);
      const payload = await response.json() as FactoryOverview;
      setOverview(payload);
      setSessionTrend((current) => appendSessionTrend(current, payload));
      setHasError(false);
    } catch {
      setHasError(true);
    }
  }, []);

  useEffect(() => {
    void loadOverview();
    const interval = window.setInterval(() => void loadOverview(), pollIntervalMs);
    return () => window.clearInterval(interval);
  }, [loadOverview]);

  const metrics = useMemo(() => overview ? calculateOverviewMetrics(overview) : null, [overview]);
  if (!overview && !hasError) return <LoadingOverview />;
  if (!overview || !metrics) return <ErrorOverview retry={() => void loadOverview()} />;

  return <div className="space-y-6"><PageHeader eyebrow="Overview" title="工廠總覽" description={`固定五條模擬產線，每 5 秒向本機 API 更新。最後更新：${formatLocalTime(overview.refreshedAt)}`} actions={<StatusBadge tone="running">5 秒同步</StatusBadge>} /><section aria-label="核心營運指標" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5"><StatCard label="OEE" value="—" detail="尚無可驗證的 OEE 資料來源" icon={Gauge} unavailable /><StatCard label="Output" value={`${metrics.output.toLocaleString()} 件`} detail={`五線累計產出；不良 ${metrics.rejected.toLocaleString()} 件`} icon={PackageCheck} trend="up" /><StatCard label="Yield" value={`${metrics.yieldPercent.toFixed(2)}%`} detail="依目前累計產出與不良品計算" icon={ChartNoAxesCombined} trend="flat" /><StatCard label="Downtime" value="—" detail="尚無可驗證的停機時長來源" icon={TimerOff} unavailable /><StatCard label="Active Alerts" value={`${metrics.activeAlerts}`} detail="目前未結案的本機異常告警" icon={AlertTriangle} trend={metrics.activeAlerts ? "down" : "flat"} /></section><section className="grid gap-6 xl:grid-cols-[minmax(0,1.4fr)_minmax(20rem,0.8fr)]"><Card className="border border-border/80 bg-card shadow-none"><CardHeader><CardTitle>Production Trend</CardTitle><CardDescription>只記錄此瀏覽器工作階段的 API 觀測值，不是歷史生產資料。</CardDescription></CardHeader><CardContent><div className="h-72" role="img" aria-label="本次瀏覽器工作階段的五線累計產出趨勢圖"><ResponsiveContainer width="100%" height="100%"><LineChart data={sessionTrend} margin={{ top: 12, right: 12, left: -14, bottom: 0 }}><CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} /><XAxis dataKey="label" tick={{ fill: "var(--muted-foreground)", fontSize: 11 }} tickLine={false} axisLine={false} minTickGap={26} /><YAxis tick={{ fill: "var(--muted-foreground)", fontSize: 11 }} tickLine={false} axisLine={false} width={56} tickFormatter={(value: number) => value.toLocaleString()} /><Tooltip contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: "8px", color: "var(--popover-foreground)" }} labelStyle={{ color: "var(--muted-foreground)" }} /><Line type="monotone" dataKey="output" stroke="var(--chart-1)" strokeWidth={2} dot={false} activeDot={{ r: 4, fill: "var(--chart-1)" }} /></LineChart></ResponsiveContainer></div></CardContent></Card><section aria-labelledby="active-alerts-title"><div className="mb-3 flex items-center justify-between"><div><h2 id="active-alerts-title" className="text-base font-semibold">Active Alerts</h2><p className="mt-1 text-sm text-muted-foreground">未結案異常會由既有 API 同步。</p></div><Link className="text-sm font-medium text-primary hover:underline" href="/dashboard/work-orders">查看工單</Link></div><AlertList alerts={overview.alerts} /></section></section><section aria-labelledby="production-lines-title"><div className="mb-3"><h2 id="production-lines-title" className="text-base font-semibold">Production Lines</h2><p className="mt-1 text-sm text-muted-foreground">五條固定產線的目前狀態與累計模擬數值。</p></div><div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-5">{overview.lines.map((line) => { const presentation = linePresentation(line.state); return <ProductionLineCard key={line.id} name={line.name} status={presentation.label} tone={presentation.tone} producedUnits={line.producedUnits} rejectedUnits={line.rejectedUnits} updatedAt={formatLocalTime(line.lastUpdatedAt)} />; })}</div></section><section aria-labelledby="work-orders-title"><div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between"><div><h2 id="work-orders-title" className="text-base font-semibold">Work Orders</h2><p className="mt-1 text-sm text-muted-foreground">告警建立的工單摘要；指派與處置在專屬頁提供。</p></div><Link className="text-sm font-medium text-primary hover:underline" href="/dashboard/work-orders">前往 Work Orders</Link></div><DataTable caption="異常告警建立的工單摘要" rows={overview.pendingWorkOrders} emptyMessage="目前沒有由異常建立的工單。" columns={[{ key: "id", header: "工單", render: (order) => <span className="font-medium tabular-nums">{order.id}</span> }, { key: "line", header: "產線", render: (order) => order.lineId }, { key: "status", header: "狀態", render: (order) => { const presentation = workOrderPresentation(order.status); return <StatusBadge tone={presentation.tone}>{presentation.label}</StatusBadge>; } }, { key: "created", header: "建立時間", className: "whitespace-nowrap text-muted-foreground", render: (order) => formatLocalTime(order.createdAt) }]} /></section></div>;
}
