import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function StatCard({ label, value, detail, trend, icon: Icon, unavailable = false }: { label: string; value: string; detail: string; trend?: "up" | "down" | "flat"; icon?: React.ComponentType<{ className?: string }>; unavailable?: boolean }) {
  const TrendIcon = trend === "up" ? ArrowUpRight : trend === "down" ? ArrowDownRight : Minus;
  return <Card className="border border-border/80 bg-card shadow-none"><CardContent className="flex min-h-28 flex-col justify-between"><div className="flex items-start justify-between gap-3"><p className="text-sm font-medium text-muted-foreground">{label}</p>{Icon && <span className="grid size-8 place-items-center rounded-md bg-primary/12 text-primary"><Icon aria-hidden="true" className="size-4" /></span>}</div><div className="mt-4 flex items-end justify-between gap-3"><p className={cn("text-2xl font-semibold tracking-tight", unavailable && "text-muted-foreground")}>{value}</p>{!unavailable && trend && <TrendIcon aria-label={trend === "up" ? "上升" : trend === "down" ? "下降" : "持平"} className={cn("mb-1 size-4", trend === "down" ? "text-red-300" : trend === "up" ? "text-emerald-300" : "text-muted-foreground")} />}</div><p className="mt-1 text-xs text-muted-foreground">{detail}</p></CardContent></Card>;
}
