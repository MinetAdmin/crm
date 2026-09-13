import { describe, expect, it } from "vitest";

import { coverageOf, progressLabel, progressOf, type Progress } from "./longlist-rules";

describe("progressOf", () => {
  it("mirrors the entry's own status before promotion", () => {
    expect(progressOf("unworked", null, null)).toEqual({ kind: "unworked" });
    expect(progressOf("parked", null, null)).toEqual({ kind: "parked" });
    expect(progressOf("dropped", "no fit", null)).toEqual({ kind: "dropped", reason: "no fit" });
  });

  it("follows a picked entry to its lead", () => {
    expect(progressOf("picked", null, { leadStatus: "qualifying", opportunity: null })).toEqual({
      kind: "lead",
      leadStatus: "qualifying",
    });
  });

  it("follows a converted lead into the pipeline and to its outcome", () => {
    expect(
      progressOf("picked", null, {
        leadStatus: "converted",
        opportunity: { outcome: "open", stage: "Engaged" },
      }),
    ).toEqual({ kind: "pipeline", stage: "Engaged" });
    expect(
      progressOf("picked", null, {
        leadStatus: "converted",
        opportunity: { outcome: "won", stage: "Shortlisted" },
      }),
    ).toEqual({ kind: "closed", outcome: "won" });
  });
});

describe("progressLabel", () => {
  it("labels each kind", () => {
    expect(progressLabel({ kind: "unworked" })).toBe("Not started");
    expect(progressLabel({ kind: "lead", leadStatus: "new" })).toBe("Lead · new");
    expect(progressLabel({ kind: "pipeline", stage: "Engaged" })).toBe("Engaged");
    expect(progressLabel({ kind: "closed", outcome: "won" })).toBe("Won");
    expect(progressLabel({ kind: "closed", outcome: "on_hold" })).toBe("On hold");
  });
});

describe("coverageOf", () => {
  it("buckets untouched, in play, won and out", () => {
    const progresses: Progress[] = [
      { kind: "unworked" },
      { kind: "parked" },
      { kind: "dropped", reason: null },
      { kind: "lead", leadStatus: "qualifying" },
      { kind: "lead", leadStatus: "disqualified" },
      { kind: "pipeline", stage: "Engaged" },
      { kind: "closed", outcome: "won" },
      { kind: "closed", outcome: "lost" },
      { kind: "closed", outcome: "on_hold" },
    ];
    expect(coverageOf(progresses)).toEqual({
      planned: 9,
      untouched: 2,
      inPlay: 3,
      won: 1,
      out: 3,
    });
  });
});
