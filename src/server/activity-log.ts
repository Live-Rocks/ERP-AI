import { randomUUID } from "node:crypto";

export interface ActivityEvent { id: string; actorUserId: string | null; action: string; entityType: string; entityId: string | null; createdAt: string; }
const events: ActivityEvent[] = [];
export function recordActivity(event: Omit<ActivityEvent, "id" | "createdAt">): void { events.unshift({ ...event, id: randomUUID(), createdAt: new Date().toISOString() }); }
export function listActivity(): ActivityEvent[] { return events.map((event) => ({ ...event })); }
export function resetActivityForTests(): void { events.length = 0; }
