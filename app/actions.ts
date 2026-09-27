"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  getExercise,
  isValidSwap,
  parseChallengeConfig,
  ruleBasedGenerator,
} from "@/lib/challenge-generator";
import { daysBetween, isValidDateString, isValidTimeZone, localDateString, weekForDate } from "@/lib/dates";
import { buildChallengePayload } from "@/lib/program-payload";
import { summariseParticipant } from "@/lib/progress";
import { findChallengeByInvite, getChallengeOverview, getViewer, type Viewer } from "@/lib/server/data";
import { generateToken, hashToken, setSessionToken } from "@/lib/server/session";
import { getSupabase } from "@/lib/server/supabase";

export type ActionResult<T = null> = { ok: true; data: T } | { ok: false; error: string };

const ok = <T>(data: T): ActionResult<T> => ({ ok: true, data });
const fail = (error: string): ActionResult<never> => ({ ok: false, error });

function cleanName(value: unknown, maxLength: number): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim().replace(/\s+/g, " ");
  return trimmed.length >= 1 && trimmed.length <= maxLength ? trimmed : null;
}

async function requireViewer(): Promise<Viewer> {
  const viewer = await getViewer();
  if (!viewer) throw new Error("Your session has expired. Open your personal link again.");
  return viewer;
}

// ── Create ──────────────────────────────────────────────────────────────────

export interface CreateChallengeInput {
  config: unknown;
  seed: number;
  challengeName: string;
  creatorName: string;
  startDate: string;
  timezone: string;
}

export async function createChallengeAction(input: CreateChallengeInput): Promise<ActionResult> {
  const config = parseChallengeConfig(input.config);
  const creatorName = cleanName(input.creatorName, 40);
  const challengeName = cleanName(input.challengeName, 60);
  const seed = Number(input.seed);

  if (!config) return fail("Some challenge options were missing. Please go back and check them.");
  if (!creatorName) return fail("Please enter your first name.");
  if (!challengeName) return fail("Please give your challenge a name.");
  if (!Number.isInteger(seed) || seed < 0 || seed >= 2 ** 31) return fail("Please regenerate the program.");
  if (!isValidTimeZone(input.timezone)) return fail("We couldn't detect your time zone.");
  if (!isValidDateString(input.startDate)) return fail("Please choose a valid start date.");
  const today = localDateString(new Date(), input.timezone);
  const offset = daysBetween(today, input.startDate);
  if (offset < -14 || offset > 90) return fail("Choose a start date within the next three months.");

  // The server regenerates from (config, seed) — the client never submits the program itself.
  const program = ruleBasedGenerator.generate(config, { seed });
  const participantToken = generateToken();
  const payload = {
    ...buildChallengePayload(program, {
      challengeName,
      startDate: input.startDate,
      timezone: input.timezone,
      inviteToken: generateToken(),
    }),
    creator: { name: creatorName, token_hash: hashToken(participantToken) },
  };

  const { error } = await getSupabase().rpc("create_challenge", { payload });
  if (error) {
    console.error("create_challenge failed", error);
    return fail("We couldn't save your challenge. Please try again.");
  }

  await setSessionToken(participantToken);
  redirect("/invite");
}

// ── Join ────────────────────────────────────────────────────────────────────

export async function joinChallengeAction(inviteToken: string, rawName: string): Promise<ActionResult> {
  const name = cleanName(rawName, 40);
  if (!name) return fail("Please enter your first name.");

  const found = await findChallengeByInvite(inviteToken);
  if (!found) return fail("This invite link isn't valid.");

  const viewer = await getViewer();
  if (viewer?.challenge.id === found.challenge.id) redirect("/");

  if (found.participants.length >= 2) return fail("This challenge already has two friends.");

  const participantToken = generateToken();
  const takenSlots = new Set(found.participants.map((p) => p.slot));
  const { error } = await getSupabase()
    .from("participants")
    .insert({
      challenge_id: found.challenge.id,
      slot: takenSlots.has(1) ? 2 : 1,
      name,
      token_hash: hashToken(participantToken),
    });

  if (error) {
    // 23505 = unique violation: someone else took the slot at the same moment.
    if (error.code === "23505") return fail("This challenge already has two friends.");
    console.error("join failed", error);
    return fail("We couldn't join the challenge. Please try again.");
  }

  await setSessionToken(participantToken);
  redirect("/");
}

// ── Workout progress ───────────────────────────────────────────────────────

async function loadOwnedExercise(viewer: Viewer, challengeWorkoutExerciseId: string) {
  const { data, error } = await getSupabase()
    .from("challenge_workout_exercises")
    .select("id, exercise_id, challenge_workout_id, challenge_workouts!inner (challenge_id)")
    .eq("id", challengeWorkoutExerciseId)
    .eq("challenge_workouts.challenge_id", viewer.challenge.id)
    .maybeSingle();
  if (error || !data) throw new Error("Exercise not found in your challenge.");
  return data as unknown as { id: string; exercise_id: string; challenge_workout_id: string };
}

async function assertOwnedWorkout(viewer: Viewer, workoutId: string) {
  const { data, error } = await getSupabase()
    .from("challenge_workouts")
    .select("id")
    .eq("id", workoutId)
    .eq("challenge_id", viewer.challenge.id)
    .maybeSingle();
  if (error || !data) throw new Error("Workout not found in your challenge.");
}

/** Marks the workout as started (idempotent). */
async function ensureStarted(participantId: string, workoutId: string) {
  const { error } = await getSupabase()
    .from("participant_workouts")
    .upsert(
      { participant_id: participantId, challenge_workout_id: workoutId },
      { onConflict: "participant_id,challenge_workout_id", ignoreDuplicates: true },
    );
  if (error) throw new Error(`Starting workout: ${error.message}`);
}

async function upsertProgress(viewer: Viewer, challengeWorkoutExerciseId: string, fields: Record<string, unknown>) {
  const exercise = await loadOwnedExercise(viewer, challengeWorkoutExerciseId);
  await ensureStarted(viewer.participant.id, exercise.challenge_workout_id);
  const { error } = await getSupabase()
    .from("participant_exercise_progress")
    .upsert(
      {
        participant_id: viewer.participant.id,
        challenge_workout_exercise_id: challengeWorkoutExerciseId,
        ...fields,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "participant_id,challenge_workout_exercise_id" },
    );
  if (error) throw new Error(`Saving progress: ${error.message}`);
  return exercise;
}

async function run<T>(fn: () => Promise<T>): Promise<ActionResult<T>> {
  try {
    return ok(await fn());
  } catch (error) {
    console.error(error);
    return fail(error instanceof Error ? error.message : "Something went wrong. Please try again.");
  }
}

export async function setExerciseDoneAction(challengeWorkoutExerciseId: string, completed: boolean) {
  return run(async () => {
    const viewer = await requireViewer();
    await upsertProgress(viewer, challengeWorkoutExerciseId, { completed: Boolean(completed) });
    return null;
  });
}

function parseOptionalNumber(value: number | null, min: number, max: number, integer: boolean): number | null {
  if (value === null) return null;
  if (!Number.isFinite(value) || value < min || value > max) throw new Error("Please enter a sensible number.");
  return integer ? Math.round(value) : Math.round(value * 100) / 100;
}

export async function saveExerciseLogAction(challengeWorkoutExerciseId: string, weightKg: number | null, reps: number | null) {
  return run(async () => {
    const viewer = await requireViewer();
    await upsertProgress(viewer, challengeWorkoutExerciseId, {
      weight_kg: parseOptionalNumber(weightKg, 0, 1000, false),
      reps: parseOptionalNumber(reps, 0, 200, true),
    });
    return null;
  });
}

/** Swap applies only to this participant. Pass null to go back to the prescribed exercise. */
export async function swapExerciseAction(challengeWorkoutExerciseId: string, substituteExerciseId: string | null) {
  return run(async () => {
    const viewer = await requireViewer();
    const owned = await loadOwnedExercise(viewer, challengeWorkoutExerciseId);

    let substitute: { id: string; name: string } | null = null;
    if (substituteExerciseId) {
      const { equipment, experience } = viewer.challenge.config;
      const exercise = getExercise(substituteExerciseId);
      if (!exercise || !isValidSwap(owned.exercise_id, substituteExerciseId, { equipment, experience })) {
        throw new Error("That swap isn't available for this exercise.");
      }
      substitute = { id: exercise.id, name: exercise.name };
    }

    // A different exercise means earlier logged numbers no longer apply.
    await upsertProgress(viewer, challengeWorkoutExerciseId, {
      substitute_exercise_id: substitute?.id ?? null,
      substitute_name: substitute?.name ?? null,
      weight_kg: null,
      reps: null,
    });
    return substitute;
  });
}

export interface CompletionSummary {
  completed: number;
  total: number;
  weekCount: number;
  weeklyTarget: number;
  finishedChallenge: boolean;
  bothFinished: boolean;
}

export async function completeWorkoutAction(workoutId: string) {
  return run(async (): Promise<CompletionSummary> => {
    const viewer = await requireViewer();
    await assertOwnedWorkout(viewer, workoutId);
    await ensureStarted(viewer.participant.id, workoutId);

    // Conditional update: a double tap or second device can't complete it twice.
    const { error } = await getSupabase()
      .from("participant_workouts")
      .update({ completed_at: new Date().toISOString() })
      .eq("participant_id", viewer.participant.id)
      .eq("challenge_workout_id", workoutId)
      .is("completed_at", null);
    if (error) throw new Error(`Completing workout: ${error.message}`);

    revalidatePath("/", "layout");

    const { challenge } = viewer;
    const overview = await getChallengeOverview(challenge.id);
    const progressChallenge = {
      startDate: challenge.startDate,
      timezone: challenge.timezone,
      durationWeeks: challenge.config.durationWeeks,
      sessionsPerWeek: challenge.config.sessionsPerWeek,
    };
    const summaries = overview.participants.map((p) =>
      summariseParticipant(p.id, progressChallenge, overview.workouts, overview.completions),
    );
    const mine = summaries.find((s) => s.participantId === viewer.participant.id)!;
    const today = localDateString(new Date(), challenge.timezone);
    const week = weekForDate(challenge.startDate, today, challenge.config.durationWeeks);

    return {
      completed: mine.completed,
      total: mine.total,
      weekCount: mine.weeklyCounts[week - 1],
      weeklyTarget: challenge.config.sessionsPerWeek,
      finishedChallenge: mine.completed === mine.total,
      bothFinished: summaries.length === 2 && summaries.every((s) => s.completed === s.total),
    };
  });
}

export async function reopenWorkoutAction(workoutId: string) {
  return run(async () => {
    const viewer = await requireViewer();
    await assertOwnedWorkout(viewer, workoutId);
    const { error } = await getSupabase()
      .from("participant_workouts")
      .update({ completed_at: null })
      .eq("participant_id", viewer.participant.id)
      .eq("challenge_workout_id", workoutId);
    if (error) throw new Error(`Reopening workout: ${error.message}`);
    revalidatePath("/", "layout");
    return null;
  });
}
