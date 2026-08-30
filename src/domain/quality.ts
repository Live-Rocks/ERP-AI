export type InspectionResult = "pass" | "fail";
export type QualityStatus = "open" | "corrected" | "closed";

export interface QualityRecord {
  id: string;
  productionTaskId: string;
  lineId: string;
  batchOrSerial: string;
  inspectionResult: InspectionResult;
  defectDescription: string | null;
  status: QualityStatus;
  correctiveAction: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface QualityHistoryEntry {
  id: string;
  qualityRecordId: string;
  at: string;
  actorUserId: string;
  status: QualityStatus;
  note: string;
}

export const isValidQualityTransition = (from: QualityStatus, to: QualityStatus): boolean =>
  (from === "open" && to === "corrected") || (from === "corrected" && to === "closed");
