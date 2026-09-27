interface Prescription {
  sets: number;
  reps: number | null;
  durationSeconds: number | null;
  perSide: boolean;
}

function formatDuration(seconds: number): string {
  if (seconds >= 120 && seconds % 60 === 0) return `${seconds / 60} min`;
  return `${seconds} sec`;
}

/** "3 × 10", "3 × 8 each side", "3 × 30 sec", "5 min". */
export function formatPrescription({ sets, reps, durationSeconds, perSide }: Prescription): string {
  const amount = reps !== null ? `${reps}` : formatDuration(durationSeconds ?? 0);
  const side = perSide ? " each side" : "";
  if (sets === 1 && reps === null) return `${amount}${side}`;
  return `${sets} × ${amount}${side}`;
}
