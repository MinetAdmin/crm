import { describe, expect, it } from "vitest";
import { coverageRatio, evenPhasing, phasingBalances, reconcile } from "./target-rules";

describe("reconcile", () => {
  it("reports the unallocated remainder while a set is built", () => {
    const result = reconcile(3_191_000_000, [
      { label: "Unit 1", amount: 1_500_000_000 },
      { label: "Unit 2", amount: 900_000_000 },
    ]);
    expect(result.allocated).toBe(2_400_000_000);
    expect(result.remainder).toBe(791_000_000);
    expect(result.reconciled).toBe(false);
  });

  it("reconciles when the parts meet the whole", () => {
    const result = reconcile(100, [
      { label: "a", amount: 60 },
      { label: "b", amount: 40 },
    ]);
    expect(result.reconciled).toBe(true);
    expect(result.remainder).toBe(0);
  });

  it("reports an over-allocation as a negative remainder", () => {
    expect(reconcile(100, [{ label: "a", amount: 130 }]).remainder).toBe(-30);
  });

  it("treats an empty set as entirely unallocated", () => {
    expect(reconcile(500, [])).toMatchObject({ allocated: 0, remainder: 500, reconciled: false });
  });
});

describe("phasingBalances", () => {
  it("accepts months that add to the annual figure", () => {
    expect(phasingBalances(120, Array.from({ length: 12 }, () => 10))).toBe(true);
  });

  it("rejects months that do not", () => {
    expect(phasingBalances(120, Array.from({ length: 12 }, () => 9))).toBe(false);
  });
});

describe("evenPhasing", () => {
  it("adds back to the annual figure despite rounding", () => {
    const months = evenPhasing(100);
    expect(phasingBalances(100, months)).toBe(true);
    expect(months).toHaveLength(12);
  });

  it("handles a figure that does not divide evenly", () => {
    expect(phasingBalances(3_191_000_000, evenPhasing(3_191_000_000))).toBe(true);
  });
});

describe("coverageRatio", () => {
  it("is open pipeline over what is left to find", () => {
    expect(coverageRatio(900, 1000, 400)).toBe(1.5);
  });

  it("is undefined once the target is met", () => {
    expect(coverageRatio(900, 1000, 1000)).toBeNull();
  });
});
