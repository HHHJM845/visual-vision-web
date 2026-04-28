import { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function PageShell({ children, tone = "light" }: { children: ReactNode; tone?: "light" | "muted" }) {
  return (
    <div className={cn(
      "min-h-screen",
      tone === "muted"
        ? "bg-[radial-gradient(circle_at_top_left,hsl(var(--accent))_0,transparent_28rem),hsl(var(--muted))]"
        : "bg-[linear-gradient(180deg,hsl(var(--accent)/0.55)_0%,hsl(var(--background))_26rem)]"
    )}>
      {children}
    </div>
  );
}

export function PageHero({
  eyebrow,
  title,
  description,
  actions,
  stats,
}: {
  eyebrow: string;
  title: string;
  description: string;
  actions?: ReactNode;
  stats?: Array<{ label: string; value: string | number }>;
}) {
  return (
    <section className="relative overflow-hidden border-b border-border/70">
      <div className="mx-auto grid max-w-6xl gap-6 px-4 py-10 md:grid-cols-[1fr_auto] md:items-end">
        <div className="max-w-3xl">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-primary">{eyebrow}</p>
          <h1 className="text-3xl font-bold leading-tight text-foreground md:text-5xl">{title}</h1>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-muted-foreground md:text-base">{description}</p>
        </div>
        {actions && <div className="flex flex-wrap gap-3 md:justify-end">{actions}</div>}
      </div>
      {stats && (
        <div className="mx-auto flex max-w-6xl flex-wrap gap-3 px-4 pb-8">
          {stats.map((item) => (
            <div key={item.label} className="rounded-full border border-border bg-background/85 px-4 py-2 shadow-sm backdrop-blur">
              <span className="mr-2 text-base font-bold text-foreground">{item.value}</span>
              <span className="text-xs text-muted-foreground">{item.label}</span>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

export function SectionTitle({ title, description, action }: { title: string; description?: string; action?: ReactNode }) {
  return (
    <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h2 className="text-xl font-bold text-foreground">{title}</h2>
        {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
      </div>
      {action}
    </div>
  );
}

export function FilterChip({ active, children, onClick }: { active?: boolean; children: ReactNode; onClick?: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex min-h-10 cursor-pointer items-center gap-1 rounded-full border px-4 py-2 text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        active
          ? "border-primary bg-primary text-primary-foreground shadow-sm"
          : "border-border bg-background text-foreground hover:border-primary/50 hover:bg-accent"
      )}
    >
      {children}
    </button>
  );
}
