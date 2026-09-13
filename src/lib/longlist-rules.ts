export type LonglistTrack = "planned" | "anytime";
export type LonglistStatus = "unworked" | "picked" | "parked" | "dropped";

export const TRACK_LABEL: Record<LonglistTrack, string> = {
  planned: "Planned",
  anytime: "Anytime",
};

export type Progress =
  | { kind: "unworked" }
  | { kind: "parked" }
  | { kind: "dropped"; reason: string | null }
  | { kind: "lead"; leadStatus: string }
  | { kind: "pipeline"; stage: string }
  | { kind: "closed"; outcome: string };

export type PromotedState = {
  leadStatus: string;
  opportunity: { outcome: string; stage: string } | null;
};

/** Where a longlist name has travelled, derived from its links at read time. */
export function progressOf(
  status: LonglistStatus,
  dropReason: string | null,
  promoted: PromotedState | null,
): Progress {
  if (status === "parked") return { kind: "parked" };
  if (status === "dropped") return { kind: "dropped", reason: dropReason };
  if (status !== "picked" || !promoted) return { kind: "unworked" };
  if (promoted.opportunity) {
    return promoted.opportunity.outcome === "open"
      ? { kind: "pipeline", stage: promoted.opportunity.stage }
      : { kind: "closed", outcome: promoted.opportunity.outcome };
  }
  return { kind: "lead", leadStatus: promoted.leadStatus };
}

export function progressLabel(progress: Progress): string {
  switch (progress.kind) {
    case "unworked":
      return "Not started";
    case "parked":
      return "Parked";
    case "dropped":
      return "Dropped";
    case "lead":
      return `Lead · ${progress.leadStatus}`;
    case "pipeline":
      return progress.stage;
    case "closed":
      return progress.outcome === "won"
        ? "Won"
        : progress.outcome.replaceAll("_", " ").replace(/^./, (c) => c.toUpperCase());
  }
}

export type Coverage = {
  planned: number;
  untouched: number;
  inPlay: number;
  won: number;
  out: number;
};

/**
 * The planned-book readout. Untouched covers unworked and parked; in play is
 * anything alive (a working lead, an open or held pursuit); out is dropped,
 * disqualified, lost or withdrawn.
 */
export function coverageOf(progresses: ReadonlyArray<Progress>): Coverage {
  const coverage = { planned: progresses.length, untouched: 0, inPlay: 0, won: 0, out: 0 };
  for (const progress of progresses) {
    if (progress.kind === "unworked" || progress.kind === "parked") coverage.untouched += 1;
    else if (progress.kind === "dropped") coverage.out += 1;
    else if (progress.kind === "lead") {
      if (progress.leadStatus === "disqualified") coverage.out += 1;
      else coverage.inPlay += 1;
    } else if (progress.kind === "pipeline") coverage.inPlay += 1;
    else if (progress.outcome === "won") coverage.won += 1;
    else if (progress.outcome === "on_hold") coverage.inPlay += 1;
    else coverage.out += 1;
  }
  return coverage;
}
