import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

export type UserRole = "admin" | "technician";

export interface User {
  id: string;
  username: string;
  displayName: string;
  role: UserRole;
  passwordHash: string;
}

export interface PublicUser {
  id: string;
  username: string;
  displayName: string;
  role: UserRole;
}

export const toPublicUser = (user: User): PublicUser => ({
  id: user.id,
  username: user.username,
  displayName: user.displayName,
  role: user.role
});

export function hashPassword(password: string, salt = randomBytes(16).toString("hex")): string {
  const digest = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${digest}`;
}

export function verifyPassword(password: string, storedHash: string): boolean {
  const [salt, digest] = storedHash.split(":");
  if (!salt || !digest) return false;
  const computed = Buffer.from(scryptSync(password, salt, 64).toString("hex"), "hex");
  const expected = Buffer.from(digest, "hex");
  return computed.length === expected.length && timingSafeEqual(computed, expected);
}

export function hasRole(user: Pick<User, "role"> | null, role: UserRole): boolean {
  return user?.role === role;
}
