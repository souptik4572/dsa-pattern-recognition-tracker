import "server-only";
import { db } from "@/lib/db";

export type SessionSummary = {
  id: string;
  userAgent: string | null;
  ipAddress: string | null;
  createdAt: Date;
  updatedAt: Date;
  current: boolean;
};

export async function getAccountOverview(userId: string, currentSessionId: string | null) {
  const [accounts, sessions] = await Promise.all([
    db.account.findMany({ where: { userId }, select: { providerId: true } }),
    db.session.findMany({
      where: { userId, expiresAt: { gt: new Date() } },
      orderBy: { updatedAt: "desc" },
      // Session tokens are credentials; they never leave the server.
      select: { id: true, userAgent: true, ipAddress: true, createdAt: true, updatedAt: true },
    }),
  ]);

  return {
    hasPassword: accounts.some((account) => account.providerId === "credential"),
    socialProviders: accounts.map((account) => account.providerId).filter((provider) => provider !== "credential"),
    sessions: sessions.map((session): SessionSummary => ({ ...session, current: session.id === currentSessionId })),
  };
}

/** Scoped by userId, so a session id belonging to someone else resolves to null. */
export async function getOwnSessionToken(userId: string, sessionId: string): Promise<string | null> {
  const session = await db.session.findFirst({ where: { id: sessionId, userId }, select: { token: true } });
  return session?.token ?? null;
}
