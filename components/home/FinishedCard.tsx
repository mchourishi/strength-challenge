import { Confetti } from "@/components/Confetti";
import type { ChallengeView } from "@/lib/server/challenge-view";

export function FinishedCard({ view }: { view: ChallengeView }) {
  const { me, friend, mine, theirs } = view;
  const both = !!theirs && theirs.completed === theirs.total;

  return (
    <section className="animate-pop-in relative overflow-hidden rounded-[2rem] bg-brand-gradient p-6 text-center text-on-brand shadow-xl shadow-brand/25">
      <Confetti pieces={both ? 48 : 28} />
      <div className="text-6xl" aria-hidden>
        🏆
      </div>
      {both && friend ? (
        <>
          <h2 className="mt-3 text-3xl font-black leading-tight">CHALLENGE SMASHED TOGETHER! 💪</h2>
          <div className="mt-5 grid grid-cols-2 gap-3">
            {[me, friend].map((p) => (
              <div key={p.id} className="rounded-2xl bg-white/15 px-3 py-3">
                <p className="truncate font-bold">{p.name}</p>
                <p className="text-xl font-black">
                  {mine.total} / {mine.total} ✓
                </p>
              </div>
            ))}
          </div>
        </>
      ) : (
        <>
          <h2 className="mt-3 text-3xl font-black">YOU DID IT!</h2>
          <p className="mt-2 font-semibold text-white/90">{mine.total} strength workouts completed.</p>
          {friend && theirs && (
            <p className="mt-4 rounded-2xl bg-white/15 px-4 py-3 font-semibold">
              Cheer on {friend.name} — {theirs.completed} / {theirs.total} so far 📣
            </p>
          )}
        </>
      )}
    </section>
  );
}
