"use client";

import { FormEvent, useEffect, useState } from "react";

interface CurrentUser {
  id: string;
  displayName: string;
  role: "admin" | "technician";
}

interface Overview {
  refreshedAt: string;
  lines: Array<{ id: string; name: string; state: string; producedUnits: number; rejectedUnits: number; lastUpdatedAt: string }>;
  alerts: Array<{ id: string; lineId: string; title: string; severity: string }>;
  pendingWorkOrders: Array<{ id: string; lineId: string; status: "pending_assignment" | "in_progress" | "resolved"; assignedToUserId: string | null; resolution: string | null }>;
}
interface ProductionTask {
  id: string; lineId: string; title: string; status: "planned" | "in_progress" | "paused" | "completed"; assignedToUserId: string | null; goodUnits: number; rejectedUnits: number; downtimeReason: string | null;
  history: Array<{ id: string; at: string; status: string; goodUnits: number; rejectedUnits: number; downtimeReason: string | null }>;
}
interface QualityRecord {
  id: string; productionTaskId: string; lineId: string; batchOrSerial: string; inspectionResult: "pass" | "fail"; defectDescription: string | null; status: "open" | "corrected" | "closed"; correctiveAction: string | null;
  history: Array<{ id: string; at: string; status: string; note: string }>;
  task: ProductionTask | null;
}

export default function DashboardPage() {
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [overview, setOverview] = useState<Overview | null>(null);
  const [question, setQuestion] = useState("產線溫度異常如何處理？");
  const [advice, setAdvice] = useState<{ answer: string; sources: Array<{ id: string; title: string }> } | null>(null);
  const [auditEvents, setAuditEvents] = useState<Array<{ id: string; action: string; createdAt: string }>>([]);
  const [productionTasks, setProductionTasks] = useState<ProductionTask[]>([]);
  const [technicians, setTechnicians] = useState<Array<{ id: string; displayName: string }>>([]);
  const [taskTitle, setTaskTitle] = useState("例行設備巡檢");
  const [taskLineId, setTaskLineId] = useState("line-01");
  const [taskTechnicianId, setTaskTechnicianId] = useState("00000000-0000-4000-8000-000000000002");
  const [reportDrafts, setReportDrafts] = useState<Record<string, { status: "in_progress" | "paused" | "completed"; goodUnits: number; rejectedUnits: number; downtimeReason: string }>>({});
  const [qualityRecords, setQualityRecords] = useState<QualityRecord[]>([]);
  const [qualityTaskId, setQualityTaskId] = useState("");
  const [batchOrSerial, setBatchOrSerial] = useState("LOT-DEMO-001");
  const [inspectionResult, setInspectionResult] = useState<"pass" | "fail">("fail");
  const [defectDescription, setDefectDescription] = useState("首件尺寸超出公差");
  const [correctiveDrafts, setCorrectiveDrafts] = useState<Record<string, string>>({});
  const [traceQuery, setTraceQuery] = useState("LOT-DEMO-001");
  const [traceResult, setTraceResult] = useState<QualityRecord[]>([]);

  useEffect(() => {
    fetch("/api/auth/me").then(async (response) => {
      if (!response.ok) {
        window.location.assign("/");
        return;
      }
      setUser(await response.json());
    });
  }, []);

  useEffect(() => { if (user?.role === "admin") { fetch("/api/admin/audit").then(async (response) => { if (response.ok) setAuditEvents(await response.json()); }); fetch("/api/admin/users").then(async (response) => { if (response.ok) setTechnicians((await response.json()).filter((item: { role: string }) => item.role === "technician")); }); } }, [user]);

  useEffect(() => {
    const loadOverview = () => fetch("/api/factory/overview").then(async (response) => {
      if (response.ok) setOverview(await response.json());
    });
    void loadOverview();
    const interval = window.setInterval(() => void loadOverview(), 5000);
    return () => window.clearInterval(interval);
  }, []);

  const loadTasks = () => fetch("/api/production-tasks").then(async (response) => { if (response.ok) { const tasks = await response.json() as ProductionTask[]; setProductionTasks(tasks); setQualityTaskId((current) => current || tasks[0]?.id || ""); } });
  useEffect(() => { void loadTasks(); }, [user]);
  const loadQualityRecords = () => fetch("/api/quality-records").then(async (response) => { if (response.ok) setQualityRecords(await response.json()); });
  useEffect(() => { if (user) void loadQualityRecords(); }, [user]);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.assign("/");
  }

  async function updateWorkOrder(id: string, body: object) {
    const response = await fetch(`/api/work-orders/${id}`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
    if (response.ok) {
      const refreshed = await fetch("/api/factory/overview");
      if (refreshed.ok) setOverview(await refreshed.json());
    }
  }

  async function askAdvice(event: FormEvent<HTMLFormElement>) { event.preventDefault(); const response = await fetch("/api/ai/advice", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ question }) }); if (response.ok) setAdvice(await response.json()); }
  async function createTask(event: FormEvent<HTMLFormElement>) { event.preventDefault(); const response = await fetch("/api/production-tasks", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ lineId: taskLineId, title: taskTitle, technicianUserId: taskTechnicianId || undefined }) }); if (response.ok) { setTaskTitle(""); await loadTasks(); } }
  async function reportTask(event: FormEvent<HTMLFormElement>, id: string) { event.preventDefault(); const draft = reportDrafts[id] ?? { status: "in_progress", goodUnits: 0, rejectedUnits: 0, downtimeReason: "" }; const response = await fetch(`/api/production-tasks/${id}`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ action: "report", ...draft }) }); if (response.ok) await loadTasks(); }
  async function createQualityRecord(event: FormEvent<HTMLFormElement>) { event.preventDefault(); const task = productionTasks.find((item) => item.id === qualityTaskId); if (!task) return; const response = await fetch("/api/quality-records", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ productionTaskId: task.id, lineId: task.lineId, batchOrSerial, inspectionResult, defectDescription: inspectionResult === "fail" ? defectDescription : undefined }) }); if (response.ok) { setDefectDescription(""); await loadQualityRecords(); } }
  async function correctQualityRecord(event: FormEvent<HTMLFormElement>, id: string) { event.preventDefault(); const correctiveAction = correctiveDrafts[id] ?? ""; const response = await fetch(`/api/quality-records/${id}`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ action: "correct", correctiveAction }) }); if (response.ok) await loadQualityRecords(); }
  async function closeQualityRecord(id: string) { const response = await fetch(`/api/quality-records/${id}`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ action: "close" }) }); if (response.ok) await loadQualityRecords(); }
  async function traceBatch(event: FormEvent<HTMLFormElement>) { event.preventDefault(); const response = await fetch(`/api/traceability?batchOrSerial=${encodeURIComponent(traceQuery)}`); if (response.ok) { const result = await response.json(); setTraceResult(result.records); } }

  if (!user) return <main className="login-shell"><p>正在驗證身分…</p></main>;
  return (
    <main className="dashboard-shell">
      <header><div><p className="eyebrow">LOCAL FACTORY</p><h1>歡迎，{user.displayName}</h1></div><button onClick={logout}>登出</button></header>
      <section className="overview-heading"><div><h2>五線即時監控</h2><p>模擬資料每 5 秒更新。最後更新：{overview ? new Date(overview.refreshedAt).toLocaleTimeString("zh-TW") : "載入中"}</p></div><span className="role-tag">{user.role === "admin" ? "管理員" : "技術員"}</span></section>
      <section className="line-grid" aria-label="五條產線狀態">
        {overview?.lines.map((line) => <article className="line-card" key={line.id}><div className="line-title"><h3>{line.name}</h3><span className={`state ${line.state}`}>{line.state}</span></div><p>累計生產 <strong>{line.producedUnits.toLocaleString()}</strong> 件</p><p>不良品 {line.rejectedUnits} 件</p><small>資料時間 {new Date(line.lastUpdatedAt).toLocaleTimeString("zh-TW")}</small></article>)}
      </section>
      <section className="alert-card"><h2>目前異常與維修工單</h2>{overview?.alerts.length ? overview.alerts.map((alert) => <p key={alert.id}><strong>{alert.lineId}</strong>　{alert.title}（{alert.severity}）</p>) : <p>目前沒有異常告警。</p>}{overview?.pendingWorkOrders.map((workOrder) => <div className="work-order" key={workOrder.id}><p>{workOrder.id} · {workOrder.lineId} · {workOrder.status}</p>{user.role === "admin" && workOrder.status === "pending_assignment" && <button onClick={() => void updateWorkOrder(workOrder.id, { action: "assign", technicianUserId: "00000000-0000-4000-8000-000000000002" })}>指派設備技術員</button>}{user.role === "technician" && workOrder.status === "in_progress" && workOrder.assignedToUserId === user.id && <button onClick={() => void updateWorkOrder(workOrder.id, { action: "resolve", resolution: "已完成標準處置並結案" })}>完成處置並結案</button>}{workOrder.resolution && <small>處置：{workOrder.resolution}</small>}</div>)}</section>
      <section className="alert-card"><h2>人工現場作業</h2>{user.role === "admin" && <form onSubmit={createTask}><label>作業名稱<input required value={taskTitle} onChange={(event) => setTaskTitle(event.target.value)} /></label><label>產線<select value={taskLineId} onChange={(event) => setTaskLineId(event.target.value)}>{overview?.lines.map((line) => <option value={line.id} key={line.id}>{line.name}</option>)}</select></label><label>指派技術員<select value={taskTechnicianId} onChange={(event) => setTaskTechnicianId(event.target.value)}>{technicians.map((technician) => <option value={technician.id} key={technician.id}>{technician.displayName}</option>)}</select></label><button type="submit">建立並指派作業</button></form>}{productionTasks.length === 0 && <p>目前沒有可顯示的人工現場作業。</p>}{productionTasks.map((task) => <div className="work-order" key={task.id}><p><strong>{task.lineId}</strong>　{task.title} · {task.status}</p><small>累計：良品 {task.goodUnits}／不良品 {task.rejectedUnits}{task.downtimeReason ? `；停機：${task.downtimeReason}` : ""}</small>{user.role === "technician" && task.assignedToUserId === user.id && task.status !== "completed" && <form className="task-report" onSubmit={(event) => void reportTask(event, task.id)}><label>狀態<select value={reportDrafts[task.id]?.status ?? (task.status === "paused" ? "in_progress" : task.status === "planned" ? "in_progress" : "completed")} onChange={(event) => setReportDrafts({ ...reportDrafts, [task.id]: { ...(reportDrafts[task.id] ?? { goodUnits: 0, rejectedUnits: 0, downtimeReason: "" }), status: event.target.value as "in_progress" | "paused" | "completed" } })}><option value="in_progress">開始／恢復</option>{task.status === "in_progress" && <><option value="paused">暫停</option><option value="completed">完成</option></>}</select></label><label>本次良品<input type="number" min="0" value={reportDrafts[task.id]?.goodUnits ?? 0} onChange={(event) => setReportDrafts({ ...reportDrafts, [task.id]: { ...(reportDrafts[task.id] ?? { status: "in_progress", rejectedUnits: 0, downtimeReason: "" }), goodUnits: Number(event.target.value) } })} /></label><label>本次不良品<input type="number" min="0" value={reportDrafts[task.id]?.rejectedUnits ?? 0} onChange={(event) => setReportDrafts({ ...reportDrafts, [task.id]: { ...(reportDrafts[task.id] ?? { status: "in_progress", goodUnits: 0, downtimeReason: "" }), rejectedUnits: Number(event.target.value) } })} /></label><label>停機原因（暫停時必填）<input value={reportDrafts[task.id]?.downtimeReason ?? ""} onChange={(event) => setReportDrafts({ ...reportDrafts, [task.id]: { ...(reportDrafts[task.id] ?? { status: "in_progress", goodUnits: 0, rejectedUnits: 0 }), downtimeReason: event.target.value } })} /></label><button type="submit">送出回報</button></form>}<small>歷程 {task.history.map((entry) => `${entry.status} ${entry.goodUnits}/${entry.rejectedUnits}`).join(" → ")}</small></div>)}</section>
      <section className="alert-card"><h2>品質不合格與批次／序號追溯</h2>{user.role === "admin" && <><form onSubmit={createQualityRecord}><label>關聯人工現場作業<select required value={qualityTaskId} onChange={(event) => setQualityTaskId(event.target.value)}>{productionTasks.map((task) => <option value={task.id} key={task.id}>{task.lineId} · {task.title}</option>)}</select></label><label>批次／序號<input required value={batchOrSerial} onChange={(event) => setBatchOrSerial(event.target.value)} /></label><label>檢驗結果<select value={inspectionResult} onChange={(event) => setInspectionResult(event.target.value as "pass" | "fail")}><option value="fail">不合格</option><option value="pass">合格</option></select></label>{inspectionResult === "fail" && <label>缺陷描述<input required value={defectDescription} onChange={(event) => setDefectDescription(event.target.value)} /></label>}<button type="submit">記錄檢驗結果</button></form><form className="task-report" onSubmit={traceBatch}><label>批次／序號追溯<input required value={traceQuery} onChange={(event) => setTraceQuery(event.target.value)} /></label><button type="submit">查詢關聯紀錄</button></form>{traceResult.map((record) => <p key={record.id}><strong>{record.batchOrSerial}</strong> · {record.task?.title ?? record.productionTaskId} · {record.inspectionResult}／{record.status}；歷程 {record.history.map((entry) => entry.status).join(" → ")}</p>)}</>}{qualityRecords.length === 0 && <p>目前沒有可顯示的品質紀錄。</p>}{qualityRecords.map((record) => <div className="work-order" key={record.id}><p><strong>{record.batchOrSerial}</strong>　{record.task?.lineId ?? record.lineId} · {record.task?.title ?? "人工現場作業"} · {record.inspectionResult}／{record.status}</p>{record.defectDescription && <small>缺陷：{record.defectDescription}</small>}{record.correctiveAction && <small>；矯正：{record.correctiveAction}</small>}{user.role === "technician" && record.status === "open" && <form className="task-report" onSubmit={(event) => void correctQualityRecord(event, record.id)}><label>矯正處置<input required value={correctiveDrafts[record.id] ?? ""} onChange={(event) => setCorrectiveDrafts({ ...correctiveDrafts, [record.id]: event.target.value })} /></label><button type="submit">送出矯正處置</button></form>}{user.role === "admin" && record.status === "corrected" && <button onClick={() => void closeQualityRecord(record.id)}>確認矯正並結案</button>}<small>歷程 {record.history.map((entry) => entry.status).join(" → ")}</small></div>)}</section>
      <section className="alert-card"><h2>本機 AI 排障建議</h2><form onSubmit={askAdvice}><label>問題<input value={question} onChange={(event) => setQuestion(event.target.value)} /></label><button type="submit">取得建議</button></form>{advice && <div><p>{advice.answer}</p><small>來源：{advice.sources.map((source) => source.title).join("；")}</small></div>}</section>
      {user.role === "admin" && <section className="alert-card"><h2>稽核紀錄</h2>{auditEvents.slice(0, 8).map((event) => <p key={event.id}><small>{new Date(event.createdAt).toLocaleTimeString("zh-TW")}</small>　{event.action}</p>)}</section>}
    </main>
  );
}
