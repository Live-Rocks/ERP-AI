import assert from "node:assert/strict";
import test from "node:test";

import { appendSessionTrend, calculateOverviewMetrics, linePresentation, workOrderPresentation } from "../src/components/factory/overview-model";
import type { FactoryOverview } from "../src/domain/factory";

const overview: FactoryOverview = {
  refreshedAt: "2026-08-31T00:00:00.000Z",
  lines: [
    { id: "line-01", name: "產線 01", state: "running", producedUnits: 1_200, rejectedUnits: 4, lastUpdatedAt: "2026-08-31T00:00:00.000Z" },
    { id: "line-02", name: "產線 02", state: "fault", producedUnits: 800, rejectedUnits: 6, lastUpdatedAt: "2026-08-31T00:00:00.000Z" }
  ],
  alerts: [{ id: "alert-01", lineId: "line-02", code: "SIM-OVERTEMP", title: "模擬設備溫度異常", severity: "critical", openedAt: "2026-08-31T00:00:00.000Z", resolvedAt: null }],
  pendingWorkOrders: [{ id: "WO-0001", alertId: "alert-01", lineId: "line-02", status: "pending_assignment", assignedToUserId: null, resolution: null, createdAt: "2026-08-31T00:00:00.000Z" }],
  workOrderHistory: {},
};

test("Overview KPI 僅由既有 API 的產出、不良品與告警推導", () => {
  const metrics = calculateOverviewMetrics(overview);
  assert.equal(metrics.output, 2_000);
  assert.equal(metrics.rejected, 10);
  assert.equal(metrics.activeAlerts, 1);
  assert.ok(Math.abs(metrics.yieldPercent - (2_000 / 2_010) * 100) < 0.0001);
});

test("production trend 僅保留目前 session 的去重且有上限觀測值", () => {
  const first = appendSessionTrend([], overview, 2);
  assert.equal(first.length, 1);
  assert.equal(appendSessionTrend(first, overview, 2).length, 1);
  const second = { ...overview, refreshedAt: "2026-08-31T00:00:05.000Z", lines: overview.lines.map((line) => ({ ...line, producedUnits: line.producedUnits + 20 })) };
  const third = { ...overview, refreshedAt: "2026-08-31T00:00:10.000Z", lines: overview.lines.map((line) => ({ ...line, producedUnits: line.producedUnits + 40 })) };
  const bounded = appendSessionTrend(appendSessionTrend(first, second, 2), third, 2);
  assert.deepEqual(bounded.map((point) => point.refreshedAt), [second.refreshedAt, third.refreshedAt]);
});

test("產線與工單狀態會有不依賴顏色的中文文字", () => {
  assert.deepEqual(linePresentation("running"), { tone: "running", label: "運行中" });
  assert.deepEqual(linePresentation("fault"), { tone: "critical", label: "異常" });
  assert.deepEqual(workOrderPresentation("pending_assignment"), { tone: "warning", label: "待指派" });
  assert.deepEqual(workOrderPresentation("resolved"), { tone: "complete", label: "已結案" });
});
