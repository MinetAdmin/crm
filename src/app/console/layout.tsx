import { redirect } from "next/navigation";

import { auth, signOut } from "@/auth";
import { ConsoleShell } from "@/components/console/ConsoleShell";
import { authEnvStatus } from "@/lib/env";

async function handleSignOut() {
  "use server";
  await signOut({ redirectTo: "/" });
}

export default async function ConsoleLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  if (!authEnvStatus().ready) redirect("/");

  const session = await auth();
  if (!session?.user) redirect("/signin");

  return (
    <ConsoleShell
      user={{
        name: session.user.name || session.user.email,
        email: session.user.email,
        role: session.user.role || "unknown",
      }}
      signOutAction={handleSignOut}
    >
      {children}
    </ConsoleShell>
  );
}
