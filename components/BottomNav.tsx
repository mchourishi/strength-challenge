"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cx } from "./ui";

const TABS = [
  { href: "/", label: "Today", icon: "🔥" },
  { href: "/program", label: "Program", icon: "📋" },
  { href: "/progress", label: "Progress", icon: "📈" },
] as const;

export function BottomNav() {
  const pathname = usePathname();
  return (
    <nav
      aria-label="Main"
      className="safe-bottom fixed inset-x-0 bottom-0 z-30 border-t border-line bg-card/90 backdrop-blur-xl"
    >
      <ul className="mx-auto flex max-w-md">
        {TABS.map((tab) => {
          const active = tab.href === "/" ? pathname === "/" : pathname.startsWith(tab.href);
          return (
            <li key={tab.href} className="flex-1">
              <Link
                href={tab.href}
                aria-current={active ? "page" : undefined}
                className={cx(
                  "flex min-h-14 flex-col items-center justify-center gap-0.5 pt-2 text-xs font-bold transition",
                  active ? "text-ink" : "text-muted",
                )}
              >
                <span className={cx("text-xl transition", active ? "scale-110" : "opacity-60 grayscale")} aria-hidden>
                  {tab.icon}
                </span>
                {tab.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
