import { redirect } from "next/navigation";
import { ShareLink } from "@/components/ShareLink";
import { Card, Eyebrow, WeekDots } from "@/components/ui";
import { formatDateLabel, localDateString } from "@/lib/dates";
import type { ChallengeView } from "@/lib/server/challenge-view";
import { percent } from "@/lib/progress";
import { getChallengeView } from "@/lib/server/challenge-view";
import { getPersonalRecords, getViewer } from "@/lib/server/data";
import { getOrigin } from "@/lib/server/origin";

export const metadata = { title: "Progress · Stronger Together" };

export default async function ProgressPage() {
  const viewer = await getViewer();
  if (!viewer) redirect("/");
  const [view, records, origin] = await Promise.all([
    getChallengeView(viewer),
    getPersonalRecords(viewer.participant.id),
    getOrigin(),
  ]);
  const { config, timezone } = viewer.challenge;
  const pct = percent(view.mine.completed, view.mine.total);

  return (
    <>
      <header className="pt-2">
        <Eyebrow>Your progress</Eyebrow>
        <h1 className="mt-1 text-3xl font-black tracking-tight">{view.me.name}</h1>
      </header>

      <Card className="flex items-center gap-5">
        <ProgressRing pct={pct} />
        <div>
          <p className="text-3xl font-black tabular-nums">
            {view.mine.completed} <span className="text-lg font-bold text-muted">/ {view.mine.total}</span>
          </p>
          <p className="font-semibold text-muted">workouts completed</p>
          <p className="mt-1 text-sm font-bold">
            {view.phase.kind === "active"
              ? `Week ${view.phase.week} of ${config.durationWeeks}`
              : view.phase.kind === "ended"
                ? "Challenge finished"
                : "Not started yet"}
          </p>
        </div>
      </Card>

      <Card className="flex flex-col gap-4">
        <Eyebrow>Weekly target · {config.sessionsPerWeek} per week</Eyebrow>
        {Array.from({ length: config.durationWeeks }, (_, i) => (
          <div key={i} className="flex flex-col gap-1.5 border-b border-line pb-3 last:border-0 last:pb-0">
            <p className="text-sm font-black">
              Week {i + 1} <span className="font-semibold text-muted">· {view.weekTitles.get(i + 1)}</span>
            </p>
            <div className="flex items-center justify-between gap-2">
              <span className="truncate text-sm font-semibold">{view.me.name}</span>
              <WeekDots count={view.mine.weeklyCounts[i]} target={config.sessionsPerWeek} label={`${view.me.name}, week ${i + 1}`} />
            </div>
            {view.friend && view.theirs && (
              <div className="flex items-center justify-between gap-2">
                <span className="truncate text-sm font-semibold">{view.friend.name}</span>
                <WeekDots
                  count={view.theirs.weeklyCounts[i]}
                  target={config.sessionsPerWeek}
                  tone="friend"
                  label={`${view.friend.name}, week ${i + 1}`}
                />
              </div>
            )}
          </div>
        ))}
      </Card>

      <HistoryCard view={view} timezone={timezone} />

      <Card>
        <div className="flex items-center justify-between">
          <Eyebrow>Personal bests</Eyebrow>
          <span className="text-xs font-bold text-muted">🔒 Only you can see this</span>
        </div>
        {records.length === 0 ? (
          <p className="mt-3 text-sm text-muted">
            Optional: log a weight during a workout and your best lifts will appear here.
          </p>
        ) : (
          <ul className="mt-3 flex flex-col divide-y divide-line">
            {records.map((r) => (
              <li key={r.name} className="flex items-center justify-between py-2">
                <span className="font-semibold">{r.name}</span>
                <span className="font-black tabular-nums">
                  {r.weightKg} kg{r.reps ? ` × ${r.reps}` : ""}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Card>

      {!view.friend && (
        <Card className="flex flex-col gap-3">
          <Eyebrow>Invite your training partner</Eyebrow>
          <ShareLink
            url={`${origin}/join/${viewer.challenge.inviteToken}`}
            label="SHARE INVITE LINK"
            shareTitle="Stronger Together"
            shareText={`Join my strength challenge "${viewer.challenge.name}" 💪`}
          />
        </Card>
      )}

      <Card className="flex flex-col gap-3">
        <Eyebrow>Use on another device</Eyebrow>
        <p className="text-sm text-muted">
          This is your personal link. Open it on your phone or another browser to pick up where you left off. Keep it private — anyone
          with it can log workouts as you.
        </p>
        <ShareLink
          url={`${origin}/me/${viewer.token}`}
          label="Copy my personal link"
          shareTitle="My Stronger Together link"
          shareText="My private Stronger Together link"
          variant="secondary"
        />
      </Card>
    </>
  );
}

function ProgressRing({ pct }: { pct: number }) {
  const r = 34;
  const c = 2 * Math.PI * r;
  return (
    <div className="relative size-24 shrink-0" role="img" aria-label={`${pct}% complete`}>
      <svg viewBox="0 0 80 80" className="size-24 -rotate-90">
        <defs>
          <linearGradient id="ring" x1="0" x2="1" y1="0" y2="1">
            <stop offset="0%" stopColor="var(--brand)" />
            <stop offset="100%" stopColor="var(--brand-2)" />
          </linearGradient>
        </defs>
        <circle cx="40" cy="40" r={r} fill="none" stroke="var(--card-2)" strokeWidth="9" />
        <circle
          cx="40"
          cy="40"
          r={r}
          fill="none"
          stroke="url(#ring)"
          strokeWidth="9"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c - (pct / 100) * c}
          className="transition-[stroke-dashoffset] duration-700"
        />
      </svg>
      <span className="absolute inset-0 grid place-items-center text-xl font-black tabular-nums">{pct}%</span>
    </div>
  );
}

function HistoryCard({ view, timezone }: { view: ChallengeView; timezone: string }) {
  const history = view.workouts
    .filter((w) => view.mine.completedAt.has(w.id))
    .map((w) => ({ workout: w, at: view.mine.completedAt.get(w.id)! }))
    .sort((a, b) => b.at.localeCompare(a.at));

  return (
    <Card>
      <Eyebrow>Workout history</Eyebrow>
      {history.length === 0 ? (
        <p className="mt-3 text-sm text-muted">Your completed workouts will show up here.</p>
      ) : (
        <ul className="mt-3 flex flex-col divide-y divide-line">
          {history.map(({ workout, at }) => (
            <li key={workout.id} className="flex items-center justify-between gap-3 py-2">
              <span className="min-w-0 truncate font-semibold">
                <span className="text-ok">✓</span> {workout.emoji} {workout.name}
                <span className="text-muted"> · W{workout.weekNumber}</span>
              </span>
              <span className="shrink-0 text-sm text-muted">{formatDateLabel(localDateString(new Date(at), timezone))}</span>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
