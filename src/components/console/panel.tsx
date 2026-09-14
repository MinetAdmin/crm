import { cn } from "cn";

export function PanelSection({
  title,
  action,
  className,
  children,
}: Readonly<{
  title: string;
  action?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}>) {
  return (
    <section className={cn("grid content-start gap-2 border-t border-border pt-4", className)}>
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-[11px] font-medium tracking-[0.08em] text-(--subtle) uppercase">
          {title}
        </h3>
        {action}
      </div>
      {children}
    </section>
  );
}

export function StatTile({
  label,
  value,
  children,
}: Readonly<{ label: string; value?: string; children?: React.ReactNode }>) {
  return (
    <div className="grid content-start gap-1.5 rounded-lg border border-border p-3">
      <span className="text-xs text-muted-foreground">{label}</span>
      {value !== undefined && (
        <span className="text-sm leading-none font-medium tabular-nums">{value}</span>
      )}
      {children}
    </div>
  );
}
