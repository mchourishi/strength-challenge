import { EXERCISES } from "./exercise-library";
import {
  MIN_SETS,
  baseReps,
  baseSets,
  displayMinutes,
  estimateWorkoutMinutes,
  fitsExperience,
  isExerciseAllowed,
  maxSets,
  minimumReps,
  restSeconds,
  targetExerciseCount,
  timeBudgetMinutes,
} from "./generation-rules";
import { blockForWeek, challengeText, weekPlans, type WeekPlan } from "./progression-rules";
import { createRandom } from "./random";
import type {
  ChallengeConfig,
  ChallengeGenerator,
  Exercise,
  GenerateOptions,
  GeneratedExercise,
  GeneratedProgram,
  GeneratedWorkout,
} from "./types";
import { SPLITS, dayNames, type DayTemplate, type Slot } from "./workout-templates";

export const RULE_BASED_GENERATOR_ID = "rules-v1";

interface SlotChoice {
  slotIndex: number;
  slot: Slot;
  exercise: Exercise;
}

interface SelectionContext {
  config: ChallengeConfig;
  random: () => number;
  /** How many times each exercise has been used by other days in the same block. */
  usedThisWeek: Map<string, number>;
}

// ── Exercise selection ──────────────────────────────────────────────────────

function eligible(exercise: Exercise, config: ChallengeConfig): boolean {
  return (
    exercise.pattern !== "conditioning" &&
    isExerciseAllowed(exercise, config.equipment) &&
    fitsExperience(exercise, config.experience)
  );
}

function matchesSlot(exercise: Exercise, slot: Slot, patterns: readonly string[]): boolean {
  if (!patterns.includes(exercise.pattern)) return false;
  return !slot.muscles || slot.muscles.includes(exercise.primaryMuscle);
}

/**
 * Deterministic scoring. The seeded jitter is small, so the best-suited exercises win
 * and regeneration only varies between comparably good options.
 */
function score(exercise: Exercise, slot: Slot, ctx: SelectionContext): number {
  const { config } = ctx;
  let value = 0;

  if (exercise.pattern === slot.patterns[0]) value += 0.5;
  if (exercise.focus?.includes(config.focus)) value += 1.5;

  if (slot.role === "primary") value += exercise.mainLift ? 3 : -2;
  else if (slot.role === "accessory" && exercise.mainLift) value -= 0.5;

  const isMachineOrDumbbell = exercise.equipment.some((e) => e === "machine" || e === "dumbbell");
  if (config.experience === "beginner" && isMachineOrDumbbell) value += 1;
  if (config.experience !== "beginner" && exercise.difficulty === config.experience) value += 0.75;

  if (config.equipment === "home" && exercise.equipment.every((e) => e === "bodyweight" || e === "band")) {
    value += 1;
  }

  value -= 3 * (ctx.usedThisWeek.get(exercise.id) ?? 0);
  value += ctx.random() * 1.5;
  return value;
}

function pickExercise(
  slot: Slot,
  ctx: SelectionContext,
  excludeIds: ReadonlySet<string>,
  avoidId?: string,
): Exercise | undefined {
  const pool = EXERCISES.filter((e) => eligible(e, ctx.config) && !excludeIds.has(e.id));
  let candidates = pool.filter((e) => matchesSlot(e, slot, slot.patterns));
  if (candidates.length === 0 && slot.fallback) {
    candidates = pool.filter((e) => matchesSlot(e, slot, slot.fallback!));
  }
  // Rotation: avoid the previous block's choice when an alternative exists.
  if (avoidId && candidates.some((e) => e.id !== avoidId)) {
    candidates = candidates.filter((e) => e.id !== avoidId);
  }

  let best: Exercise | undefined;
  let bestScore = -Infinity;
  for (const candidate of candidates) {
    const value = score(candidate, slot, ctx);
    if (value > bestScore) {
      best = candidate;
      bestScore = value;
    }
  }
  return best;
}

/** Which slots keep the same exercise in the second half of the challenge. */
function keepsExerciseAcrossBlocks(slot: Slot, config: ChallengeConfig): boolean {
  if (slot.role === "primary") return true;
  if (slot.role === "secondary") return config.goal === "strength" || config.goal === "muscle";
  return false;
}

function selectDay(
  day: DayTemplate,
  ctx: SelectionContext,
  count: number,
  previousBlock: SlotChoice[] | undefined,
): SlotChoice[] {
  const chosen: SlotChoice[] = [];
  const chosenIds = new Set<string>();

  day.slots.forEach((slot, slotIndex) => {
    if (chosen.length >= count) return;
    const previous = previousBlock?.find((c) => c.slotIndex === slotIndex);

    let exercise: Exercise | undefined;
    if (previous && keepsExerciseAcrossBlocks(slot, ctx.config) && !chosenIds.has(previous.exercise.id)) {
      exercise = previous.exercise;
    } else {
      exercise = pickExercise(slot, ctx, chosenIds, previous?.exercise.id);
    }
    if (!exercise) return;

    chosen.push({ slotIndex, slot, exercise });
    chosenIds.add(exercise.id);
  });

  for (const choice of chosen) {
    ctx.usedThisWeek.set(choice.exercise.id, (ctx.usedThisWeek.get(choice.exercise.id) ?? 0) + 1);
  }
  return chosen;
}

function pickFinisher(config: ChallengeConfig): Exercise | undefined {
  // Prefer the gym option when available; the bodyweight circuit works everywhere.
  const options = EXERCISES.filter(
    (e) => e.pattern === "conditioning" && isExerciseAllowed(e, config.equipment) && fitsExperience(e, config.experience),
  );
  return options.find((e) => e.equipment.includes("machine")) ?? options[0];
}

// ── Prescription (sets, reps, time) ─────────────────────────────────────────

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

function prescribe(choice: SlotChoice, week: WeekPlan, config: ChallengeConfig): GeneratedExercise {
  const { exercise, slot } = choice;
  const role = slot.role;
  const [rangeMin, rangeMax] = exercise.defaultRange;

  const setsDelta =
    role === "primary" ? week.primarySetsDelta : role === "secondary" ? week.secondarySetsDelta : week.accessorySetsDelta;
  const sets = clamp(baseSets(role, config.experience) + setsDelta, MIN_SETS, maxSets(role, config.experience));

  let reps: number | null = null;
  let durationSeconds: number | null = null;

  if (exercise.unit === "reps") {
    const repsDelta = role === "primary" ? week.primaryRepsDelta : role === "secondary" ? week.secondaryRepsDelta : 0;
    const start = clamp(baseReps(role, config.goal, config.experience), rangeMin, rangeMax);
    const floor = Math.max(rangeMin, minimumReps(config.goal, config.experience));
    reps = clamp(start + repsDelta, Math.min(floor, start), rangeMax);
  } else {
    const value = rangeMin + (rangeMax - rangeMin) * week.timedProgress;
    durationSeconds = exercise.unit === "seconds" ? Math.round(value / 5) * 5 : Math.round(value) * 60;
  }

  return {
    exerciseId: exercise.id,
    name: exercise.name,
    pattern: exercise.pattern,
    role,
    sets,
    reps,
    durationSeconds,
    perSide: exercise.perSide ?? false,
    restSeconds: restSeconds(role, config.goal, config.sessionMinutes),
    notes: exercise.instructions ?? null,
  };
}

function prescribeFinisher(exercise: Exercise): GeneratedExercise {
  return {
    exerciseId: exercise.id,
    name: exercise.name,
    pattern: exercise.pattern,
    role: "finisher",
    sets: 1,
    reps: null,
    durationSeconds: exercise.defaultRange[0] * 60,
    perSide: false,
    restSeconds: 0,
    notes: exercise.instructions ?? null,
  };
}

// ── Time budget ─────────────────────────────────────────────────────────────

/**
 * Keep a workout within the chosen session length. Trims the least important volume
 * first so main lifts and the week's progression are protected.
 */
function fitToBudget(exercises: GeneratedExercise[], config: ChallengeConfig): GeneratedExercise[] {
  const budget = timeBudgetMinutes(config.sessionMinutes);
  let items = exercises.map((e) => ({ ...e }));
  const fits = () => estimateWorkoutMinutes(items) <= budget;

  const reduceSets = (role: GeneratedExercise["role"], floor: (e: GeneratedExercise) => number) => {
    for (let i = items.length - 1; i >= 0 && !fits(); i--) {
      const item = items[i];
      while (item.role === role && item.sets > floor(item) && !fits()) item.sets -= 1;
    }
  };

  reduceSets("accessory", () => MIN_SETS);
  reduceSets("secondary", () => baseSets("secondary", config.experience));
  if (!fits()) items = items.filter((e) => e.role !== "finisher");
  reduceSets("primary", () => baseSets("primary", config.experience));
  reduceSets("secondary", () => MIN_SETS);
  while (!fits() && items.some((e) => e.role !== "primary")) {
    const lastNonPrimary = items.map((e) => e.role).lastIndexOf("accessory");
    const index = lastNonPrimary >= 0 ? lastNonPrimary : items.map((e) => e.role).lastIndexOf("secondary");
    items.splice(index, 1);
  }
  return items;
}

// ── Program ─────────────────────────────────────────────────────────────────

export function generateProgram(config: ChallengeConfig, options: GenerateOptions): GeneratedProgram {
  const random = createRandom(options.seed);
  const split = SPLITS[config.focus][config.sessionsPerWeek];
  const names = dayNames(split);
  const count = targetExerciseCount(config);
  const weeks = weekPlans(config.durationWeeks);
  const finisher = pickFinisher(config);

  // Choose exercises for each day, once per block (first half / second half).
  const blocks: SlotChoice[][][] = [];
  for (const block of [0, 1] as const) {
    const ctx: SelectionContext = { config, random, usedThisWeek: new Map() };
    blocks.push(split.map((day, dayIndex) => selectDay(day, ctx, count, blocks[block - 1]?.[dayIndex])));
  }

  const totalWorkouts = weeks.length * split.length;
  const workouts: GeneratedWorkout[] = [];

  for (const week of weeks) {
    const block = blockForWeek(week.weekNumber, config.durationWeeks);
    split.forEach((day, dayIndex) => {
      const sequence = workouts.length + 1;
      const choices = blocks[block][dayIndex];
      let exercises = choices.map((choice) => prescribe(choice, week, config));
      if (week.finisher && finisher && config.sessionMinutes >= 45) {
        exercises.push(prescribeFinisher(finisher));
      }
      exercises = fitToBudget(exercises, config);

      const mainLift = exercises.find((e) => e.role === "primary");
      workouts.push({
        sequence,
        weekNumber: week.weekNumber,
        dayNumber: dayIndex + 1,
        name: names[dayIndex],
        emoji: sequence === totalWorkouts ? "🏆" : day.emoji,
        estimatedMinutes: displayMinutes(estimateWorkoutMinutes(exercises)),
        challengeText: challengeText({
          phase: week.phase,
          dayNumber: dayIndex + 1,
          mainLiftName: mainLift?.name ?? null,
          isFirstWorkout: sequence === 1,
          isFinalWorkout: sequence === totalWorkouts,
        }),
        exercises,
      });
    });
  }

  return {
    generator: RULE_BASED_GENERATOR_ID,
    seed: options.seed,
    config,
    weeks: weeks.map(({ weekNumber, phase, title }) => ({ weekNumber, phase, title })),
    workouts,
  };
}

export const ruleBasedGenerator: ChallengeGenerator = {
  id: RULE_BASED_GENERATOR_ID,
  generate: generateProgram,
};
