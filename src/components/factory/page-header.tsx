import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export function PageHeader({ eyebrow, title, description, actions, className }: { eyebrow?: string; title: string; description: string; actions?: React.ReactNode; className?: string }) {
  return <header className={cn("flex flex-col gap-4 border-b border-border/80 pb-5 sm:flex-row sm:items-end sm:justify-between", className)}><div className="min-w-0">{eyebrow && <p className="mb-2 flex items-center gap-1 text-xs font-semibold tracking-[0.16em] text-primary uppercase"><ChevronRight aria-hidden="true" className="size-3" />{eyebrow}</p>}<h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">{title}</h1><p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">{description}</p></div>{actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}</header>;
}
