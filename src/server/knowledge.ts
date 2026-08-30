import type { FactoryOverview } from "@/domain/factory";

const sop = { id: "SOP-COOL-001", title: "溫度異常處置 SOP", content: "確認冷卻風扇、散熱通道與溫度感測器；完成檢查後由技術員記錄處置並結案。" };
export interface Advice { answer: string; sources: Array<{ type: "sop" | "alert" | "work_order"; id: string; title: string }>; }
export function answerOperationalQuestion(question: string, overview: FactoryOverview): Advice {
  const alert = overview.alerts[0]; const workOrder = overview.pendingWorkOrders[0];
  const sources: Advice["sources"] = [{ type: "sop", id: sop.id, title: sop.title }];
  if (alert) sources.push({ type: "alert", id: alert.id, title: `${alert.lineId}：${alert.title}` });
  if (workOrder) sources.push({ type: "work_order", id: workOrder.id, title: `${workOrder.lineId} 工單 ${workOrder.status}` });
  const focus = question.includes("溫") || alert ? "先依 SOP 檢查冷卻風扇、散熱通道與感測器，確認安全後由指派技術員記錄處置。" : "請先確認相關產線狀態與開放工單，再依 SOP 由人員執行處置。";
  return { answer: `建議：${focus} 此回覆僅供人員參考，不會控制設備。`, sources };
}
