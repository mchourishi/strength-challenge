# Stronger Together 💪

A private, mobile-first PWA for two friends doing a strength challenge together.

The creator answers a short wizard (goal, experience, session length, sessions per week, 4 or 6 weeks, equipment, focus). A **rule-based generator** builds a program, the creator reviews it (and can regenerate it), then starts the challenge. The program is saved as a snapshot, the friend joins with an invite link, and both follow the same program while tracking their own progress.

See `docs/product-spec.md` for the full V1 specification.

## Stack

Next.js 16 (App Router) · TypeScript · Tailwind CSS 4 · Supabase (Postgres) · Vercel · Vitest

## Getting started

```bash
npm install
cp .env.example .env.local   # fill in your Supabase URL + service-role key
npm run dev
```

### Supabase setup

1. Create a Supabase project.
2. Run `supabase/migrations/0001_initial_schema.sql` in the SQL editor (or `supabase db push` with the CLI).
3. Copy the project URL and **service-role** key into `.env.local` (Project Settings → API).

No Supabase Auth configuration is needed.

### Deploying to Vercel

1. Import the repository in Vercel.
2. Add `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` as environment variables (Production + Preview). Optionally set `SITE_URL`.
3. Deploy. The app is installable from the browser menu ("Add to Home Screen").

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Development server |
| `npm test` | Generator, date and progress unit tests (Vitest) |
| `npm run typecheck` | Route type generation + `tsc --noEmit` |
| `npm run lint` | ESLint |
| `npm run build` | Production build |

## How it's organised

```
lib/challenge-generator/   Pure, unit-tested program generator (no UI, no network)
  exercise-library.ts      ~60 curated exercises with pattern/equipment/difficulty metadata
  workout-templates.ts     Day templates (ordered movement-pattern slots) and weekly splits
  generation-rules.ts      Equipment, experience, workout size, sets/reps, rest, time estimates
  progression-rules.ts     Week phases (Foundation → Finish Strong), prompts, safety note
  substitutions.ts         Equipment-aware swap suggestions
  generator.ts             ChallengeGenerator interface → rule-based implementation
lib/dates.ts, progress.ts  Time-zone aware week maths and progress summaries (unit tested)
lib/server/                Server-only: Supabase client, private-link session, queries
app/actions.ts             Server Actions (create, join, tick, log, swap, complete, reopen)
app/create/                Setup wizard + program review
app/(tabs)/                Home, Program, Progress (bottom-tab screens)
app/workout/[id]/          Focused workout screen
supabase/migrations/       Schema, RLS, create_challenge() function
```

### The generator

Generation is deterministic for a given `(config, seed)`:

- Day templates list movement-pattern slots in priority order (main lifts first). Session length and experience decide how many slots are used.
- Each slot is filled by scoring eligible exercises (equipment, difficulty, focus fit, main-lift suitability, variety within the week) plus a small seeded tie-break. This gives controlled variation on "Regenerate", not random programs.
- Main lifts stay the same for the whole challenge. Accessories (and secondary lifts for tone/general goals) rotate at the halfway point.
- Week phases add modest, participant-controlled progression (an extra set, slightly fewer reps with a little more weight, longer holds). A time-budget pass trims accessory volume first if a session would run long.
- The client generates the preview. When the challenge starts, the server regenerates from `(config, seed)` and saves the result, so the client never submits a program.

An AI generator could implement the same `ChallengeGenerator` interface later. V1 deliberately uses no LLM API.

## Privacy & the private-link security model

V1 has no accounts. Access works like an unlisted link:

- **Invite link** (`/join/<token>`): 256-bit random token. Anyone who has it can join while the challenge has fewer than two participants. After that, it only shows "challenge full".
- **Participant token**: each participant gets a 256-bit random token stored in an httpOnly, SameSite=Lax cookie. The database stores only its SHA-256 hash.
- **Personal link** (`/me/<token>`, shown on the Progress screen): lets someone use the app on another device. **Anyone with this link can act as that participant.** Treat it like a password.
- **Database access**: the browser never talks to Supabase. Every query runs on the server with the service-role key, which is never sent to the client. RLS is enabled on every table with **no** policies for `anon`/`authenticated`, and their table grants are revoked, so the public Supabase API exposes nothing even if someone finds the project URL.
- **Personal data**: weights, reps and exercise swaps are only ever loaded for their owner. The friend sees completions and names only.

Limitations to be aware of:

- Links can be forwarded or leaked (chat history, screenshots, browser sync). There is no way to revoke a single link in V1 short of editing the database.
- Clearing cookies logs you out on that device. Use your personal link to get back in.
- One browser holds one participant at a time. Joining or creating another challenge on the same browser switches to it.
- This is fine for two friends' workout ticks. It is not suitable for sensitive data.
