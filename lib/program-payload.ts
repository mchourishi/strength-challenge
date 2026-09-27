import type { GeneratedProgram } from "./challenge-generator/types";

/** Shape expected by the `create_challenge` Postgres function (minus the creator). */
export function buildChallengePayload(
  program: GeneratedProgram,
  input: { challengeName: string; startDate: string; timezone: string; inviteToken: string },
) {
  const { config } = program;
  const weekTitles = new Map(program.weeks.map((w) => [w.weekNumber, w.title]));
  return {
    challenge: {
      name: input.challengeName,
      invite_token: input.inviteToken,
      start_date: input.startDate,
      timezone: input.timezone,
      goal: config.goal,
      experience: config.experience,
      session_minutes: config.sessionMinutes,
      sessions_per_week: config.sessionsPerWeek,
      duration_weeks: config.durationWeeks,
      equipment: config.equipment,
      focus: config.focus,
      generator: program.generator,
      generator_seed: program.seed,
    },
    workouts: program.workouts.map((w) => ({
      sequence: w.sequence,
      week_number: w.weekNumber,
      day_number: w.dayNumber,
      week_title: weekTitles.get(w.weekNumber) ?? `Week ${w.weekNumber}`,
      name: w.name,
      emoji: w.emoji,
      estimated_minutes: w.estimatedMinutes,
      challenge_text: w.challengeText,
      exercises: w.exercises.map((e, index) => ({
        position: index + 1,
        exercise_id: e.exerciseId,
        name: e.name,
        movement_pattern: e.pattern,
        role: e.role,
        sets: e.sets,
        reps: e.reps,
        duration_seconds: e.durationSeconds,
        per_side: e.perSide,
        rest_seconds: e.restSeconds,
        notes: e.notes,
      })),
    })),
  };
}

