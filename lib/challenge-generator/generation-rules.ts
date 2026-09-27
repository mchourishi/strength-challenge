import type {
  ChallengeConfig,
  EquipmentCategory,
  EquipmentSetting,
  Exercise,
  Experience,
  Goal,
  SessionMinutes,
  SlotRole,
} from "./types";

// ── Equipment ────────────────────────────────────────────────────────────────

export const EQUIPMENT_AVAILABLE: Record<EquipmentSetting, readonly EquipmentCategory[]> = {
  full_gym: ["bodyweight", "dumbbell", "band", "bench", "cable", "machine", "barbell"],
  dumbbells: ["bodyweight", "dumbbell", "bench"],
  home: ["bodyweight", "dumbbell", "band", "bench"],
};

export function isExerciseAllowed(exercise: Exercise, setting: EquipmentSetting): boolean {
  const available = EQUIPMENT_AVAILABLE[setting];
  return exercise.equipment.every((item) => available.includes(item));
}

// ── Experience ───────────────────────────────────────────────────────────────

const EXPERIENCE_RANK: Record<Experience, number> = { beginner: 0, intermediate: 1, advanced: 2 };

export function experienceRank(level: Experience): number {
  return EXPERIENCE_RANK[level];
}

export function fitsExperience(exercise: Exercise, level: Experience): boolean {
  return EXPERIENCE_RANK[exercise.difficulty] <= EXPERIENCE_RANK[level];
}

// ── Workout size ─────────────────────────────────────────────────────────────

const EXERCISE_COUNT: Record<SessionMinutes, Record<Experience, number>> = {
  30: { beginner: 4, intermediate: 5, advanced: 5 },
  45: { beginner: 5, intermediate: 6, advanced: 6 },
  60: { beginner: 6, intermediate: 7, advanced: 8 },
};

export function targetExerciseCount(config: Pick<ChallengeConfig, "sessionMinutes" | "experience">): number {
  return EXERCISE_COUNT[config.sessionMinutes][config.experience];
}

/** Workouts may run slightly over the chosen time, never far over. */
export function timeBudgetMinutes(sessionMinutes: SessionMinutes): number {
  return sessionMinutes + 3;
}

// ── Volume ───────────────────────────────────────────────────────────────────

type LiftRole = Exclude<SlotRole, "finisher">;

export function baseSets(role: LiftRole, experience: Experience): number {
  if (role === "primary") return experience === "advanced" ? 4 : 3;
  if (role === "secondary") return 3;
  return experience === "beginner" ? 2 : 3;
}

export function maxSets(role: LiftRole, experience: Experience): number {
  if (role === "primary") return experience === "advanced" ? 5 : 4;
  if (role === "secondary") return 4;
  return 3;
}

export const MIN_SETS = 2;

const BASE_REPS: Record<Goal, Record<LiftRole, number>> = {
  strength: { primary: 8, secondary: 10, accessory: 12 },
  tone: { primary: 12, secondary: 12, accessory: 15 },
  muscle: { primary: 10, secondary: 10, accessory: 12 },
  general: { primary: 10, secondary: 12, accessory: 12 },
};

export function baseReps(role: LiftRole, goal: Goal, experience: Experience): number {
  // Beginners chasing strength still use moderate reps while learning technique.
  if (goal === "strength" && experience === "beginner" && role === "primary") return 10;
  return BASE_REPS[goal][role];
}

/** The lowest rep target ever prescribed. No max-effort or very heavy singles. */
export function minimumReps(goal: Goal, experience: Experience): number {
  if (experience === "beginner") return 8;
  if (goal === "tone") return 10;
  return 6;
}

// ── Rest & time estimate ────────────────────────────────────────────────────

const REST_SECONDS: Record<Goal, Record<LiftRole, number>> = {
  strength: { primary: 120, secondary: 90, accessory: 60 },
  tone: { primary: 75, secondary: 60, accessory: 45 },
  muscle: { primary: 90, secondary: 75, accessory: 45 },
  general: { primary: 90, secondary: 75, accessory: 45 },
};

export function restSeconds(role: SlotRole, goal: Goal, sessionMinutes: SessionMinutes): number {
  if (role === "finisher") return 0;
  const rest = REST_SECONDS[goal][role];
  // Shorter sessions use slightly shorter rests.
  const scaled = sessionMinutes === 30 ? rest * 0.75 : rest;
  return Math.round(scaled / 15) * 15;
}

const SECONDS_PER_REP = 4;
const TRANSITION_SECONDS = 60; // set-up, moving between stations
const WARM_UP_MINUTES = 4;

export interface TimedItem {
  sets: number;
  reps: number | null;
  durationSeconds: number | null;
  perSide: boolean;
  restSeconds: number;
}

export function estimateItemSeconds(item: TimedItem): number {
  const sides = item.perSide ? 2 : 1;
  const work = item.reps !== null ? item.reps * SECONDS_PER_REP * sides : (item.durationSeconds ?? 0) * sides;
  // No rest after the final set.
  return item.sets * work + Math.max(item.sets - 1, 0) * item.restSeconds + TRANSITION_SECONDS;
}

export function estimateWorkoutMinutes(items: readonly TimedItem[]): number {
  const seconds = items.reduce((sum, item) => sum + estimateItemSeconds(item), 0);
  return WARM_UP_MINUTES + seconds / 60;
}

/** Rounded to the nearest 5 minutes for display. */
export function displayMinutes(minutes: number): number {
  return Math.max(15, Math.round(minutes / 5) * 5);
}
