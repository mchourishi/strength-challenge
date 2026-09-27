import Link from "next/link";
import type { ChallengeWorkout } from "@/lib/server/data";

interface Props {
  workout: ChallengeWorkout;
  total: number;
  inProgress: boolean;
}

export function NextWorkoutCard({ workout, total, inProgress }: Props) {
  return (
    <section
      aria-labelledby="next-workout"
      className="animate-pop-in relative overflow-hidden rounded-[2rem] bg-brand-gradient p-6 text-on-brand shadow-xl shadow-brand/25"
    >
      <div aria-hidden className="absolute -right-8 -top-10 size-40 rounded-full bg-white/10" />
      <div aria-hidden className="absolute -bottom-14 -right-2 size-32 rounded-full bg-white/10" />
      <p className="relative text-xs font-extrabold uppercase tracking-[0.16em] text-white/80">
        {inProgress ? "Pick up where you left off" : "Your next challenge"}
      </p>
      <h2 id="next-workout" className="relative mt-3 text-[1.7rem] font-black leading-tight">
        <span aria-hidden>{workout.emoji} </span>
        {workout.name}
      </h2>
      <p className="relative mt-1 font-semibold text-white/85">
        Week {workout.weekNumber} · Workout {workout.sequence} of {total} · ~{workout.estimatedMinutes} min
      </p>
      <Link
        href={`/workout/${workout.id}`}
        className="relative mt-6 flex min-h-14 items-center justify-center rounded-2xl bg-white text-base font-black tracking-wide text-[#e0314f] shadow-md transition active:scale-[0.98]"
      >
        {inProgress ? "CONTINUE WORKOUT" : "START WORKOUT"}
      </Link>
    </section>
  );
}
