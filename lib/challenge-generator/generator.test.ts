import { describe, expect, it } from "vitest";
import { EXERCISES, getExercise } from "./exercise-library";
import { EQUIPMENT_AVAILABLE, targetExerciseCount, timeBudgetMinutes } from "./generation-rules";
import { generateProgram } from "./generator";
import { getSwapOptions } from "./substitutions";
import {
  DURATION_WEEKS,
  EQUIPMENT_SETTINGS,
  EXPERIENCE_LEVELS,
  FOCUSES,
  GOALS,
  SESSIONS_PER_WEEK,
  SESSION_MINUTES,
  type ChallengeConfig,
  type GeneratedProgram,
  type MovementPattern,
} from "./types";
import { DEFAULT_CONFIG } from "./config";

function* allConfigs(): Generator<ChallengeConfig> {
  for (const goal of GOALS)
    for (const experience of EXPERIENCE_LEVELS)
      for (const sessionMinutes of SESSION_MINUTES)
        for (const sessionsPerWeek of SESSIONS_PER_WEEK)
          for (const durationWeeks of DURATION_WEEKS)
            for (const equipment of EQUIPMENT_SETTINGS)
              for (const focus of FOCUSES)
                yield { goal, experience, sessionMinutes, sessionsPerWeek, durationWeeks, equipment, focus };
}

const ALL = [...allConfigs()].map((config, i) => generateProgram(config, { seed: 1000 + i }));
const programsWhere = (predicate: (c: ChallengeConfig) => boolean) => ALL.filter((p) => predicate(p.config));

const allExercises = (program: GeneratedProgram) => program.workouts.flatMap((w) => w.exercises);
const equipmentOf = (exerciseId: string) => getExercise(exerciseId)!.equipment;

describe("program structure", () => {
  it("contains the requested number of workouts, ordered by week and day", () => {
    for (const program of ALL) {
      const { durationWeeks, sessionsPerWeek } = program.config;
      expect(program.workouts).toHaveLength(durationWeeks * sessionsPerWeek);
      expect(program.weeks).toHaveLength(durationWeeks);
      program.workouts.forEach((workout, index) => {
        expect(workout.sequence).toBe(index + 1);
        expect(workout.weekNumber).toBe(Math.floor(index / sessionsPerWeek) + 1);
        expect(workout.dayNumber).toBe((index % sessionsPerWeek) + 1);
      });
    }
  });

  it("never produces an empty workout", () => {
    for (const program of ALL) {
      for (const workout of program.workouts) expect(workout.exercises.length).toBeGreaterThanOrEqual(3);
    }
  });

  it("does not repeat an exercise inside the same workout", () => {
    for (const program of ALL) {
      for (const workout of program.workouts) {
        const ids = workout.exercises.map((e) => e.exerciseId);
        expect(new Set(ids).size).toBe(ids.length);
      }
    }
  });

  it("is deterministic for the same config and seed", () => {
    const a = generateProgram(DEFAULT_CONFIG, { seed: 42 });
    const b = generateProgram(DEFAULT_CONFIG, { seed: 42 });
    expect(a).toEqual(b);
  });

  it("regenerates with controlled variation: still valid, not identical across many seeds", () => {
    const signatures = new Set<string>();
    for (let seed = 1; seed <= 20; seed++) {
      const program = generateProgram(DEFAULT_CONFIG, { seed });
      expect(program.workouts).toHaveLength(12);
      signatures.add(allExercises(program).map((e) => e.exerciseId).join(","));
    }
    expect(signatures.size).toBeGreaterThan(1);
  });
});

describe("equipment filtering", () => {
  it("dumbbell-only programs never include machine, cable, barbell, or band exercises", () => {
    for (const program of programsWhere((c) => c.equipment === "dumbbells")) {
      for (const exercise of allExercises(program)) {
        for (const item of equipmentOf(exercise.exerciseId)) {
          expect(["bodyweight", "dumbbell", "bench"]).toContain(item);
        }
      }
    }
  });

  it("home programs only use bodyweight, dumbbells, a band and a bench/chair", () => {
    for (const program of programsWhere((c) => c.equipment === "home")) {
      for (const exercise of allExercises(program)) {
        for (const item of equipmentOf(exercise.exerciseId)) {
          expect(EQUIPMENT_AVAILABLE.home).toContain(item);
        }
        expect(equipmentOf(exercise.exerciseId)).not.toContain("machine");
        expect(equipmentOf(exercise.exerciseId)).not.toContain("cable");
      }
    }
  });

  it("home programs lean on bodyweight and band movements", () => {
    const home = programsWhere((c) => c.equipment === "home");
    const light = home
      .flatMap(allExercises)
      .filter((e) => equipmentOf(e.exerciseId).every((item) => item === "bodyweight" || item === "band"));
    expect(light.length).toBeGreaterThan(0);
  });
});

describe("experience rules", () => {
  it("beginner programs only use beginner exercises", () => {
    for (const program of programsWhere((c) => c.experience === "beginner")) {
      for (const exercise of allExercises(program)) {
        expect(getExercise(exercise.exerciseId)!.difficulty).toBe("beginner");
      }
    }
  });

  it("intermediate programs never use advanced-only exercises", () => {
    for (const program of programsWhere((c) => c.experience === "intermediate")) {
      for (const exercise of allExercises(program)) {
        expect(getExercise(exercise.exerciseId)!.difficulty).not.toBe("advanced");
      }
    }
  });
});

describe("duration rules", () => {
  const averageSize = (minutes: number) => {
    const workouts = programsWhere((c) => c.sessionMinutes === minutes).flatMap((p) => p.workouts);
    return workouts.reduce((sum, w) => sum + w.exercises.length, 0) / workouts.length;
  };

  it("longer sessions contain more exercises", () => {
    expect(averageSize(30)).toBeLessThan(averageSize(45));
    expect(averageSize(45)).toBeLessThan(averageSize(60));
  });

  it("keeps workouts within the size range for the chosen duration", () => {
    const ranges = { 30: [3, 5], 45: [4, 7], 60: [5, 9] } as const;
    for (const program of ALL) {
      const [min, max] = ranges[program.config.sessionMinutes];
      for (const workout of program.workouts) {
        expect(workout.exercises.length).toBeGreaterThanOrEqual(min);
        expect(workout.exercises.length).toBeLessThanOrEqual(max);
        expect(workout.exercises.filter((e) => e.role !== "finisher").length).toBeLessThanOrEqual(
          targetExerciseCount(program.config),
        );
      }
    }
  });

  it("estimates stay within the chosen session length", () => {
    for (const program of ALL) {
      for (const workout of program.workouts) {
        expect(workout.estimatedMinutes).toBeLessThanOrEqual(timeBudgetMinutes(program.config.sessionMinutes) + 2);
      }
    }
  });
});

describe("movement-pattern balance", () => {
  const weekPatterns = (program: GeneratedProgram, week: number) =>
    new Set(program.workouts.filter((w) => w.weekNumber === week).flatMap((w) => w.exercises.map((e) => e.pattern)));
  const hasAny = (patterns: Set<MovementPattern>, options: MovementPattern[]) => options.some((p) => patterns.has(p));

  it("balanced programs train knee-dominant, hip-dominant, push and pull every week", () => {
    for (const program of programsWhere((c) => c.focus === "balanced")) {
      for (const week of program.weeks) {
        const patterns = weekPatterns(program, week.weekNumber);
        expect(hasAny(patterns, ["squat", "lunge"])).toBe(true);
        expect(hasAny(patterns, ["hinge", "glute_bridge"])).toBe(true);
        expect(hasAny(patterns, ["horizontal_push", "vertical_push"])).toBe(true);
        expect(hasAny(patterns, ["horizontal_pull", "vertical_pull"])).toBe(true);
      }
    }
  });

  it("glute-focused programs include a hip thrust / bridge every week", () => {
    for (const program of programsWhere((c) => c.focus === "lower_glutes" || c.focus === "full_glutes")) {
      for (const week of program.weeks) {
        expect(weekPatterns(program, week.weekNumber).has("glute_bridge")).toBe(true);
      }
    }
  });

  it("upper-body programs push and pull every week without skipping legs entirely", () => {
    for (const program of programsWhere((c) => c.focus === "upper")) {
      for (const week of program.weeks) {
        const patterns = weekPatterns(program, week.weekNumber);
        expect(hasAny(patterns, ["horizontal_push", "vertical_push"])).toBe(true);
        expect(hasAny(patterns, ["horizontal_pull", "vertical_pull"])).toBe(true);
        expect(hasAny(patterns, ["squat", "lunge", "hinge"])).toBe(true);
      }
    }
  });

  it("every workout starts with a main lift", () => {
    for (const program of ALL) {
      for (const workout of program.workouts) expect(workout.exercises[0].role).toBe("primary");
    }
  });
});

describe("progression", () => {
  it("main lifts repeat across the challenge so progress is visible", () => {
    for (const program of ALL) {
      const { sessionsPerWeek, durationWeeks } = program.config;
      for (let day = 1; day <= sessionsPerWeek; day++) {
        const first = program.workouts.find((w) => w.weekNumber === 1 && w.dayNumber === day)!;
        const last = program.workouts.find((w) => w.weekNumber === durationWeeks && w.dayNumber === day)!;
        const firstMain = first.exercises.filter((e) => e.role === "primary").map((e) => e.exerciseId);
        const lastMain = last.exercises.filter((e) => e.role === "primary").map((e) => e.exerciseId);
        expect(lastMain).toEqual(firstMain);
      }
    }
  });

  it("main-lift volume or load increases from week 1 to later weeks", () => {
    const program = generateProgram({ ...DEFAULT_CONFIG, experience: "intermediate" }, { seed: 7 });
    const week1 = program.workouts[0].exercises[0];
    const week3 = program.workouts.find((w) => w.weekNumber === 3 && w.dayNumber === 1)!.exercises[0];
    expect(week3.exerciseId).toBe(week1.exerciseId);
    expect(week3.sets).toBeGreaterThan(week1.sets);
    expect(week3.reps!).toBeLessThanOrEqual(week1.reps!);
  });

  it("main lifts use slightly fewer reps with more resistance later on", () => {
    const program = generateProgram({ ...DEFAULT_CONFIG, goal: "general", experience: "intermediate" }, { seed: 3 });
    const week1 = program.workouts[0].exercises[0];
    const week3 = program.workouts.find((w) => w.weekNumber === 3 && w.dayNumber === 1)!.exercises[0];
    expect(week3.reps!).toBeLessThan(week1.reps!);
  });

  it("weeks are not identical", () => {
    for (const program of programsWhere((c) => c.experience !== "beginner").slice(0, 200)) {
      const signature = (week: number) =>
        JSON.stringify(
          program.workouts.filter((w) => w.weekNumber === week).map((w) => w.exercises.map((e) => [e.exerciseId, e.sets, e.reps])),
        );
      const signatures = new Set(program.weeks.map((w) => signature(w.weekNumber)));
      expect(signatures.size).toBeGreaterThan(1);
    }
  });

  it("uses the week phases Foundation → Finish Strong", () => {
    const program = generateProgram(DEFAULT_CONFIG, { seed: 1 });
    expect(program.weeks.map((w) => w.title)).toEqual(["Foundation", "Build", "Progress", "Finish Strong"]);
  });
});

describe("safety guardrails", () => {
  it("never prescribes very low reps, excessive sets or max-effort language", () => {
    for (const program of ALL) {
      for (const workout of program.workouts) {
        expect(workout.challengeText).not.toMatch(/\bmax\b|1RM|as many as possible|through the pain/i);
        for (const exercise of workout.exercises) {
          if (exercise.reps !== null) expect(exercise.reps).toBeGreaterThanOrEqual(6);
          expect(exercise.sets).toBeLessThanOrEqual(5);
          expect(exercise.sets).toBeGreaterThanOrEqual(1);
        }
      }
    }
  });
});

describe("exercise swaps", () => {
  it("only suggests exercises compatible with the challenge's equipment", () => {
    for (const equipment of EQUIPMENT_SETTINGS) {
      for (const exercise of EXERCISES) {
        for (const option of getSwapOptions(exercise.id, { equipment, experience: "advanced" })) {
          expect(option.equipment.every((item) => EQUIPMENT_AVAILABLE[equipment].includes(item))).toBe(true);
        }
      }
    }
  });

  it("suggests 2–4 alternatives for every strength exercise in a full gym", () => {
    for (const exercise of EXERCISES) {
      if (exercise.pattern === "conditioning") continue;
      const options = getSwapOptions(exercise.id, { equipment: "full_gym", experience: "advanced" });
      expect(options.length).toBeGreaterThanOrEqual(2);
      expect(options.length).toBeLessThanOrEqual(4);
      expect(options.map((o) => o.id)).not.toContain(exercise.id);
    }
  });

  it("suggests alternatives for every exercise a generated program can contain", () => {
    for (const program of ALL.filter((_, i) => i % 7 === 0)) {
      const { equipment, experience } = program.config;
      for (const exercise of allExercises(program)) {
        if (exercise.role === "finisher") continue;
        expect(getSwapOptions(exercise.exerciseId, { equipment, experience }).length).toBeGreaterThanOrEqual(1);
      }
    }
  });

  it("offers sensible single-leg swaps for a Bulgarian split squat", () => {
    const names = getSwapOptions("bulgarian-split-squat", { equipment: "full_gym", experience: "intermediate" }).map(
      (o) => o.name,
    );
    expect(names).toEqual(expect.arrayContaining(["Dumbbell Reverse Lunge", "Dumbbell Step-Up", "Single-Leg Press"]));
  });

  it("keeps isolation swaps on the same muscle", () => {
    const options = getSwapOptions("triceps-pushdown", { equipment: "full_gym", experience: "advanced" });
    for (const option of options) expect(option.primaryMuscle).toBe("triceps");
  });

  it("respects excluded exercises", () => {
    const options = getSwapOptions("goblet-squat", {
      equipment: "full_gym",
      experience: "advanced",
      excludeIds: ["leg-press"],
    });
    expect(options.map((o) => o.id)).not.toContain("leg-press");
  });
});

describe("exercise library", () => {
  it("has a curated size with unique ids", () => {
    expect(EXERCISES.length).toBeGreaterThanOrEqual(40);
    expect(EXERCISES.length).toBeLessThanOrEqual(65);
    expect(new Set(EXERCISES.map((e) => e.id)).size).toBe(EXERCISES.length);
  });
});
