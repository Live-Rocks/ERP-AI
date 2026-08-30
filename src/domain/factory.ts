export type LineState = "running" | "idle" | "stopped" | "fault";
export type AlertSeverity = "warning" | "critical";

export interface ProductionLine {
  id: string;
  name: string;
  state: LineState;
  producedUnits: number;
  rejectedUnits: number;
  lastUpdatedAt: string;
}

export interface Alert {
  id: string;
  lineId: string;
  code: string;
  title: string;
  severity: AlertSeverity;
  openedAt: string;
  resolvedAt: string | null;
}

export interface PendingWorkOrder {
  id: string;
  alertId: string;
  lineId: string;
  status: "pending_assignment" | "in_progress" | "resolved";
  assignedToUserId: string | null;
  resolution: string | null;
  createdAt: string;
}

export interface WorkOrderHistoryEntry { at: string; actorUserId: string; status: PendingWorkOrder["status"]; note: string; }

export interface FactoryOverview {
  lines: ProductionLine[];
  alerts: Alert[];
  pendingWorkOrders: PendingWorkOrder[];
  workOrderHistory: Record<string, WorkOrderHistoryEntry[]>;
  refreshedAt: string;
}

export interface LineDataProvider {
  refresh(at?: Date): FactoryOverview;
}
