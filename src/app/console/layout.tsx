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

async function navCounts(): Promise<Record<string, number>> {
  const [accounts, leads, opportunities] = await Promise.all([
    db().account.count({ where: { archived_at: null } }),
    db().lead.count({
      where: { archived_at: null, status: { notIn: ["converted", "disqualified"] } },
    }),
    db().opportunity.count({ where: { archived_at: null, outcome: "open" } }),
  ]);
  return {
    "/console/accounts": accounts,
    "/console/leads": leads,
    "/console/opportunities": opportunities,
  };
}

export default async function ConsoleLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  if (!authEnvStatus().ready) redirect("/");

  const session = await auth();
  if (!session?.user) redirect("/signin");

  const [cookieStore, counts] = await Promise.all([cookies(), navCounts()]);
  const defaultSidebarOpen = cookieStore.get("sidebar_state")?.value !== "false";

  return (
    <ConsoleShell
      counts={counts}
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
