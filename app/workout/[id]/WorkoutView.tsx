"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
  completeWorkoutAction,
  reopenWorkoutAction,
  saveExerciseLogAction,
  setExerciseDoneAction,
  swapExerciseAction,
  type CompletionSummary,
} from "@/app/actions";
import { ProgressBar, cx, primaryButton } from "@/components/ui";
import { Celebration } from "./Celebration";
import { ExerciseCard } from "./ExerciseCard";
import { SwapSheet } from "./SwapSheet";
import type { ExerciseItem, ExerciseState, PreviousLog, SwapOption } from "./types";

interface Props {
  workoutId: string;
  title: string;
  emoji: string;
  subtitle: string;
  challengeText: string;
  safetyNote: string;
  items: ExerciseItem[];
  previousLogs: Record<string, PreviousLog>;
  /** e.g. "Today" when already completed, otherwise null. */
  completedLabel: string | null;
}

export function WorkoutView(props: Props) {
  const { workoutId, items, previousLogs } = props;
  const router = useRouter();
  const [states, setStates] = useState<Record<string, ExerciseState>>(() =>
    Object.fromEntries(items.map((item) => [item.id, item.initial])),
  );
  const [completedLabel, setCompletedLabel] = useState(props.completedLabel);
  const [swapFor, setSwapFor] = useState<string | null>(null);
  const [confirmFinish, setConfirmFinish] = useState(false);
  const [summary, setSummary] = useState<CompletionSummary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [swapPending, startSwap] = useTransition();
  const [finishing, startFinish] = useTransition();

  const doneCount = items.filter((item) => states[item.id].completed).length;
  const allDone = doneCount === items.length;

  function patch(id: string, update: Partial<ExerciseState>) {
    setStates((s) => ({ ...s, [id]: { ...s[id], ...update } }));
  }

  // Ticks are optimistic: instant feedback, rolled back if the save fails.
  async function toggle(id: string) {
    const next = !states[id].completed;
    patch(id, { completed: next });
    setError(null);
    const result = await setExerciseDoneAction(id, next);
    if (!result.ok) {
      patch(id, { completed: !next });
      setError(result.error);
    }
  }

  async function saveLog(id: string, weightKg: number | null, reps: number | null): Promise<boolean> {
    const result = await saveExerciseLogAction(id, weightKg, reps);
    if (result.ok) patch(id, { weightKg, reps });
    return result.ok;
  }

  function chooseSwap(id: string, option: SwapOption | null) {
    startSwap(async () => {
      const result = await swapExerciseAction(id, option?.id ?? null);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      patch(id, {
        substituteId: option?.id ?? null,
        substituteName: option?.name ?? null,
        weightKg: null,
        reps: null,
      });
      setSwapFor(null);
    });
  }

  function finish() {
    if (!allDone && !confirmFinish) {
      setConfirmFinish(true);
      return;
    }
    setConfirmFinish(false);
    setError(null);
    startFinish(async () => {
      const result = await completeWorkoutAction(workoutId);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setCompletedLabel("Today");
      setSummary(result.data);
      router.refresh();
    });
  }

  function reopen() {
    startFinish(async () => {
      const result = await reopenWorkoutAction(workoutId);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setCompletedLabel(null);
      router.refresh();
    });
  }

  const swapItem = items.find((item) => item.id === swapFor);

  return (
    <main className="safe-top mx-auto flex min-h-dvh w-full max-w-md flex-col gap-4 px-4 pb-44">
      <header className="flex flex-col gap-1 pt-1">
        <Link href="/" className="flex min-h-11 w-fit items-center text-sm font-bold text-muted">
          ← Back
        </Link>
        <h1 className="text-3xl font-black leading-tight tracking-tight">
          <span aria-hidden>{props.emoji} </span>
          {props.title}
        </h1>
        <p className="font-semibold text-muted">{props.subtitle}</p>
      </header>

      <section className="rounded-3xl bg-brand-gradient p-4 text-on-brand">
        <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-white/80">Today&apos;s challenge</p>
        <p className="mt-1 font-semibold leading-snug">{props.challengeText}</p>
      </section>
      <p className="px-1 text-xs text-muted">⚠️ {props.safetyNote}</p>

      <div className="sticky top-0 z-10 -mx-4 bg-bg/90 px-4 pb-2 pt-[max(env(safe-area-inset-top),0.5rem)] backdrop-blur-xl">
        <div className="flex items-center justify-between pb-1.5 text-sm font-bold">
          <span aria-live="polite">
            {doneCount} / {items.length} exercises complete
          </span>
          {allDone && <span className="text-ok">All done! 🎉</span>}
        </div>
        <ProgressBar value={doneCount} max={items.length} label="Exercises complete" />
      </div>

      {error && (
        <p role="alert" className="rounded-2xl bg-brand/10 px-4 py-3 text-sm font-semibold text-brand">
          {error}
        </p>
      )}

      <ol className="flex flex-col gap-3">
        {items.map((item) => {
          const state = states[item.id];
          return (
            <ExerciseCard
              key={`${item.id}-${state.substituteId ?? ""}`}
              item={item}
              state={state}
              previous={previousLogs[state.substituteId ?? item.exerciseId]}
              onToggle={() => toggle(item.id)}
              onSaveLog={(w, r) => saveLog(item.id, w, r)}
              onOpenSwap={() => setSwapFor(item.id)}
            />
          );
        })}
      </ol>

      <div className="safe-bottom fixed inset-x-0 bottom-0 z-20 border-t border-line bg-bg/90 px-4 pt-3 backdrop-blur-xl">
        <div className="mx-auto flex max-w-md flex-col gap-2">
          {completedLabel ? (
            <>
              <p className="flex min-h-14 items-center justify-center gap-2 rounded-2xl bg-ok/12 font-black text-ok">
                ✓ Completed {completedLabel.toLowerCase() === "today" ? "today" : completedLabel}
              </p>
              <button type="button" onClick={reopen} disabled={finishing} className="min-h-11 text-sm font-bold text-muted">
                {finishing ? "Reopening…" : "Completed by mistake? Reopen workout"}
              </button>
            </>
          ) : (
            <>
              {confirmFinish && (
                <div className="flex items-center justify-between gap-2 rounded-2xl bg-card px-4 py-2 ring-1 ring-line">
                  <span className="text-sm font-semibold">
                    {doneCount} of {items.length} ticked — finish anyway?
                  </span>
                  <button type="button" onClick={() => setConfirmFinish(false)} className="min-h-11 px-2 text-sm font-bold text-muted">
                    Keep going
                  </button>
                </div>
              )}
              <button type="button" onClick={finish} disabled={finishing} className={cx(primaryButton)}>
                {finishing ? "Saving…" : confirmFinish ? "YES, COMPLETE WORKOUT 💪" : "COMPLETE WORKOUT 💪"}
              </button>
            </>
          )}
        </div>
      </div>

      {swapItem && (
        <SwapSheet
          open
          exerciseName={states[swapItem.id].substituteName ?? swapItem.name}
          prescribedName={swapItem.name}
          currentSubstituteId={states[swapItem.id].substituteId}
          options={swapItem.swapOptions}
          pending={swapPending}
          onChoose={(option) => chooseSwap(swapItem.id, option)}
          onClose={() => setSwapFor(null)}
        />
      )}

      {summary && <Celebration summary={summary} onClose={() => setSummary(null)} />}
    </main>
  );
}
