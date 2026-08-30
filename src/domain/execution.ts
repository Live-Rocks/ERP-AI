export type ProductionTaskStatus = "planned" | "in_progress" | "paused" | "completed";

export interface ProductionTask {
  id: string;
  lineId: string;
  title: string;
  status: ProductionTaskStatus;
  assignedToUserId: string | null;
  goodUnits: number;
  rejectedUnits: number;
  downtimeReason: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ProductionTaskHistoryEntry {
  id: string;
  taskId: string;
  at: string;
  actorUserId: string;
  status: ProductionTaskStatus;
  goodUnits: number;
  rejectedUnits: number;
  downtimeReason: string | null;
  note: string;
}

export const isValidTaskTransition = (from: ProductionTaskStatus, to: ProductionTaskStatus): boolean =>
  (from === "planned" && to === "in_progress") ||
  (from === "in_progress" && (to === "paused" || to === "completed")) ||
  (from === "paused" && to === "in_progress");
