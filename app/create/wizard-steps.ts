import {
  EQUIPMENT_DESCRIPTIONS,
  EQUIPMENT_LABELS,
  FOCUS_LABELS,
  GOAL_LABELS,
  EXPERIENCE_LABELS,
} from "@/lib/challenge-generator/labels";
import type { ChallengeConfig } from "@/lib/challenge-generator/types";

export interface ChoiceOption<V> {
  value: V;
  label: string;
  emoji: string;
  description?: string;
  badge?: string;
}

export interface ChoiceStep<K extends keyof ChallengeConfig = keyof ChallengeConfig> {
  key: K;
  title: string;
  hint?: string;
  options: ChoiceOption<ChallengeConfig[K]>[];
}

function step<K extends keyof ChallengeConfig>(s: ChoiceStep<K>): ChoiceStep {
  return s as unknown as ChoiceStep;
}

export const CHOICE_STEPS: ChoiceStep[] = [
  step({
    key: "goal",
    title: "What's your main goal?",
    options: [
      { value: "strength", label: GOAL_LABELS.strength, emoji: "🏋️", description: "Lift a little more each week." },
      { value: "tone", label: GOAL_LABELS.tone, emoji: "✨", description: "Firmer, fitter, more energy." },
      { value: "muscle", label: GOAL_LABELS.muscle, emoji: "💪", description: "More volume for muscle growth." },
      { value: "general", label: GOAL_LABELS.general, emoji: "🌿", description: "Feel good, move well, stay consistent." },
    ],
  }),
  step({
    key: "experience",
    title: "How experienced are you?",
    hint: "If you differ, pick the less experienced friend's level.",
    options: [
      { value: "beginner", label: EXPERIENCE_LABELS.beginner, emoji: "🌱", description: "New or returning to strength training." },
      { value: "intermediate", label: EXPERIENCE_LABELS.intermediate, emoji: "🌿", description: "Comfortable with the main lifts." },
      { value: "advanced", label: EXPERIENCE_LABELS.advanced, emoji: "🌳", description: "Training consistently for a year or more." },
    ],
  }),
  step({
    key: "sessionMinutes",
    title: "How long is each workout?",
    options: [
      { value: 30, label: "30 minutes", emoji: "⚡", description: "4–5 exercises. Short and sharp." },
      { value: 45, label: "45 minutes", emoji: "⏱️", description: "5–6 exercises.", badge: "Popular" },
      { value: 60, label: "60 minutes", emoji: "🕐", description: "6–8 exercises." },
    ],
  }),
  step({
    key: "sessionsPerWeek",
    title: "Workouts per week?",
    hint: "This is your weekly target.",
    options: [
      { value: 2, label: "2 per week", emoji: "✌️" },
      { value: 3, label: "3 per week", emoji: "🔥", badge: "Recommended" },
      { value: 4, label: "4 per week", emoji: "🚀" },
    ],
  }),
  step({
    key: "durationWeeks",
    title: "How long is the challenge?",
    options: [
      { value: 4, label: "4 weeks", emoji: "📅", badge: "Recommended" },
      { value: 6, label: "6 weeks", emoji: "🗓️" },
    ],
  }),
  step({
    key: "equipment",
    title: "What equipment do you have?",
    options: [
      { value: "full_gym", label: EQUIPMENT_LABELS.full_gym, emoji: "🏟️", description: EQUIPMENT_DESCRIPTIONS.full_gym },
      { value: "dumbbells", label: EQUIPMENT_LABELS.dumbbells, emoji: "🏋️‍♀️", description: EQUIPMENT_DESCRIPTIONS.dumbbells },
      { value: "home", label: EQUIPMENT_LABELS.home, emoji: "🏠", description: EQUIPMENT_DESCRIPTIONS.home },
    ],
  }),
  step({
    key: "focus",
    title: "Pick one training focus",
    options: [
      { value: "balanced", label: FOCUS_LABELS.balanced, emoji: "⚖️", description: "Everything, evenly." },
      { value: "lower_glutes", label: FOCUS_LABELS.lower_glutes, emoji: "🍑", description: "Legs and glutes lead the way." },
      { value: "upper", label: FOCUS_LABELS.upper, emoji: "💪", description: "Arms, back and shoulders first." },
      { value: "full_glutes", label: FOCUS_LABELS.full_glutes, emoji: "🔥", description: "Full body, with extra glute work." },
    ],
  }),
];
