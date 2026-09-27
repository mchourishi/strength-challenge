import Link from "next/link";
import { redirect } from "next/navigation";
import { Card, EmptyState, primaryButton } from "@/components/ui";
import { EQUIPMENT_LABELS, FOCUS_LABELS, GOAL_LABELS } from "@/lib/challenge-generator/labels";
import { formatDateLabel } from "@/lib/dates";
import { findChallengeByInvite, getViewer } from "@/lib/server/data";
import { JoinForm } from "./JoinForm";

export const metadata = { title: "Join · Stronger Together" };

export default async function JoinPage({ params }: PageProps<"/join/[token]">) {
  const { token } = await params;
  const [found, viewer] = await Promise.all([findChallengeByInvite(token), getViewer()]);

  if (found && viewer?.challenge.id === found.challenge.id) redirect("/");

  return (
    <main className="safe-top mx-auto flex min-h-dvh w-full max-w-md flex-col gap-6 px-4 pb-10">
      {!found ? (
        <EmptyState emoji="🔗" title="This invite link isn't valid">
          Check you copied the whole link, or ask your friend to send it again.
        </EmptyState>
      ) : found.participants.length >= 2 ? (
        <EmptyState emoji="👯" title="This challenge is full">
          Stronger Together challenges are for two friends. You could start your own!
          <Link href="/create" className={`${primaryButton} mt-6`}>
            CREATE A CHALLENGE
          </Link>
        </EmptyState>
      ) : (
        <>
          <div className="animate-pop-in pt-8 text-center">
            <div className="text-6xl" aria-hidden>
              💪
            </div>
            <h1 className="mt-4 text-3xl font-black tracking-tight">
              {found.participants[0]?.name ?? "Your friend"} invited you!
            </h1>
            <p className="mt-2 text-muted">
              Join <b className="text-ink">{found.challenge.name}</b> and follow the same program together.
            </p>
          </div>

          <Card className="grid grid-cols-2 gap-3 text-sm">
            <Fact label="Length" value={`${found.challenge.config.durationWeeks} weeks`} />
            <Fact label="Workouts" value={`${found.challenge.config.sessionsPerWeek} per week`} />
            <Fact label="Session" value={`~${found.challenge.config.sessionMinutes} min`} />
            <Fact label="Starts" value={formatDateLabel(found.challenge.startDate)} />
            <Fact label="Equipment" value={EQUIPMENT_LABELS[found.challenge.config.equipment]} />
            <Fact label="Focus" value={FOCUS_LABELS[found.challenge.config.focus]} />
            <Fact label="Goal" value={GOAL_LABELS[found.challenge.config.goal]} />
          </Card>

          <Card>
            <JoinForm inviteToken={token} />
            {viewer && (
              <p className="mt-3 text-xs text-muted">
                This device is already in another challenge. Joining will switch it to this one — save your personal link from
                the Progress screen first if you want to go back.
              </p>
            )}
          </Card>
        </>
      )}
    </main>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-bold uppercase tracking-wider text-muted">{label}</p>
      <p className="font-bold">{value}</p>
    </div>
  );
}
