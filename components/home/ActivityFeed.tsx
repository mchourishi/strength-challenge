import { Card, Eyebrow } from "@/components/ui";
import type { ActivityItem } from "@/lib/server/challenge-view";

export function ActivityFeed({ items }: { items: ActivityItem[] }) {
  return (
    <Card>
      <Eyebrow>Recent activity</Eyebrow>
      {items.length === 0 ? (
        <p className="mt-3 text-muted">No workouts yet. Be the first! 💪</p>
      ) : (
        <ul className="mt-3 flex flex-col gap-3">
          {items.map((item) => (
            <li key={item.key} className="flex items-center gap-3">
              <span
                aria-hidden
                className={`grid size-10 shrink-0 place-items-center rounded-full text-lg ${item.isMe ? "bg-brand/12" : "bg-friend/15"}`}
              >
                {item.emoji}
              </span>
              <div className="min-w-0">
                <p className="truncate font-semibold">{item.text}</p>
                <p className="text-sm text-muted">{item.when}</p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
