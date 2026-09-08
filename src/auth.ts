/**
 * Invite-only Microsoft Entra ID SSO (doc 03 §2.1, doc 06 §0).
 *
 * Layer 1 (outside this file): the Entra app registration has "Assignment
 * required" on, so unassigned users are refused by Microsoft before we run.
 * Layer 2 (here): a provisioned, active `app_user` row must exist. Lookup is
 * by azure_oid; email is used once, to link the OID on first login, and a
 * relink to a different OID is refused (recycled-email takeover guard).
 */
import NextAuth from "next-auth";
import { authConfig } from "./auth.config";
import { prisma } from "./lib/db";

declare module "next-auth" {
  interface Session {
    user: {
      id: string; // app_user.id
      email: string;
      name?: string | null;
      role: string;
      unitId: string | null;
    };
  }
}

function maskEmail(email: string | null | undefined): string {
  if (!email || !email.includes("@")) return "<none>";
  const [local, domain] = email.split("@");
  return `${local[0] ?? ""}***@${domain}`;
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  callbacks: {
    ...authConfig.callbacks,

    async signIn({ profile }) {
      const oid = typeof profile?.oid === "string" ? profile.oid : null;
      const email =
        typeof profile?.email === "string"
          ? profile.email.toLowerCase()
          : typeof profile?.preferred_username === "string"
            ? profile.preferred_username.toLowerCase()
            : null;
      if (!oid) {
        console.warn(`[auth] token without oid claim, email=${maskEmail(email)}`);
        return false;
      }

      // Returning user: OID already linked.
      const byOid = await prisma.app_user.findUnique({ where: { azure_oid: oid } });
      if (byOid) return byOid.active;

      // First SSO login: link by provisioned email.
      if (!email) return false;
      const byEmail = await prisma.app_user.findUnique({ where: { email } });
      if (!byEmail) {
        console.warn(`[auth] unprovisioned sign-in refused, email=${maskEmail(email)}`);
        return false; // not invited — no app_user record
      }
      if (!byEmail.active) return false;
      if (byEmail.azure_oid && byEmail.azure_oid !== oid) {
        console.warn(
          `[auth] refused relink of already-linked account, email=${maskEmail(email)}`,
        );
        return false;
      }
      await prisma.app_user.update({
        where: { id: byEmail.id },
        data: { azure_oid: oid, last_login_at: new Date() },
      });
      return true;
    },

    async jwt({ token, profile, trigger }) {
      // On sign-in, stamp app identity into the JWT so per-request code never
      // needs a user lookup just to know who is asking.
      if (trigger === "signIn" && typeof profile?.oid === "string") {
        const user = await prisma.app_user.findUnique({ where: { azure_oid: profile.oid } });
        if (user) {
          token.appUserId = user.id.toString();
          token.role = user.role;
          token.unitId = user.unit_id?.toString() ?? null;
          await prisma.app_user.update({
            where: { id: user.id },
            data: { last_login_at: new Date() },
          });
        }
      }
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
