import { randomUUID } from "node:crypto";
import { hashPassword, type User, type UserRole } from "@/domain/auth";

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

export const isKnownRole = (role: string): role is UserRole =>
  role === "admin" || role === "technician";

let repository: AuthRepository | undefined;

export function getAuthRepository(): AuthRepository {
  if (!repository) repository = new MemoryAuthRepository();
  return repository;
}

export function setAuthRepositoryForTests(next: AuthRepository | undefined): void {
  repository = next;
}
