// Core types for challenge configuration, the exercise library and generated programs.
// This module is pure TypeScript with no framework dependencies so it can be unit tested
// and used on both the server and the client.

export const GOALS = ["strength", "tone", "muscle", "general"] as const;
export type Goal = (typeof GOALS)[number];

export const EXPERIENCE_LEVELS = ["beginner", "intermediate", "advanced"] as const;
export type Experience = (typeof EXPERIENCE_LEVELS)[number];

export const SESSION_MINUTES = [30, 45, 60] as const;
export type SessionMinutes = (typeof SESSION_MINUTES)[number];

export const SESSIONS_PER_WEEK = [2, 3, 4] as const;
export type SessionsPerWeek = (typeof SESSIONS_PER_WEEK)[number];

export const DURATION_WEEKS = [4, 6] as const;
export type DurationWeeks = (typeof DURATION_WEEKS)[number];

export const EQUIPMENT_SETTINGS = ["full_gym", "dumbbells", "home"] as const;
export type EquipmentSetting = (typeof EQUIPMENT_SETTINGS)[number];

export const FOCUSES = ["balanced", "lower_glutes", "upper", "full_glutes"] as const;
export type Focus = (typeof FOCUSES)[number];

export interface ChallengeConfig {
  goal: Goal;
  experience: Experience;
  sessionMinutes: SessionMinutes;
  sessionsPerWeek: SessionsPerWeek;
  durationWeeks: DurationWeeks;
  equipment: EquipmentSetting;
  focus: Focus;
}

export type MovementPattern =
  | "squat"
  | "hinge"
  | "lunge"
  | "glute_bridge"
  | "glute_isolation"
  | "leg_isolation"
  | "horizontal_push"
  | "vertical_push"
  | "horizontal_pull"
  | "vertical_pull"
  | "shoulder_isolation"
  | "arm_isolation"
  | "carry"
  | "core"
  | "conditioning";

export type EquipmentCategory =
  | "bodyweight"
  | "dumbbell"
  | "band"
  | "bench"
  | "cable"
  | "machine"
  | "barbell";

export type MuscleGroup =
  | "quads"
  | "glutes"
  | "hamstrings"
  | "calves"
  | "chest"
  | "back"
  | "lats"
  | "shoulders"
  | "rear_delts"
  | "biceps"
  | "triceps"
  | "core"
  | "full_body";

/** Minimum experience level at which an exercise may be prescribed. */
export type Difficulty = Experience;

export type ExerciseUnit = "reps" | "seconds" | "minutes";

export interface Exercise {
  id: string;
  name: string;
  pattern: MovementPattern;
  primaryMuscle: MuscleGroup;
  secondaryMuscles?: MuscleGroup[];
  /** Every listed category is required. */
  equipment: EquipmentCategory[];
  difficulty: Difficulty;
  /** Focuses this exercise suits particularly well. */
  focus?: Focus[];
  unit: ExerciseUnit;
  /** Default reps (or seconds / minutes, depending on `unit`) as [min, max]. */
  defaultRange: [number, number];
  perSide?: boolean;
  /** Suitable as a main (primary) lift that can be progressively loaded. */
  mainLift?: boolean;
  substitutionGroup: string;
  instructions?: string;
}

export type SlotRole = "primary" | "secondary" | "accessory" | "finisher";

export type WeekPhase = "foundation" | "build" | "progress" | "finish";

export interface GeneratedExercise {
  exerciseId: string;
  name: string;
  pattern: MovementPattern;
  role: SlotRole;
  sets: number;
  /** Reps per set; null for timed exercises. */
  reps: number | null;
  /** Seconds per set; null for rep-based exercises. */
  durationSeconds: number | null;
  perSide: boolean;
  restSeconds: number;
  notes: string | null;
}

export interface GeneratedWorkout {
  /** 1-based position in the whole program. */
  sequence: number;
  weekNumber: number;
  /** 1-based position within the week. */
  dayNumber: number;
  name: string;
  emoji: string;
  estimatedMinutes: number;
  challengeText: string;
  exercises: GeneratedExercise[];
}

export interface GeneratedWeek {
  weekNumber: number;
  phase: WeekPhase;
  title: string;
}

export interface GeneratedProgram {
  generator: string;
  seed: number;
  config: ChallengeConfig;
  weeks: GeneratedWeek[];
  workouts: GeneratedWorkout[];
}

export interface GenerateOptions {
  seed: number;
}

/**
 * The conceptual interface for program generators. V1 ships only the rule-based
 * implementation; an AI-backed generator could implement the same contract later.
 */
export interface ChallengeGenerator {
  readonly id: string;
  generate(config: ChallengeConfig, options: GenerateOptions): GeneratedProgram;
}
