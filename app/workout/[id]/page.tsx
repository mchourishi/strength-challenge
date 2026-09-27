import { notFound, redirect } from "next/navigation";
import { getExercise, getSwapOptions, SAFETY_NOTE } from "@/lib/challenge-generator";
import { formatPrescription } from "@/lib/challenge-generator/format";
import { relativeDayLabel } from "@/lib/dates";
import { getChallengeOverview, getViewer, getWorkoutDetail } from "@/lib/server/data";
import type { ExerciseItem, PreviousLog } from "./types";
import { WorkoutView } from "./WorkoutView";

export const metadata = { title: "Workout · Stronger Together" };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function WorkoutPage({ params }: PageProps<"/workout/[id]">) {
  const { id } = await params;
  const viewer = await getViewer();
  if (!viewer) redirect("/");
  if (!UUID.test(id)) notFound();

  const [detail, overview] = await Promise.all([getWorkoutDetail(viewer, id), getChallengeOverview(viewer.challenge.id)]);
  if (!detail) notFound();

  const { equipment, experience } = viewer.challenge.config;
  const workoutExerciseIds = detail.exercises.map((e) => e.exerciseId);
  const progressById = new Map(detail.progress.map((p) => [p.challengeWorkoutExerciseId, p]));

  const items: ExerciseItem[] = detail.exercises.map((e) => {
    const progress = progressById.get(e.id);
    const swapOptions = getSwapOptions(e.exerciseId, {
      equipment,
      experience,
      excludeIds: workoutExerciseIds.filter((other) => other !== e.exerciseId),
    }).map((option) => ({ id: option.id, name: option.name, instructions: option.instructions ?? null }));

    return {
      id: e.id,
      exerciseId: e.exerciseId,
      name: e.name,
      role: e.role,
      prescription: formatPrescription(e),
      restSeconds: e.restSeconds,
      notes: e.notes ?? getExercise(e.exerciseId)?.instructions ?? null,
      swapOptions,
      initial: {
        completed: progress?.completed ?? false,
        weightKg: progress?.weightKg ?? null,
        reps: progress?.reps ?? null,
        substituteId: progress?.substituteExerciseId ?? null,
        substituteName: progress?.substituteName ?? null,
      },
    };
  });

  // Only this participant's own history, for the exercises they might do today.
  const relevantIds = new Set(items.flatMap((item) => [item.exerciseId, ...item.swapOptions.map((o) => o.id)]));
  const previousLogs: Record<string, PreviousLog> = {};
  for (const [exerciseId, log] of Object.entries(detail.previousLogs)) {
    if (relevantIds.has(exerciseId)) previousLogs[exerciseId] = log;
  }

  const { workout, completion } = detail;
  return (
    <WorkoutView
      workoutId={workout.id}
      title={workout.name}
      emoji={workout.emoji}
      subtitle={`Week ${workout.weekNumber} · Workout ${workout.sequence} of ${overview.workouts.length} · ~${workout.estimatedMinutes} min`}
      challengeText={workout.challengeText}
      safetyNote={SAFETY_NOTE}
      items={items}
      previousLogs={previousLogs}
      completedLabel={
        completion?.completedAt
          ? relativeDayLabel(new Date(completion.completedAt), new Date(), viewer.challenge.timezone)
          : null
      }
    />
  );
}
