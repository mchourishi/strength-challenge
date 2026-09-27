import type { Focus, MovementPattern, MuscleGroup, SessionsPerWeek, SlotRole } from "./types";

// Day templates: ordered movement-pattern slots, highest priority first.
// Shorter sessions take the first N slots, so the most important movements always survive.

export interface Slot {
  role: Exclude<SlotRole, "finisher">;
  patterns: readonly MovementPattern[];
  /** Restrict to these primary muscles (e.g. biceps vs triceps). */
  muscles?: readonly MuscleGroup[];
  /** Used only when no exercise matches `patterns`. */
  fallback?: readonly MovementPattern[];
}

export interface DayTemplate {
  id: string;
  name: string;
  emoji: string;
  slots: readonly Slot[];
}

const P = (patterns: MovementPattern[], extra: Partial<Slot> = {}): Slot => ({ role: "primary", patterns, ...extra });
const S = (patterns: MovementPattern[], extra: Partial<Slot> = {}): Slot => ({ role: "secondary", patterns, ...extra });
const A = (patterns: MovementPattern[], extra: Partial<Slot> = {}): Slot => ({ role: "accessory", patterns, ...extra });

const VPULL: Partial<Slot> = { fallback: ["horizontal_pull"] };
const BICEPS: Partial<Slot> = { muscles: ["biceps"] };
const TRICEPS: Partial<Slot> = { muscles: ["triceps"] };
const HAMSTRINGS: Partial<Slot> = { muscles: ["hamstrings"], fallback: ["hinge"] };
const CARRY: Partial<Slot> = { fallback: ["core"] };

export const DAY_TEMPLATES = {
  fullBodyA: {
    id: "full-body-a",
    name: "Full Body A",
    emoji: "⚡",
    slots: [
      P(["squat"]),
      P(["horizontal_push"]),
      S(["hinge"]),
      S(["horizontal_pull"]),
      A(["lunge"]),
      A(["core", "carry"]),
      A(["shoulder_isolation"]),
      A(["arm_isolation"], BICEPS),
    ],
  },
  fullBodyB: {
    id: "full-body-b",
    name: "Full Body B",
    emoji: "⚡",
    slots: [
      P(["hinge"]),
      P(["vertical_pull"], VPULL),
      S(["lunge", "squat"]),
      S(["vertical_push"]),
      A(["glute_bridge"]),
      A(["carry"], CARRY),
      A(["arm_isolation"], TRICEPS),
      A(["core"]),
    ],
  },
  fullBody: {
    id: "full-body",
    name: "Full Body",
    emoji: "⚡",
    slots: [
      P(["squat"]),
      P(["vertical_pull"], VPULL),
      S(["hinge"]),
      S(["horizontal_push"]),
      A(["lunge"]),
      A(["carry"], CARRY),
      A(["shoulder_isolation"]),
      A(["core"]),
    ],
  },
  lowerPush: {
    id: "lower-push",
    name: "Lower + Push",
    emoji: "🦵",
    slots: [
      P(["squat"]),
      P(["horizontal_push"]),
      S(["hinge"]),
      S(["vertical_push"]),
      A(["lunge"]),
      A(["core"]),
      A(["arm_isolation"], TRICEPS),
      A(["glute_isolation"]),
    ],
  },
  upperHinge: {
    id: "upper-hinge",
    name: "Upper + Hinge",
    emoji: "💪",
    slots: [
      P(["hinge"]),
      P(["horizontal_pull"]),
      S(["horizontal_push"]),
      S(["vertical_pull"], VPULL),
      A(["glute_bridge"]),
      A(["shoulder_isolation"]),
      A(["arm_isolation"], BICEPS),
      A(["core"]),
    ],
  },
  lowerBody: {
    id: "lower-body",
    name: "Lower Body",
    emoji: "🦵",
    slots: [
      P(["squat"]),
      P(["hinge"]),
      S(["lunge"]),
      S(["glute_bridge"]),
      A(["leg_isolation"], HAMSTRINGS),
      A(["core"]),
      A(["glute_isolation"]),
      A(["leg_isolation"], { muscles: ["quads"], fallback: ["glute_isolation"] }),
    ],
  },
  upperBody: {
    id: "upper-body",
    name: "Upper Body",
    emoji: "💪",
    slots: [
      P(["horizontal_push"]),
      P(["horizontal_pull"]),
      S(["vertical_pull"], VPULL),
      S(["vertical_push"]),
      A(["shoulder_isolation"]),
      A(["arm_isolation"], BICEPS),
      A(["arm_isolation"], TRICEPS),
      A(["core"]),
    ],
  },
  pullPush: {
    id: "pull-push",
    name: "Pull + Push",
    emoji: "💪",
    slots: [
      P(["vertical_pull"], VPULL),
      P(["vertical_push"]),
      S(["horizontal_pull"]),
      S(["horizontal_push"]),
      A(["shoulder_isolation"]),
      A(["arm_isolation"], BICEPS),
      A(["arm_isolation"], TRICEPS),
      A(["carry"], CARRY),
    ],
  },
  glutesLegs: {
    id: "glutes-legs",
    name: "Glutes + Legs",
    emoji: "🍑",
    slots: [
      P(["glute_bridge"]),
      P(["squat"]),
      S(["hinge"]),
      S(["lunge"]),
      A(["glute_isolation"]),
      A(["leg_isolation"], HAMSTRINGS),
      A(["core"]),
      A(["glute_isolation"]),
    ],
  },
  hingeGlutes: {
    id: "hinge-glutes",
    name: "Hinge + Glutes",
    emoji: "🍑",
    slots: [
      P(["hinge"]),
      P(["lunge"]),
      S(["glute_bridge"]),
      S(["squat"]),
      A(["glute_isolation"]),
      A(["core"]),
      A(["glute_isolation"]),
      A(["leg_isolation"], HAMSTRINGS),
    ],
  },
  fullBodyGlutesA: {
    id: "full-body-glutes-a",
    name: "Full Body + Glutes",
    emoji: "🍑",
    slots: [
      P(["squat"]),
      P(["horizontal_push"]),
      S(["glute_bridge"]),
      S(["horizontal_pull"]),
      A(["glute_isolation"]),
      A(["core"]),
      A(["lunge"]),
      A(["shoulder_isolation"]),
    ],
  },
  fullBodyGlutesB: {
    id: "full-body-glutes-b",
    name: "Full Body + Glutes",
    emoji: "🍑",
    slots: [
      P(["hinge"]),
      P(["vertical_pull"], VPULL),
      S(["lunge"]),
      S(["vertical_push"]),
      A(["glute_isolation"]),
      A(["carry"], CARRY),
      A(["glute_bridge"]),
      A(["arm_isolation"], TRICEPS),
    ],
  },
} as const satisfies Record<string, DayTemplate>;

const T = DAY_TEMPLATES;

/** Weekly split for each focus and frequency. */
export const SPLITS: Record<Focus, Record<SessionsPerWeek, readonly DayTemplate[]>> = {
  balanced: {
    2: [T.fullBodyA, T.fullBodyB],
    3: [T.lowerPush, T.upperHinge, T.fullBody],
    4: [T.lowerBody, T.upperBody, T.lowerBody, T.upperBody],
  },
  lower_glutes: {
    2: [T.glutesLegs, T.fullBodyGlutesA],
    3: [T.glutesLegs, T.upperBody, T.hingeGlutes],
    4: [T.glutesLegs, T.upperBody, T.hingeGlutes, T.fullBodyGlutesA],
  },
  upper: {
    2: [T.upperBody, T.fullBody],
    3: [T.upperBody, T.lowerBody, T.pullPush],
    4: [T.upperBody, T.lowerBody, T.pullPush, T.fullBody],
  },
  full_glutes: {
    2: [T.fullBodyGlutesA, T.fullBodyGlutesB],
    3: [T.fullBodyGlutesA, T.glutesLegs, T.fullBodyGlutesB],
    4: [T.fullBodyGlutesA, T.glutesLegs, T.fullBodyGlutesB, T.hingeGlutes],
  },
};

/** Distinguish repeated templates within a week, e.g. "Lower Body A" / "Lower Body B". */
export function dayNames(split: readonly DayTemplate[]): string[] {
  return split.map((day, index) => {
    const total = split.filter((d) => d.name === day.name).length;
    if (total === 1) return day.name;
    const occurrence = split.slice(0, index + 1).filter((d) => d.name === day.name).length;
    return `${day.name} ${String.fromCharCode(64 + occurrence)}`;
  });
}
