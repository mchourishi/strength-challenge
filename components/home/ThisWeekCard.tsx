import type { ReactNode } from "react";
import { Card, Eyebrow, WeekDots } from "@/components/ui";
import type { ChallengeView } from "@/lib/server/challenge-view";

export function ThisWeekCard({ view }: { view: ChallengeView }) {
  const target = view.viewer.challenge.config.sessionsPerWeek;
  const mineCount = view.mine.weeklyCounts[view.week - 1] ?? 0;
  const theirCount = view.theirs?.weeklyCounts[view.week - 1] ?? 0;
  const done = mineCount >= target;

  return (
    <Card className="flex flex-col gap-4">
      <div className="flex items-end justify-between">
        <div>
          <Eyebrow>This week</Eyebrow>
          <p className="mt-1 text-2xl font-black tabular-nums">
            {mineCount} / {target} <span className="text-base font-bold text-muted">workouts</span>
          </p>
        </div>
        <p className="pb-1 text-sm font-bold text-muted">{done ? "Target hit! 🔥" : `${target - mineCount} to go`}</p>
      </div>
      <div className="flex flex-col gap-2">
        <Row name={view.me.name}>
          <WeekDots count={mineCount} target={target} label={`${view.me.name} this week`} />
        </Row>
        {view.friend && (
          <Row name={view.friend.name}>
            <WeekDots count={theirCount} target={target} tone="friend" label={`${view.friend.name} this week`} />
          </Row>
        )}
      </div>
    </Card>
  );
}

function Row({ name, children }: { name: string; children: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="truncate text-sm font-semibold">{name}</span>
      {children}
    </div>
  );
}
