import Link from "next/link";

import { Wordmark } from "@/components/brand/Wordmark";
import { navFor } from "./nav";

/**
 * Console chrome: sections on the left, the signed-in person and sign-out on
 * top, the page below. Narrow screens get the same sections as a scrolling
 * row, so the shell needs no client-side state.
 */
export function ConsoleShell({
  user,
  signOutAction,
  children,
}: {
  user: { name: string; email: string; role: string };
  signOutAction: () => Promise<void>;
  children: React.ReactNode;
}) {
  const items = navFor(user.role);

  return (
    <div className="flex min-h-svh flex-col lg:flex-row">
      <aside className="shrink-0 border-b border-(--c-line-soft) bg-(--c-surface) lg:w-60 lg:border-r lg:border-b-0">
        <div className="px-5 py-4 lg:px-6">
          <Link href="/">
            <Wordmark />
          </Link>
        </div>

        <nav aria-label="Sections" className="px-2 pb-3 lg:px-3">
          <ul className="flex gap-1 overflow-x-auto lg:flex-col lg:overflow-visible">
            {items.map((item) => (
              <li key={item.label} className="shrink-0 lg:shrink">
                {item.href ? (
                  <Link
                    href={item.href}
                    aria-current="page"
                    className="block rounded-md bg-(--c-wash) px-3 py-2 text-sm font-medium whitespace-nowrap"
                  >
                    {item.label}
                  </Link>
                ) : (
                  <span
                    aria-disabled="true"
                    title="Not built yet"
                    className="flex items-center gap-2 rounded-md px-3 py-2 text-sm whitespace-nowrap text-(--c-muted)"
                  >
                    {item.label}
                    <span className="rounded border border-(--c-line) px-1 text-[10px] tracking-wide">
                      soon
                    </span>
                  </span>
                )}
              </li>
            ))}
          </ul>
        </nav>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between gap-4 border-b border-(--c-line-soft) px-5 py-3.5 md:px-8">
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">{user.name}</p>
            <p className="truncate text-[13px] text-(--c-muted)">
              {user.email} · {user.role.replace(/_/g, " ")}
            </p>
          </div>
          <form action={signOutAction}>
            <button
              type="submit"
              className="rounded-full border border-(--c-line) px-4 py-1.5 text-sm font-medium transition-colors hover:bg-(--c-wash)"
            >
              Sign out
            </button>
          </form>
        </header>

        <main className="flex-1 px-5 py-8 md:px-8 md:py-10">{children}</main>
      </div>
    </div>
  );
}
