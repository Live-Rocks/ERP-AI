import { randomUUID } from "node:crypto";
import { hasPostgresRuntime, getDatabasePool } from "@/server/database";

export interface ActivityEvent { id: string; actorUserId: string | null; action: string; entityType: string; entityId: string | null; createdAt: string; }
const events: ActivityEvent[] = [];
export async function recordActivity(event: Omit<ActivityEvent, "id" | "createdAt">): Promise<void> {
  const id = randomUUID(); const createdAt = new Date().toISOString();
  if (hasPostgresRuntime()) {
    await getDatabasePool().query(
      "INSERT INTO audit_events (id, actor_user_id, action, entity_type, entity_id, created_at) VALUES ($1, $2, $3, $4, $5, $6)",
      [id, event.actorUserId, event.action, event.entityType, event.entityId, createdAt]
    );
    return;
  }
  events.unshift({ ...event, id, createdAt });
}
export async function listActivity(): Promise<ActivityEvent[]> {
  if (hasPostgresRuntime()) {
    const result = await getDatabasePool().query<ActivityEvent>("SELECT id, actor_user_id AS \"actorUserId\", action, entity_type AS \"entityType\", entity_id AS \"entityId\", created_at AS \"createdAt\" FROM audit_events ORDER BY created_at DESC");
    return result.rows.map((event: ActivityEvent) => ({ ...event, createdAt: new Date(event.createdAt).toISOString() }));
  }
  return events.map((event) => ({ ...event }));
}
export function resetActivityForTests(): void { events.length = 0; }
