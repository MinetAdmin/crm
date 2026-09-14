import { describe, expect, it } from "vitest";
import {
  canConvert,
  conversionConditions,
  hasContactMethod,
  leadAgeDays,
} from "./lead-rules";

const ready = {
  accountResolved: true,
  decisionMakerNamed: true,
  productCount: 1,
  estimatedValue: 45_000_000,
  ownerAccepted: true,
};

describe("conversionConditions", () => {
  it("passes only when all four hold", () => {
    expect(canConvert(ready)).toBe(true);
  });

  it("names the four conditions in order", () => {
    expect(conversionConditions(ready).map((c) => c.key)).toEqual([
      "account",
      "contact",
      "value",
      "owner",
    ]);
  });

  it("blocks conversion without a resolved account", () => {
    expect(canConvert({ ...ready, accountResolved: false })).toBe(false);
  });

  it("blocks conversion without a decision maker", () => {
    expect(canConvert({ ...ready, decisionMakerNamed: false })).toBe(false);
  });

  it("blocks conversion with a product but no value", () => {
    expect(canConvert({ ...ready, estimatedValue: null })).toBe(false);
  });

  it("blocks conversion with a value but no product", () => {
    expect(canConvert({ ...ready, productCount: 0 })).toBe(false);
  });

  it("treats a zero value as unknown", () => {
    expect(canConvert({ ...ready, estimatedValue: 0 })).toBe(false);
  });

  it("explains what is missing", () => {
    const unmet = conversionConditions({ ...ready, decisionMakerNamed: false }).find(
      (c) => !c.met,
    );
    expect(unmet?.unmetHint).toMatch(/decision maker/i);
  });
});

describe("hasContactMethod", () => {
  it("accepts either an email or a phone", () => {
    expect(hasContactMethod({ contactEmail: "a@b.com", contactPhone: null })).toBe(true);
    expect(hasContactMethod({ contactEmail: null, contactPhone: "0772000000" })).toBe(true);
  });

  it("rejects neither, and rejects whitespace", () => {
    expect(hasContactMethod({ contactEmail: null, contactPhone: null })).toBe(false);
    expect(hasContactMethod({ contactEmail: "  ", contactPhone: " " })).toBe(false);
  });
});

describe("leadAgeDays", () => {
  it("counts whole days", () => {
    const created = new Date("2026-09-01T08:00:00Z");
    expect(leadAgeDays(created, new Date("2026-09-09T09:00:00Z"))).toBe(8);
  });

  it("never returns a negative age", () => {
    const created = new Date("2026-09-09T08:00:00Z");
    expect(leadAgeDays(created, new Date("2026-09-08T08:00:00Z"))).toBe(0);
  });
});
