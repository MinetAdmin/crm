import Link from "next/link";
import { redirect } from "next/navigation";

import { auth, signIn } from "@/auth";
import { Wordmark } from "@/components/brand/Wordmark";

/**
 * Readable messages for the Auth.js error codes this app can produce. An
 * invite refusal arrives as AccessDenied, which is the common case and the
 * one worth explaining properly.
 */
const ERROR_MESSAGES: Record<string, string> = {
  AccessDenied:
    "That Microsoft account has no CRM account yet. An administrator creates one before the first sign-in.",
  Configuration:
    "Sign-in is not configured correctly on this server. Contact the administrator.",
  OAuthCallbackError:
    "Microsoft could not complete the sign-in. Try again, and contact the administrator if it continues.",
  Verification: "That sign-in link has expired. Start again.",
};

const ASSURANCES: ReadonlyArray<{ term: string; detail: string }> = [
  {
    term: "Invitation only",
    detail: "An administrator creates the account. There is no signup.",
  },
  {
    term: "No password to forget",
    detail: "Your Microsoft identity is the only credential, with the policies it already carries.",
  },
  {
    term: "Every change is recorded",
    detail: "Who changed what, and when, kept alongside the record itself.",
  },
];

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const session = await auth();
  if (session?.user) redirect("/");
  const { error } = await searchParams;

  return (
    <div className="landing grid min-h-svh lg:grid-cols-[1.05fr_1fr]">
      <Argument />
      <section className="flex min-w-0 flex-col">
        <header className="border-b border-(--lp-line-soft) px-5 py-3.5 lg:hidden">
          <Link href="/">
            <Wordmark />
          </Link>
        </header>

        <div className="flex flex-1 items-center justify-center px-5 py-12 md:px-10">
          <div className="w-full max-w-[24rem]">
            <h1 className="lp-display text-[clamp(2rem,4vw,2.75rem)]">Sign in</h1>
            <p className="lp-lede mt-3 text-[15px] leading-relaxed text-(--lp-fg-muted)">
              Use the Microsoft account you sign in to work with. The console opens on the book you
              left.
            </p>

            {error && <ErrorNote code={error} />}

            <form
              className="mt-7"
              action={async () => {
                "use server";
                await signIn("microsoft-entra-id", { redirectTo: "/" });
              }}
            >
              <button
                type="submit"
                className="flex h-12 w-full items-center justify-center gap-3 rounded-full bg-(--lp-fg) px-6 text-[15px] font-medium text-(--lp-page) transition-colors hover:bg-(--lp-fg)/85"
              >
                <MicrosoftMark />
                Continue with Microsoft
              </button>
            </form>

            <p className="mt-5 text-[13px] leading-relaxed text-(--lp-fg-muted)">
              Access is by invitation. If you have not been given an account, ask the BD
              administrator to create one, then sign in here.
            </p>

            {/* The dark panel carries these on wide screens; keep them here too. */}
            <dl className="mt-8 grid gap-4 border-t border-(--lp-line) pt-6 lg:hidden">
              {ASSURANCES.map((item) => (
                <div key={item.term} className="grid gap-0.5">
                  <dt className="text-[14px] font-medium">{item.term}</dt>
                  <dd className="text-[13px] leading-snug text-(--lp-fg-muted)">{item.detail}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>

        <footer className="flex items-center justify-between gap-4 border-t border-(--lp-line-soft) px-5 py-5 text-[13px] text-(--lp-fg-muted) md:px-10">
          <span>© 2026 Minet Uganda</span>
          <Link href="/" className="transition-colors hover:text-(--lp-fg)">
            Back to the overview
          </Link>
        </footer>
      </section>
    </div>
  );
}

/** The dark half: what this console is, for anyone who arrives here first. */
function Argument() {
  return (
    <aside className="hidden flex-col justify-between bg-(--lp-panel) p-10 text-(--lp-panel-fg) lg:flex xl:p-14">
      <Link href="/">
        <Wordmark tone="dark" />
      </Link>

      <div className="max-w-[34ch]">
        <p className="lp-display text-[clamp(2rem,3.2vw,3rem)]">
          One deal.
          <br />
          One row.
        </p>
        <p className="mt-5 text-[15px] leading-relaxed text-(--lp-panel-muted)">
          Pipeline, initiatives, tenders and the forecast derived from them, held once so the
          numbers agree with each other.
        </p>
      </div>

      <dl className="grid gap-5">
        {ASSURANCES.map((item) => (
          <div key={item.term} className="grid gap-1 border-t border-(--lp-panel-line) pt-3">
            <dt className="text-[15px] font-medium">{item.term}</dt>
            <dd className="max-w-[42ch] text-[13px] leading-relaxed text-(--lp-panel-muted)">
              {item.detail}
            </dd>
          </div>
        ))}
      </dl>
    </aside>
  );
}

function ErrorNote({ code }: { code: string }) {
  return (
    <p
      role="alert"
      className="mt-6 rounded-md border-l-2 border-(--lp-brand) bg-(--lp-wash) px-4 py-3 text-[14px] leading-relaxed text-(--lp-fg)"
    >
      {ERROR_MESSAGES[code] ?? "Sign-in did not complete. Try again, or contact the administrator."}
    </p>
  );
}

/** Microsoft's mark, so the button reads as the identity provider it is. */
function MicrosoftMark() {
  return (
    <svg viewBox="0 0 16 16" className="size-[18px] shrink-0" aria-hidden>
      <path fill="#F25022" d="M1 1h6.6v6.6H1z" />
      <path fill="#7FBA00" d="M8.4 1H15v6.6H8.4z" />
      <path fill="#00A4EF" d="M1 8.4h6.6V15H1z" />
      <path fill="#FFB900" d="M8.4 8.4H15V15H8.4z" />
    </svg>
  );
}
