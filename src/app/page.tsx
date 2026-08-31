"use client";

import { FormEvent, useState } from "react";
import { Factory, LockKeyhole, UserRound } from "lucide-react";

import { Button } from "@/components/ui/button";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    const response = await fetch("/api/auth/login", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ username, password }) });
    if (!response.ok) { setError("帳號或密碼不正確。請確認目前部署環境的帳號設定，或向系統管理員取得協助。"); return; }
    window.location.assign("/dashboard");
  }

  return <main className="industrial-grid grid min-h-screen place-items-center p-5"><section className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl shadow-black/20 sm:p-8" aria-labelledby="login-title"><div className="flex items-center gap-3"><span className="grid size-10 place-items-center rounded-lg bg-primary text-primary-foreground"><Factory aria-hidden="true" className="size-5" /></span><div><p className="text-xs font-semibold tracking-[0.15em] text-primary uppercase">On-premise factory OS</p><h1 id="login-title" className="mt-1 text-xl font-semibold">ERP AI 智慧工廠</h1></div></div><p className="mt-6 text-sm leading-6 text-muted-foreground">登入廠內系統以查看五條模擬產線、告警、工單與本機 AI 處置建議。</p><form className="mt-6 space-y-4" onSubmit={submit}><label className="block text-sm font-medium">帳號<span className="relative mt-2 block"><UserRound aria-hidden="true" className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" /><input className="h-10 w-full rounded-lg border border-input bg-background px-9 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-ring focus:ring-2 focus:ring-ring/30" value={username} onChange={(event) => setUsername(event.target.value)} autoComplete="username" placeholder="輸入廠內帳號" required /></span></label><label className="block text-sm font-medium">密碼<span className="relative mt-2 block"><LockKeyhole aria-hidden="true" className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" /><input className="h-10 w-full rounded-lg border border-input bg-background px-9 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-ring focus:ring-2 focus:ring-ring/30" value={password} onChange={(event) => setPassword(event.target.value)} type="password" autoComplete="current-password" placeholder="輸入密碼" required /></span></label>{error && <p className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-red-100" role="alert">{error}</p>}<Button type="submit" size="lg" className="mt-2 w-full">登入系統</Button></form><p className="mt-6 border-t border-border pt-4 text-xs leading-5 text-muted-foreground">帳密由目前部署環境管理。Compose 初次建立空白 PostgreSQL volume 時，會使用未追蹤 `.env` 的 `INITIAL_ADMIN_*`／`INITIAL_TECHNICIAN_*`；既有 volume 不會因 `.env` 變更而重設帳密。未設定 `DATABASE_URL` 的本機開發模式才可使用 <span className="font-medium text-foreground">admin / admin-demo</span> 與 <span className="font-medium text-foreground">tech / tech-demo</span>。</p></section></main>;
}
