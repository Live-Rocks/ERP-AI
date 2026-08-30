import { createHmac, timingSafeEqual } from "node:crypto";
import type { UserRole } from "@/domain/auth";

const sessionSecret = process.env.SESSION_SECRET ?? "development-only-session-secret-change-before-deployment";

export interface SessionPayload {
  userId: string;
  role: UserRole;
  expiresAt: number;
}

function encode(payload: SessionPayload): string {
  return Buffer.from(JSON.stringify(payload)).toString("base64url");
}

function sign(encodedPayload: string): string {
  return createHmac("sha256", sessionSecret).update(encodedPayload).digest("base64url");
}

export function createSessionToken(userId: string, role: UserRole, now = Date.now()): string {
  const payload = encode({ userId, role, expiresAt: now + 1000 * 60 * 60 * 8 });
  return `${payload}.${sign(payload)}`;
}

export function verifySessionToken(token: string | undefined, now = Date.now()): SessionPayload | null {
  if (!token) return null;
  const [encodedPayload, receivedSignature] = token.split(".");
  if (!encodedPayload || !receivedSignature) return null;
  const expectedSignature = sign(encodedPayload);
  const received = Buffer.from(receivedSignature);
  const expected = Buffer.from(expectedSignature);
  if (received.length !== expected.length || !timingSafeEqual(received, expected)) return null;
  try {
    const payload = JSON.parse(Buffer.from(encodedPayload, "base64url").toString("utf8")) as SessionPayload;
    if ((payload.role !== "admin" && payload.role !== "technician") || payload.expiresAt <= now) return null;
    return payload;
  } catch {
    return null;
  }
}
