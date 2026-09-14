import { PrimaryLink } from "@/components/console/ui";

export default function ConsoleNotFound() {
  return (
    <div className="w-full max-w-4xl">
      <p className="text-[13px] text-(--c-muted)">404</p>
      <h1 className="mt-2 text-2xl font-semibold tracking-[-0.01em]">Not found</h1>
      <p className="mt-1 text-sm text-(--c-muted)">
        This page or record does not exist, or your account cannot see it. It may have been removed
        since the link was made.
      </p>
      <div className="mt-6">
        <PrimaryLink href="/console">Go to the dashboard</PrimaryLink>
      </div>
    </div>
  );
}
