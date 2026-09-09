const AMOUNT = new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 });

/** Grouped whole units, e.g. 22500000 becomes "22,500,000". */
export function formatAmount(value: number): string {
  return AMOUNT.format(Math.round(value));
}

const COMPACT = new Intl.NumberFormat("en-US", {
  notation: "compact",
  maximumFractionDigits: 1,
});

/** Compact figure for stat tiles, e.g. 2400000000 becomes "2.4B". */
export function formatCompactAmount(value: number): string {
  return COMPACT.format(value);
}
