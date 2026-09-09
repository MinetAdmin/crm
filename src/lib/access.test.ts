import { describe, expect, it } from "vitest";
import { decideAccess } from "./access";

const OID = "11111111-1111-1111-1111-111111111111";
const OTHER_OID = "22222222-2222-2222-2222-222222222222";
const EMAIL = "person@minet.co.ug";

const base = {
  oid: OID,
  email: EMAIL,
  byOid: null,
  byEmail: null,
  anyAccountLinked: true,
};

describe("decideAccess", () => {
  it("allows a returning user matched by linked identity", () => {
    expect(
      decideAccess({ ...base, byOid: { active: true, linkedOid: OID } }),
    ).toEqual({ kind: "allow", reason: "linked" });
  });

  it("links an invited account on its first sign-in", () => {
    expect(
      decideAccess({ ...base, byEmail: { active: true, linkedOid: null } }),
    ).toEqual({ kind: "allow", reason: "link_invite" });
  });

  it("refuses an uninvited account once the system has users", () => {
    expect(decideAccess(base)).toEqual({ kind: "deny", reason: "not_invited" });
  });

  it("bootstraps the administrator when no account has ever been linked", () => {
    expect(decideAccess({ ...base, anyAccountLinked: false })).toEqual({ kind: "bootstrap" });
  });

  it("bootstraps only once, so the second uninvited person is refused", () => {
    const first = decideAccess({ ...base, anyAccountLinked: false });
    const second = decideAccess({ ...base, email: "other@minet.co.ug", anyAccountLinked: true });
    expect(first).toEqual({ kind: "bootstrap" });
    expect(second).toEqual({ kind: "deny", reason: "not_invited" });
  });

  it("refuses a deactivated account even when its identity is linked", () => {
    expect(decideAccess({ ...base, byOid: { active: false, linkedOid: OID } })).toEqual({
      kind: "deny",
      reason: "inactive",
    });
  });

  it("refuses a deactivated invited account", () => {
    expect(decideAccess({ ...base, byEmail: { active: false, linkedOid: null } })).toEqual({
      kind: "deny",
      reason: "inactive",
    });
  });

  it("refuses an email already linked to a different Microsoft identity", () => {
    expect(
      decideAccess({ ...base, byEmail: { active: true, linkedOid: OTHER_OID } }),
    ).toEqual({ kind: "deny", reason: "oid_mismatch" });
  });

  it("refuses a token with no oid claim", () => {
    expect(decideAccess({ ...base, oid: null })).toEqual({ kind: "deny", reason: "no_oid" });
  });

  it("refuses an unlinked identity with no usable email claim", () => {
    expect(decideAccess({ ...base, email: null })).toEqual({ kind: "deny", reason: "no_email" });
  });
});
