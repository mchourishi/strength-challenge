"use client";

import Link from "next/link";
import type { CompletionSummary } from "@/app/actions";
import { Confetti } from "@/components/Confetti";
import { primaryButton } from "@/components/ui";

export function Celebration({ summary, onClose }: { summary: CompletionSummary; onClose: () => void }) {
  const hitTarget = summary.weekCount === summary.weeklyTarget;
  const title = summary.bothFinished
    ? "CHALLENGE SMASHED TOGETHER! 🏆💪"
    : summary.finishedChallenge
      ? "YOU DID IT! 🏆"
      : hitTarget
        ? `${summary.weekCount} / ${summary.weeklyTarget} THIS WEEK! 🔥🔥🔥`
        : "Workout done! 🔥";

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="celebration-title"
      className="fixed inset-0 z-40 grid place-items-center bg-black/55 px-6 backdrop-blur-sm"
    >
      <Confetti pieces={summary.finishedChallenge || hitTarget ? 48 : 24} />
      <div className="animate-pop-in w-full max-w-sm rounded-[2rem] bg-card p-6 text-center shadow-2xl">
        <h2 id="celebration-title" className="text-3xl font-black leading-tight">
          {title}
        </h2>
        {summary.finishedChallenge ? (
          <p className="mt-2 font-semibold text-muted">{summary.total} strength workouts completed.</p>
        ) : (
          <p className="mt-2 text-lg font-bold text-muted">
            {hitTarget ? "Weekly target hit." : `${summary.weekCount} / ${summary.weeklyTarget} workouts this week`}
          </p>
        )}
        <p className="mt-4 text-5xl font-black tabular-nums">
          {summary.completed}
          <span className="text-2xl text-muted"> / {summary.total}</span>
        </p>
        <p className="text-sm font-semibold text-muted">challenge workouts</p>
        <Link href="/" className={`${primaryButton} mt-6`}>
          SEE OUR PROGRESS
        </Link>
        <button type="button" onClick={onClose} className="mt-2 min-h-11 w-full text-sm font-bold text-muted">
          Stay here
        </button>
      </div>
    </div>
  );
}
