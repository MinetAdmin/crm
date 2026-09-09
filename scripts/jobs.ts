/**
 * Scheduled work, run as a container job.
 * Usage: pnpm job snapshot | hygiene | deadlines
 */
import { db } from "../src/lib/db";
import { takeSnapshot } from "../src/lib/snapshots";
import { hygieneExceptions } from "../src/lib/reports";
import { daysUntil } from "../src/lib/tender-rules";

function previousMonth(now: Date): string {
  const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1));
  return d.toISOString().slice(0, 7);
}

async function snapshot(): Promise<void> {
  const month = process.argv[3] ?? previousMonth(new Date());
  try {
    const id = await takeSnapshot(month, null);
    console.log(`snapshot ${month} taken (${id})`);
  } catch (error) {
    console.error(`snapshot ${month} failed:`, (error as Error).message);
    process.exitCode = 1;
  }
}

async function hygiene(): Promise<void> {
  const rows = await hygieneExceptions();
  if (rows.length === 0) {
    console.log("hygiene: nothing to report");
    return;
  }
  const byOwner = new Map<string, string[]>();
  for (const row of rows) {
    byOwner.set(row.owner, [...(byOwner.get(row.owner) ?? []), `${row.name}: ${row.reasons.join(", ")}`]);
  }
  for (const [owner, items] of byOwner) {
    console.log(`hygiene: ${owner} has ${items.length}`);
    for (const item of items) console.log(`  ${item}`);
  }
}

async function deadlines(): Promise<void> {
  const now = new Date();
  const tenders = await db().tender.findMany({
    where: {
      archived_at: null,
      submission_deadline: { not: null },
      status: { in: ["to_submit", "submitted", "in_evaluation"] },
    },
    include: { app_user: { select: { full_name: true } } },
  });
  const due = tenders
    .map((t) => ({ t, days: daysUntil(t.submission_deadline as Date, now) }))
    .filter(({ days }) => [14, 7, 2].includes(days));

  if (due.length === 0) {
    console.log("deadlines: nothing due at 14, 7 or 2 days");
    return;
  }
  for (const { t, days } of due) {
    console.log(`deadline in ${days}d: ${t.title} (${t.issuing_body}) — ${t.app_user?.full_name ?? "unowned"}`);
  }
}

const jobs: Record<string, () => Promise<void>> = { snapshot, hygiene, deadlines };

async function main(): Promise<void> {
  const name = process.argv[2];
  const job = jobs[name];
  if (!job) {
    console.error(`Unknown job "${name}". One of: ${Object.keys(jobs).join(", ")}`);
    process.exit(1);
  }
  await job();
  await db().$disconnect();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
