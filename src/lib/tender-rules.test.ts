import { describe, expect, it } from "vitest";
import { daysUntil, decisionNeedsReason, totalsByBasis, winRates } from "./tender-rules";

describe("totalsByBasis", () => {
  it("keeps bases apart instead of summing them", () => {
    const totals = totalsByBasis([
      { basis: "brokerage_income", amount: 120_000_000 },
      { basis: "sum_insured", amount: 1_500_000_000 },
      { basis: "brokerage_income", amount: 30_000_000 },
    ]);
    expect(totals).toEqual([
      { basis: "brokerage_income", total: 150_000_000, count: 2 },
      { basis: "sum_insured", total: 1_500_000_000, count: 1 },
    ]);
  });

  it("never produces one combined figure", () => {
    const totals = totalsByBasis([
      { basis: "premium", amount: 10 },
      { basis: "sum_insured", amount: 90 },
    ]);
    expect(totals).toHaveLength(2);
    expect(totals.some((t) => t.total === 100)).toBe(false);
  });

  it("returns nothing for no values", () => {
    expect(totalsByBasis([])).toEqual([]);
  });
});

describe("decisionNeedsReason", () => {
  it("asks for a reason once won or lost", () => {
    expect(decisionNeedsReason("won", null)).toBe(true);
    expect(decisionNeedsReason("lost", null)).toBe(true);
  });

  it("is satisfied by a reason", () => {
    expect(decisionNeedsReason("lost", "4")).toBe(false);
  });

  it("asks nothing of a live tender", () => {
    expect(decisionNeedsReason("submitted", null)).toBe(false);
    expect(decisionNeedsReason("in_evaluation", null)).toBe(false);
  });
});

describe("winRates", () => {
  it("reports count and value separately, since they disagree", () => {
    const rates = winRates([
      { won: true, amount: 10 },
      { won: false, amount: 90 },
    ]);
    expect(rates.byCount).toBe(50);
    expect(rates.byValue).toBe(10);
  });

  it("returns nothing when nothing is decided", () => {
    expect(winRates([])).toEqual({ byCount: null, byValue: null });
  });
});

describe("daysUntil", () => {
  it("counts forward to a deadline", () => {
    expect(daysUntil(new Date("2026-09-19T00:00:00Z"), new Date("2026-09-09T10:00:00Z"))).toBe(10);
  });

  it("goes negative once passed", () => {
    expect(daysUntil(new Date("2026-09-05T00:00:00Z"), new Date("2026-09-09T00:00:00Z"))).toBe(-4);
  });
});
