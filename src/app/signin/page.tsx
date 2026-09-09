import { redirect } from "next/navigation";
import { auth, signIn } from "@/auth";

// Readable messages for the Auth.js error codes we expect; anything else gets
// the generic line. Invite refusals surface as AccessDenied (doc 06 §0).
const ERROR_MESSAGES: Record<string, string> = {
  AccessDenied:
    "Your Microsoft account is not provisioned for the CRM. Ask the administrator for an invite.",
  Configuration: "Sign-in is not configured correctly on this server. Contact the administrator.",
};

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const session = await auth();
  if (session?.user) redirect("/");
  const { error } = await searchParams;

  return (
    <main className="flex min-h-screen items-center justify-center p-8">
      <div className="w-full max-w-sm space-y-6 text-center">
        <div>
          <h1 className="text-2xl font-semibold">
            CRM <span className="font-normal text-neutral-500">· Minet Uganda</span>
          </h1>
          <p className="mt-1 text-sm text-neutral-500">Business Development</p>
        </div>
        {error && (
          <p className="rounded border border-red-300 bg-red-50 p-3 text-sm text-red-800">
            {ERROR_MESSAGES[error] ?? "Sign-in failed. Try again or contact the administrator."}
          </p>
        )}
        <form
          action={async () => {
            "use server";
            await signIn("microsoft-entra-id", { redirectTo: "/" });
          }}
        >
          <button
            type="submit"
            className="w-full rounded bg-neutral-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-neutral-700 focus:outline-2 focus:outline-offset-2"
          >
            Sign in with Microsoft
          </button>
        </form>
        <p className="text-xs text-neutral-500">
          Access is by invitation only. There is no signup and no password.
        </p>
      </div>
    </main>
  );
}
