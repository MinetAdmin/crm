const AMOUNT = new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 });

/** Grouped whole units, e.g. 22500000 becomes "22,500,000". */
export function formatAmount(value: number): string {
  return AMOUNT.format(Math.round(value));
}
