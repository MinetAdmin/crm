const SUFFIXES = new Set([
  "ltd",
  "limited",
  "plc",
  "inc",
  "incorporated",
  "corp",
  "corporation",
  "co",
  "company",
]);

/**
 * Folds a client name for comparison: case, punctuation, spacing, the "and"
 * spelling and trailing company suffixes. Used to find likely duplicates, not
 * to decide identity.
 */
export function comparisonKey(name: string): string {
  const words = name
    .toLowerCase()
    .replaceAll("&", " and ")
    .replaceAll(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter(Boolean);

  while (words.length > 1 && SUFFIXES.has(words.at(-1) as string)) {
    words.pop();
  }
  if (words.length > 1 && words.at(-1) === "u") words.pop();
  return words.join(" ");
}

export type AccountMatch = { id: string; name: string };

/** Existing accounts whose folded name matches the one being entered. */
export function findLikelyDuplicates(
  name: string,
  existing: ReadonlyArray<AccountMatch>,
): AccountMatch[] {
  const key = comparisonKey(name);
  if (!key) return [];
  return existing.filter((account) => comparisonKey(account.name) === key);
}
