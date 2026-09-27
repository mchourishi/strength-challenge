"use client";

import { useState } from "react";
import { cx } from "@/components/ui";
import type { ExerciseItem, ExerciseState, PreviousLog } from "./types";

interface Props {
  item: ExerciseItem;
  state: ExerciseState;
  previous: PreviousLog | undefined;
  onToggle: () => void;
  onSaveLog: (weightKg: number | null, reps: number | null) => Promise<boolean>;
  onOpenSwap: () => void;
}

const ROLE_LABEL = { primary: "Main lift", secondary: null, accessory: null, finisher: "Finisher" } as const;

function parseNumber(value: string): number | null {
  const normalised = value.replace(",", ".").trim();
  if (normalised === "") return null;
  const n = Number(normalised);
  return Number.isFinite(n) ? n : NaN;
}

export function ExerciseCard({ item, state, previous, onToggle, onSaveLog, onOpenSwap }: Props) {
  const [logOpen, setLogOpen] = useState(state.weightKg !== null || state.reps !== null);
  const [weight, setWeight] = useState(state.weightKg?.toString() ?? "");
  const [reps, setReps] = useState(state.reps?.toString() ?? "");
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "invalid" | "error">("idle");

  const displayName = state.substituteName ?? item.name;
  const notes = state.substituteId
    ? (item.swapOptions.find((o) => o.id === state.substituteId)?.instructions ?? null)
    : item.notes;
  const roleLabel = ROLE_LABEL[item.role];

  async function save() {
    const w = parseNumber(weight);
    const r = parseNumber(reps);
    if (Number.isNaN(w) || Number.isNaN(r) || (w !== null && (w < 0 || w > 1000)) || (r !== null && (r < 0 || r > 200))) {
      setSaveStatus("invalid");
      return;
    }
    if (w === state.weightKg && r === state.reps) return;
    setSaveStatus("saving");
    setSaveStatus((await onSaveLog(w, r)) ? "saved" : "error");
  }

  return (
    <li
      className={cx(
        "rounded-3xl bg-card p-4 ring-1 transition",
        state.completed ? "ring-ok/40 bg-ok/[0.04]" : "ring-line",
      )}
    >
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <h3 className={cx("text-lg font-extrabold leading-snug", state.completed && "text-muted line-through decoration-2")}>
            {displayName}
          </h3>
          <p className="mt-0.5 flex flex-wrap items-center gap-x-2 text-base font-black tabular-nums">
            {item.prescription}
            {roleLabel && (
              <span className="rounded-full bg-brand/12 px-2 py-0.5 text-[0.65rem] font-black uppercase tracking-wider text-brand">
                {roleLabel}
              </span>
            )}
          </p>
          {item.restSeconds > 0 && <p className="text-xs font-semibold text-muted">Rest ~{item.restSeconds}s between sets</p>}
          {state.substituteId && <p className="mt-1 text-xs font-bold text-friend">⇄ Swapped from {item.name}</p>}
          {previous && (
            <p className="mt-1 text-sm font-semibold text-muted">
              Last time: {previous.weightKg} kg{previous.reps ? ` × ${previous.reps}` : ""}
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={onToggle}
          aria-pressed={state.completed}
          aria-label={state.completed ? `${displayName} done. Tap to undo` : `Mark ${displayName} done`}
          className={cx(
            "grid size-14 shrink-0 place-items-center rounded-2xl text-2xl font-black transition active:scale-90",
            state.completed ? "animate-tick bg-ok text-white shadow-lg shadow-ok/30" : "bg-card-2 text-muted ring-1 ring-line",
          )}
        >
          ✓
        </button>
      </div>

      {notes && (
        <details className="mt-2 text-sm text-muted">
          <summary className="cursor-pointer font-semibold">How to</summary>
          <p className="mt-1 leading-snug">{notes}</p>
        </details>
      )}

      <div className="mt-3 flex gap-2">
        <button
          type="button"
          onClick={() => setLogOpen((o) => !o)}
          aria-expanded={logOpen}
          className="min-h-11 flex-1 rounded-xl bg-card-2 px-3 text-sm font-bold"
        >
          {logOpen ? "Hide log" : "Log weight"} <span className="font-semibold text-muted">(optional)</span>
        </button>
        <button type="button" onClick={onOpenSwap} className="min-h-11 rounded-xl bg-card-2 px-4 text-sm font-bold">
          ⇄ Swap
        </button>
      </div>

      {logOpen && (
        <div className="animate-rise-in mt-3 grid grid-cols-2 gap-2">
          <label className="flex flex-col gap-1">
            <span className="text-xs font-bold text-muted">Weight (kg)</span>
            <input
              inputMode="decimal"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              onBlur={save}
              onKeyDown={(e) => e.key === "Enter" && e.currentTarget.blur()}
              placeholder={previous ? String(previous.weightKg) : "—"}
              className="min-h-12 rounded-xl bg-card-2 px-3 text-lg font-bold tabular-nums outline-none focus:ring-2 focus:ring-brand"
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs font-bold text-muted">Reps</span>
            <input
              inputMode="numeric"
              value={reps}
              onChange={(e) => setReps(e.target.value)}
              onBlur={save}
              onKeyDown={(e) => e.key === "Enter" && e.currentTarget.blur()}
              placeholder="—"
              className="min-h-12 rounded-xl bg-card-2 px-3 text-lg font-bold tabular-nums outline-none focus:ring-2 focus:ring-brand"
            />
          </label>
          <p className="col-span-2 text-xs text-muted" aria-live="polite">
            {saveStatus === "saving" && "Saving…"}
            {saveStatus === "saved" && "Saved ✓ · only you can see this"}
            {saveStatus === "invalid" && "Please enter a sensible number."}
            {saveStatus === "error" && "Couldn't save — check your connection."}
            {saveStatus === "idle" && "🔒 Private — only you can see your numbers."}
          </p>
        </div>
      )}
    </li>
  );
}
