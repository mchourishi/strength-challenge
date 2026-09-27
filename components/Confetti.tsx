"use client";

import { useMemo, type CSSProperties } from "react";

const COLORS = ["#ff5a36", "#ff2e74", "#6b5cff", "#ffc53d", "#2ec486"];

/** Lightweight CSS confetti. Pieces are deterministic so server and client render alike. */
export function Confetti({ pieces = 36 }: { pieces?: number }) {
  const items = useMemo(
    () =>
      Array.from({ length: pieces }, (_, i) => ({
        left: (i * 37) % 100,
        delay: ((i * 13) % 20) / 20,
        duration: 2.2 + ((i * 7) % 10) / 10,
        drift: ((i % 5) - 2) * 18,
        spin: 360 + ((i * 53) % 540),
        color: COLORS[i % COLORS.length],
        size: 6 + (i % 3) * 2,
      })),
    [pieces],
  );

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-50 overflow-hidden motion-reduce:hidden">
      {items.map((p, i) => (
        <span
          key={i}
          className="absolute top-0 rounded-[2px]"
          style={
            {
              left: `${p.left}%`,
              width: p.size,
              height: p.size * 1.6,
              background: p.color,
              animation: `confetti-fall ${p.duration}s ${p.delay}s ease-in forwards`,
              "--drift": `${p.drift}px`,
              "--spin": `${p.spin}deg`,
            } as CSSProperties
          }
        />
      ))}
    </div>
  );
}
