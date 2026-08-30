import { randomUUID } from "node:crypto";
import { hashPassword, type User, type UserRole } from "@/domain/auth";
import { getDatabasePool, hasPostgresRuntime } from "@/server/database";

export interface AuditEvent {
  id: string;
  actorUserId: string | null;
  action: string;
  entityType: string;
  entityId: string | null;
  createdAt: Date;
}

export interface AuthRepository {
  findUserByUsername(username: string): Promise<User | null>;
  findUserById(id: string): Promise<User | null>;
  listUsers(): Promise<User[]>;
  recordAudit(event: Omit<AuditEvent, "id" | "createdAt">): Promise<void>;
  listAudit(): Promise<AuditEvent[]>;
}

const seedUsers: User[] = [
  {
    id: "00000000-0000-4000-8000-000000000001",
    username: "admin",
    displayName: "廠務管理員",
    role: "admin",
    passwordHash: hashPassword("admin-demo")
  },
  {
    id: "00000000-0000-4000-8000-000000000002",
    username: "tech",
    displayName: "設備技術員",
    role: "technician",
    passwordHash: hashPassword("tech-demo")
  }
];

export class MemoryAuthRepository implements AuthRepository {
  private readonly users: User[];
  private readonly audit: AuditEvent[] = [];

  constructor(users = seedUsers) {
    this.users = users.map((user) => ({ ...user }));
  }

  async findUserByUsername(username: string): Promise<User | null> {
    return this.users.find((user) => user.username === username) ?? null;
  }

  async findUserById(id: string): Promise<User | null> {
    return this.users.find((user) => user.id === id) ?? null;
  }

  async listUsers(): Promise<User[]> {
    return this.users.map((user) => ({ ...user }));
  }

  async recordAudit(event: Omit<AuditEvent, "id" | "createdAt">): Promise<void> {
    this.audit.unshift({ ...event, id: randomUUID(), createdAt: new Date() });
  }

  async listAudit(): Promise<AuditEvent[]> {
    return this.audit.map((event) => ({ ...event }));
  }
}

type UserRow = { id: string; username: string; display_name: string; role: UserRole; password_hash: string };

function userFromRow(row: UserRow): User {
  return { id: row.id, username: row.username, displayName: row.display_name, role: row.role, passwordHash: row.password_hash };
}

export class PostgresAuthRepository implements AuthRepository {
  private bootstrapPromise: Promise<void> | undefined;

  private async ensureBootstrapUsers(): Promise<void> {
    if (!this.bootstrapPromise) this.bootstrapPromise = this.bootstrapUsers();
    await this.bootstrapPromise;
  }

  private async bootstrapUsers(): Promise<void> {
    const pool = getDatabasePool();
    const existing = await pool.query<{ count: string }>("SELECT COUNT(*)::text AS count FROM users");
    if (Number(existing.rows[0]?.count ?? "0") > 0) return;
    const adminPassword = process.env.INITIAL_ADMIN_PASSWORD;
    const technicianPassword = process.env.INITIAL_TECHNICIAN_PASSWORD;
    if (!adminPassword || !technicianPassword) throw new Error("INITIAL_ADMIN_PASSWORD and INITIAL_TECHNICIAN_PASSWORD are required when PostgreSQL has no users.");
    await pool.query(
      "INSERT INTO users (id, username, display_name, role, password_hash) VALUES ($1, $2, $3, 'admin', $4), ($5, $6, $7, 'technician', $8) ON CONFLICT (username) DO NOTHING",
      [
        "00000000-0000-4000-8000-000000000001", process.env.INITIAL_ADMIN_USERNAME || "admin", "廠務管理員", hashPassword(adminPassword),
        "00000000-0000-4000-8000-000000000002", process.env.INITIAL_TECHNICIAN_USERNAME || "tech", "設備技術員", hashPassword(technicianPassword)
      ]
    );
  }

  async findUserByUsername(username: string): Promise<User | null> {
    await this.ensureBootstrapUsers();
    const result = await getDatabasePool().query<UserRow>("SELECT id, username, display_name, role, password_hash FROM users WHERE username = $1", [username]);
    return result.rows[0] ? userFromRow(result.rows[0]) : null;
  }

  async findUserById(id: string): Promise<User | null> {
    await this.ensureBootstrapUsers();
    const result = await getDatabasePool().query<UserRow>("SELECT id, username, display_name, role, password_hash FROM users WHERE id = $1", [id]);
    return result.rows[0] ? userFromRow(result.rows[0]) : null;
  }

  async listUsers(): Promise<User[]> {
    await this.ensureBootstrapUsers();
    const result = await getDatabasePool().query<UserRow>("SELECT id, username, display_name, role, password_hash FROM users ORDER BY username");
    return result.rows.map(userFromRow);
  }

  async recordAudit(event: Omit<AuditEvent, "id" | "createdAt">): Promise<void> {
    await getDatabasePool().query(
      "INSERT INTO audit_events (id, actor_user_id, action, entity_type, entity_id) VALUES ($1, $2, $3, $4, $5)",
      [randomUUID(), event.actorUserId, event.action, event.entityType, event.entityId]
    );
  }

  async listAudit(): Promise<AuditEvent[]> {
    const result = await getDatabasePool().query<AuditEvent>("SELECT id, actor_user_id AS \"actorUserId\", action, entity_type AS \"entityType\", entity_id AS \"entityId\", created_at AS \"createdAt\" FROM audit_events ORDER BY created_at DESC");
    return result.rows.map((event: AuditEvent) => ({ ...event, createdAt: new Date(event.createdAt) }));
  }
}

export const isKnownRole = (role: string): role is UserRole =>
  role === "admin" || role === "technician";

let repository: AuthRepository | undefined;

export function getAuthRepository(): AuthRepository {
  if (!repository) repository = hasPostgresRuntime() ? new PostgresAuthRepository() : new MemoryAuthRepository();
  return repository;
}

export function setAuthRepositoryForTests(next: AuthRepository | undefined): void {
  repository = next;
}
