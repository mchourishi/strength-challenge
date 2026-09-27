import "server-only";
import { cache } from "react";
import { parseChallengeConfig, type ChallengeConfig, type MovementPattern, type SlotRole } from "@/lib/challenge-generator";
import { getSessionToken, hashToken } from "./session";
import { getSupabase } from "./supabase";

// ── Domain types ────────────────────────────────────────────────────────────

export interface Challenge {
  id: string;
  name: string;
  inviteToken: string;
  startDate: string;
  timezone: string;
  config: ChallengeConfig;
}

export interface Participant {
  id: string;
  challengeId: string;
  slot: 1 | 2;
  name: string;
  createdAt: string;
}

export interface ChallengeWorkout {
  id: string;
  sequence: number;
  weekNumber: number;
  dayNumber: number;
  weekTitle: string;
  name: string;
  emoji: string;
  estimatedMinutes: number;
  challengeText: string;
}

export interface WorkoutExercise {
  id: string;
  position: number;
  exerciseId: string;
  name: string;
  pattern: MovementPattern;
  role: SlotRole;
  sets: number;
  reps: number | null;
  durationSeconds: number | null;
  perSide: boolean;
  restSeconds: number;
  notes: string | null;
}

export interface Completion {
  participantId: string;
  challengeWorkoutId: string;
  startedAt: string;
  completedAt: string | null;
}

/** Private to the participant who recorded it. */
export interface ExerciseProgress {
  challengeWorkoutExerciseId: string;
  completed: boolean;
  weightKg: number | null;
  reps: number | null;
  substituteExerciseId: string | null;
  substituteName: string | null;
}

export interface PreviousLog {
  weightKg: number;
  reps: number | null;
}

// ── Row mapping ─────────────────────────────────────────────────────────────

interface ChallengeRow {
  id: string;
  name: string;
  invite_token: string;
  start_date: string;
  timezone: string;
  goal: string;
  experience: string;
  session_minutes: number;
  sessions_per_week: number;
  duration_weeks: number;
  equipment: string;
  focus: string;
}

interface ParticipantRow {
  id: string;
  challenge_id: string;
  slot: number;
  name: string;
  created_at: string;
}

interface WorkoutRow {
  id: string;
  sequence: number;
  week_number: number;
  day_number: number;
  week_title: string;
  name: string;
  emoji: string;
  estimated_minutes: number;
  challenge_text: string;
}

interface ExerciseRow {
  id: string;
  position: number;
  exercise_id: string;
  name: string;
  movement_pattern: string;
  role: string;
  sets: number;
  reps: number | null;
  duration_seconds: number | null;
  per_side: boolean;
  rest_seconds: number;
  notes: string | null;
}

interface CompletionRow {
  participant_id: string;
  challenge_workout_id: string;
  started_at: string;
  completed_at: string | null;
}

interface ProgressRow {
  challenge_workout_exercise_id: string;
  completed: boolean;
  weight_kg: number | string | null;
  reps: number | null;
  substitute_exercise_id: string | null;
  substitute_name: string | null;
}

const CHALLENGE_COLUMNS =
  "id, name, invite_token, start_date, timezone, goal, experience, session_minutes, sessions_per_week, duration_weeks, equipment, focus";
const WORKOUT_COLUMNS = "id, sequence, week_number, day_number, week_title, name, emoji, estimated_minutes, challenge_text";
const EXERCISE_COLUMNS =
  "id, position, exercise_id, name, movement_pattern, role, sets, reps, duration_seconds, per_side, rest_seconds, notes";
const PROGRESS_COLUMNS =
  "challenge_workout_exercise_id, completed, weight_kg, reps, substitute_exercise_id, substitute_name";

function toChallenge(row: ChallengeRow): Challenge {
  const config = parseChallengeConfig({
    goal: row.goal,
    experience: row.experience,
    sessionMinutes: row.session_minutes,
    sessionsPerWeek: row.sessions_per_week,
    durationWeeks: row.duration_weeks,
    equipment: row.equipment,
    focus: row.focus,
  });
  if (!config) throw new Error(`Challenge ${row.id} has an invalid configuration`);
  return {
    id: row.id,
    name: row.name,
    inviteToken: row.invite_token,
    startDate: row.start_date,
    timezone: row.timezone,
    config,
  };
}

function toParticipant(row: ParticipantRow): Participant {
  return {
    id: row.id,
    challengeId: row.challenge_id,
    slot: row.slot === 2 ? 2 : 1,
    name: row.name,
    createdAt: row.created_at,
  };
}

function toWorkout(row: WorkoutRow): ChallengeWorkout {
  return {
    id: row.id,
    sequence: row.sequence,
    weekNumber: row.week_number,
    dayNumber: row.day_number,
    weekTitle: row.week_title,
    name: row.name,
    emoji: row.emoji,
    estimatedMinutes: row.estimated_minutes,
    challengeText: row.challenge_text,
  };
}

function toExercise(row: ExerciseRow): WorkoutExercise {
  return {
    id: row.id,
    position: row.position,
    exerciseId: row.exercise_id,
    name: row.name,
    pattern: row.movement_pattern as MovementPattern,
    role: row.role as SlotRole,
    sets: row.sets,
    reps: row.reps,
    durationSeconds: row.duration_seconds,
    perSide: row.per_side,
    restSeconds: row.rest_seconds,
    notes: row.notes,
  };
}

function toCompletion(row: CompletionRow): Completion {
  return {
    participantId: row.participant_id,
    challengeWorkoutId: row.challenge_workout_id,
    startedAt: row.started_at,
    completedAt: row.completed_at,
  };
}

function toProgress(row: ProgressRow): ExerciseProgress {
  return {
    challengeWorkoutExerciseId: row.challenge_workout_exercise_id,
    completed: row.completed,
    weightKg: row.weight_kg === null ? null : Number(row.weight_kg),
    reps: row.reps,
    substituteExerciseId: row.substitute_exercise_id,
    substituteName: row.substitute_name,
  };
}

function check<T>(result: { data: T | null; error: { message: string } | null }, context: string): T {
  if (result.error) throw new Error(`${context}: ${result.error.message}`);
  if (result.data === null) throw new Error(`${context}: no data`);
  return result.data;
}

// ── Session ─────────────────────────────────────────────────────────────────

export interface Viewer {
  participant: Participant;
  challenge: Challenge;
  token: string;
}

/** The participant for this browser's private token, or null. Cached per request. */
export const getViewer = cache(async (): Promise<Viewer | null> => {
  const token = await getSessionToken();
  if (!token) return null;
  return getViewerForToken(token);
});

export async function getViewerForToken(token: string): Promise<Viewer | null> {
  const supabase = getSupabase();
  const result = await supabase
    .from("participants")
    .select(`id, challenge_id, slot, name, created_at, challenges (${CHALLENGE_COLUMNS})`)
    .eq("token_hash", hashToken(token))
    .maybeSingle();
  if (result.error) throw new Error(`Loading participant: ${result.error.message}`);
  if (!result.data) return null;

  const row = result.data as unknown as ParticipantRow & { challenges: ChallengeRow };
  return { participant: toParticipant(row), challenge: toChallenge(row.challenges), token };
}

// ── Challenge-wide data (shared between both friends) ──────────────────────

export interface ChallengeOverview {
  participants: Participant[];
  workouts: ChallengeWorkout[];
  completions: Completion[];
}

export const getChallengeOverview = cache(async (challengeId: string): Promise<ChallengeOverview> => {
  const supabase = getSupabase();
  const [participants, workouts] = await Promise.all([
    supabase
      .from("participants")
      .select("id, challenge_id, slot, name, created_at")
      .eq("challenge_id", challengeId)
      .order("slot"),
    supabase.from("challenge_workouts").select(WORKOUT_COLUMNS).eq("challenge_id", challengeId).order("sequence"),
  ]);
  const participantRows = check(participants, "Loading participants") as ParticipantRow[];

  const completions = await supabase
    .from("participant_workouts")
    .select("participant_id, challenge_workout_id, started_at, completed_at")
    .in(
      "participant_id",
      participantRows.map((p) => p.id),
    );

  return {
    participants: participantRows.map(toParticipant),
    workouts: (check(workouts, "Loading workouts") as WorkoutRow[]).map(toWorkout),
    completions: (check(completions, "Loading completions") as CompletionRow[]).map(toCompletion),
  };
});

export async function findChallengeByInvite(inviteToken: string) {
  const supabase = getSupabase();
  const result = await supabase
    .from("challenges")
    .select(`${CHALLENGE_COLUMNS}, participants (id, challenge_id, slot, name, created_at)`)
    .eq("invite_token", inviteToken)
    .maybeSingle();
  if (result.error) throw new Error(`Loading invite: ${result.error.message}`);
  if (!result.data) return null;
  const row = result.data as unknown as ChallengeRow & { participants: ParticipantRow[] };
  return { challenge: toChallenge(row), participants: row.participants.map(toParticipant) };
}

// ── A single workout, from one participant's point of view ─────────────────

export interface WorkoutDetail {
  workout: ChallengeWorkout;
  exercises: WorkoutExercise[];
  progress: ExerciseProgress[];
  completion: Completion | null;
  /** Keyed by the exercise the participant actually does (after any swap). Private. */
  previousLogs: Record<string, PreviousLog>;
}

export async function getWorkoutDetail(viewer: Viewer, workoutId: string): Promise<WorkoutDetail | null> {
  const supabase = getSupabase();
  const workoutResult = await supabase
    .from("challenge_workouts")
    .select(WORKOUT_COLUMNS)
    .eq("id", workoutId)
    .eq("challenge_id", viewer.challenge.id)
    .maybeSingle();
  if (workoutResult.error) throw new Error(`Loading workout: ${workoutResult.error.message}`);
  if (!workoutResult.data) return null;

  const [exercises, completion, logs] = await Promise.all([
    supabase.from("challenge_workout_exercises").select(EXERCISE_COLUMNS).eq("challenge_workout_id", workoutId).order("position"),
    supabase
      .from("participant_workouts")
      .select("participant_id, challenge_workout_id, started_at, completed_at")
      .eq("participant_id", viewer.participant.id)
      .eq("challenge_workout_id", workoutId)
      .maybeSingle(),
    supabase
      .from("participant_exercise_progress")
      .select(`${PROGRESS_COLUMNS}, updated_at, challenge_workout_exercises (exercise_id, challenge_workout_id)`)
      .eq("participant_id", viewer.participant.id),
  ]);

  const exerciseList = (check(exercises, "Loading exercises") as ExerciseRow[]).map(toExercise);
  const exerciseIds = new Set(exerciseList.map((e) => e.id));
  if (completion.error) throw new Error(`Loading completion: ${completion.error.message}`);

  type LogRow = ProgressRow & {
    updated_at: string;
    challenge_workout_exercises: { exercise_id: string; challenge_workout_id: string };
  };
  const logRows = check(logs, "Loading progress") as unknown as LogRow[];

  const progress = logRows.filter((r) => exerciseIds.has(r.challenge_workout_exercise_id)).map(toProgress);

  // "Last time" hints come from this participant's other workouts only.
  const previousLogs: Record<string, PreviousLog> = {};
  const history = logRows
    .filter((r) => r.weight_kg !== null && r.challenge_workout_exercises.challenge_workout_id !== workoutId)
    .sort((a, b) => b.updated_at.localeCompare(a.updated_at));
  for (const row of history) {
    const key = row.substitute_exercise_id ?? row.challenge_workout_exercises.exercise_id;
    previousLogs[key] ??= { weightKg: Number(row.weight_kg), reps: row.reps };
  }

  return {
    workout: toWorkout(workoutResult.data as WorkoutRow),
    exercises: exerciseList,
    progress,
    completion: completion.data ? toCompletion(completion.data as CompletionRow) : null,
    previousLogs,
  };
}

/** Best recorded weight per exercise for one participant. Private. */
export async function getPersonalRecords(participantId: string) {
  const supabase = getSupabase();
  const result = await supabase
    .from("participant_exercise_progress")
    .select("weight_kg, reps, substitute_exercise_id, substitute_name, challenge_workout_exercises (exercise_id, name)")
    .eq("participant_id", participantId)
    .not("weight_kg", "is", null);

  type Row = {
    weight_kg: number | string;
    reps: number | null;
    substitute_exercise_id: string | null;
    substitute_name: string | null;
    challenge_workout_exercises: { exercise_id: string; name: string };
  };
  const rows = check(result, "Loading personal records") as unknown as Row[];

  const best = new Map<string, { name: string; weightKg: number; reps: number | null }>();
  for (const row of rows) {
    const id = row.substitute_exercise_id ?? row.challenge_workout_exercises.exercise_id;
    const name = row.substitute_name ?? row.challenge_workout_exercises.name;
    const weightKg = Number(row.weight_kg);
    const current = best.get(id);
    if (!current || weightKg > current.weightKg) best.set(id, { name, weightKg, reps: row.reps });
  }
  return [...best.values()].sort((a, b) => a.name.localeCompare(b.name));
}
