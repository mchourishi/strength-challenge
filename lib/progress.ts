import { challengePhase, localDateString, weekForDate, type ChallengePhase } from "./dates";

// Pure progress calculations shared by the home, program and progress screens.

export interface ProgressChallenge {
  startDate: string;
  timezone: string;
  durationWeeks: number;
  sessionsPerWeek: number;
}

export interface ProgressWorkout {
  id: string;
  sequence: number;
  weekNumber: number;
  name: string;
}

export interface ProgressCompletion {
  participantId: string;
  challengeWorkoutId: string;
  startedAt: string;
  completedAt: string | null;
}

export interface ParticipantSummary {
  participantId: string;
  completed: number;
  total: number;
  /** Workouts completed in each challenge week (index 0 = week 1). */
  weeklyCounts: number[];
  completedWorkoutIds: Set<string>;
  /** ISO completion time per completed workout id. */
  completedAt: Map<string, string>;
  inProgressWorkoutIds: Set<string>;
  nextWorkout: ProgressWorkout | null;
}

export function summariseParticipant(
  participantId: string,
  challenge: ProgressChallenge,
  workouts: readonly ProgressWorkout[],
  completions: readonly ProgressCompletion[],
): ParticipantSummary {
  const mine = completions.filter((c) => c.participantId === participantId);
  const completedAt = new Map(
    mine.filter((c) => c.completedAt).map((c) => [c.challengeWorkoutId, c.completedAt as string] as const),
  );
  const completedWorkoutIds = new Set(completedAt.keys());
  const inProgressWorkoutIds = new Set(mine.filter((c) => !c.completedAt).map((c) => c.challengeWorkoutId));

  const weeklyCounts = Array.from({ length: challenge.durationWeeks }, () => 0);
  for (const completion of mine) {
    if (!completion.completedAt) continue;
    const localDate = localDateString(new Date(completion.completedAt), challenge.timezone);
    weeklyCounts[weekForDate(challenge.startDate, localDate, challenge.durationWeeks) - 1] += 1;
  }

  const ordered = [...workouts].sort((a, b) => a.sequence - b.sequence);
  return {
    participantId,
    completed: completedWorkoutIds.size,
    total: workouts.length,
    weeklyCounts,
    completedWorkoutIds,
    completedAt,
    inProgressWorkoutIds,
    nextWorkout: ordered.find((w) => !completedWorkoutIds.has(w.id)) ?? null,
  };
}

export function currentPhase(challenge: ProgressChallenge, now: Date): ChallengePhase {
  return challengePhase(challenge.startDate, localDateString(now, challenge.timezone), challenge.durationWeeks);
}

/** The week used for "this week" counts: the active week, or the final week once ended. */
export function displayWeek(phase: ChallengePhase, durationWeeks: number): number {
  if (phase.kind === "active") return phase.week;
  if (phase.kind === "ended") return durationWeeks;
  return 1;
}

export function percent(completed: number, total: number): number {
  return total === 0 ? 0 : Math.round((completed / total) * 100);
}
