import type { SlotRole } from "@/lib/challenge-generator/types";

export interface SwapOption {
  id: string;
  name: string;
  instructions: string | null;
}

export interface ExerciseState {
  completed: boolean;
  weightKg: number | null;
  reps: number | null;
  substituteId: string | null;
  substituteName: string | null;
}

export interface ExerciseItem {
  id: string;
  exerciseId: string;
  name: string;
  role: SlotRole;
  prescription: string;
  restSeconds: number;
  notes: string | null;
  swapOptions: SwapOption[];
  initial: ExerciseState;
}

export interface PreviousLog {
  weightKg: number;
  reps: number | null;
}
