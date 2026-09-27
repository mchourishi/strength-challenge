import type { DurationWeeks, WeekPhase } from "./types";

// Week-by-week progression. Changes are deliberately modest and participant-controlled:
// the app never needs to know anyone's actual strength level.

export interface WeekPlan {
  weekNumber: number;
  phase: WeekPhase;
  title: string;
  primarySetsDelta: number;
  primaryRepsDelta: number;
  secondarySetsDelta: number;
  secondaryRepsDelta: number;
  accessorySetsDelta: number;
  /** 0 → start of the exercise's time range, 1 → end of it (for timed exercises). */
  timedProgress: number;
  /** Add a short finisher when the time budget allows. */
  finisher: boolean;
}

type PlanWithoutNumber = Omit<WeekPlan, "weekNumber">;

const FOUNDATION: PlanWithoutNumber = {
  phase: "foundation",
  title: "Foundation",
  primarySetsDelta: 0,
  primaryRepsDelta: 0,
  secondarySetsDelta: 0,
  secondaryRepsDelta: 0,
  accessorySetsDelta: 0,
  timedProgress: 0,
  finisher: false,
};

const PLANS: Record<DurationWeeks, PlanWithoutNumber[]> = {
  4: [
    FOUNDATION,
    { ...FOUNDATION, phase: "build", title: "Build", secondaryRepsDelta: 2, accessorySetsDelta: 1, timedProgress: 0.33 },
    {
      ...FOUNDATION,
      phase: "progress",
      title: "Progress",
      primarySetsDelta: 1,
      primaryRepsDelta: -2,
      accessorySetsDelta: 1,
      timedProgress: 0.66,
    },
    {
      ...FOUNDATION,
      phase: "finish",
      title: "Finish Strong",
      primarySetsDelta: 1,
      primaryRepsDelta: -2,
      secondarySetsDelta: 1,
      accessorySetsDelta: 1,
      timedProgress: 1,
      finisher: true,
    },
  ],
  6: [
    FOUNDATION,
    { ...FOUNDATION, phase: "build", title: "Build", secondaryRepsDelta: 2, accessorySetsDelta: 1, timedProgress: 0.2 },
    {
      ...FOUNDATION,
      phase: "build",
      title: "Keep Building",
      secondarySetsDelta: 1,
      secondaryRepsDelta: 2,
      accessorySetsDelta: 1,
      timedProgress: 0.4,
    },
    {
      ...FOUNDATION,
      phase: "progress",
      title: "Progress",
      primarySetsDelta: 1,
      primaryRepsDelta: -2,
      accessorySetsDelta: 1,
      timedProgress: 0.6,
    },
    {
      ...FOUNDATION,
      phase: "progress",
      title: "Push On",
      primarySetsDelta: 1,
      primaryRepsDelta: -2,
      secondarySetsDelta: 1,
      accessorySetsDelta: 1,
      timedProgress: 0.8,
    },
    {
      ...FOUNDATION,
      phase: "finish",
      title: "Finish Strong",
      primarySetsDelta: 1,
      primaryRepsDelta: -2,
      secondarySetsDelta: 1,
      accessorySetsDelta: 1,
      timedProgress: 1,
      finisher: true,
    },
  ],
};

export function weekPlans(durationWeeks: DurationWeeks): WeekPlan[] {
  return PLANS[durationWeeks].map((plan, index) => ({ ...plan, weekNumber: index + 1 }));
}

/**
 * Exercise selections are made per "block". Main lifts stay fixed across blocks so
 * progress is visible; some other slots rotate for variety at the halfway point.
 */
export function blockForWeek(weekNumber: number, durationWeeks: DurationWeeks): 0 | 1 {
  return weekNumber <= durationWeeks / 2 ? 0 : 1;
}

interface ChallengeTextInput {
  phase: WeekPhase;
  dayNumber: number;
  mainLiftName: string | null;
  isFinalWorkout: boolean;
  isFirstWorkout: boolean;
}

const FOUNDATION_TEXTS = [
  "Find comfortable starting weights. Finish each set feeling like you could do about 2 more good reps.",
  "Focus on smooth, controlled reps. Today sets your starting point for the challenge.",
  "Keep the same steady technique from the first rep to the last.",
  "Notice which weights feel right — write one down if you like. No pressure to push yet.",
];

const BUILD_TEXTS = [
  "Pick one exercise from last week and do 1–2 more controlled reps, or add a small amount of weight.",
  "Try to make one exercise feel a little stronger than last time while keeping good form.",
  "Match last week's effort, then try 1–2 extra controlled reps on your favourite exercise.",
  "Slow the lowering part of each rep today. Control builds strength.",
];

export function challengeText(input: ChallengeTextInput): string {
  const lift = input.mainLiftName;
  if (input.isFirstWorkout) {
    return "Welcome to day one! Choose weights that let you move well and finish every set with good form.";
  }
  if (input.isFinalWorkout) {
    return "Final session! Choose one exercise and safely beat your week 1 performance. 🏆";
  }
  const pick = (texts: string[]) => texts[(input.dayNumber - 1) % texts.length];
  switch (input.phase) {
    case "foundation":
      return pick(FOUNDATION_TEXTS);
    case "build":
      return pick(BUILD_TEXTS);
    case "progress":
      return lift
        ? `Try adding a small amount of weight to ${lift} while keeping excellent form.`
        : "Try adding a small amount of weight to one main exercise while keeping excellent form.";
    case "finish":
      return lift
        ? `Compare ${lift} with week 1. If it feels good, improve it slightly — form first.`
        : "Compare one exercise with week 1 and improve it slightly if you can do so safely.";
  }
}

export const SAFETY_NOTE = "Choose a resistance that allows good form. Stop the exercise if you experience pain.";
