/**
 * Forward-only SQL migration runner. Applies db/migrations/NNNN_*.sql in
 * filename order and records each in _migrations. Files manage their own
 * BEGIN/COMMIT.
 *
 * Usage: pnpm db:migrate [-- --dry]
 */
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { Client } from "pg";

const MIGRATIONS_DIR = join(process.cwd(), "db", "migrations");

async function main() {
  const dry = process.argv.includes("--dry");
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set");

  const client = new Client({ connectionString: url });
  await client.connect();
  try {
    await client.query(
      `CREATE TABLE IF NOT EXISTS _migrations (
         filename   text PRIMARY KEY,
         applied_at timestamptz NOT NULL DEFAULT now()
       )`,
    );
    const applied = new Set(
      (await client.query("SELECT filename FROM _migrations")).rows.map(
        (r: { filename: string }) => r.filename,
      ),
    );
    const files = readdirSync(MIGRATIONS_DIR)
      .filter((f) => /^\d{4}_.+\.sql$/.test(f))
      .sort();

    const pending = files.filter((f) => !applied.has(f));
    if (pending.length === 0) {
      console.log("No pending migrations.");
      return;
    }
    for (const file of pending) {
      if (dry) {
        console.log(`pending: ${file}`);
        continue;
      }
      console.log(`applying: ${file}`);
      const sql = readFileSync(join(MIGRATIONS_DIR, file), "utf8");
      await client.query(sql);
      await client.query("INSERT INTO _migrations (filename) VALUES ($1)", [file]);
    }
    if (!dry) console.log(`Applied ${pending.length} migration(s).`);
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
