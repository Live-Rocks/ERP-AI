import type { Alert, FactoryOverview, LineState, PendingWorkOrder } from "@/domain/factory";
import type { StatusTone } from "@/components/factory/status-badge";

export type OverviewMetrics = {
  output: number;
  rejected: number;
  yieldPercent: number;
  activeAlerts: number;
};

export type SessionTrendPoint = {
  refreshedAt: string;
  label: string;
  output: number;
  yieldPercent: number;
};

export function calculateOverviewMetrics(overview: Pick<FactoryOverview, "lines" | "alerts">): OverviewMetrics {
  const output = overview.lines.reduce((sum, line) => sum + line.producedUnits, 0);
  const rejected = overview.lines.reduce((sum, line) => sum + line.rejectedUnits, 0);
  const yieldPercent = output + rejected === 0 ? 0 : (output / (output + rejected)) * 100;
  return { output, rejected, yieldPercent, activeAlerts: overview.alerts.length };
}

export function appendSessionTrend(points: SessionTrendPoint[], overview: Pick<FactoryOverview, "lines" | "alerts" | "refreshedAt">, limit = 24): SessionTrendPoint[] {
  const metrics = calculateOverviewMetrics(overview);
  const point: SessionTrendPoint = { refreshedAt: overview.refreshedAt, label: new Intl.DateTimeFormat("zh-TW", { hour: "2-digit", minute: "2-digit", second: "2-digit" }).format(new Date(overview.refreshedAt)), output: metrics.output, yieldPercent: metrics.yieldPercent };
  const withoutDuplicate = points.filter((existing) => existing.refreshedAt !== point.refreshedAt);
  return [...withoutDuplicate, point].slice(-limit);
}

export function linePresentation(state: LineState): { tone: StatusTone; label: string } {
  switch (state) {
    case "running": return { tone: "running", label: "運行中" };
    case "idle": return { tone: "idle", label: "待機" };
    case "stopped": return { tone: "critical", label: "停機" };
    case "fault": return { tone: "critical", label: "異常" };
  }
}

export function workOrderPresentation(status: PendingWorkOrder["status"]): { tone: StatusTone; label: string } {
  switch (status) {
    case "pending_assignment": return { tone: "warning", label: "待指派" };
    case "in_progress": return { tone: "running", label: "處置中" };
    case "resolved": return { tone: "complete", label: "已結案" };
  }
}

export function formatLocalTime(value: string): string {
  return new Intl.DateTimeFormat("zh-TW", { hour: "2-digit", minute: "2-digit", second: "2-digit" }).format(new Date(value));
}

export type { Alert };
