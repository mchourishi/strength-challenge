-- Stronger Together — V1 schema
--
-- Access model: the browser never talks to Supabase directly. All reads and writes go
-- through the Next.js server using the service-role key. RLS is enabled on every table
-- with NO policies for the anon/authenticated roles, so the public API exposes nothing.

-- ── Challenges ──────────────────────────────────────────────────────────────
create table public.challenges (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 60),
  invite_token text not null unique check (char_length(invite_token) >= 20),
  start_date date not null,
  timezone text not null default 'UTC',

  -- Generator configuration chosen in the setup wizard.
  goal text not null check (goal in ('strength', 'tone', 'muscle', 'general')),
  experience text not null check (experience in ('beginner', 'intermediate', 'advanced')),
  session_minutes smallint not null check (session_minutes in (30, 45, 60)),
  sessions_per_week smallint not null check (sessions_per_week in (2, 3, 4)),
  duration_weeks smallint not null check (duration_weeks in (4, 6)),
  equipment text not null check (equipment in ('full_gym', 'dumbbells', 'home')),
  focus text not null check (focus in ('balanced', 'lower_glutes', 'upper', 'full_glutes')),
  generator text not null,
  generator_seed bigint not null,

  created_at timestamptz not null default now()
);

-- ── Participants (max two per challenge) ───────────────────────────────────
create table public.participants (
  id uuid primary key default gen_random_uuid(),
  challenge_id uuid not null references public.challenges (id) on delete cascade,
  slot smallint not null check (slot in (1, 2)),
  name text not null check (char_length(name) between 1 and 40),
  -- SHA-256 of the participant's private token. The raw token lives only in their cookie.
  token_hash text not null unique,
  created_at timestamptz not null default now(),
  unique (challenge_id, slot)
);

-- ── Generated program snapshot (prescribed, shared by both participants) ───
create table public.challenge_workouts (
  id uuid primary key default gen_random_uuid(),
  challenge_id uuid not null references public.challenges (id) on delete cascade,
  sequence smallint not null check (sequence >= 1),
  week_number smallint not null check (week_number >= 1),
  day_number smallint not null check (day_number >= 1),
  week_title text not null,
  name text not null,
  emoji text not null default '',
  estimated_minutes smallint not null,
  challenge_text text not null,
  unique (challenge_id, sequence)
);

create table public.challenge_workout_exercises (
  id uuid primary key default gen_random_uuid(),
  challenge_workout_id uuid not null references public.challenge_workouts (id) on delete cascade,
  position smallint not null check (position >= 1),
  exercise_id text not null,          -- library id at generation time
  name text not null,                 -- snapshot, so library renames never change a challenge
  movement_pattern text not null,
  role text not null check (role in ('primary', 'secondary', 'accessory', 'finisher')),
  sets smallint not null check (sets between 1 and 10),
  reps smallint check (reps between 1 and 50),
  duration_seconds integer check (duration_seconds between 1 and 3600),
  per_side boolean not null default false,
  rest_seconds smallint not null default 0,
  notes text,
  unique (challenge_workout_id, position),
  check (reps is not null or duration_seconds is not null)
);

-- ── Participant progress (private per participant) ─────────────────────────
create table public.participant_workouts (
  id uuid primary key default gen_random_uuid(),
  participant_id uuid not null references public.participants (id) on delete cascade,
  challenge_workout_id uuid not null references public.challenge_workouts (id) on delete cascade,
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  -- A participant can complete each prescribed workout once.
  unique (participant_id, challenge_workout_id)
);

create table public.participant_exercise_progress (
  id uuid primary key default gen_random_uuid(),
  participant_id uuid not null references public.participants (id) on delete cascade,
  challenge_workout_exercise_id uuid not null references public.challenge_workout_exercises (id) on delete cascade,
  completed boolean not null default false,
  weight_kg numeric(6, 2) check (weight_kg >= 0 and weight_kg <= 1000),
  reps smallint check (reps between 0 and 200),
  -- The participant's personal swap. The prescribed exercise is never modified.
  substitute_exercise_id text,
  substitute_name text,
  updated_at timestamptz not null default now(),
  unique (participant_id, challenge_workout_exercise_id),
  check ((substitute_exercise_id is null) = (substitute_name is null))
);

create index participant_workouts_completed_idx
  on public.participant_workouts (participant_id, completed_at desc);
create index participant_exercise_progress_weight_idx
  on public.participant_exercise_progress (participant_id, updated_at desc)
  where weight_kg is not null;
create index challenge_workouts_challenge_idx on public.challenge_workouts (challenge_id, sequence);
create index challenge_workout_exercises_workout_idx
  on public.challenge_workout_exercises (challenge_workout_id, position);

-- ── Row Level Security ─────────────────────────────────────────────────────
alter table public.challenges enable row level security;
alter table public.participants enable row level security;
alter table public.challenge_workouts enable row level security;
alter table public.challenge_workout_exercises enable row level security;
alter table public.participant_workouts enable row level security;
alter table public.participant_exercise_progress enable row level security;

-- No policies are created for anon/authenticated: they can read or write nothing.
revoke all on
  public.challenges,
  public.participants,
  public.challenge_workouts,
  public.challenge_workout_exercises,
  public.participant_workouts,
  public.participant_exercise_progress
from anon, authenticated;

-- ── Create a challenge + creator + full program atomically ─────────────────
create or replace function public.create_challenge(payload jsonb)
returns uuid
language plpgsql
set search_path = public
as $$
declare
  new_challenge_id uuid;
  workout jsonb;
  new_workout_id uuid;
begin
  insert into challenges (
    name, invite_token, start_date, timezone,
    goal, experience, session_minutes, sessions_per_week, duration_weeks, equipment, focus,
    generator, generator_seed
  )
  values (
    payload #>> '{challenge,name}',
    payload #>> '{challenge,invite_token}',
    (payload #>> '{challenge,start_date}')::date,
    payload #>> '{challenge,timezone}',
    payload #>> '{challenge,goal}',
    payload #>> '{challenge,experience}',
    (payload #>> '{challenge,session_minutes}')::smallint,
    (payload #>> '{challenge,sessions_per_week}')::smallint,
    (payload #>> '{challenge,duration_weeks}')::smallint,
    payload #>> '{challenge,equipment}',
    payload #>> '{challenge,focus}',
    payload #>> '{challenge,generator}',
    (payload #>> '{challenge,generator_seed}')::bigint
  )
  returning id into new_challenge_id;

  insert into participants (challenge_id, slot, name, token_hash)
  values (new_challenge_id, 1, payload #>> '{creator,name}', payload #>> '{creator,token_hash}');

  for workout in select * from jsonb_array_elements(payload -> 'workouts')
  loop
    insert into challenge_workouts (
      challenge_id, sequence, week_number, day_number, week_title, name, emoji, estimated_minutes, challenge_text
    )
    values (
      new_challenge_id,
      (workout ->> 'sequence')::smallint,
      (workout ->> 'week_number')::smallint,
      (workout ->> 'day_number')::smallint,
      workout ->> 'week_title',
      workout ->> 'name',
      workout ->> 'emoji',
      (workout ->> 'estimated_minutes')::smallint,
      workout ->> 'challenge_text'
    )
    returning id into new_workout_id;

    insert into challenge_workout_exercises (
      challenge_workout_id, position, exercise_id, name, movement_pattern, role,
      sets, reps, duration_seconds, per_side, rest_seconds, notes
    )
    select
      new_workout_id, e.position, e.exercise_id, e.name, e.movement_pattern, e.role,
      e.sets, e.reps, e.duration_seconds, e.per_side, e.rest_seconds, e.notes
    from jsonb_to_recordset(workout -> 'exercises') as e(
      position smallint, exercise_id text, name text, movement_pattern text, role text,
      sets smallint, reps smallint, duration_seconds integer, per_side boolean,
      rest_seconds smallint, notes text
    );
  end loop;

  return new_challenge_id;
end;
$$;

revoke all on function public.create_challenge(jsonb) from public, anon, authenticated;
grant execute on function public.create_challenge(jsonb) to service_role;
