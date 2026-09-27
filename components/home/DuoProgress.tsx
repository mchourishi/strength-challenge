import Link from "next/link";
import { Card, ProgressBar } from "@/components/ui";
import type { ChallengeView } from "@/lib/server/challenge-view";

export function DuoProgress({ view }: { view: ChallengeView }) {
  const { me, friend, mine, theirs } = view;
  return (
    <Card className="grid grid-cols-2 gap-4">
      <div className="flex flex-col gap-2">
        <p className="truncate text-sm font-bold text-muted">{me.name}</p>
        <p className="text-3xl font-black tabular-nums">
          <span aria-hidden>🔥 </span>
          {mine.completed}
          <span className="text-lg font-bold text-muted"> / {mine.total}</span>
        </p>
        <ProgressBar value={mine.completed} max={mine.total} label={`${me.name}'s progress`} />
      </div>

      {friend && theirs ? (
        <div className="flex flex-col gap-2">
          <p className="truncate text-sm font-bold text-muted">{friend.name}</p>
          <p className="text-3xl font-black tabular-nums">
            <span aria-hidden>💪 </span>
            {theirs.completed}
            <span className="text-lg font-bold text-muted"> / {theirs.total}</span>
          </p>
          <ProgressBar value={theirs.completed} max={theirs.total} tone="friend" label={`${friend.name}'s progress`} />
        </div>
      ) : (
        <Link
          href="/invite"
          className="flex flex-col items-start justify-center gap-1 rounded-2xl border-2 border-dashed border-line px-3 py-2 transition active:scale-[0.98]"
        >
          <span className="text-sm font-bold">Waiting for your friend</span>
          <span className="text-sm font-bold text-brand">Send invite →</span>
        </Link>
      )}
    </Card>
  );
}
