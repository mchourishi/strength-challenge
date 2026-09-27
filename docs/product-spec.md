# Stronger Together — V1 Product Specification

## 1. Product Overview

Stronger Together is a private strength-training challenge for two friends.

The **structure** of a challenge is fixed (two friends, a set number of weeks, a weekly workout target, shared progress). The **workout program** is generated when the challenge is created, from a few simple choices (goal, experience, time, equipment, focus).

Both participants follow the same generated program but may train:

- on different days
- at different times
- using different weights
- with occasional personal exercise swaps

The goal is consistency and friendly accountability.

The product is intentionally simple.

It is not intended to replace a full fitness tracker such as Strava, Hevy or MyFitnessPal.

### Creating a challenge (once)

CREATE CHALLENGE
↓
CHOOSE GOAL / EXPERIENCE / TIME / EQUIPMENT / FOCUS
↓
GENERATE PROGRAM
↓
REVIEW PROGRAM (regenerate if wanted)
↓
START CHALLENGE (program is saved as a snapshot)
↓
INVITE FRIEND
↓
BOTH FOLLOW THE SAME PROGRAM, TRACK PROGRESS TOGETHER

### Everyday use (every workout)

OPEN APP
↓
SEE NEXT WORKOUT
↓
START WORKOUT
↓
TICK EXERCISES
↓
COMPLETE WORKOUT
↓
SEE SHARED PROGRESS

The generator must never make the everyday experience more complicated.

---

# 2. Challenge Structure

A challenge has:

- **Name** (default: Stronger Together)
- **Start date**
- **Duration:** 4 or 6 weeks (default 4)
- **Sessions per week:** 2, 3 or 4 (default 3) — this is also the weekly target
- **Total workouts:** duration × sessions per week (e.g. 4 × 3 = 12)
- **Two participants maximum**

Each participant progresses independently through the same ordered program.

Participants do not need to train together.

Throughout this document, "12 workouts" and "3 per week" are examples of the default configuration. The app must always use the challenge's own configuration.

---

# 3. Challenge Setup Wizard

Participant 1 creates a challenge through a short, mobile-first wizard. One question per screen, large tap targets, sensible defaults preselected.

## Goal

- Get Stronger
- Tone & Strengthen
- Build Muscle
- General Fitness

## Experience

- Beginner
- Intermediate
- Advanced

## Workout Duration

- 30 minutes
- 45 minutes
- 60 minutes

## Sessions Per Week

- 2
- 3 (default)
- 4

## Challenge Duration

- 4 weeks (default)
- 6 weeks

## Equipment

- **Full Gym** — machines, cables, barbells, dumbbells, benches.
- **Dumbbells Only** — a range of dumbbells, a bench, and your bodyweight.
- **Home / Basic Equipment** — your bodyweight, a pair of dumbbells, a resistance band (with a door anchor), and a sturdy chair, bench or step. No machines, cables or barbells.

The UI must show these definitions so the choice is clear.

## Training Focus (one primary focus)

- Balanced Full Body
- Lower Body + Glutes
- Upper Body
- Full Body + Extra Glutes

## About you

- creator's first name
- challenge name (default "Stronger Together")
- start date (default today)

Then show:

[ GENERATE MY CHALLENGE ✨ ]

---

# 4. Program Generator (rule-based)

## 4.1 No AI API in V1

The V1 generator is deterministic and rule-based. It must not call OpenAI, Anthropic, Gemini or any other LLM API and must not require an API key.

It uses:

1. an exercise library
2. workout (day) templates
3. program-generation rules
4. progression rules

The generator lives in `lib/challenge-generator/`, separate from UI code, and is unit tested.

Conceptual interface:

```ts
interface ChallengeGenerator {
  generate(config: ChallengeConfig, options: { seed: number }): GeneratedProgram;
}
```

V1 implements only the rule-based generator. A future AI generator could implement the same interface (see §20).

Generation is deterministic for a given `(config, seed)`. "Regenerate" simply uses a new seed. The server re-runs the generator from `(config, seed)` when the challenge is started, so the client never submits an arbitrary program.

## 4.2 Exercise Library

A curated library of roughly 40–60 common, accessible exercises. Each exercise has:

- id
- name
- movement pattern
- primary muscle group, secondary muscle groups where useful
- required equipment
- difficulty (beginner / intermediate / advanced)
- suitable focus tags
- default rep range or duration
- whether it is performed per side
- substitution group
- short instructions

Movement patterns: squat, hinge, lunge, glute bridge/hip thrust, glute isolation, leg isolation, horizontal push, vertical push, horizontal pull, vertical pull, shoulder isolation, arm isolation, carry, core, conditioning.

Equipment categories: bodyweight, dumbbell, band, bench, cable, machine, barbell.

| Setting | Allowed equipment |
|---|---|
| Full Gym | everything |
| Dumbbells Only | bodyweight, dumbbell, bench |
| Home / Basic | bodyweight, dumbbell, band, bench (chair/step) — bodyweight and band movements preferred |

## 4.3 Workout composition

Workouts are built from **day templates**. Each template is an ordered list of movement-pattern slots (primary lifts first, accessories last). The generator fills each slot with a suitable exercise. Exercises are chosen by rules and scoring, never purely at random. A seeded tie-break provides controlled variation between regenerations.

Examples:

- **Balanced full body:** squat/lunge, hinge, push, pull, secondary lower-body, accessory/core/carry.
- **Lower body + glutes:** hip thrust/glute bridge, squat, hinge, unilateral leg movement, glute accessory, optional finisher.
- **Upper body:** horizontal push, horizontal pull, vertical pull, vertical push, shoulder, biceps, triceps.

Weekly splits by focus:

| Focus | 2 / week | 3 / week | 4 / week |
|---|---|---|---|
| Balanced Full Body | Full Body A, Full Body B | Lower + Push, Upper + Hinge, Full Body | Lower A, Upper A, Lower B, Upper B |
| Lower Body + Glutes | Glutes + Legs, Full Body + Glutes | Glutes + Legs, Upper Body, Hinge + Glutes | + Full Body + Glutes |
| Upper Body | Upper Body, Full Body | Push + Pull, Lower Body, Pull + Push | + Full Body |
| Full Body + Extra Glutes | Full Body + Glutes A, B | Full Body + Glutes A, Glutes + Legs, Full Body + Glutes B | + Hinge + Glutes |

No exercise appears twice in the same workout.

## 4.4 Duration rules

| Duration | Beginner | Intermediate | Advanced |
|---|---|---|---|
| 30 min | 4 | 5 | 5 |
| 45 min | 5 | 6 | 6 |
| 60 min | 6 | 7 | 8 |

The generator estimates each workout's time from sets, work time and rest (plus a short warm-up). If the estimate exceeds the budget it first trims accessory sets, then drops the lowest-priority exercise. The estimate is shown as "~N min".

## 4.5 Experience rules

- **Beginner:** only beginner-level exercises; prefers machines, dumbbells and stable movements; moderate volume (3 sets on main lifts, 2 on accessories).
- **Intermediate:** beginner and intermediate exercises (cables, unilateral work, compound dumbbell/barbell lifts); moderate progression.
- **Advanced:** all exercises, slightly more volume on main lifts. Never extreme.

## 4.6 Goal rules (week-1 reps)

| Goal | Main lifts | Secondary | Accessories |
|---|---|---|---|
| Get Stronger | 8 (10 for beginners) | 10 | 12 |
| Tone & Strengthen | 12 | 12 | 15 |
| Build Muscle | 10 | 10 | 12 |
| General Fitness | 10 | 12 | 12 |

Rest is longer for strength work and shorter for accessories.

## 4.7 Progression

Weeks have a phase:

- 4 weeks: Foundation → Build → Progress → Finish Strong
- 6 weeks: Foundation → Build → Keep Building → Progress → Push On → Finish Strong

Progression is modest and participant-controlled:

- **Foundation:** find comfortable starting weights, ~2 reps in reserve.
- **Build:** accessories gain a set (beginners); add 1–2 controlled reps or a little weight.
- **Progress / Push On:** main lifts gain a set and use slightly fewer reps with slightly more resistance (e.g. Goblet Squat 3 × 10 → 4 × 8).
- **Finish Strong:** compare with week 1 and improve one lift safely; a short finisher is added when time allows.

Each workout has a short "Today's challenge" prompt, e.g. *"Try to add a small amount of weight while maintaining good form"* or *"Try 1–2 more controlled reps than last time."* The app never needs to know a participant's actual strength level.

## 4.8 Variety

Consistency + progression + some variety:

- Main lifts stay the same for the whole challenge so progress is visible.
- Secondary lifts stay the same for strength/muscle goals and rotate at the halfway point for tone/general goals.
- Accessories rotate at the halfway point.
- When the same template appears twice in a week (e.g. Lower A / Lower B), the generator prefers different variations.

## 4.9 Safety guardrails

- Never prescribe maximum lifts, 1RM attempts, or "as many as possible at any cost".
- Never encourage training through pain.
- Workout screens include: "Choose a resistance that allows good form. Stop the exercise if you experience pain."

---

# 5. Program Review

After generation show a preview **before** anything is saved:

# YOUR CHALLENGE 💪

4 weeks · 3 workouts/week · 45 min · Full Gym · Balanced Full Body

## Week 1 — Foundation
1. Lower + Push
2. Upper + Hinge
3. Full Body

## Week 2 — Build
…

Each workout can be tapped to inspect its exercises.

[ REGENERATE ] produces another valid program with the same constraints (controlled variation, not wildly different).

[ START THIS CHALLENGE ] persists the program.

---

# 6. Starting the Challenge & Inviting

When the creator taps START THIS CHALLENGE:

- the challenge, its configuration and the **complete generated program** are saved to Supabase in one transaction
- this saved program is now the challenge's program; it is never regenerated when the app opens
- later changes to the library, templates or rules do not affect existing challenges (exercise names, sets, reps and notes are copied into the challenge's own tables)

Then show:

## Invite your training partner 💪

[COPY INVITE LINK] (uses the native share sheet when available)

Route: `/join/[inviteToken]`. The friend enters their name and joins. They receive exactly the same program.

V1 supports a maximum of two participants per challenge.

Do not implement full email/password authentication for V1.

---

# 7. Home Screen

The home screen is the most important screen. Within ~2 seconds it answers:

1. What workout should I do next?
2. How far through the challenge am I?
3. Have I reached my weekly target?
4. How is my friend progressing?
5. Who trained recently?

Example:

# STRONGER TOGETHER 💪

Week 2 of 4

Mukta 🔥 5 / 12 · Friend 💪 4 / 12

## YOUR NEXT CHALLENGE

🍑 Week 2 · Glutes + Legs · ~40 min

[ START WORKOUT ]

This week: 2 / 3 workouts

🔥 Friend completed Upper Body yesterday.

The next workout is visually dominant. If the friend has not joined yet, show the invite link instead of their progress.

---

# 8. Program Overview

Display the challenge week by week with phase titles, e.g. "Week 1 — Foundation". Each workout shows ✓ / ○ for the current participant. Tapping a workout opens it.

---

# 9. Workout Experience

Tapping START WORKOUT opens a focused workout screen showing:

- workout title and estimated duration
- today's mini-challenge
- safety note
- exercise list with sets × reps (or time), per-side label
- workout progress (e.g. 3 / 6 exercises)

Each exercise card:

- large [ ✓ DONE ] toggle
- optional weight (kg) and reps inputs, collapsed by default
- "Last time: 12 kg" if this participant previously recorded a weight for that exercise (private)
- [ SWAP ] action

At the bottom: [ COMPLETE WORKOUT 💪 ]

Users are never required to enter weight or reps, and may complete a workout without ticking every exercise (with a gentle confirmation).

## Exercise swaps

"Can't do this today?" shows 2–4 alternatives from the same substitution group (then same movement pattern), filtered by the challenge's equipment and the participant's experience level. E.g. Bulgarian Split Squat → Reverse Lunge, Step-Up, Single-Leg Press.

A swap applies only to **that participant's** instance of that workout. The prescribed exercise stays in the challenge program; the other participant is unaffected. The swap can be undone.

---

# 10. Workout Completion

When a workout is completed:

- save participant completion (idempotent — a second submit does nothing)
- update overall, weekly and shared progress
- it appears in the activity feed
- the next workout is determined as the first uncompleted workout in program order

Show a quick celebration: "Workout done! 🔥 2 / 3 this week" or "3 / 3 THIS WEEK! 🔥🔥🔥" when the weekly target is reached.

An accidentally completed workout can be reopened.

---

# 11. Shared Progress

Show both participants' completed / total with progress bars.

Do NOT compare weight lifted, rank strength, total kilograms, or create scores.

The ideal outcome is BOTH participants finishing every workout.

---

# 12. Weekly Progress

"This week" means the current challenge week counted from the start date in the challenge's time zone (week 1 = days 1–7). A participant's weekly count is the number of workouts they completed during that week. The target is the challenge's sessions per week.

Show dots per week per participant (● ● ○), with 🔥 when the target is met. Extra workouts are not penalised.

---

# 13. Activity Feed

Newest first. Derived from workout completions and joins:

🔥 Mukta completed Glutes + Legs — Today

Never display weights, reps, swaps or notes.

---

# 14. Personal Progress

A Progress screen shows:

- completed workouts and overall percentage
- current challenge week
- weekly dots
- workout history
- private personal records (best recorded weight per exercise) — visible only to that participant

---

# 15. Notifications

Not required for V1. Structure the product so reminders could be added later.

---

# 16. PWA Requirements

- web app manifest, icons, standalone display
- theme/background configuration
- service worker (network-first, offline fallback)
- mobile safe-area support

It should feel like a lightweight native app when opened from the home screen on iPhone and Android.

---

# 17. Visual Design

Modern, energetic, clean, premium, friendly, slightly playful, feminine-neutral, uncluttered. Avoid aggressive bodybuilding aesthetics and dashboard looks.

Large progress numbers, progress bars/rings, cards, clear typography, large buttons, subtle animations, tasteful emoji. Dark mode. Phones first.

---

# 18. Data Model

Supabase (Postgres). Prescribed program data is separate from participant data.

The exercise library, templates and rules live in versioned TypeScript (`lib/challenge-generator/`) — they are code, not user data. When a challenge starts, everything needed to display the program is copied into the challenge's own tables, so the program is a durable snapshot.

## challenges

- id, name, invite_token (unique), start_date, timezone, created_at
- configuration: goal, experience, session_minutes, sessions_per_week, duration_weeks, equipment, focus
- generator (e.g. `rules-v1`), generator_seed

## participants

- id, challenge_id, slot (1 or 2, unique per challenge → max two participants), name
- token_hash (SHA-256 of the private participant token; the raw token lives only in the participant's cookie/personal link)

## challenge_workouts

- id, challenge_id, sequence (1..total, unique per challenge), week_number, day_number, week_title, name, emoji, estimated_minutes, challenge_text

## challenge_workout_exercises

- id, challenge_workout_id, position, exercise_id (library id), name, movement_pattern, role, sets, reps, duration_seconds, per_side, rest_seconds, notes

## participant_workouts

- id, participant_id, challenge_workout_id, started_at, completed_at
- unique (participant_id, challenge_workout_id) — prevents duplicate completion

## participant_exercise_progress

- id, participant_id, challenge_workout_exercise_id (unique together)
- completed, weight_kg, reps (optional, private)
- substitute_exercise_id, substitute_name — the participant's personal swap, stored separately from the prescription
- updated_at

`create_challenge(payload)` is a Postgres function that inserts the challenge, creator and full program in one transaction.

---

# 19. Privacy / Access Model

V1 uses private-link access rather than full authentication.

- Invite links contain a random token. Anyone with the link can join while a slot is free.
- Each participant gets a random private token stored in an httpOnly cookie. A personal "use on another device" link restores it.
- All database access goes through the Next.js server using the service-role key, which is never sent to the browser.
- RLS is enabled on every table with no anon/authenticated policies, so the public API exposes nothing.
- The server only returns a participant's weights, reps and swaps to that participant.

The README explains the limitations of private-link security.

---

# 20. Out of Scope for V1

- AI-generated programs (see Future)
- meal plans, calorie or macro tracking, body-weight tracking, step tracking
- Apple Health, Google Fit, Strava, smartwatch integrations
- public challenges, groups larger than two, comments/chat, social profiles
- subscriptions, payments
- complex achievements, scoring or rankings
- push notifications
- editing individual exercises of a generated program before starting (regenerate instead)

## Future: AI generator (not V1)

A future version could let a user type:

> "Two intermediate women, full gym, 40-minute workouts, 3 days/week, strength with extra glute focus."

An AI model could then produce a program through the same `ChallengeGenerator` interface, validated against the same exercise library and guardrails. Not implemented in V1.

---

# 21. Challenge Completion

When one participant completes every workout: "YOU DID IT! 🏆 N strength workouts completed."

When BOTH do: "CHALLENGE SMASHED TOGETHER! 🏆💪" with both names and a tasteful confetti animation.

---

# 22. Definition of Done

1. Mukta can create a challenge through the setup wizard.
2. A program is generated from her choices and can be reviewed and regenerated.
3. Starting the challenge persists the program.
4. She can send one link to her friend, who can join.
5. Both see the same generated program.
6. Both can install the PWA on their phones.
7. Each sees their own next workout, can start it, tick exercises and complete it.
8. Exercises can be swapped per participant.
9. Optional weights/reps can be recorded privately, with "Last time" hints.
10. Shared progress, weekly progress and friend activity update correctly.
11. Completing all workouts triggers the appropriate celebration.
12. Data persists across devices.
13. Generator unit tests, type checks, lint and the production build pass.
14. The app is deployed successfully to Vercel.

Above all, it should be enjoyable enough that two friends actually want to open it at the gym.
