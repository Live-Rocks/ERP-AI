import { hasRole, toPublicUser, verifyPassword, type PublicUser, type User } from "@/domain/auth";
import { getAuthRepository } from "@/server/repositories";
import { createSessionToken, verifySessionToken } from "@/server/session";
import { recordActivity } from "@/server/activity-log";

export const sessionCookieName = "erp_session";

export async function authenticate(username: string, password: string): Promise<{ user: PublicUser; token: string } | null> {
  const repository = getAuthRepository();
  const user = await repository.findUserByUsername(username.trim());
  if (!user || !verifyPassword(password, user.passwordHash)) return null;
  await repository.recordAudit({ actorUserId: user.id, action: "auth.login", entityType: "user", entityId: user.id });
  recordActivity({ actorUserId: user.id, action: "auth.login", entityType: "user", entityId: user.id });
  return { user: toPublicUser(user), token: createSessionToken(user.id, user.role) };
}

export async function currentUser(token: string | undefined): Promise<User | null> {
  const payload = verifySessionToken(token);
  if (!payload) return null;
  return getAuthRepository().findUserById(payload.userId);
}

export async function requireAdmin(token: string | undefined): Promise<User | null> {
  const user = await currentUser(token);
  return hasRole(user, "admin") ? user : null;
}

export async function recordLogout(token: string | undefined): Promise<void> {
  const user = await currentUser(token);
  if (user) {
    await getAuthRepository().recordAudit({ actorUserId: user.id, action: "auth.logout", entityType: "user", entityId: user.id });
    recordActivity({ actorUserId: user.id, action: "auth.logout", entityType: "user", entityId: user.id });
  }
}
