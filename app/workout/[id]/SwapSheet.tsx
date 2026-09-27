"use client";

import { useEffect, useRef } from "react";
import { cx } from "@/components/ui";
import type { SwapOption } from "./types";

interface Props {
  open: boolean;
  exerciseName: string;
  prescribedName: string;
  currentSubstituteId: string | null;
  options: SwapOption[];
  pending: boolean;
  onChoose: (option: SwapOption | null) => void;
  onClose: () => void;
}

/** Bottom sheet with 2–4 equipment-compatible alternatives. Swaps only affect this participant. */
export function SwapSheet({ open, exerciseName, prescribedName, currentSubstituteId, options, pending, onChoose, onClose }: Props) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onClick={(e) => e.target === ref.current && onClose()}
      aria-labelledby="swap-title"
      className="safe-bottom mx-auto mb-0 mt-auto w-full max-w-md rounded-t-[2rem] bg-card p-0 text-ink backdrop:bg-black/50 backdrop:backdrop-blur-sm"
    >
      <div className="flex flex-col gap-3 px-5 pb-4 pt-3">
        <span aria-hidden className="mx-auto h-1.5 w-10 rounded-full bg-line" />
        <div>
          <p className="text-sm font-bold text-muted">{exerciseName}</p>
          <h2 id="swap-title" className="text-xl font-black">
            Can&apos;t do this today?
          </h2>
          <p className="text-sm text-muted">Swap it just for you — your friend&apos;s workout stays the same.</p>
        </div>

        {options.length === 0 ? (
          <p className="rounded-2xl bg-card-2 px-4 py-3 text-sm">No alternatives fit your equipment for this one.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {options.map((option) => {
              const current = option.id === currentSubstituteId;
              return (
                <li key={option.id}>
                  <button
                    type="button"
                    disabled={pending || current}
                    onClick={() => onChoose(option)}
                    className={cx(
                      "flex min-h-14 w-full flex-col items-start rounded-2xl px-4 py-3 text-left transition active:scale-[0.98] disabled:opacity-70",
                      current ? "bg-brand/12 ring-2 ring-brand" : "bg-card-2",
                    )}
                  >
                    <span className="font-bold">
                      {option.name} {current && "✓"}
                    </span>
                    {option.instructions && <span className="text-sm leading-snug text-muted">{option.instructions}</span>}
                  </button>
                </li>
              );
            })}
          </ul>
        )}

        {currentSubstituteId && (
          <button
            type="button"
            disabled={pending}
            onClick={() => onChoose(null)}
            className="min-h-12 rounded-2xl font-bold text-brand ring-1 ring-line"
          >
            ↩ Back to {prescribedName}
          </button>
        )}
        <button type="button" onClick={onClose} className="min-h-12 rounded-2xl font-bold text-muted">
          Cancel
        </button>
      </div>
    </dialog>
  );
}
