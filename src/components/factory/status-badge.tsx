import { AlertTriangle, CheckCircle2, Circle, CirclePause, XCircle } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type StatusTone = "running" | "idle" | "paused" | "warning" | "critical" | "complete" | "neutral";

const toneDefinition: Record<StatusTone, { className: string; icon: typeof Circle; label: string }> = {
  running: { className: "border-emerald-400/25 bg-emerald-400/12 text-emerald-200", icon: Circle, label: "運行中" },
  idle: { className: "border-amber-300/25 bg-amber-300/12 text-amber-100", icon: CirclePause, label: "待機" },
  paused: { className: "border-amber-300/25 bg-amber-300/12 text-amber-100", icon: CirclePause, label: "暫停" },
  warning: { className: "border-amber-300/25 bg-amber-300/12 text-amber-100", icon: AlertTriangle, label: "注意" },
  critical: { className: "border-red-400/30 bg-red-400/12 text-red-200", icon: XCircle, label: "異常" },
  complete: { className: "border-cyan-300/25 bg-cyan-300/12 text-cyan-100", icon: CheckCircle2, label: "已完成" },
  neutral: { className: "border-border bg-muted text-muted-foreground", icon: Circle, label: "未知" },
};

export function StatusBadge({ tone = "neutral", children, className }: { tone?: StatusTone; children?: React.ReactNode; className?: string }) {
  const definition = toneDefinition[tone];
  const Icon = definition.icon;
  return <Badge variant="outline" className={cn("gap-1.5 border", definition.className, className)}><Icon aria-hidden="true" className="size-2.5 fill-current" />{children ?? definition.label}</Badge>;
}

export type { StatusTone };
