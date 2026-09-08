/**
 * Edge-safe Auth.js config: no database imports. The middleware uses this to
 * verify the session JWT; the full config in src/auth.ts adds the DB-backed
 * invite-only checks. Design: doc 03 §2.1, doc 06 §0.
 */
import type { NextAuthConfig } from "next-auth";
import MicrosoftEntraID from "next-auth/providers/microsoft-entra-id";

export const authConfig = {
  providers: [
    MicrosoftEntraID({
      // Single-tenant: issuer pinned to the Minet tenant, never `common`.
      issuer: process.env.AUTH_MICROSOFT_ENTRA_ID_ISSUER,
    }),
  ],
  session: { strategy: "jwt" },
  pages: {
    signIn: "/signin",
    error: "/signin", // error code arrives as ?error=; the page renders it readably
  },
  callbacks: {
    authorized({ auth }) {
      // Middleware gate: any signed-in session may reach the app shell.
      // Row/role scoping happens server-side per request (doc 06 §3).
      return !!auth?.user;
    },
  },
} satisfies NextAuthConfig;
