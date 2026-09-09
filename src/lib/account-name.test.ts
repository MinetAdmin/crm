import { describe, expect, it } from "vitest";
import { comparisonKey, findLikelyDuplicates } from "./account-name";

describe("comparisonKey", () => {
  it("folds case and repeated spacing", () => {
    expect(comparisonKey("MEMNON CAPITAL")).toBe(comparisonKey("memnon  capital"));
  });

  it("folds punctuation and trailing company suffixes", () => {
    const key = comparisonKey("Memnon Capital");
    expect(comparisonKey("Memnon Capital Ltd.")).toBe(key);
    expect(comparisonKey("MEMNON CAPITAL LIMITED")).toBe(key);
    expect(comparisonKey("Memnon Capital (U) Ltd")).toBe(key);
  });

  it("folds the two spellings of and", () => {
    expect(comparisonKey("Roko & Sons")).toBe(comparisonKey("Roko and Sons"));
  });

  it("keeps genuinely different clients apart", () => {
    expect(comparisonKey("Memnon Capital")).not.toBe(comparisonKey("Memnon Holdings"));
    expect(comparisonKey("Nile Microfinance")).not.toBe(comparisonKey("Nile Insurance"));
  });

  it("does not strip a suffix that is the whole name", () => {
    expect(comparisonKey("Limited")).toBe("limited");
  });
});

describe("findLikelyDuplicates", () => {
  const existing = [
    { id: "1", name: "Memnon Capital Ltd" },
    { id: "2", name: "Kampala Logistics" },
  ];

  it("matches across spelling variants", () => {
    expect(findLikelyDuplicates("memnon  capital", existing)).toEqual([
      { id: "1", name: "Memnon Capital Ltd" },
    ]);
  });

  it("returns nothing for a new client", () => {
    expect(findLikelyDuplicates("Nile Microfinance", existing)).toEqual([]);
  });

  it("returns nothing for an empty name", () => {
    expect(findLikelyDuplicates("   ", existing)).toEqual([]);
  });
});
