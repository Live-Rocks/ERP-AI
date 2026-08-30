import type { FactoryOverview } from "@/domain/factory";

const sop = { id: "SOP-COOL-001", title: "溫度異常處置 SOP", content: "確認冷卻風扇、散熱通道與溫度感測器；完成檢查後由技術員記錄處置並結案。" };
export interface Advice { answer: string; sources: Array<{ type: "sop" | "alert" | "work_order"; id: string; title: string }>; }
export interface OllamaClient { generate(prompt: string): Promise<string>; }
export class LocalAiUnavailableError extends Error {}

function assertLocalOllamaUrl(value: string): URL {
  let url: URL;
  try { url = new URL(value); } catch { throw new LocalAiUnavailableError("OLLAMA_URL 必須是有效的廠內 URL。"); }
  const host = url.hostname.toLowerCase();
  const isPrivateIpv4 = /^(10\.|127\.|192\.168\.|172\.(1[6-9]|2[0-9]|3[0-1])\.)/.test(host);
  const isLocalName = host === "localhost" || host === "ollama" || host.endsWith(".local") || !host.includes(".");
  if (url.protocol !== "http:" || !(isPrivateIpv4 || isLocalName)) throw new LocalAiUnavailableError("AI 僅允許連線至廠內 Ollama endpoint。");
  return url;
}

export class HttpOllamaClient implements OllamaClient {
  constructor(private readonly baseUrl = process.env.OLLAMA_URL, private readonly model = process.env.OLLAMA_MODEL) {}
  async generate(prompt: string): Promise<string> {
    if (!this.baseUrl || !this.model) throw new LocalAiUnavailableError("本機 Ollama 尚未設定或模型尚未備妥。");
    const url = assertLocalOllamaUrl(this.baseUrl); url.pathname = `${url.pathname.replace(/\/$/, "")}/api/generate`;
    let response: Response;
    try {
      response = await fetch(url, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ model: this.model, prompt, stream: false }), cache: "no-store" });
    } catch { throw new LocalAiUnavailableError("無法連線至廠內 Ollama。請確認本機服務與模型已就緒。"); }
    if (!response.ok) throw new LocalAiUnavailableError("廠內 Ollama 無法產生建議。");
    const body = await response.json() as { response?: unknown };
    if (typeof body.response !== "string" || !body.response.trim()) throw new LocalAiUnavailableError("廠內 Ollama 回傳無效內容。");
    return body.response.trim();
  }
}

let clientForTests: OllamaClient | undefined;
function getOllamaClient(): OllamaClient { return clientForTests ?? new HttpOllamaClient(); }
export function setOllamaClientForTests(client: OllamaClient | undefined): void { clientForTests = client; }

export async function answerOperationalQuestion(question: string, overview: FactoryOverview): Promise<Advice> {
  const alert = overview.alerts[0]; const workOrder = overview.pendingWorkOrders[0];
  const sources: Advice["sources"] = [{ type: "sop", id: sop.id, title: sop.title }];
  if (alert) sources.push({ type: "alert", id: alert.id, title: `${alert.lineId}：${alert.title}` });
  if (workOrder) sources.push({ type: "work_order", id: workOrder.id, title: `${workOrder.lineId} 工單 ${workOrder.status}` });
  const context = [
    `SOP ${sop.id}｜${sop.title}：${sop.content}`,
    alert ? `告警 ${alert.id}｜${alert.lineId}｜${alert.code}｜${alert.title}` : "目前沒有開放告警。",
    workOrder ? `工單 ${workOrder.id}｜${workOrder.status}｜${workOrder.resolution ?? "尚未處置"}` : "目前沒有相關工單。"
  ].join("\n");
  const generated = await getOllamaClient().generate(`你是廠內維修知識助理。僅依下列資料，以繁體中文提供簡短、可由人員執行的排障建議。不得宣稱已控制或將控制設備；資料不足時要明確說明。\n\n資料：\n${context}\n\n問題：${question.trim()}`);
  return { answer: `建議：${generated} 此回覆僅供人員參考，不會控制設備。`, sources };
}
