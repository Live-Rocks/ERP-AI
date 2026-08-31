import { AlertTriangle, Inbox } from "lucide-react";
import { StatusBadge } from "@/components/factory/status-badge";
import { Card, CardContent } from "@/components/ui/card";

export interface AlertListItem { id: string; lineId: string; title: string; severity: string; }
export function AlertList({ alerts, emptyMessage = "目前沒有異常告警。" }: { alerts: AlertListItem[]; emptyMessage?: string }) {
  if (!alerts.length) return <Card className="border border-dashed border-border bg-card shadow-none"><CardContent className="flex min-h-32 flex-col items-center justify-center text-center"><Inbox aria-hidden="true" className="mb-2 size-5 text-muted-foreground" /><p className="text-sm text-muted-foreground">{emptyMessage}</p></CardContent></Card>;
  return <ul className="divide-y divide-border rounded-xl border border-border bg-card">{alerts.map((alert) => <li key={alert.id} className="flex items-start gap-3 p-4"><span className="mt-0.5 grid size-7 shrink-0 place-items-center rounded-md bg-amber-300/12 text-amber-100"><AlertTriangle aria-hidden="true" className="size-4" /></span><div className="min-w-0 flex-1"><p className="font-medium text-foreground">{alert.title}</p><p className="mt-1 text-xs text-muted-foreground">{alert.lineId} · 告警 ID {alert.id}</p></div><StatusBadge tone={alert.severity === "critical" ? "critical" : "warning"}>{alert.severity === "critical" ? "緊急" : "警示"}</StatusBadge></li>)}</ul>;
}
