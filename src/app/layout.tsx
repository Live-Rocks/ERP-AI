import type { Metadata } from "next";
import "./styles.css";

export const metadata: Metadata = {
  title: "智造工廠 ERP",
  description: "廠內自架的智慧工廠管理系統"
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="zh-Hant"><body>{children}</body></html>;
}
