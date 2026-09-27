import "server-only";
import { relativeDayLabel, type ChallengePhase } from "@/lib/dates";
import { currentPhase, displayWeek, summariseParticipant, type ParticipantSummary } from "@/lib/progress";
import { getChallengeOverview, type ChallengeWorkout, type Participant, type Viewer } from "./data";

export interface ActivityItem {
  key: string;
  emoji: string;
  text: string;
  when: string;
  isMe: boolean;
}

export interface ChallengeView {
  viewer: Viewer;
  me: Participant;
  friend: Participant | null;
  workouts: ChallengeWorkout[];
  mine: ParticipantSummary;
  theirs: ParticipantSummary | null;
  phase: ChallengePhase;
  /** The week "this week" refers to. */
  week: number;
  weekTitles: Map<number, string>;
  activity: ActivityItem[];
}

const ACTIVITY_LIMIT = 8;

export async function getChallengeView(viewer: Viewer): Promise<ChallengeView> {
  const { challenge, participant } = viewer;
  const overview = await getChallengeOverview(challenge.id);
  const progressChallenge = {
    startDate: challenge.startDate,
    timezone: challenge.timezone,
    durationWeeks: challenge.config.durationWeeks,
    sessionsPerWeek: challenge.config.sessionsPerWeek,
  };
  const now = new Date();

  const me = overview.participants.find((p) => p.id === participant.id) ?? participant;
  const friend = overview.participants.find((p) => p.id !== participant.id) ?? null;
  const summarise = (p: Participant) =>
    summariseParticipant(p.id, progressChallenge, overview.workouts, overview.completions);

  const phase = currentPhase(progressChallenge, now);
  const workoutsById = new Map(overview.workouts.map((w) => [w.id, w]));
  const nameOf = (id: string) => (id === me.id ? "You" : (friend?.name ?? "Your friend"));

  const events: (ActivityItem & { at: string })[] = [];
  for (const c of overview.completions) {
    const workout = workoutsById.get(c.challengeWorkoutId);
    if (!c.completedAt || !workout) continue;
    const isMe = c.participantId === me.id;
    events.push({
      key: `done-${c.participantId}-${c.challengeWorkoutId}`,
      emoji: isMe ? "🔥" : "💪",
      text: `${nameOf(c.participantId)} completed ${workout.name}`,
      when: relativeDayLabel(new Date(c.completedAt), now, challenge.timezone),
      isMe,
      at: c.completedAt,
    });
  }
  for (const p of overview.participants) {
    const isMe = p.id === me.id;
    events.push({
      key: `join-${p.id}`,
      emoji: p.slot === 1 ? "✨" : "👋",
      text: p.slot === 1 ? `${isMe ? "You" : p.name} started the challenge` : `${isMe ? "You" : p.name} joined the challenge`,
      when: relativeDayLabel(new Date(p.createdAt), now, challenge.timezone),
      isMe,
      at: p.createdAt,
    });
  }
  events.sort((a, b) => b.at.localeCompare(a.at));

  return {
    viewer,
    me,
    friend,
    workouts: overview.workouts,
    mine: summarise(me),
    theirs: friend ? summarise(friend) : null,
    phase,
    week: displayWeek(phase, challenge.config.durationWeeks),
    weekTitles: new Map(overview.workouts.map((w) => [w.weekNumber, w.weekTitle])),
    activity: events.slice(0, ACTIVITY_LIMIT),
  };
}
