import { ActivityFeed } from "@/components/home/ActivityFeed";
import { DuoProgress } from "@/components/home/DuoProgress";
import { FinishedCard } from "@/components/home/FinishedCard";
import { Landing } from "@/components/home/Landing";
import { NextWorkoutCard } from "@/components/home/NextWorkoutCard";
import { ThisWeekCard } from "@/components/home/ThisWeekCard";
import { Eyebrow } from "@/components/ui";
import { addDays, formatDateLabel } from "@/lib/dates";
import { getChallengeView, type ChallengeView } from "@/lib/server/challenge-view";
import { getViewer } from "@/lib/server/data";

const NOTICES: Record<string, string> = {
  "invalid-link": "That personal link isn't valid any more. Ask your friend for the invite link, or create a new challenge.",
};

export default async function HomePage({ searchParams }: PageProps<"/">) {
  const viewer = await getViewer();
  if (!viewer) {
    const { notice } = await searchParams;
    return <Landing notice={typeof notice === "string" ? NOTICES[notice] : undefined} />;
  }

  const view = await getChallengeView(viewer);
  const next = view.mine.nextWorkout;
  const nextWorkout = next ? view.workouts.find((w) => w.id === next.id) : undefined;

  return (
    <>
      <header className="animate-rise-in pt-2">
        <Eyebrow>Stronger Together 💪</Eyebrow>
        <h1 className="mt-1 text-3xl font-black tracking-tight">{viewer.challenge.name}</h1>
        <p className="mt-1 font-semibold text-muted">{phaseLabel(view)}</p>
      </header>

      <DuoProgress view={view} />

      {nextWorkout ? (
        <NextWorkoutCard
          workout={nextWorkout}
          total={view.mine.total}
          inProgress={view.mine.inProgressWorkoutIds.has(nextWorkout.id)}
        />
      ) : (
        <FinishedCard view={view} />
      )}

      {view.phase.kind !== "ended" && <ThisWeekCard view={view} />}
      <ActivityFeed items={view.activity} />
    </>
  );
}

function phaseLabel(view: ChallengeView): string {
  const { config, startDate } = view.viewer.challenge;
  switch (view.phase.kind) {
    case "not_started": {
      const days = view.phase.daysUntilStart;
      return `Starts ${days === 1 ? "tomorrow" : formatDateLabel(startDate)} · early sessions count towards week 1`;
    }
    case "active":
      return `Week ${view.phase.week} of ${config.durationWeeks} · ${view.weekTitles.get(view.phase.week) ?? ""}`;
    case "ended":
      return `Challenge ended ${formatDateLabel(addDays(startDate, config.durationWeeks * 7 - 1))}`;
  }
}
