import { Construction } from "lucide-react";
import { PageHeader } from "@/components/factory/page-header";
import { Card, CardContent } from "@/components/ui/card";

export function PagePlaceholder({ title, description, feature }: { title: string; description: string; feature: string }) {
  return <div className="space-y-6"><PageHeader eyebrow="ERP AI" title={title} description={description} /><Card className="border border-dashed border-border bg-card shadow-none"><CardContent className="flex min-h-64 flex-col items-center justify-center text-center"><span className="grid size-11 place-items-center rounded-xl bg-muted text-primary"><Construction aria-hidden="true" className="size-5" /></span><h2 className="mt-4 text-base font-semibold">{feature} 資料介面尚未提供</h2><p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">此頁面會在後續前端 phase 串接既有的本機 API。系統不以模擬營運數值取代尚未提供的資料。</p></CardContent></Card></div>;
}
