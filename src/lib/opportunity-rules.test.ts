import { describe, expect, it } from "vitest";
import { checkClosure, checkStageMove, weightedAmount } from "./opportunity-rules";

const move = {
  toSortOrder: 3,
  scheduleLineCount: 0,
  defaultProbability: 35,
  probability: 35,
  overrideNote: null,
};

describe("checkStageMove", () => {
  it("allows an early stage with no priced work", () => {
    expect(checkStageMove(move)).toEqual([]);
  });

  it("blocks moving past Quotation prepared with no schedule line", () => {
    const violations = checkStageMove({ ...move, toSortOrder: 5, defaultProbability: 70, probability: 70 });
    expect(violations.map((v) => v.rule)).toEqual(["BR-OPP-03"]);
  });

  it("allows that move once a line exists", () => {
    expect(
      checkStageMove({
        ...move,
        toSortOrder: 5,
        scheduleLineCount: 1,
        defaultProbability: 70,
        probability: 70,
      }),
    ).toEqual([]);
  });

  it("requires a note when probability leaves the stage default", () => {
    const violations = checkStageMove({ ...move, probability: 60 });
    expect(violations.map((v) => v.rule)).toEqual(["BR-OPP-05"]);
  });

  it("accepts an override that carries a note", () => {
    expect(
      checkStageMove({ ...move, probability: 60, overrideNote: "Client confirmed budget" }),
    ).toEqual([]);
  });

  it("rejects a note that is only whitespace", () => {
    expect(checkStageMove({ ...move, probability: 60, overrideNote: "   " })).toHaveLength(1);
  });

  it("reports both violations at once", () => {
    const violations = checkStageMove({
      ...move,
      toSortOrder: 6,
      probability: 90,
      defaultProbability: 85,
    });
    expect(violations.map((v) => v.rule).sort((a, b) => a.localeCompare(b))).toEqual(["BR-OPP-03", "BR-OPP-05"]);
  });
});

describe("checkClosure", () => {
  it("requires a reason for lost and on hold", () => {
    expect(checkClosure({ outcome: "lost", reasonId: null })).toHaveLength(1);
    expect(checkClosure({ outcome: "on_hold", reasonId: null })).toHaveLength(1);
  });

  it("accepts them with a reason", () => {
    expect(checkClosure({ outcome: "lost", reasonId: "3" })).toEqual([]);
  });

  it("asks nothing of won or withdrawn", () => {
    expect(checkClosure({ outcome: "won", reasonId: null })).toEqual([]);
    expect(checkClosure({ outcome: "withdrawn", reasonId: null })).toEqual([]);
  });
});

describe("weightedAmount", () => {
  it("is expected times probability", () => {
    expect(weightedAmount(45_000_000, 50)).toBe(22_500_000);
  });

  it("is zero at zero probability", () => {
    expect(weightedAmount(45_000_000, 0)).toBe(0);
  });
});
