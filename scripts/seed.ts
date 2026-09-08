/**
 * Seed runner. Reference data always; dev fixtures only outside production.
 * Usage: pnpm db:seed            (reference + dev when NODE_ENV != production)
 *        pnpm db:seed -- --reference-only
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { Client } from "pg";

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set");
  const referenceOnly =
    process.argv.includes("--reference-only") || process.env.NODE_ENV === "production";

  const client = new Client({ connectionString: url });
  await client.connect();
  try {
    console.log("seeding: reference data");
    await client.query(readFileSync(join(process.cwd(), "db", "seed-reference.sql"), "utf8"));
    if (!referenceOnly) {
      console.log("seeding: dev fixtures");
      await client.query(readFileSync(join(process.cwd(), "db", "seed-dev.sql"), "utf8"));
    }
    console.log("done");
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
