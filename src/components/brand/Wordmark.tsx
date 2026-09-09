/** The product mark, shared by the landing page and the sign-in page. */
export function Wordmark({
  size = "lg",
  tone = "light",
}: {
  size?: "lg" | "sm";
  tone?: "light" | "dark";
}) {
  const muted = tone === "dark" ? "text-(--lp-panel-muted)" : "text-(--lp-fg-muted)";
  return (
    <span className="flex items-center gap-2.5">
      <span
        aria-hidden
        className={`${size === "lg" ? "h-6 w-1.5" : "h-5 w-1"} shrink-0 rounded-full bg-(--lp-brand)`}
      />
      <span className={`lp-display tracking-[-0.02em] ${size === "lg" ? "text-lg" : "text-sm"}`}>
        CRM
        <span className={muted}> · Minet Uganda</span>
      </span>
    </span>
  );
}
