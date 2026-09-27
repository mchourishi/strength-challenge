# Stronger Together

Stronger Together is a private, mobile-first Progressive Web App (PWA) for two friends completing a structured strength-training challenge together.

The product should feel like a tiny mobile fitness app, not a website or admin dashboard.

## Source of Truth

Before making product, UI, database, or architectural decisions, read:

`docs/product-spec.md`

Treat that document as the source of truth for V1.

If an implementation decision is not specified, choose the simplest solution that supports the product principles below.

Do not add features simply because they are common in fitness apps.

---

## Core Product Principle

A challenge's **structure** is fixed (two friends, a set number of weeks, a weekly target, shared progress). Its **workout program** is generated once, when the challenge is created, by a deterministic rule-based generator from the creator's choices (goal, experience, time, equipment, focus).

When the challenge starts, the generated program is saved as a snapshot belonging to that challenge. Later changes to the exercise library, templates or generation rules must never change an existing challenge.

Challenge creation (once):

CREATE CHALLENGE → CHOOSE OPTIONS → GENERATE → REVIEW / REGENERATE → START → INVITE FRIEND

The primary everyday experience is:

OPEN APP
↓
SEE NEXT CHALLENGE
↓
START WORKOUT
↓
TICK EXERCISES
↓
FINISH
↓
SEE BOTH FRIENDS' PROGRESS

Using the app should require almost no effort. The smarter generator must never make the everyday workout experience more complicated — configuration belongs to the setup wizard only.

The app exists to encourage consistency and friendly accountability.

It is NOT intended to become a detailed fitness tracker.

---

## V1 Scope

V1 is designed for:

- private challenges of exactly two participants
- 4 or 6 weeks (default 4)
- 2, 3 or 4 workouts per week (default 3)
- a program generated per challenge from the setup wizard's choices
- both participants following the same generated program
- participants training independently, with optional personal exercise swaps

Never hard-code "12 workouts" or "3 per week" — always use the challenge's configuration.

Do not overengineer for thousands of users unless doing so comes naturally from good basic architecture.

---

## Program Generator

The V1 generator is rule-based and deterministic for a given `(config, seed)`. It lives in `lib/challenge-generator/`, is independent of UI code, and is unit tested.

It uses an exercise library, day templates, generation rules and progression rules.

Do NOT integrate any LLM API (OpenAI, Anthropic, Gemini, etc.) and do not require an AI API key. An AI generator is a documented future possibility only, behind the same `ChallengeGenerator` interface.

Generated programs must:

- respect the selected equipment, experience level and workout duration
- balance movement patterns
- repeat key lifts so progress is visible (consistency + progression + some variety)
- progress modestly and in a participant-controlled way
- never prescribe max lifts, 1RM attempts, or training through pain

---

## Tech Stack

Use:

- Next.js
- TypeScript
- Tailwind CSS
- Supabase
- Vercel
- Progressive Web App support

Prefer the current stable versions already used by the repository.

Keep dependencies minimal.

Do not introduce additional frameworks or services without a clear need.

---

## Product Rules

Do NOT add:

- calorie counting
- food logging
- body-weight tracking
- step tracking
- complicated points systems
- exercise-level social competition
- ranking based on weight lifted
- public profiles
- social feeds beyond the private challenge activity
- full email/password authentication for V1
- LLM/AI-API-generated workouts for V1 (the rule-based generator is in scope)

Optional weight/repetition tracking is allowed only as a secondary personal feature.

A participant's recorded weights/reps and exercise swaps must not be displayed to the other participant.

Exercise swaps apply only to the participant who made them; the prescribed program is never modified.

The shared challenge should focus on consistency.

---

## UX Principles

Design mobile-first.

Prioritise phone usability over desktop.

Important actions must have large tap targets.

The home screen should answer within approximately two seconds:

1. What workout should I do next?
2. How far through the challenge am I?
3. Have I reached my weekly target this week?
4. How is my friend progressing?
5. Who trained recently?

The primary CTA should normally be:

`START WORKOUT`

Avoid unnecessary forms and screens.

Do not require users to record weight, reps, calories, or other metrics to complete a workout.

Support dark mode.

Use subtle animations and celebrations, but do not make the interface childish.

---

## Engineering Principles

Keep components small and understandable.

Maintain strong TypeScript typing.

Use Supabase Row Level Security appropriately.

Never expose Supabase service-role credentials to the browser.

Never disable RLS globally as a shortcut.

Handle local dates and timezones correctly.

Prevent accidental duplicate workout completion.

Handle loading, empty and error states.

Maintain reasonable accessibility.

Use optimistic updates only where appropriate.

---

## Database

Keep prescribed workout/program data separate from participant completion data.

The database should support:

- challenges (including their generator configuration and seed)
- participants
- generated challenge workouts (snapshot, persisted when the challenge starts)
- generated challenge workout exercises (snapshot)
- participant workout completion
- optional participant exercise progress and personal swaps

The exercise library, templates and rules are versioned TypeScript code. A started challenge must be fully displayable from its own database rows and is never regenerated on load.

Avoid unnecessary abstractions.

---

## Code Quality

Before considering a feature complete:

- run TypeScript checks
- run lint
- run the unit tests (`npm test`)
- run the production build
- fix errors introduced by the change

Do not leave major TODOs where a reasonable implementation can be completed now.

---

## Working Style

When given a substantial task:

1. Inspect the existing implementation first.
2. Read the relevant sections of `docs/product-spec.md`.
3. Give a short implementation plan.
4. Implement the feature.
5. Run appropriate checks.
6. Summarise what changed and anything requiring manual setup.

Do not stop after explaining how something could be built when the request is to implement it.

Prefer a working, polished V1 over speculative architecture.
