/**
 * Sign-in access decision, separated from Prisma so the rules are testable
 * on their own. Mirrors doc 06 §0: an account is reached by linked identity,
 * then by invited email, and only the very first sign-in may bootstrap.
 */

export type AccountState = {
  active: boolean;
  linkedOid: string | null;
};

export type AccessDecision =
  | { kind: "allow"; reason: "linked" | "link_invite" }
  | { kind: "bootstrap" }
  | { kind: "deny"; reason: "no_oid" | "no_email" | "inactive" | "oid_mismatch" | "not_invited" };

export function decideAccess(input: {
  oid: string | null;
  email: string | null;
  byOid: AccountState | null;
  byEmail: AccountState | null;
  anyAccountLinked: boolean;
}): AccessDecision {
  if (!input.oid) return { kind: "deny", reason: "no_oid" };

  if (input.byOid) {
    return input.byOid.active
      ? { kind: "allow", reason: "linked" }
      : { kind: "deny", reason: "inactive" };
  }

  if (!input.email) return { kind: "deny", reason: "no_email" };

  if (input.byEmail) {
    if (!input.byEmail.active) return { kind: "deny", reason: "inactive" };
    if (input.byEmail.linkedOid && input.byEmail.linkedOid !== input.oid) {
      return { kind: "deny", reason: "oid_mismatch" };
    }
    return { kind: "allow", reason: "link_invite" };
  }

  return input.anyAccountLinked ? { kind: "deny", reason: "not_invited" } : { kind: "bootstrap" };
}
