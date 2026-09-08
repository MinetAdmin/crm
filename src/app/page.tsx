import { auth, signOut } from "@/auth";

// Placeholder shell until the dashboard (doc 07 §2.1) lands.
export default async function Home() {
  const session = await auth();

  return (
    <main className="mx-auto max-w-3xl p-8">
      <header className="flex items-center justify-between border-b pb-4">
        <div>
          <h1 className="text-xl font-semibold">BD CRM</h1>
          <p className="text-sm text-neutral-500">Sprint 0 shell. Build docs in /docs.</p>
        </div>
        <form
          action={async () => {
            "use server";
            await signOut({ redirectTo: "/signin" });
          }}
        >
          <button type="submit" className="text-sm underline hover:no-underline">
            Sign out
          </button>
        </form>
      </header>
      <section className="mt-6 space-y-1 text-sm">
        <p>
          Signed in as <strong>{session?.user?.email}</strong>
        </p>
        <p>
          Role: <code>{session?.user?.role || "unknown"}</code> · Unit:{" "}
          <code>{session?.user?.unitId ?? "none"}</code>
        </p>
      </section>
    </main>
  );
}
