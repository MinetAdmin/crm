import { Logo } from "./Logo";

/** The product mark. */
export function Wordmark({
  size = "lg",
  tone = "light",
}: Readonly<{
  size?: "lg" | "sm";
  tone?: "light" | "dark";
}>) {
  const muted = tone === "dark" ? "text-(--lp-panel-muted)" : "text-(--lp-fg-muted)";
  return (
    <span className="flex items-center gap-2.5">
      <Logo size={size === "lg" ? 24 : 20} />
      <span className={`lp-display tracking-[-0.02em] ${size === "lg" ? "text-lg" : "text-sm"}`}>
        CRM{" "}
        <span className={muted}>· Minet Uganda</span>
      </span>
    </span>
  );
}
