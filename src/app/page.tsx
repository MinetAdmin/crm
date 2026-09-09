import { auth, signOut } from "@/auth";
import { ConsoleShell } from "@/components/console/ConsoleShell";
import { LandingPage } from "@/components/landing/LandingPage";
import { getDashboardSummary } from "@/lib/dashboard";
import { authEnvStatus } from "@/lib/env";
import { formatAmount } from "@/lib/format";

async function handleSignOut() {
  "use server";
  await signOut({ redirectTo: "/" });
}

/** Landing page for signed-out visitors, console for everyone else. */
export default async function Home() {
  if (!authEnvStatus().ready) return <LandingPage />;

  const session = await auth();
  if (!session?.user) return <LandingPage />;

  const summary = await getDashboardSummary();

  return (
    <ConsoleShell
      user={{
        name: session.user.name || session.user.email,
        email: session.user.email,
        role: session.user.role || "unknown",
      }}
      signOutAction={handleSignOut}
    >
      <div className="mx-auto w-full max-w-5xl">
        <h1 className="text-2xl font-semibold tracking-[-0.01em]">Dashboard</h1>
        <p className="mt-1 text-sm text-(--c-muted)">
          The book as it stands. Trend views arrive once there is history to read.
        </p>

        <dl className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <Tile
            label="Open pursuits"
            value={String(summary.openPursuits)}
            note="Outcome still open"
          />
          <Tile
            label="Weighted pipeline"
            value={formatAmount(summary.weightedPipeline)}
            note="UGX, expected times probability"
          />
          <Tile
            label="Needs attention"
            value={String(summary.exceptions)}
            note="No next action, overdue, stale or unpriced"
            tone={summary.exceptions > 0 ? "warn" : "plain"}
          />
          <Tile
            label="Tender deadlines"
            value={String(summary.tendersDue)}
            note="Closing within 30 days"
            tone={summary.tendersDue > 0 ? "warn" : "plain"}
          />
        </dl>

        <section className="mt-8 rounded-md border border-(--c-line) bg-(--c-surface) p-5 md:p-6">
          <h2 className="text-[15px] font-semibold">What is here so far</h2>
          <p className="mt-2 max-w-[70ch] text-sm leading-relaxed text-(--c-muted)">
            This is the console shell. Sign-in, the record model and the audit trail are in place,
            and the tiles above read the live database through the same views the reports will use.
            Leads, opportunities and the rest are marked <em>soon</em> in the sidebar because they
            are not built yet, rather than linked to an empty page.
          </p>
          <p className="mt-3 max-w-[70ch] text-sm leading-relaxed text-(--c-muted)">
            Next in the plan: accounts and contacts with the duplicate guard, then leads and the
            conversion flow. See <span className="font-medium">docs/11-delivery-plan.md</span>.
          </p>
        </section>
      </div>
    </ConsoleShell>
  );
}

function Tile({
  label,
  value,
  note,
  tone = "plain",
}: Readonly<{
  label: string;
  value: string;
  note: string;
  tone?: "plain" | "warn";
}>) {
  return (
    <div className="rounded-md border border-(--c-line) bg-(--c-surface) p-4">
      <dt className="text-[13px] text-(--c-muted)">{label}</dt>
      <dd
        className={`mt-1.5 text-2xl font-semibold tracking-[-0.02em] tabular-nums ${
          tone === "warn" ? "text-(--c-warn)" : ""
        }`}
      >
        {value}
      </dd>
      <p className="mt-1 text-[12px] leading-snug text-(--c-muted)">{note}</p>
    </div>
  );
}
