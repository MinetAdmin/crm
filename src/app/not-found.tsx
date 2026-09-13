import Link from "next/link";

import { Wordmark } from "@/components/brand/Wordmark";

export default function NotFound() {
  return (
    <div className="landing flex min-h-svh flex-col">
      <header className="border-b border-(--lp-line-soft) px-5 py-3.5 md:px-10">
        <Link href="/">
          <Wordmark />
        </Link>
      </header>

      <main className="flex flex-1 items-center justify-center px-5 py-12 md:px-10">
        <div className="w-full max-w-[26rem]">
          <p className="text-[13px] text-(--lp-fg-muted)">404</p>
          <h1 className="lp-display mt-2 text-[clamp(2rem,4vw,2.75rem)]">Page not found</h1>
          <p className="mt-3 text-[15px] leading-relaxed text-(--lp-fg-muted)">
            There is nothing at this address. The link may be out of date, or the address may be
            mistyped.
          </p>
          <div className="mt-7 flex flex-wrap items-center gap-5">
            <Link
              href="/console"
              className="flex h-12 items-center justify-center rounded-full bg-(--lp-fg) px-6 text-[15px] font-medium text-(--lp-page) transition-colors hover:bg-(--lp-fg)/85"
            >
              Go to the dashboard
            </Link>
            <Link
              href="/"
              className="text-[15px] text-(--lp-fg-muted) transition-colors hover:text-(--lp-fg)"
            >
              Back to the overview
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
