import { EXERCISES, getExercise } from "./exercise-library";
import { experienceRank, fitsExperience, isExerciseAllowed } from "./generation-rules";
import type { EquipmentSetting, Exercise, Experience, MovementPattern, MuscleGroup } from "./types";

/** Loosely related patterns, used only when too few direct substitutes exist. */
const RELATED_PATTERNS: Partial<Record<MovementPattern, MovementPattern[]>> = {
  squat: ["lunge"],
  lunge: ["squat"],
  hinge: ["glute_bridge"],
  glute_bridge: ["hinge"],
  glute_isolation: ["glute_bridge"],
  horizontal_pull: ["vertical_pull"],
  vertical_pull: ["horizontal_pull"],
  horizontal_push: ["vertical_push"],
  vertical_push: ["horizontal_push"],
  shoulder_isolation: ["vertical_push"],
  carry: ["core"],
  core: ["carry"],
};

/** Related patterns for isolation work depend on the muscle trained. */
const RELATED_BY_MUSCLE: Partial<Record<MuscleGroup, MovementPattern[]>> = {
  quads: ["squat", "lunge"],
  hamstrings: ["hinge"],
  biceps: ["horizontal_pull"],
  triceps: ["horizontal_push"],
};

/** For isolation work a substitute must train the same muscle (no curls for pushdowns). */
const MUSCLE_SPECIFIC_PATTERNS: readonly MovementPattern[] = ["arm_isolation", "leg_isolation"];

export interface SwapContext {
  equipment: EquipmentSetting;
  experience: Experience;
  /** Exercises already in the workout, which should not be suggested again. */
  excludeIds?: readonly string[];
}

export const MIN_SWAP_OPTIONS = 2;
export const MAX_SWAP_OPTIONS = 4;

/**
 * Suggest 2–4 alternatives for an exercise, compatible with the challenge's equipment
 * and experience level. Same substitution group first, then same pattern, then related.
 */
export function getSwapOptions(exerciseId: string, context: SwapContext): Exercise[] {
  return rankedSubstitutes(exerciseId, context, MAX_SWAP_OPTIONS);
}

function rankedSubstitutes(exerciseId: string, context: SwapContext, limit: number): Exercise[] {
  const original = getExercise(exerciseId);
  if (!original) return [];

  const excluded = new Set([exerciseId, ...(context.excludeIds ?? [])]);
  const pool = EXERCISES.filter(
    (e) => !excluded.has(e.id) && isExerciseAllowed(e, context.equipment) && fitsExperience(e, context.experience),
  );

  const byCloseness = (a: Exercise, b: Exercise) =>
    Math.abs(experienceRank(a.difficulty) - experienceRank(original.difficulty)) -
      Math.abs(experienceRank(b.difficulty) - experienceRank(original.difficulty)) || a.name.localeCompare(b.name);

  const sameGroup = pool.filter((e) => e.substitutionGroup === original.substitutionGroup).sort(byCloseness);

  const samePattern = pool
    .filter(
      (e) =>
        e.pattern === original.pattern &&
        e.substitutionGroup !== original.substitutionGroup &&
        (!MUSCLE_SPECIFIC_PATTERNS.includes(e.pattern) || e.primaryMuscle === original.primaryMuscle),
    )
    .sort(byCloseness);

  const options = [...sameGroup, ...samePattern];
  if (options.length < MIN_SWAP_OPTIONS) {
    const related = MUSCLE_SPECIFIC_PATTERNS.includes(original.pattern)
      ? (RELATED_BY_MUSCLE[original.primaryMuscle] ?? [])
      : (RELATED_PATTERNS[original.pattern] ?? []);
    options.push(...pool.filter((e) => related.includes(e.pattern)).sort(byCloseness));
  }

  return options.slice(0, limit);
}

export function isValidSwap(exerciseId: string, substituteId: string, context: SwapContext): boolean {
  // Validates against every compatible substitute, not just the top suggestions.
  return rankedSubstitutes(exerciseId, context, Infinity).some((e) => e.id === substituteId);
}
