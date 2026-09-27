import type { ComponentProps, ReactNode } from "react";

export function cx(...classes: (string | false | null | undefined)[]): string {
  return classes.filter(Boolean).join(" ");
}

export function Card({ className, children, ...props }: ComponentProps<"section">) {
  return (
    <section className={cx("rounded-3xl bg-card p-5 shadow-[0_1px_2px_rgba(0,0,0,0.04)] ring-1 ring-line", className)} {...props}>
      {children}
    </section>
  );
}

export const primaryButton =
  "flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl bg-brand-gradient px-6 text-base font-extrabold tracking-wide text-on-brand shadow-lg shadow-brand/25 transition active:scale-[0.98] disabled:opacity-60 disabled:active:scale-100";

export const secondaryButton =
  "flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl bg-card-2 px-6 text-base font-bold text-ink transition active:scale-[0.98] disabled:opacity-60";

export function Eyebrow({ children, className }: { children: ReactNode; className?: string }) {
  return <p className={cx("text-xs font-bold uppercase tracking-[0.14em] text-muted", className)}>{children}</p>;
}

type Tone = "me" | "friend";

const toneBar: Record<Tone, string> = { me: "bg-brand-gradient", friend: "bg-friend" };
const toneDot: Record<Tone, string> = { me: "bg-brand", friend: "bg-friend" };

export function ProgressBar({ value, max, tone = "me", label }: { value: number; max: number; tone?: Tone; label: string }) {
  const pct = max === 0 ? 0 : Math.min(100, (value / max) * 100);
  return (
    <div
      className="h-2.5 w-full overflow-hidden rounded-full bg-card-2"
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={max}
      aria-valuenow={value}
    >
      <div className={cx("h-full rounded-full transition-[width] duration-700 ease-out", toneBar[tone])} style={{ width: `${pct}%` }} />
    </div>
  );
}

export function WeekDots({ count, target, tone = "me", label }: { count: number; target: number; tone?: Tone; label: string }) {
  const hit = count >= target;
  return (
    <div className="flex items-center gap-1.5" aria-label={`${label}: ${count} of ${target}`} role="img">
      {Array.from({ length: target }, (_, i) => (
        <span key={i} className={cx("size-3 rounded-full", i < count ? toneDot[tone] : "bg-card-2 ring-1 ring-line")} />
      ))}
      {count > target && <span className="text-xs font-bold text-muted">+{count - target}</span>}
      {hit && <span aria-hidden>🔥</span>}
    </div>
  );
}

export function EmptyState({ emoji, title, children }: { emoji: string; title: string; children?: ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-2 py-10 text-center">
      <div className="text-5xl" aria-hidden>
        {emoji}
      </div>
      <h2 className="text-xl font-extrabold">{title}</h2>
      {children && <div className="max-w-xs text-muted">{children}</div>}
    </div>
  );
}
