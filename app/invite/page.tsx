import Link from "next/link";
import { redirect } from "next/navigation";
import { ShareLink } from "@/components/ShareLink";
import { Card, Eyebrow, secondaryButton } from "@/components/ui";
import { getChallengeOverview, getViewer } from "@/lib/server/data";
import { getOrigin } from "@/lib/server/origin";

export const metadata = { title: "Invite · Stronger Together" };

export default async function InvitePage() {
  const viewer = await getViewer();
  if (!viewer) redirect("/");
  const [overview, origin] = await Promise.all([getChallengeOverview(viewer.challenge.id), getOrigin()]);
  const friend = overview.participants.find((p) => p.id !== viewer.participant.id);

  return (
    <main className="safe-top mx-auto flex min-h-dvh w-full max-w-md flex-col gap-6 px-4 pb-10">
      <div className="animate-pop-in pt-8 text-center">
        <div className="text-6xl" aria-hidden>
          🤝
        </div>
        <h1 className="mt-4 text-3xl font-black tracking-tight">
          {friend ? `${friend.name} is in!` : "Invite your training partner 💪"}
        </h1>
        <p className="mt-2 text-muted">
          {friend
            ? "You're both following the same program. Time to train."
            : "Send this link to your friend. They'll join your challenge and get exactly the same program."}
        </p>
      </div>

      {!friend && (
        <Card className="flex flex-col gap-3">
          <Eyebrow>Your invite link</Eyebrow>
          <ShareLink
            url={`${origin}/join/${viewer.challenge.inviteToken}`}
            label="SHARE INVITE LINK"
            shareTitle="Stronger Together"
            shareText={`Join my strength challenge "${viewer.challenge.name}" 💪`}
          />
          <p className="text-xs text-muted">Anyone with this link can join until your challenge has two people.</p>
        </Card>
      )}

      <Card className="flex flex-col gap-1">
        <p className="font-bold">📲 Add it to your home screen</p>
        <p className="text-sm text-muted">
          iPhone: tap Share → <b>Add to Home Screen</b>. Android: tap ⋮ → <b>Install app</b>. It opens like a real app.
        </p>
      </Card>

      <Link href="/" className={`${secondaryButton} mt-auto`}>
        Go to my challenge →
      </Link>
    </main>
  );
}
