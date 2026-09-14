import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { auth, signOut } from "@/auth";
import { ConsoleShell } from "@/components/console/ConsoleShell";
import { db } from "@/lib/db";
import { authEnvStatus } from "@/lib/env";

async function handleSignOut() {
  "use server";
  await signOut({ redirectTo: "/" });
}

async function shellData(): Promise<{ counts: Record<string, number>; freshActivity: boolean }> {
  const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const [accounts, leads, opportunities, recentMoves] = await Promise.all([
    db().account.count({ where: { archived_at: null } }),
    db().lead.count({
      where: { archived_at: null, status: { notIn: ["converted", "disqualified"] } },
    }),
    db().opportunity.count({ where: { archived_at: null, outcome: "open" } }),
    db().stage_history.count({ where: { changed_at: { gte: dayAgo } } }),
  ]);
  return {
    counts: {
      "/console/accounts": accounts,
      "/console/leads": leads,
      "/console/opportunities": opportunities,
    },
    freshActivity: recentMoves > 0,
  };
}

export default async function ConsoleLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  if (!authEnvStatus().ready) redirect("/");

  const session = await auth();
  if (!session?.user) redirect("/signin");

  const [cookieStore, shell] = await Promise.all([cookies(), shellData()]);
  const defaultSidebarOpen = cookieStore.get("sidebar_state")?.value !== "false";

  return (
    <ConsoleShell
      counts={shell.counts}
      freshActivity={shell.freshActivity}
      user={{
        name: session.user.name || session.user.email,
        email: session.user.email,
        role: session.user.role || "unknown",
      }}
      signOutAction={handleSignOut}
      defaultSidebarOpen={defaultSidebarOpen}
    >
      {children}
    </ConsoleShell>
  );
}
