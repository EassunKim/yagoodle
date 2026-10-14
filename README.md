# Yagoodle

A daily hololive talent guessing game, in the style of Onepiecedle / Loldle.
Every day at midnight (JST by default) each mode gets a new mystery talent.

- **Classic**: guess any talent; each trait turns green (match), orange (partial) or red (no match), with ▲▼ arrows for height and debut date. Hints unlock after 4 / 7 / 10 guesses.
- **Portrait**: a blurred, zoomed-in picture that gets clearer with every wrong guess.

## Run it

Requires Node 22.13+ (uses the built-in `node:sqlite`, so there's nothing native to compile).

```sh
npm install
npm start          # http://localhost:3000
npm run dev        # same, restarts on file changes
npm test
```

On first start the database (`data/yagoodle.db`) is created and filled from `data/talents.json`.

## The talent database

`data/talents.json` is the file you edit. `npm run seed` syncs it into SQLite (you need to run it after every edit; the server only auto-imports into an empty DB).

```sh
npm run validate   # check the file: errors, missing fields, missing pictures
npm run seed       # import into the database
```

### Fields

| Field | Required | Example | Used for |
|---|---|---|---|
| `id` | yes | `"usada-pekora"` | Unique key, lowercase-kebab. Also the picture file name. |
| `name` | yes | `"Usada Pekora"` | Display and search |
| `nameJp` | | `"兎田ぺこら"` | Display and search |
| `aliases` | | `["Pekora", "Peko"]` | Search only |
| `branch` | yes | `JP`, `EN`, `ID`, `DEV_IS` | Classic column |
| `generation` | yes | `"Gen 3"`, `"Myth"`, `"holoX"`, `"ID Gen 2"` | Classic column. Keep names unique across branches. |
| `status` | yes | `Active`, `Graduated`, `Affiliate` | Classic column |
| `hairColor` | | `["White", "Blue"]` | Classic column, partial matches count |
| `height` | | `153` (cm) | Classic column with arrows |
| `debutDate` | | `"2019-07-17"` | Classic column with arrows (same month = green, same year = orange) |
| `graduationDate` | | `"2024-08-28"` | Stored for reference |
| `birthday` | | `"01-12"` (MM-DD) | Hint |
| `fanName` | | `"Nousagi"` | Hint, win screen |
| `oshiMark` | | `"👯"` | Hint, win screen |
| `youtube`, `twitter` | | URLs | YouTube link on the win screen |
| `image` | | `"pekora-v2.png"` | Only if the icon isn't named `<id>.<ext>` |
| `inPool` | | `true` (default) | Set `false` to keep a talent guessable but never the answer |
| `verified` | | `false` | Your own checklist flag. `npm run validate` counts unverified entries. |

Any other field you add is kept (in the `extra` column), so you can add data now and use it later.
Keep spellings consistent (`"Blonde"` everywhere, never `"Blond"` in one place), because matching compares the text exactly (ignoring case).

**The starter data was written from memory and every entry is `verified: false`.** Check it against official profiles, especially heights, graduation status and dates.

### Pictures

| What | Where | Notes |
|---|---|---|
| Icon | `public/images/talents/<id>.webp` (or .png / .jpg / .avif) | Square, 256px or larger. Shown in search results and guess rows. Talents without one get an initials placeholder. |
| Portrait art (optional) | `data/portraits/<id>.png` | Used by Portrait mode. Not publicly served, so players can't match it against the icons. Without it, Portrait mode falls back to the icon. |

Portrait mode stays off until at least one talent has a picture, then it turns on automatically.

### Adding a Classic column

Add an entry to `ATTRIBUTES` in [server/config.js](server/config.js), e.g. `{ key: 'eyeColor', label: 'Eyes', type: 'multi' }`, and add `eyeColor` to talents in the JSON.
Types: `exact`, `multi`, `number` (arrows), `date` (arrows).

## Daily schedule

- The answer for each date and mode is stored in the `daily_puzzles` table, so everyone gets the same talent and restarts don't change it.
- The scheduler checks every minute for the day rolling over and keeps the next 7 days generated.
- The randomizer works like a shuffle bag: everyone in the pool is picked once before anyone repeats, no one repeats within 30 days, and the two modes never share an answer on the same day.
- Answers stay on the server. The browser only receives comparison results.

Admin commands:

```sh
npm run schedule                                     # recent + upcoming answers
npm run schedule -- fill 30                          # generate 30 days ahead
npm run schedule -- set 2026-12-27 classic amane-kanata   # pin a talent (e.g. a birthday or anniversary)
npm run schedule -- reroll 2026-10-20 [mode]         # re-randomize a future day
npm run schedule -- pool [mode]                      # who can currently be an answer
```

Changing today or earlier requires `--force`, since players may already have guessed.

## Settings (environment variables)

| Variable | Default | |
|---|---|---|
| `PORT` | `3000` | |
| `RESET_TZ` | `Asia/Tokyo` | Any IANA time zone |
| `SCHEDULE_AHEAD_DAYS` | `7` | |
| `COOLDOWN_DAYS` | `30` | Minimum gap before a talent repeats (capped by pool size) |
| `DB_PATH` | `data/yagoodle.db` | |

## Project layout

```
server/      Express API, SQLite access, scheduler, randomizer, comparison logic
scripts/     seed / validate / schedule CLIs
public/      the website (plain HTML, CSS and ES modules, no build step)
data/        talents.json, the SQLite database, private portrait art
test/        node:test unit tests
```

---

Fan-made, not affiliated with COVER Corporation. Before publishing, read COVER's derivative-work guidelines, especially regarding official art.
