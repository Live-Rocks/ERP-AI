"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Bell, Bot, ClipboardList, Factory, LayoutDashboard, Menu, ScrollText, Settings, ShieldCheck, Wrench } from "lucide-react";
import { useEffect, useState } from "react";
import type { LucideIcon } from "lucide-react";

import { StatusBadge } from "@/components/factory/status-badge";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

type CurrentUser = { id: string; displayName: string; role: "admin" | "technician"; };
type NavigationItem = { href: string; label: string; icon: LucideIcon; };

const navigation: NavigationItem[] = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/dashboard/production", label: "Production", icon: Factory },
  { href: "/dashboard/equipment", label: "Equipment", icon: Wrench },
  { href: "/dashboard/work-orders", label: "Work Orders", icon: ClipboardList },
  { href: "/dashboard/quality", label: "Quality", icon: ShieldCheck },
  { href: "/dashboard/copilot", label: "AI Copilot", icon: Bot },
  { href: "/dashboard/audit", label: "Audit Log", icon: ScrollText },
  { href: "/dashboard/settings", label: "Settings", icon: Settings },
];

function Brand() {
  return <Link href="/dashboard" className="flex items-center gap-3 rounded-md px-2 py-2 text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring"><span className="grid size-8 place-items-center rounded-md bg-primary text-primary-foreground"><Factory aria-hidden="true" className="size-4" /></span><span><span className="block text-sm font-semibold tracking-wide">ERP AI</span><span className="block text-[10px] tracking-[0.16em] text-muted-foreground uppercase">Factory OS</span></span></Link>;
}

function Navigation({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  return <nav aria-label="主要功能" className="flex flex-1 flex-col gap-1 px-3 py-4">{navigation.map((item) => { const Icon = item.icon; const selected = item.href === "/dashboard" ? pathname === item.href : pathname.startsWith(item.href); return <Link onClick={onNavigate} key={item.href} href={item.href} aria-current={selected ? "page" : undefined} className={cn("flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring", selected ? "bg-sidebar-accent text-sidebar-accent-foreground" : "text-sidebar-foreground/72 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground")}><Icon aria-hidden="true" className="size-4" />{item.label}</Link>; })}</nav>;
}

function Sidebar({ mobile = false, onNavigate }: { mobile?: boolean; onNavigate?: () => void }) {
  return <div className={cn("flex h-full flex-col bg-sidebar", !mobile && "border-r border-sidebar-border")}><div className="border-b border-sidebar-border p-3"><Brand /></div><Navigation onNavigate={onNavigate} /><div className="m-3 rounded-lg border border-sidebar-border bg-sidebar-accent/35 p-3"><p className="text-xs font-medium text-sidebar-foreground">本機優先運行</p><p className="mt-1 text-xs leading-5 text-sidebar-foreground/65">沒有雲端資料服務或設備控制。</p></div></div>;
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [isMobileNavigationOpen, setIsMobileNavigationOpen] = useState(false);
  const router = useRouter();

  useEffect(() => { let active = true; void fetch("/api/auth/me").then(async (response) => { if (!response.ok) { router.replace("/"); return; } if (active) setUser(await response.json() as CurrentUser); }).catch(() => router.replace("/")); return () => { active = false; }; }, [router]);
  async function logout() { await fetch("/api/auth/logout", { method: "POST" }); router.replace("/"); router.refresh(); }

  if (!user) return <main className="grid min-h-screen place-items-center bg-background p-6"><div role="status" aria-live="polite" className="flex items-center gap-3 text-sm text-muted-foreground"><span aria-hidden="true" className="size-2 animate-pulse rounded-full bg-primary" />正在驗證廠內登入狀態…</div></main>;
  return <Sheet open={isMobileNavigationOpen} onOpenChange={setIsMobileNavigationOpen}>
    <a href="#main-content" onClick={() => document.getElementById("main-content")?.focus()} className="sr-only rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground outline-none focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:not-sr-only focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background">跳至主要內容</a>
    <div className="min-h-screen bg-background lg:grid lg:grid-cols-[15.5rem_minmax(0,1fr)]">
      <aside className="fixed inset-y-0 left-0 z-20 hidden w-[15.5rem] lg:block"><Sidebar /></aside>
      <SheetContent side="left" className="w-[17.5rem] max-w-[86vw] p-0" showCloseButton><SheetHeader className="sr-only"><SheetTitle>主要導覽</SheetTitle><SheetDescription>前往 ERP AI 工廠管理功能。</SheetDescription></SheetHeader><Sidebar mobile onNavigate={() => setIsMobileNavigationOpen(false)} /></SheetContent>
      <div className="min-w-0 lg:col-start-2">
        <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b border-border bg-background/95 px-4 backdrop-blur sm:px-6"><div className="flex items-center gap-3"><SheetTrigger render={<Button variant="ghost" size="icon" aria-label="開啟主要導覽" className="lg:hidden" />}><Menu aria-hidden="true" /></SheetTrigger><div><p className="text-sm font-semibold text-foreground">智慧工廠控制中心</p><div className="mt-0.5 hidden sm:block"><StatusBadge tone="running">本機系統</StatusBadge></div></div></div><div className="flex items-center gap-2"><Button variant="ghost" size="icon" aria-label="告警數於 Overview 顯示"><Bell aria-hidden="true" /></Button><DropdownMenu><DropdownMenuTrigger render={<Button variant="outline" size="sm" className="max-w-48 justify-start" />}><span className="truncate">{user.displayName}</span><span className="ml-auto text-xs text-muted-foreground">{user.role === "admin" ? "管理員" : "技術員"}</span></DropdownMenuTrigger><DropdownMenuContent align="end" className="w-52"><DropdownMenuGroup><DropdownMenuLabel>{user.role === "admin" ? "管理員帳號" : "技術員帳號"}</DropdownMenuLabel></DropdownMenuGroup><DropdownMenuSeparator /><DropdownMenuGroup><DropdownMenuItem onClick={() => void logout()}>登出系統</DropdownMenuItem></DropdownMenuGroup></DropdownMenuContent></DropdownMenu></div></header>
        <main id="main-content" tabIndex={-1} className="industrial-grid min-h-[calc(100vh-4rem)] p-4 sm:p-6 lg:p-8"><div className="mx-auto max-w-[1600px]">{children}</div></main>
      </div>
    </div>
  </Sheet>;
}
