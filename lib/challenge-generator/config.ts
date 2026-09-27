import {
  DURATION_WEEKS,
  EQUIPMENT_SETTINGS,
  EXPERIENCE_LEVELS,
  FOCUSES,
  GOALS,
  SESSIONS_PER_WEEK,
  SESSION_MINUTES,
  type ChallengeConfig,
} from "./types";

export const DEFAULT_CONFIG: ChallengeConfig = {
  goal: "strength",
  experience: "beginner",
  sessionMinutes: 45,
  sessionsPerWeek: 3,
  durationWeeks: 4,
  equipment: "full_gym",
  focus: "balanced",
};

function oneOf<T extends string | number>(allowed: readonly T[], value: unknown): T | null {
  return allowed.includes(value as T) ? (value as T) : null;
}

/** Validate untrusted input (e.g. from a form or the database) into a ChallengeConfig. */
export function parseChallengeConfig(input: unknown): ChallengeConfig | null {
  if (typeof input !== "object" || input === null) return null;
  const raw = input as Record<string, unknown>;
  const config = {
    goal: oneOf(GOALS, raw.goal),
    experience: oneOf(EXPERIENCE_LEVELS, raw.experience),
    sessionMinutes: oneOf(SESSION_MINUTES, raw.sessionMinutes),
    sessionsPerWeek: oneOf(SESSIONS_PER_WEEK, raw.sessionsPerWeek),
    durationWeeks: oneOf(DURATION_WEEKS, raw.durationWeeks),
    equipment: oneOf(EQUIPMENT_SETTINGS, raw.equipment),
    focus: oneOf(FOCUSES, raw.focus),
  };
  if (Object.values(config).some((value) => value === null)) return null;
  return config as ChallengeConfig;
}
