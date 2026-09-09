import Link from "next/link";

import { PipelineBoard } from "./PipelineBoard";

const NAV = [
  { href: "#stages", label: "How a pursuit moves" },
  { href: "#console", label: "The console" },
  { href: "#assurance", label: "Assurance" },
];

const STAGES: ReadonlyArray<{ step: string; title: string; exit: string; probability: string }> = [
  {
    step: "01",
    title: "Prospecting",
    exit: "A named contact has responded.",
    probability: "10%",
  },
  {
    step: "02",
    title: "Information gathering",
    exit: "Enough held to price or scope the risk.",
    probability: "20%",
  },
  {
    step: "03",
    title: "Engaged",
    exit: "The client invites a quotation or bid.",
    probability: "35%",
  },
  {
    step: "04",
    title: "Quotation prepared",
    exit: "Quotation issued to the client.",
    probability: "50%",
  },
  {
    step: "05",
    title: "Proposal submitted",
    exit: "Receipt confirmed, evaluation underway.",
    probability: "70%",
  },
  {
    step: "06",
    title: "Shortlisted",
    exit: "Award decision communicated.",
    probability: "85%",
  },
];

const CAPABILITIES: ReadonlyArray<{ title: string; detail: string; span?: boolean }> = [
  {
    title: "Pipeline and revenue schedule",
    detail:
      "One pursuit is one record. Its money lives underneath it as dated schedule lines, one per product and month, so a deal phased across a quarter stops looking like four different deals.",
    span: true,
  },
  {
    title: "Strategic initiatives",
    detail:
      "Target entered once. Delivered, expected and the gap roll up from the pursuits linked to it.",
  },
  {
    title: "Tenders and prequalifications",
    detail:
      "Their own lifecycle and their own win rate, with the basis of every value recorded so figures on different bases are never added together.",
  },
  {
    title: "Forecast and month-end snapshots",
    detail:
      "Committed, weighted and year-end landing, phased by month. Each month end is frozen and kept, so the movement since last month decomposes into what was added, revised, won, lost and slipped.",
    span: true,
  },
];

const ASSURANCES: ReadonlyArray<{ term: string; detail: string }> = [
  {
    term: "Invite-only sign-in",
    detail: "Microsoft identity at the door, and an account an administrator created.",
  },
  {
    term: "Field-level audit trail",
    detail: "Who changed a probability, and when. Written with the change, not alongside it.",
  },
  {
    term: "Immutable snapshots",
    detail: "A month end, once taken, is never rewritten by a later edit.",
  },
  {
    term: "Role-scoped visibility",
    detail: "An owner sees their book, a unit head sees the unit, enforced on every query.",
  },
];

const PROOF: ReadonlyArray<{ value: string; label: string }> = [
  { value: "One record", label: "From first approach to won" },
  { value: "Derived", label: "Weighted figures calculated, never typed" },
  { value: "Every change", label: "Written to the audit trail" },
];

export function LandingPage() {
  return (
    <div className="landing flex min-h-svh flex-col">
      <SiteHeader />

      <main className="flex-1">
        <Hero />
        <Stages />
        <Capabilities />
        <Assurance />
        <Closing />
      </main>

      <SiteFooter />
    </div>
  );
}

function SignInButton({ children, tone = "brand" }: { children: React.ReactNode; tone?: "brand" | "ink" }) {
  const base =
    "inline-flex items-center gap-2 rounded-full font-medium transition-colors focus-visible:outline-2";
  const styles =
    tone === "brand"
      ? "h-12 bg-(--lp-brand) px-6 text-[15px] text-white hover:bg-(--lp-brand)/90"
      : "h-9 bg-(--lp-fg) px-4 text-sm text-(--lp-page) hover:bg-(--lp-fg)/85";
  return (
    <Link href="/signin" className={`${base} ${styles}`}>
      {children}
    </Link>
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

function Wordmark({ size = "lg" }: { size?: "lg" | "sm" }) {
  return (
    <span className="flex items-center gap-2.5">
      <span
        aria-hidden
        className={`${size === "lg" ? "h-6 w-1.5" : "h-5 w-1"} shrink-0 rounded-full bg-(--lp-brand)`}
      />
      <span className={`lp-display tracking-[-0.02em] ${size === "lg" ? "text-lg" : "text-sm"}`}>
        BD CRM
      </span>
    </span>
  );
}

function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-(--lp-line-soft) bg-(--lp-page)/85 backdrop-blur-md">
      <div className="mx-auto flex w-full max-w-[80rem] items-center justify-between gap-6 px-5 py-3.5 md:px-8">
        <Link href="/">
          <Wordmark />
        </Link>

        <nav className="hidden items-center gap-8 md:flex" aria-label="Sections">
          {NAV.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="text-sm text-(--lp-fg-muted) transition-colors hover:text-(--lp-fg)"
            >
              {item.label}
            </a>
          ))}
        </nav>

        <SignInButton tone="ink">Sign in</SignInButton>
      </div>
    </header>
  );
}

function Hero() {
  return (
    <section className="mx-auto w-full max-w-[80rem] px-5 pt-14 pb-8 md:px-8 md:pt-20">
      <h1 className="lp-display lp-rise text-[clamp(2.5rem,7.7vw,6.75rem)]">
        The forecast is
        <br />
        never typed.
      </h1>

      <div className="mt-8 grid gap-8 md:mt-10 lg:grid-cols-[minmax(0,44ch)_auto] lg:items-end lg:justify-between lg:gap-16">
        <p
          className="lp-lede lp-rise text-lg leading-[1.55] text-(--lp-fg-muted) md:text-xl"
          style={{ "--lp-delay": "0.1s" } as React.CSSProperties}
        >
          It is derived, every time, from the pursuits underneath it. The BD console holds leads,
          opportunities, initiatives and tenders, and the weighted number falls out of them rather
          than being carried between workbooks.
        </p>

        <div
          className="lp-rise flex flex-wrap items-center gap-3"
          style={{ "--lp-delay": "0.2s" } as React.CSSProperties}
        >
          <SignInButton>
            Sign in to the console
            <Arrow />
          </SignInButton>
          <a
            href="#stages"
            className="inline-flex h-12 items-center rounded-full px-5 text-[15px] font-medium text-(--lp-fg) transition-colors hover:bg-(--lp-wash)"
          >
            How a pursuit moves
          </a>
        </div>
      </div>

      <div className="relative mt-12 md:mt-16">
        <PipelineBoard />
        <ProofBar />
      </div>
    </section>
  );
}

function ProofBar() {
  return (
    <div
      className="lp-rise relative z-10 mx-3 mt-3 rounded-md bg-(--lp-card) p-1.5 sm:mx-6 sm:-mt-16 md:mx-10"
      style={{ "--lp-delay": "1.75s" } as React.CSSProperties}
    >
      <dl className="grid divide-y divide-(--lp-line-soft) sm:grid-cols-3 sm:divide-x sm:divide-y-0">
        {PROOF.map((item) => (
          <div key={item.value} className="flex flex-col gap-0.5 px-5 py-3">
            <dt className="lp-display text-base tracking-[-0.02em]">{item.value}</dt>
            <dd className="text-[13px] text-(--lp-fg-muted)">{item.label}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

function Stages() {
  return (
    <section id="stages" className="scroll-mt-20 border-t border-(--lp-line-soft) py-20 md:py-28">
      <div className="mx-auto w-full max-w-[80rem] px-5 md:px-8">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <h2 className="lp-display max-w-[52rem] text-[clamp(2rem,4.2vw,3.5rem)]">
            Six stages, each with a way out
          </h2>
          <p className="max-w-[32ch] text-[15px] leading-relaxed text-(--lp-fg-muted)">
            Every stage carries an exit criterion, so moving a deal means the same thing whoever
            moves it. The probability comes with the stage.
          </p>
        </div>

        <ol className="mt-12 grid gap-px border-t border-(--lp-line) md:mt-16 md:grid-cols-3 lg:grid-cols-6">
          {STAGES.map((item) => (
            <li
              key={item.step}
              className="grid content-start gap-2.5 border-b border-(--lp-line-soft) py-6 lg:border-b-0 lg:border-r lg:border-r-(--lp-line-soft) lg:px-5 lg:py-8 lg:first:pl-0 lg:last:border-r-0 lg:last:pr-0"
            >
              <div className="flex items-baseline justify-between gap-2">
                <span className="lp-mono text-[11px] text-(--lp-brand)">{item.step}</span>
                <span className="lp-mono text-[11px] text-(--lp-fg-muted)">{item.probability}</span>
              </div>
              <h3 className="lp-display text-lg tracking-[-0.02em]">{item.title}</h3>
              <p className="text-[14px] leading-relaxed text-(--lp-fg-muted)">{item.exit}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

function Capabilities() {
  return (
    <section id="console" className="scroll-mt-20 bg-(--lp-wash) py-20 md:py-28">
      <div className="mx-auto w-full max-w-[80rem] px-5 md:px-8">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <h2 className="lp-display max-w-[44rem] text-[clamp(2rem,4.2vw,3.5rem)]">
            Four surfaces, one set of records
          </h2>
          <p className="max-w-[30ch] text-[15px] leading-relaxed text-(--lp-fg-muted)">
            Owners, unit heads and management read the same records from different angles. Nothing
            is reconciled between them, because nothing is held twice.
          </p>
        </div>

        <div className="mt-12 grid gap-4 md:mt-16 md:grid-cols-3">
          {CAPABILITIES.map((item) => (
            <article
              key={item.title}
              className={`grid content-start gap-3 rounded-md bg-(--lp-card) p-6 md:p-8 ${
                item.span ? "md:col-span-2" : ""
              }`}
            >
              <h3 className="lp-display text-2xl tracking-[-0.025em]">{item.title}</h3>
              <p className="max-w-[46ch] text-[15px] leading-relaxed text-(--lp-fg-muted)">
                {item.detail}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function Assurance() {
  return (
    <section
      id="assurance"
      className="scroll-mt-20 bg-(--lp-panel) py-20 text-(--lp-panel-fg) md:py-28"
    >
      <div className="mx-auto grid w-full max-w-[80rem] gap-12 px-5 md:px-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)] lg:gap-20">
        <div>
          <h2 className="lp-display text-[clamp(2rem,4vw,3.25rem)]">
            A number is only worth as much as its history
          </h2>
          <p className="mt-6 max-w-[42ch] text-[15px] leading-relaxed text-(--lp-panel-muted)">
            Spreadsheets lost the pipeline twice over: two files that no longer agreed, and no way
            to tell which to trust. Single ownership and a trail behind every change matter here
            more than any report.
          </p>
        </div>

        <dl className="grid gap-px self-start border-t border-(--lp-panel-line) sm:grid-cols-2">
          {ASSURANCES.map((item) => (
            <div
              key={item.term}
              className="grid content-start gap-2 border-b border-(--lp-panel-line) py-6 sm:px-6 sm:first:pl-0 sm:[&:nth-child(2n)]:pr-0 sm:[&:nth-child(2n+1)]:pl-0"
            >
              <dt className="lp-display text-lg tracking-[-0.02em]">{item.term}</dt>
              <dd className="text-sm leading-relaxed text-(--lp-panel-muted)">{item.detail}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}

function Closing() {
  return (
    <section className="mx-auto w-full max-w-[80rem] px-5 py-20 md:px-8 md:py-28">
      <div className="flex flex-wrap items-end justify-between gap-8">
        <h2 className="lp-display max-w-[24ch] text-[clamp(2rem,4.4vw,3.75rem)]">
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
      <div className="mx-auto flex w-full max-w-[80rem] flex-wrap items-center justify-between gap-4 px-5 py-6 md:px-8">
        <div className="flex items-center gap-2.5 text-(--lp-fg-muted)">
          <Wordmark size="sm" />
          <span className="text-sm">© 2026 Minet Uganda, Business Development</span>
        </div>
        <span className="lp-mono text-[11px] text-(--lp-fg-muted)">v0.1</span>
      </div>
    </footer>
  );
}
