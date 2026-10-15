-- languages
create table languages (
  id    smallint generated always as identity primary key,
  code  text not null unique check (code ~ '^[A-Z_]+$'),
  name  text not null
);


-- generations
create table generations (
  id            smallint generated always as identity primary key,
  language_id   smallint not null references languages (id),
  name          text not null,
  debut_order   smallint,
  unique (language_id, name)
);


-- talents
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


-- daily_puzzles
create table daily_puzzles (
  date        date not null,
  mode        text not null check (mode in ('classic', 'portrait')),
  talent_id   text not null references talents (id),
  source      text not null default 'random' check (source in ('random', 'manual')),
  created_at  timestamptz not null default now(),
  primary key (date, mode)
);

create index daily_puzzles_mode_date_idx on daily_puzzles (mode, date);


-- talent_profiles
create view talent_profiles
with (security_invoker = on) as
select
  t.*,
  g.name as generation,
  l.code as branch
from talents t
join generations g on g.id = t.generation_id
join languages l on l.id = g.language_id;


-- row level security
alter table languages     enable row level security;
alter table generations   enable row level security;
alter table talents       enable row level security;
alter table daily_puzzles enable row level security;
