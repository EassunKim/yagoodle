-- ============================================================================
-- Yagoodle database schema (PostgreSQL / Supabase)
--
-- Structure of the database: tables, rules and views.
-- To rebuild from scratch, run this file first, then seed.sql.
-- Tables are created in dependency order: a foreign key can only point at a
-- table that already exists.
-- ============================================================================


-- ----------------------------------------------------------------------------
-- languages
-- The branches talents belong to (JP, EN, ID). Since the branches merged,
-- these are grouped by the language each branch streams in.
-- ----------------------------------------------------------------------------
create table languages (
  id    smallint generated always as identity primary key,
  code  text not null unique check (code ~ '^[A-Z_]+$'),
  name  text not null
);


-- ----------------------------------------------------------------------------
-- generations
-- Debut groups such as Gen 3, Myth or holoX. Each belongs to one language,
-- and a generation name can only appear once per language.
-- ----------------------------------------------------------------------------
create table generations (
  id            smallint generated always as identity primary key,
  language_id   smallint not null references languages (id),
  name          text not null,
  debut_order   smallint,
  unique (language_id, name)
);


-- ----------------------------------------------------------------------------
-- talents
-- One row per member. The id is a readable slug (e.g. 'usada-pekora') that
-- also names the talent's image files. in_pool controls whether a talent can
-- be picked as a daily answer.
-- ----------------------------------------------------------------------------
create table talents (
  id             text primary key,
  name           text not null,
  name_jp        text,
  aliases        text[] not null default '{}',
  generation_id  smallint not null references generations (id),
  status         text not null check (status in ('Active', 'Graduated', 'Affiliate')),
  debut_date     date,
  hair_colors    text[] not null default '{}',
  fan_name       text,
  oshi_mark      text,
  image_url      text,
  in_pool        boolean not null default true,
  height_cm      smallint,
  youtube_url    text
);


-- ----------------------------------------------------------------------------
-- daily_puzzles
-- The answer for each date and game mode, filled in by the app's scheduler.
-- The primary key on (date, mode) guarantees one answer per mode per day.
-- source records whether the scheduler picked it ('random') or it was set by
-- hand ('manual').
-- ----------------------------------------------------------------------------
create table daily_puzzles (
  date        date not null,
  mode        text not null check (mode in ('classic', 'portrait')),
  talent_id   text not null references talents (id),
  source      text not null default 'random' check (source in ('random', 'manual')),
  created_at  timestamptz not null default now(),
  primary key (date, mode)
);

-- Speeds up the scheduler's "previous answers for this mode" lookup.
create index daily_puzzles_mode_date_idx on daily_puzzles (mode, date);


-- ----------------------------------------------------------------------------
-- talent_profiles (view)
-- Talents joined with their generation and language, so the app reads flat
-- rows with 'generation' and 'branch' as text instead of id numbers.
-- security_invoker makes the view obey the tables' row level securitydai
-- instead of bypassing it.
-- ----------------------------------------------------------------------------
create view talent_profiles
with (security_invoker = on) as
select
  t.*,
  g.name as generation,
  l.code as branch
from talents t
join generations g on g.id = t.generation_id
join languages l on l.id = g.language_id;


-- ----------------------------------------------------------------------------
-- Security
-- Supabase exposes every table through its public API. Enabling row level
-- security with no policies blocks that API entirely; the game server
-- connects with the database password and is unaffected.
-- ----------------------------------------------------------------------------
alter table languages     enable row level security;
alter table generations   enable row level security;
alter table talents       enable row level security;
alter table daily_puzzles enable row level security;
