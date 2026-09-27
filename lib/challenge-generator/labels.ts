import type { EquipmentSetting, Experience, Focus, Goal } from "./types";

export const GOAL_LABELS: Record<Goal, string> = {
  strength: "Get Stronger",
  tone: "Tone & Strengthen",
  muscle: "Build Muscle",
  general: "General Fitness",
};

export const EXPERIENCE_LABELS: Record<Experience, string> = {
  beginner: "Beginner",
  intermediate: "Intermediate",
  advanced: "Advanced",
};

export const EQUIPMENT_LABELS: Record<EquipmentSetting, string> = {
  full_gym: "Full Gym",
  dumbbells: "Dumbbells Only",
  home: "Home / Basic Equipment",
};

export const EQUIPMENT_DESCRIPTIONS: Record<EquipmentSetting, string> = {
  full_gym: "Machines, cables, barbells, dumbbells and benches.",
  dumbbells: "A range of dumbbells, a bench, and your bodyweight.",
  home: "Your bodyweight, a pair of dumbbells, a resistance band with a door anchor, and a sturdy chair, bench or step. No machines, cables or barbells.",
};

export const FOCUS_LABELS: Record<Focus, string> = {
  balanced: "Balanced Full Body",
  lower_glutes: "Lower Body + Glutes",
  upper: "Upper Body",
  full_glutes: "Full Body + Extra Glutes",
};
