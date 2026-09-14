export type RuleViolation = { rule: string; message: string };

/** Stages at or below this position may be reached without any priced work. */
const PRICED_FROM_SORT_ORDER = 5;

export type StageMove = {
  toSortOrder: number;
  scheduleLineCount: number;
  defaultProbability: number;
  probability: number;
  overrideNote: string | null;
};

/**
 * BR-OPP-03 and BR-OPP-05, checked before a stage change is written.
 * A stage past Quotation prepared needs priced work, and a probability away
 * from the stage default needs a note.
 */
export function checkStageMove(move: StageMove): RuleViolation[] {
  const violations: RuleViolation[] = [];

  if (move.toSortOrder >= PRICED_FROM_SORT_ORDER && move.scheduleLineCount === 0) {
    violations.push({
      rule: "BR-OPP-03",
      message: "Add a revenue schedule line before moving past Quotation prepared.",
    });
  }

  if (move.probability !== move.defaultProbability && !move.overrideNote?.trim()) {
    violations.push({
      rule: "BR-OPP-05",
      message: "A probability away from the stage default needs a note explaining why.",
    });
  }

  return violations;
}

export type Closure = {
  outcome: "won" | "lost" | "on_hold" | "withdrawn";
  reasonId: string | null;
};

/** BR-OPP-04: lost and on hold both have to say why. */
export function checkClosure(closure: Closure): RuleViolation[] {
  const needsReason = closure.outcome === "lost" || closure.outcome === "on_hold";
  if (needsReason && !closure.reasonId) {
    return [
      {
        rule: "BR-OPP-04",
        message: `An outcome of ${closure.outcome.replace("_", " ")} needs a recorded reason.`,
      },
    ];
  }
  return [];
}

/** The weighted figure, derived here for display and in SQL for reporting. */
export function weightedAmount(expected: number, probability: number): number {
  return (expected * probability) / 100;
}
