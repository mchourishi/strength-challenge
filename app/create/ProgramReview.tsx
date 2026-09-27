"use client";

import { useState } from "react";
import { cx } from "@/components/ui";
import { formatPrescription } from "@/lib/challenge-generator/format";
import { EQUIPMENT_LABELS, FOCUS_LABELS, GOAL_LABELS } from "@/lib/challenge-generator/labels";
import type { GeneratedProgram } from "@/lib/challenge-generator/types";

const ROLE_LABEL = { primary: "Main lift", secondary: null, accessory: null, finisher: "Finisher" } as const;

export function ProgramReview({ program }: { program: GeneratedProgram }) {
  const [open, setOpen] = useState<number | null>(null);
  const { config } = program;
  const chips = [
    `${config.durationWeeks} weeks`,
    `${config.sessionsPerWeek} workouts/week`,
    `${config.sessionMinutes} min`,
    EQUIPMENT_LABELS[config.equipment],
    FOCUS_LABELS[config.focus],
    GOAL_LABELS[config.goal],
  ];

  return (
    <div className="flex flex-col gap-4">
      <ul className="flex flex-wrap gap-2" aria-label="Challenge settings">
        {chips.map((chip) => (
          <li key={chip} className="rounded-full bg-card px-3 py-1.5 text-sm font-bold ring-1 ring-line">
            {chip}
          </li>
        ))}
      </ul>

      {program.weeks.map((week) => (
        <section key={week.weekNumber} className="rounded-3xl bg-card p-4 ring-1 ring-line">
          <h2 className="px-1 text-lg font-black">
            Week {week.weekNumber} <span className="font-bold text-muted">— {week.title}</span>
          </h2>
          <ol className="mt-2 flex flex-col gap-2">
            {program.workouts
              .filter((w) => w.weekNumber === week.weekNumber)
              .map((w) => {
                const expanded = open === w.sequence;
                return (
                  <li key={w.sequence} className="rounded-2xl bg-card-2">
                    <button
                      type="button"
                      aria-expanded={expanded}
                      onClick={() => setOpen(expanded ? null : w.sequence)}
                      className="flex min-h-14 w-full items-center gap-3 px-3 py-2 text-left"
                    >
                      <span className="grid size-8 shrink-0 place-items-center rounded-full bg-card text-sm font-black ring-1 ring-line">
                        {w.sequence}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-bold">
                          {w.emoji} {w.name}
                        </span>
                        <span className="block text-xs font-semibold text-muted">
                          {w.exercises.length} exercises · ~{w.estimatedMinutes} min
                        </span>
                      </span>
                      <span aria-hidden className={cx("text-muted transition", expanded && "rotate-90")}>
                        ›
                      </span>
                    </button>
                    {expanded && (
                      <div className="animate-rise-in px-3 pb-3">
                        <p className="mb-2 rounded-xl bg-card px-3 py-2 text-sm">
                          <span className="font-bold">Today&apos;s challenge: </span>
                          {w.challengeText}
                        </p>
                        <ul className="flex flex-col divide-y divide-line">
                          {w.exercises.map((e) => (
                            <li key={e.exerciseId} className="flex items-center justify-between gap-3 py-2 text-sm">
                              <span className="min-w-0">
                                <span className="font-semibold">{e.name}</span>
                                {ROLE_LABEL[e.role] && (
                                  <span className="ml-2 text-[0.65rem] font-black uppercase tracking-wider text-brand">
                                    {ROLE_LABEL[e.role]}
                                  </span>
                                )}
                              </span>
                              <span className="shrink-0 font-bold tabular-nums text-muted">{formatPrescription(e)}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </li>
                );
              })}
          </ol>
        </section>
      ))}
    </div>
  );
}
