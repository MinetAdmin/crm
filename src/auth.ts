/** Invite-only Microsoft Entra ID SSO (doc 03 §2.1, doc 06 §0). */
import NextAuth, { type Profile } from "next-auth";
import type { app_user } from "@prisma/client";
import { authConfig } from "./auth.config";
import { withAudit, writeAudit } from "./lib/audit";
import { type AccountState, decideAccess } from "./lib/access";
import { db } from "./lib/db";
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
  if (!email?.includes("@")) return "<none>";
  const [local, domain] = email.split("@");
  return `${local[0] ?? ""}***@${domain}`;
}

/** Extracts the oid and email claims from an Entra profile. */
function profileIdentity(profile: Profile | undefined): {
  oid: string | null;
  email: string | null;
} {
  const oid = typeof profile?.oid === "string" ? profile.oid : null;
  const claims = [profile?.email, profile?.preferred_username];
  const raw = claims.find((c): c is string => typeof c === "string");
  return { oid, email: raw?.toLowerCase() ?? null };
}

/** Links the Azure OID to an invited account on its first SSO login. */
async function linkFirstLogin(user: app_user, oid: string): Promise<app_user> {
  await withAudit(db(), {
    entity: "app_user",
    entityId: user.id,
    changedBy: user.id,
    before: { azure_oid: user.azure_oid },
    mutate: async (tx) => {
      await tx.app_user.update({ where: { id: user.id }, data: { azure_oid: oid } });
      return { azure_oid: oid };
    },
  });
  return db().app_user.findUniqueOrThrow({ where: { id: user.id } });
}

/**
 * Creates the first person to sign in as administrator, while no account has
 * ever been linked to a Microsoft identity. Returns null once one has.
 */
async function bootstrapAdministrator(
  oid: string,
  email: string,
  fullName: string | null,
): Promise<app_user | null> {
  return db().$transaction(async (tx) => {
    const linked = await tx.app_user.count({ where: { azure_oid: { not: null } } });
    if (linked > 0) return null;
    const user = await tx.app_user.create({
      data: { email, full_name: fullName ?? email, role: "admin", azure_oid: oid },
    });
    await writeAudit(tx, {
      entity: "app_user",
      entityId: user.id,
      changes: [
        { field: "email", oldValue: null, newValue: email },
        { field: "role", oldValue: null, newValue: "admin" },
        { field: "azure_oid", oldValue: null, newValue: oid },
      ],
      changedBy: user.id,
    });
    console.warn(`[auth] bootstrapped first administrator, email=${maskEmail(email)}`);
    return user;
  });
}

function toAccountState(user: app_user | null): AccountState | null {
  return user ? { active: user.active, linkedOid: user.azure_oid } : null;
}

/** Applies the access rules in lib/access to the accounts matching a sign-in. */
async function resolveUser(
  oid: string,
  email: string | null,
  fullName: string | null,
): Promise<app_user | null> {
  const byOid = await db().app_user.findUnique({ where: { azure_oid: oid } });
  const byEmail =
    !byOid && email ? await db().app_user.findUnique({ where: { email } }) : null;
  const anyAccountLinked =
    Boolean(byOid) ||
    (await db().app_user.count({ where: { azure_oid: { not: null } } })) > 0;

  const decision = decideAccess({
    oid,
    email,
    byOid: toAccountState(byOid),
    byEmail: toAccountState(byEmail),
    anyAccountLinked,
  });

  if (decision.kind === "deny") {
    console.warn(`[auth] sign-in denied (${decision.reason}), email=${maskEmail(email)}`);
    return null;
  }
  if (decision.kind === "bootstrap") {
    return bootstrapAdministrator(oid, email as string, fullName);
  }
  return decision.reason === "linked" ? byOid : linkFirstLogin(byEmail as app_user, oid);
}

async function recordLogin(user: app_user): Promise<void> {
  await withAudit(db(), {
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
      const fullName = typeof profile?.name === "string" ? profile.name : null;
      const user = await resolveUser(oid, email, fullName);
      if (!user) return false;
      await recordLogin(user);
      return true;
    },

    async jwt({ token, profile, trigger }) {
      if (trigger !== "signIn") return token;
      const { oid } = profileIdentity(profile);
      if (!oid) return token;
      const user = await db().app_user.findUnique({ where: { azure_oid: oid } });
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
