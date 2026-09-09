/** The state a lead must reach before it can become an opportunity. */
export type ConversionState = {
  accountResolved: boolean;
  decisionMakerNamed: boolean;
  productCount: number;
  estimatedValue: number | null;
  ownerAccepted: boolean;
};

export type ConversionCondition = {
  key: "account" | "contact" | "value" | "owner";
  label: string;
  met: boolean;
  unmetHint: string;
};

/**
 * The four conditions of FR-LEAD-04, each with the reason it is not yet met.
 * Anything short of all four stays a lead.
 */
export function conversionConditions(state: ConversionState): ConversionCondition[] {
  return [
    {
      key: "account",
      label: "Account identified",
      met: state.accountResolved,
      unmetHint: "Match this lead to an account, or create one.",
    },
    {
      key: "contact",
      label: "Decision maker named",
      met: state.decisionMakerNamed,
      unmetHint: "Add a contact marked as a decision maker on the account.",
    },
    {
      key: "value",
      label: "Product and indicative value known",
      met: state.productCount > 0 && state.estimatedValue !== null && state.estimatedValue > 0,
      unmetHint: "Record at least one product of interest and an estimated value.",
    },
    {
      key: "owner",
      label: "Owner accepted",
      met: state.ownerAccepted,
      unmetHint: "Assign an owner who has accepted the pursuit.",
    },
  ];
}

export function canConvert(state: ConversionState): boolean {
  return conversionConditions(state).every((condition) => condition.met);
}

/** BR-LEAD-01: a lead needs a way to reach someone before it can be qualified. */
export function hasContactMethod(lead: {
  contactEmail: string | null;
  contactPhone: string | null;
}): boolean {
  return Boolean(lead.contactEmail?.trim() || lead.contactPhone?.trim());
}

/** Whole days since a lead was created, which drives the ageing view. */
export function leadAgeDays(createdAt: Date, now: Date): number {
  return Math.max(0, Math.floor((now.getTime() - createdAt.getTime()) / 86_400_000));
}
