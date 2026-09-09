import Link from "next/link";

import { ForecastBand } from "./ForecastBand";
import { LedgerResolve } from "./LedgerResolve";
import { StageLadder } from "./StageLadder";

const REFUSALS: ReadonlyArray<{ rule: string; because: string }> = [
  {
    rule: "You cannot type a weighted figure.",
    because: "It is expected amount times probability, calculated on read. There is no cell to overwrite.",
  },
  {
    rule: "You cannot save a pursuit nobody owns.",
    because: "An unowned deal is one nobody is working, and it will not be found later by accident.",
  },
  {
    rule: "You cannot close one without a reason.",
    because: "Lost and on hold both ask why, because the reason is the only part worth reading next year.",
  },
  {
    rule: "You cannot put TBA in a date.",
    because: "Uncertainty belongs in close-date confidence, where it can be counted.",
  },
  {
    rule: "You cannot quietly change a probability.",
    because: "An override wants a note, and the note is kept with your name on it.",
  },
  {
    rule: "You cannot lose the history.",
    because: "Stage moves are written as they happen. A month end, once taken, is never rewritten.",
  },
];

export function LandingPage() {
  return (
    <div className="landing flex min-h-svh flex-col">
      <SiteHeader />
      <main className="flex-1">
        <Hero />
        <Forecast />
        <Stages />
        <Refusals />
        <Closing />
      </main>
      <SiteFooter />
    </div>
  );
}

function Arrow() {
  return (
    <svg viewBox="0 0 16 16" className="size-4" fill="none" aria-hidden>
      <path
        d="M3 8h10m0 0-4-4m4 4-4 4"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function SignInButton({
  children,
  tone = "brand",
}: {
  children: React.ReactNode;
  tone?: "brand" | "ink";
}) {
  const styles =
    tone === "brand"
      ? "h-12 bg-(--lp-brand) px-6 text-[15px] text-white hover:bg-(--lp-brand)/90"
      : "h-9 bg-(--lp-fg) px-4 text-sm text-(--lp-page) hover:bg-(--lp-fg)/85";
  return (
    <Link
      href="/signin"
      className={`inline-flex items-center gap-2 rounded-full font-medium transition-colors ${styles}`}
    >
      {children}
    </Link>
  );
}

function Wordmark({ size = "lg" }: { size?: "lg" | "sm" }) {
  return (
    <span className="flex items-center gap-2.5">
      <span
        aria-hidden
        className={`${size === "lg" ? "h-6 w-1.5" : "h-5 w-1"} shrink-0 rounded-full bg-(--lp-brand)`}
      />
      <span className={`lp-display tracking-[-0.02em] ${size === "lg" ? "text-lg" : "text-sm"}`}>
        CRM
        <span className="text-(--lp-fg-muted)"> · Minet Uganda</span>
      </span>
    </span>
  );
}

function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-(--lp-line-soft) bg-(--lp-page)/85 backdrop-blur-md">
      <div className="mx-auto flex w-full max-w-[78rem] items-center justify-between gap-6 px-5 py-3.5 md:px-8">
        <Link href="/">
          <Wordmark />
        </Link>
        <SignInButton tone="ink">Sign in</SignInButton>
      </div>
    </header>
  );
}

/**
 * The hero is the argument: one deal, four ways, resolving into one record.
 */
function Hero() {
  return (
    <section className="mx-auto w-full max-w-[78rem] px-5 pt-16 pb-20 md:px-8 md:pt-24 md:pb-28">
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,38ch)] lg:items-end lg:gap-16">
        <h1 className="lp-display lp-rise text-[clamp(2.5rem,7vw,6rem)]">
          One deal.
          <br />
          One row.
        </h1>
        <p
          className="lp-lede lp-rise text-lg leading-[1.55] text-(--lp-fg-muted)"
          style={{ "--lp-delay": "0.1s" } as React.CSSProperties}
        >
          The pipeline used to live in three sheets that disagreed with each other. Here a pursuit
          is one record, its money is a set of dated lines beneath it, and the forecast is derived
          rather than carried.
        </p>
      </div>

      <div className="mt-12 md:mt-16">
        <LedgerResolve />
      </div>

      <div
        className="lp-rise mt-10 flex flex-wrap items-center gap-3"
        style={{ "--lp-delay": "1.7s" } as React.CSSProperties}
      >
        <SignInButton>
          Sign in to the console
          <Arrow />
        </SignInButton>
        <span className="text-[15px] text-(--lp-fg-muted)">
          Microsoft sign-in. Access is by invitation.
        </span>
      </div>
    </section>
  );
}

/** Dark full-bleed band: the whole year in one line. */
function Forecast() {
  return (
    <section className="bg-(--lp-panel) py-20 text-(--lp-panel-fg) md:py-28">
      <div className="mx-auto w-full max-w-[78rem] px-5 md:px-8">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,34ch)_minmax(0,1fr)] lg:gap-16">
          <div>
            <h2 className="lp-display text-[clamp(1.875rem,3.6vw,3rem)]">
              The year, read left to right
            </h2>
            <p className="mt-5 text-[15px] leading-relaxed text-(--lp-panel-muted)">
              Won, committed, weighted, and the part nobody has yet. Four groupings of the same
              schedule lines, so they always add up. Month end is frozen and kept, which is what
              makes next month&rsquo;s movement explainable rather than arguable.
            </p>
          </div>
          <ForecastBand />
        </div>
      </div>
    </section>
  );
}

function Stages() {
  return (
    <section className="mx-auto w-full max-w-[78rem] px-5 py-20 md:px-8 md:py-28">
      <div className="flex flex-wrap items-end justify-between gap-6">
        <h2 className="lp-display max-w-[20ch] text-[clamp(1.875rem,3.6vw,3rem)]">
          A stage is a claim, so it needs a test
        </h2>
        <p className="max-w-[34ch] text-[15px] leading-relaxed text-(--lp-fg-muted)">
          Each step carries an exit criterion and the probability that comes with it. Without the
          criterion a stage is just an opinion, and win rate cannot be read from opinions.
        </p>
      </div>

      <div className="mt-12 md:mt-16">
        <StageLadder />
      </div>
    </section>
  );
}

/** Defined by what it refuses: the save-time rules, stated plainly. */
function Refusals() {
  return (
    <section className="border-y border-(--lp-line-soft) bg-(--lp-wash) py-20 md:py-28">
      <div className="mx-auto w-full max-w-[78rem] px-5 md:px-8">
        <h2 className="lp-display max-w-[24ch] text-[clamp(1.875rem,3.6vw,3rem)]">
          Six things it will not let you do
        </h2>

        <dl className="mt-12 grid gap-x-12 gap-y-8 md:mt-16 md:grid-cols-2 lg:gap-y-10">
          {REFUSALS.map((item) => (
            <div key={item.rule} className="grid content-start gap-2 border-t border-(--lp-line) pt-5">
              <dt className="lp-display text-lg tracking-[-0.02em] md:text-xl">{item.rule}</dt>
              <dd className="max-w-[52ch] text-[15px] leading-relaxed text-(--lp-fg-muted)">
                {item.because}
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}

function Closing() {
  return (
    <section className="mx-auto w-full max-w-[78rem] px-5 py-20 md:px-8 md:py-28">
      <div className="flex flex-wrap items-end justify-between gap-8">
        <h2 className="lp-display max-w-[22ch] text-[clamp(2rem,4.2vw,3.5rem)]">
          Pick up the book where you left it.
        </h2>
        <SignInButton>
          Sign in
          <Arrow />
        </SignInButton>
      </div>
    </section>
  );
}

function SiteFooter() {
  return (
    <footer className="border-t border-(--lp-line-soft)">
      <div className="mx-auto flex w-full max-w-[78rem] flex-wrap items-center justify-between gap-4 px-5 py-6 md:px-8">
        <div className="flex items-center gap-2.5 text-(--lp-fg-muted)">
          <Wordmark size="sm" />
          <span className="text-sm">© 2026</span>
        </div>
        <span className="lp-num text-[11px] text-(--lp-fg-muted)">v0.1</span>
      </div>
    </footer>
  );
}
