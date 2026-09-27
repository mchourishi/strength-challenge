"use client";

import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import { createChallengeAction } from "@/app/actions";
import { cx, primaryButton, secondaryButton } from "@/components/ui";
import { DEFAULT_CONFIG } from "@/lib/challenge-generator/config";
import { generateProgram } from "@/lib/challenge-generator/generator";
import { randomSeed } from "@/lib/challenge-generator/random";
import type { ChallengeConfig } from "@/lib/challenge-generator/types";
import { localDateString } from "@/lib/dates";
import { OptionTile } from "./OptionTile";
import { ProgramReview } from "./ProgramReview";
import { CHOICE_STEPS } from "./wizard-steps";

const ABOUT_STEP = CHOICE_STEPS.length;
const TOTAL_STEPS = CHOICE_STEPS.length + 1;

const inputClass =
  "min-h-14 w-full rounded-2xl bg-card px-4 text-lg font-semibold ring-1 ring-line outline-none focus:ring-2 focus:ring-brand";

function browserTimeZone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  } catch {
    return "UTC";
  }
}

export function CreateWizard({ switchingChallenge }: { switchingChallenge: boolean }) {
  const [config, setConfig] = useState<ChallengeConfig>(DEFAULT_CONFIG);
  const [step, setStep] = useState(0);
  const [creatorName, setCreatorName] = useState("");
  const [challengeName, setChallengeName] = useState("Stronger Together");
  const [startDate, setStartDate] = useState("");
  const [seed, setSeed] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [starting, startTransition] = useTransition();

  // Generation is pure and fast, so the preview is computed on the client.
  // The server regenerates from (config, seed) when the challenge is started.
  const program = useMemo(() => (seed === null ? null : generateProgram(config, { seed })), [config, seed]);

  function goTo(next: number) {
    if (next === ABOUT_STEP && !startDate) setStartDate(localDateString(new Date(), browserTimeZone()));
    setError(null);
    setStep(next);
    window.scrollTo({ top: 0 });
  }

  function choose<K extends keyof ChallengeConfig>(key: K, value: ChallengeConfig[K]) {
    setConfig((c) => ({ ...c, [key]: value }));
    setTimeout(() => goTo(step + 1), 180);
  }

  function generate() {
    if (!creatorName.trim()) return setError("Please enter your first name.");
    if (!challengeName.trim()) return setError("Please give your challenge a name.");
    if (!startDate) return setError("Please choose a start date.");
    setSeed(randomSeed());
    window.scrollTo({ top: 0 });
  }

  function start() {
    if (seed === null) return;
    setError(null);
    startTransition(async () => {
      const result = await createChallengeAction({
        config,
        seed,
        challengeName,
        creatorName,
        startDate,
        timezone: browserTimeZone(),
      });
      // On success the action redirects to the invite screen.
      if (result && !result.ok) setError(result.error);
    });
  }

  if (program) {
    return (
      <div className="flex flex-col gap-5 pb-44">
        <header className="animate-rise-in pt-4">
          <button type="button" onClick={() => setSeed(null)} className="min-h-11 text-sm font-bold text-muted">
            ← Edit choices
          </button>
          <h1 className="mt-1 text-3xl font-black tracking-tight">YOUR CHALLENGE 💪</h1>
          <p className="mt-1 text-muted">Tap a workout to see its exercises. Happy? Start it and invite your friend.</p>
        </header>

        <div key={seed} className="animate-rise-in">
          <ProgramReview program={program} />
        </div>

        <div className="safe-bottom fixed inset-x-0 bottom-0 z-20 border-t border-line bg-bg/90 px-4 pt-3 backdrop-blur-xl">
          <div className="mx-auto flex max-w-md flex-col gap-2">
            {error && (
              <p role="alert" className="text-center text-sm font-semibold text-brand">
                {error}
              </p>
            )}
            <button type="button" onClick={start} disabled={starting} className={primaryButton}>
              {starting ? "Saving your challenge…" : "START THIS CHALLENGE"}
            </button>
            <button type="button" onClick={() => setSeed(randomSeed())} disabled={starting} className={cx(secondaryButton, "min-h-12")}>
              ↻ REGENERATE
            </button>
          </div>
        </div>
      </div>
    );
  }

  const choiceStep = step < ABOUT_STEP ? CHOICE_STEPS[step] : null;

  return (
    <div className="flex flex-1 flex-col gap-5 pb-8">
      <header className="flex items-center justify-between pt-2">
        {step === 0 ? (
          <Link href="/" className="flex min-h-11 items-center text-sm font-bold text-muted">
            ✕ Cancel
          </Link>
        ) : (
          <button type="button" onClick={() => goTo(step - 1)} className="min-h-11 text-sm font-bold text-muted">
            ← Back
          </button>
        )}
        <span className="text-sm font-bold text-muted">
          {step + 1} of {TOTAL_STEPS}
        </span>
      </header>

      <div className="flex gap-1.5" aria-hidden>
        {Array.from({ length: TOTAL_STEPS }, (_, i) => (
          <span key={i} className={cx("h-1.5 flex-1 rounded-full transition", i <= step ? "bg-brand" : "bg-card-2")} />
        ))}
      </div>

      {switchingChallenge && step === 0 && (
        <p className="rounded-2xl bg-card-2 px-4 py-3 text-sm">
          This device is already in a challenge. Creating a new one will switch to it — copy your personal link from the
          Progress screen first if you want to go back.
        </p>
      )}

      {choiceStep ? (
        <section key={choiceStep.key} className="animate-rise-in flex flex-col gap-3" aria-labelledby="step-title">
          <h1 id="step-title" className="text-3xl font-black tracking-tight">
            {choiceStep.title}
          </h1>
          {choiceStep.hint && <p className="-mt-1 text-muted">{choiceStep.hint}</p>}
          <div role="radiogroup" aria-labelledby="step-title" className="mt-2 flex flex-col gap-3">
            {choiceStep.options.map((option) => (
              <OptionTile
                key={String(option.value)}
                option={option}
                selected={config[choiceStep.key] === option.value}
                onSelect={() => choose(choiceStep.key, option.value)}
              />
            ))}
          </div>
          <button type="button" onClick={() => goTo(step + 1)} className={cx(secondaryButton, "mt-3")}>
            Next
          </button>
        </section>
      ) : (
        <section className="animate-rise-in flex flex-col gap-4" aria-labelledby="about-title">
          <h1 id="about-title" className="text-3xl font-black tracking-tight">
            Almost there!
          </h1>
          <label className="flex flex-col gap-2">
            <span className="text-sm font-bold">Your first name</span>
            <input
              value={creatorName}
              onChange={(e) => setCreatorName(e.target.value)}
              maxLength={40}
              autoComplete="given-name"
              autoCapitalize="words"
              placeholder="e.g. Mukta"
              className={inputClass}
            />
          </label>
          <label className="flex flex-col gap-2">
            <span className="text-sm font-bold">Challenge name</span>
            <input
              value={challengeName}
              onChange={(e) => setChallengeName(e.target.value)}
              maxLength={60}
              className={inputClass}
            />
          </label>
          <label className="flex flex-col gap-2">
            <span className="text-sm font-bold">Start date</span>
            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className={inputClass} />
          </label>
          {error && (
            <p role="alert" className="text-sm font-semibold text-brand">
              {error}
            </p>
          )}
          <button type="button" onClick={generate} className={cx(primaryButton, "mt-2")}>
            GENERATE MY CHALLENGE ✨
          </button>
        </section>
      )}
    </div>
  );
}
