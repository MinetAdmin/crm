import { describe, expect, it } from "vitest";
import { formatAmount } from "./format";

describe("formatAmount", () => {
  it("groups thousands", () => {
    expect(formatAmount(22500000)).toBe("22,500,000");
  });

  it("renders zero without decoration", () => {
    expect(formatAmount(0)).toBe("0");
  });

  it("rounds to whole units", () => {
    expect(formatAmount(22500000.6)).toBe("22,500,001");
  });
});
