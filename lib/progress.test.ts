import { describe, expect, it } from "vitest";
import { challengePhase, daysBetween, localDateString, relativeDayLabel, weekForDate } from "./dates";
import { summariseParticipant } from "./progress";

describe("dates", () => {
  it("uses the challenge time zone for local dates", () => {
    const instant = new Date("2026-03-01T23:30:00Z");
    expect(localDateString(instant, "Europe/London")).toBe("2026-03-01");
    expect(localDateString(instant, "Australia/Sydney")).toBe("2026-03-02");
    expect(localDateString(instant, "America/Los_Angeles")).toBe("2026-03-01");
  });

  it("counts whole days across DST changes", () => {
    expect(daysBetween("2026-03-28", "2026-03-30")).toBe(2);
    expect(daysBetween("2026-10-24", "2026-10-26")).toBe(2);
  });

  it("works out the challenge phase", () => {
    expect(challengePhase("2026-03-10", "2026-03-08", 4)).toEqual({ kind: "not_started", daysUntilStart: 2 });
    expect(challengePhase("2026-03-10", "2026-03-10", 4)).toEqual({ kind: "active", week: 1 });
    expect(challengePhase("2026-03-10", "2026-03-16", 4)).toEqual({ kind: "active", week: 1 });
    expect(challengePhase("2026-03-10", "2026-03-17", 4)).toEqual({ kind: "active", week: 2 });
    expect(challengePhase("2026-03-10", "2026-04-06", 4)).toEqual({ kind: "active", week: 4 });
    expect(challengePhase("2026-03-10", "2026-04-07", 4)).toEqual({ kind: "ended" });
  });

  it("clamps early and late workouts into the challenge weeks", () => {
    expect(weekForDate("2026-03-10", "2026-03-01", 4)).toBe(1);
    expect(weekForDate("2026-03-10", "2026-05-01", 4)).toBe(4);
  });

  it("labels recent days", () => {
    const now = new Date("2026-03-10T12:00:00Z");
    expect(relativeDayLabel(new Date("2026-03-10T08:00:00Z"), now, "UTC")).toBe("Today");
    expect(relativeDayLabel(new Date("2026-03-09T08:00:00Z"), now, "UTC")).toBe("Yesterday");
    expect(relativeDayLabel(new Date("2026-03-07T08:00:00Z"), now, "UTC")).toBe("Saturday");
  });
});

describe("summariseParticipant", () => {
  const challenge = { startDate: "2026-03-09", timezone: "Europe/London", durationWeeks: 4, sessionsPerWeek: 3 };
  const workouts = Array.from({ length: 12 }, (_, i) => ({
    id: `w${i + 1}`,
    sequence: i + 1,
    weekNumber: Math.floor(i / 3) + 1,
    name: `Workout ${i + 1}`,
  }));

  it("counts completions per week and finds the next workout in program order", () => {
    const summary = summariseParticipant("me", challenge, workouts, [
      { participantId: "me", challengeWorkoutId: "w1", startedAt: "", completedAt: "2026-03-09T18:00:00Z" },
      { participantId: "me", challengeWorkoutId: "w2", startedAt: "", completedAt: "2026-03-11T18:00:00Z" },
      { participantId: "me", challengeWorkoutId: "w3", startedAt: "", completedAt: "2026-03-17T07:00:00Z" },
      { participantId: "me", challengeWorkoutId: "w4", startedAt: "", completedAt: null },
      { participantId: "friend", challengeWorkoutId: "w5", startedAt: "", completedAt: "2026-03-10T07:00:00Z" },
    ]);
    expect(summary.completed).toBe(3);
    expect(summary.total).toBe(12);
    expect(summary.weeklyCounts).toEqual([2, 1, 0, 0]);
    expect(summary.nextWorkout?.id).toBe("w4");
    expect(summary.inProgressWorkoutIds.has("w4")).toBe(true);
  });

  it("returns no next workout when everything is done", () => {
    const completions = workouts.map((w) => ({
      participantId: "me",
      challengeWorkoutId: w.id,
      startedAt: "",
      completedAt: "2026-03-20T10:00:00Z",
    }));
    const summary = summariseParticipant("me", challenge, workouts, completions);
    expect(summary.completed).toBe(12);
    expect(summary.nextWorkout).toBeNull();
  });
});
