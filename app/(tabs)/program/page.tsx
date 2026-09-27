import Link from "next/link";
import { redirect } from "next/navigation";
import { Card, Eyebrow, WeekDots, cx } from "@/components/ui";
import { EQUIPMENT_LABELS, FOCUS_LABELS, GOAL_LABELS } from "@/lib/challenge-generator/labels";
import { getChallengeView } from "@/lib/server/challenge-view";
import { getViewer } from "@/lib/server/data";

export const metadata = { title: "Program · Stronger Together" };

export default async function ProgramPage() {
  const viewer = await getViewer();
  if (!viewer) redirect("/");
  const view = await getChallengeView(viewer);
  const { config } = viewer.challenge;

  const weeks = Array.from({ length: config.durationWeeks }, (_, i) => i + 1);
  const nextId = view.mine.nextWorkout?.id;

  return (
    <>
      <header className="pt-2">
        <Eyebrow>Your program</Eyebrow>
        <h1 className="mt-1 text-3xl font-black tracking-tight">
          {config.durationWeeks} weeks · {config.sessionsPerWeek}×/week
        </h1>
        <p className="mt-1 text-sm font-semibold text-muted">
          {config.sessionMinutes} min · {EQUIPMENT_LABELS[config.equipment]} · {FOCUS_LABELS[config.focus]} ·{" "}
          {GOAL_LABELS[config.goal]}
        </p>
      </header>

      {weeks.map((week) => {
        const workouts = view.workouts.filter((w) => w.weekNumber === week);
        const isCurrent = view.phase.kind === "active" && view.phase.week === week;
        return (
          <Card key={week} className={cx("flex flex-col gap-3", isCurrent && "ring-2! ring-brand!")}>
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-lg font-black">
                Week {week} <span className="font-bold text-muted">— {view.weekTitles.get(week)}</span>
              </h2>
              <WeekDots
                count={view.mine.weeklyCounts[week - 1] ?? 0}
                target={config.sessionsPerWeek}
                label={`Week ${week} workouts completed`}
              />
            </div>
            <ul className="flex flex-col gap-2">
              {workouts.map((w) => {
                const done = view.mine.completedWorkoutIds.has(w.id);
                const isNext = w.id === nextId;
                return (
                  <li key={w.id}>
                    <Link
                      href={`/workout/${w.id}`}
                      className={cx(
                        "flex min-h-14 items-center gap-3 rounded-2xl px-3 py-2 transition active:scale-[0.99]",
                        isNext ? "bg-brand/10" : "bg-card-2",
                      )}
                    >
                      <span
                        aria-label={done ? "Completed" : "Not completed"}
                        className={cx(
                          "grid size-8 shrink-0 place-items-center rounded-full text-sm font-black",
                          done ? "bg-ok text-white" : "bg-card ring-1 ring-line text-muted",
                        )}
                      >
                        {done ? "✓" : w.sequence}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-bold">
                          {w.emoji} {w.name}
                        </span>
                        <span className="block text-xs font-semibold text-muted">~{w.estimatedMinutes} min</span>
                      </span>
                      {isNext && <span className="text-xs font-black text-brand">NEXT</span>}
                      <span aria-hidden className="text-muted">
                        ›
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </Card>
        );
      })}
    </>
  );
}
