# Yagoodle

A daily hololive talent guessing game, in the style of Onepiecedle / Loldle.
Every day at midnight (JST) each mode gets a new mystery talent.

- **Classic**: guess any talent; each trait turns green (match), orange (partial) or red (no match), with ▲▼ arrows for height and debut date. Hints unlock after 4 / 7 / 10 guesses.
- **Portrait**: a blurred, zoomed-in picture that gets clearer with every wrong guess.

## About this project

This is a personal learning project. **Most of the code was written by AI** ([Claude Code](https://claude.com/claude-code)): the game, the website, the server and the scheduler.

My goal was to learn SQL and how to set up a hosted database, using a project I'd actually enjoy. The part I worked on hands-on is the **PostgreSQL schema in [`db/`](db/)**. I designed and wrote the tables with AI explaining concepts and reviewing my work, then set up the Supabase instance and filled in the data myself.

What I practiced:

- Designing related tables (languages → generations → talents) instead of one flat table, so each fact is stored in one place
- Primary keys, including a two-column key (`daily_puzzles (date, mode)`)
- Foreign keys, `CHECK` constraints, `UNIQUE` rules and defaults
- PostgreSQL types: `date`, `timestamptz`, `smallint`, `text[]` arrays
- A view that joins three tables (`talent_profiles`)
- An index for the scheduler's most common lookup
- Row level security on a hosted Supabase project

### Status

The game runs on the Supabase database. The server reads talents from the `talent_profiles` view and stores each day's answers in `daily_puzzles`, using the [`pg`](https://node-postgres.com) library with parameterized queries.

## Database setup (Supabase)

### 1. Create the project

1. Sign up at [supabase.com](https://supabase.com) and create a new project (the free tier is enough).
2. Save the database password. The game server will use it to connect.

### 2. Create the tables

Open **SQL Editor** in the Supabase dashboard and run [`db/schema.sql`](db/schema.sql). It creates, in order:

| Object | What it holds |
| --- | --- |
| `languages` | Branches by language: JP, EN, ID |
| `generations` | Debut groups (Gen 3, Myth, holoX…), each linked to a language |
| `talents` | One row per member, linked to a generation |
| `daily_puzzles` | The answer for each date and game mode, filled in by the app's scheduler |
| `talent_profiles` | A view joining the three tables above into flat rows for the app |

The file ends by enabling row level security on every table. Supabase automatically exposes tables through a public API; enabling RLS with no policies blocks that, while the game server (which connects with the database password) is unaffected.

### 3. Add the data

Add rows in dependency order: **languages → generations → talents**. A generation needs its language to exist first, and a talent needs its generation.

- **Table Editor**: open a table and use **Insert row**. Foreign key columns such as `generation_id` show a dropdown of existing rows.
- **SQL**: [`db/seed.sql`](db/seed.sql) has the languages and example inserts that look up foreign keys by name with a subquery. Every insert uses `on conflict do nothing`, so the file is safe to re-run.

`daily_puzzles` is left empty; the scheduler fills it in.

Naming notes:

- Talent `id`s are lowercase slugs like `usada-pekora`. They also name the talent's image files.
- Keep Indonesian generations named `ID Gen 1`, `ID Gen 2`… The game compares generation names as text, so a plain `Gen 1` would wrongly match JP's Gen 1.
- Keep spellings consistent across rows (`Blonde` everywhere, never `Blond` in one place), since hair colors are matched by text.

### 4. Check it

```sql
select name, branch, generation, status, debut_date
from talent_profiles
order by branch, debut_date;
```

## Run the game locally

Requires Node 22.13+ and the Supabase database from the steps above.

Create a `.env` file in the project root with your connection string. In Supabase, click **Connect**, choose **Session pooler**, and copy the string (the direct connection needs IPv6, which many home networks don't have):

```text
DATABASE_URL=postgresql://postgres.<project-ref>:<password>@<region>.pooler.supabase.com:5432/postgres
```

Remove the `[ ]` around the password, and percent-encode any special characters in it (`@` → `%40`, `$` → `%24`, `#` → `%23`…). `.env` is in `.gitignore`; never commit it.

```sh
npm install
npm start          # http://localhost:3000
npm run dev        # same, restarts on file changes
npm test
```

Talent pictures come from each talent's `image_url`, or from a local file at `public/images/talents/<id>.webp` (or .png / .jpg). Portrait mode turns on once at least one talent has a picture. Talent edits made in Supabase show up in the game within a minute.

## Daily schedule

- Each date's answer is stored, so every player gets the same talent and restarting the server doesn't change it.
- The scheduler checks every minute for the day rolling over and keeps the next 7 days generated.
- Everyone in the pool is picked once before anyone repeats, no one repeats within 30 days, and the two modes never share an answer on the same day.
- Answers stay on the server. The browser only receives comparison results.

Admin commands:

```sh
npm run schedule                                          # recent + upcoming answers
npm run schedule -- fill 30                               # generate 30 days ahead
npm run schedule -- set 2026-12-27 classic amane-kanata   # pin a talent to a date
npm run schedule -- reroll 2026-10-20 [mode]              # re-randomize a future day
npm run schedule -- pool [mode]                           # who can currently be an answer
```

Changing today or an earlier date requires `--force`, since players may already have guessed.

## Project layout

```text
db/          PostgreSQL schema and seed data for Supabase
server/      Express API, Supabase access (db.js), scheduler, randomizer, comparison logic
scripts/     schedule admin command
public/      the website (plain HTML, CSS and JavaScript, no build step)
data/        optional private Portrait-mode art (data/portraits)
test/        unit tests
```

---

Fan-made, not affiliated with COVER Corporation. hololive and all talents are property of COVER Corp.
