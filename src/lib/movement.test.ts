import { describe, expect, it } from "vitest";
import { decomposeMovement, type SnapshotLine } from "./movement";

const line = (over: Partial<SnapshotLine> = {}): SnapshotLine => ({
  opportunityId: "1",
  scheduleLineId: "1",
  outcome: "open",
  effectiveMonth: "2026-10",
  expected: 100,
  probability: 50,
  weighted: 50,
  ...over,
});

describe("decomposeMovement", () => {
  it("reconciles when nothing changed", () => {
    const m = decomposeMovement([line()], [line()]);
    expect(m.reconciles).toBe(true);
    expect(m.residual).toBe(0);
  });

  it("counts a new line as added", () => {
    const m = decomposeMovement([], [line()]);
    expect(m.buckets.added).toBe(50);
    expect(m.reconciles).toBe(true);
  });

  it("removes weighted when a deal is won", () => {
    const m = decomposeMovement([line()], [line({ outcome: "won", weighted: 0 })]);
    expect(m.buckets.won).toBe(-50);
    expect(m.reconciles).toBe(true);
  });

  it("removes weighted when a deal is lost", () => {
    const m = decomposeMovement([line()], [line({ outcome: "lost", weighted: 0 })]);
    expect(m.buckets.lost).toBe(-50);
    expect(m.reconciles).toBe(true);
  });

  it("separates a probability change from an amount change", () => {
    const m = decomposeMovement([line()], [line({ probability: 70, weighted: 70 })]);
    expect(m.buckets.probabilityChange).toBe(20);
    expect(m.buckets.revised).toBe(0);
    expect(m.reconciles).toBe(true);
  });

  it("attributes an amount change to revised", () => {
    const m = decomposeMovement([line()], [line({ expected: 200, weighted: 100 })]);
    expect(m.buckets.revised).toBe(50);
    expect(m.reconciles).toBe(true);
  });

  it("reconciles when amount and probability both move", () => {
    const m = decomposeMovement([line()], [line({ expected: 200, probability: 70, weighted: 140 })]);
    expect(m.reconciles).toBe(true);
    expect(m.closingWeighted - m.openingWeighted).toBe(90);
  });

  it("counts a month change as slipped", () => {
    const m = decomposeMovement([line()], [line({ effectiveMonth: "2026-12" })]);
    expect(m.slippedCount).toBe(1);
    expect(m.buckets.slipped).toBe(0);
    expect(m.reconciles).toBe(true);
  });

  it("counts a disappeared line as removed", () => {
    const m = decomposeMovement([line()], []);
    expect(m.buckets.removed).toBe(-50);
    expect(m.reconciles).toBe(true);
  });

  it("reconciles across a mixed month", () => {
    const opening = [
      line({ scheduleLineId: "1" }),
      line({ opportunityId: "2", scheduleLineId: "2", expected: 400, probability: 25, weighted: 100 }),
      line({ opportunityId: "3", scheduleLineId: "3", expected: 200, weighted: 100 }),
    ];
    const closing = [
      line({ scheduleLineId: "1", outcome: "won", weighted: 0 }),
      line({ opportunityId: "2", scheduleLineId: "2", expected: 400, probability: 50, weighted: 200 }),
      line({ opportunityId: "4", scheduleLineId: "4", expected: 80, probability: 10, weighted: 8 }),
    ];
    const m = decomposeMovement(opening, closing);
    expect(m.reconciles).toBe(true);
    expect(m.openingWeighted).toBe(250);
    expect(m.closingWeighted).toBe(208);
  });
});
