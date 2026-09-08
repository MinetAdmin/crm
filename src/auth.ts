/**
 * Invite-only Microsoft Entra ID SSO (doc 03 §2.1, doc 06 §0). Entra refuses
 * unassigned users first; here a provisioned, active app_user row must also
 * exist. Lookup is by azure_oid, linked once by email on first login.
 */
import NextAuth, { type Profile } from "next-auth";
import type { app_user } from "@prisma/client";
import { authConfig } from "./auth.config";
import { withAudit } from "./lib/audit";
import { prisma } from "./lib/db";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      name?: string | null;
      role: string;
      unitId: string | null;
    };
  }
}

function maskEmail(email: string | null): string {
  if (!email || !email.includes("@")) return "<none>";
  const [local, domain] = email.split("@");
  return `${local[0] ?? ""}***@${domain}`;
}

/** Extracts the oid and email claims from an Entra profile. */
function profileIdentity(profile: Profile | undefined): {
  oid: string | null;
  email: string | null;
} {
  const oid = typeof profile?.oid === "string" ? profile.oid : null;
  const raw =
    typeof profile?.email === "string"
      ? profile.email
      : typeof profile?.preferred_username === "string"
        ? profile.preferred_username
        : null;
  return { oid, email: raw?.toLowerCase() ?? null };
}

/**
 * First SSO login: links the Azure OID to the provisioned user with that
 * email. Refused when no active user exists or the record is already linked
 * to a different OID (recycled-email takeover guard).
 */
async function linkFirstLogin(oid: string, email: string): Promise<app_user | null> {
  const user = await prisma.app_user.findUnique({ where: { email } });
  if (!user || !user.active) {
    console.warn(`[auth] unprovisioned sign-in refused, email=${maskEmail(email)}`);
    return null;
  }
  if (user.azure_oid && user.azure_oid !== oid) {
    console.warn(`[auth] refused relink of linked account, email=${maskEmail(email)}`);
    return null;
  }
  await withAudit(prisma, {
    entity: "app_user",
    entityId: user.id,
    changedBy: user.id,
    before: { azure_oid: user.azure_oid },
    mutate: async (tx) => {
      await tx.app_user.update({ where: { id: user.id }, data: { azure_oid: oid } });
      return { azure_oid: oid };
    },
  });
  return prisma.app_user.findUniqueOrThrow({ where: { id: user.id } });
}

/** Resolves a sign-in to an active user: by OID, else by first-login link. */
async function resolveUser(oid: string, email: string | null): Promise<app_user | null> {
  const byOid = await prisma.app_user.findUnique({ where: { azure_oid: oid } });
  if (byOid) return byOid.active ? byOid : null;
  if (!email) return null;
  return linkFirstLogin(oid, email);
}

async function recordLogin(user: app_user): Promise<void> {
  await withAudit(prisma, {
    entity: "app_user",
    entityId: user.id,
    changedBy: user.id,
    before: { last_login_at: user.last_login_at },
    mutate: async (tx) => {
      const stamp = new Date();
      await tx.app_user.update({ where: { id: user.id }, data: { last_login_at: stamp } });
      return { last_login_at: stamp };
    },
  });
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  callbacks: {
    ...authConfig.callbacks,

    async signIn({ profile }) {
      const { oid, email } = profileIdentity(profile);
      if (!oid) {
        console.warn(`[auth] token without oid claim, email=${maskEmail(email)}`);
        return false;
      }
      const user = await resolveUser(oid, email);
      if (!user) return false;
      await recordLogin(user);
      return true;
    },

    async jwt({ token, profile, trigger }) {
      if (trigger !== "signIn") return token;
      const { oid } = profileIdentity(profile);
      if (!oid) return token;
      const user = await prisma.app_user.findUnique({ where: { azure_oid: oid } });
      if (!user) return token;
      token.appUserId = user.id.toString();
      token.role = user.role;
      token.unitId = user.unit_id?.toString() ?? null;
      return token;
    },

    session({ session, token }) {
      session.user.id = (token.appUserId as string) ?? "";
      session.user.role = (token.role as string) ?? "";
      session.user.unitId = (token.unitId as string | null) ?? null;
      return session;
    },
  },
});
