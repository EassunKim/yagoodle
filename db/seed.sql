-- ============================================================================
-- Yagoodle starting data. Run AFTER schema.sql.
--
-- Every insert ends with "on conflict ... do nothing", so this whole file is
-- safe to re-run: rows that already exist are skipped, new ones are added.
-- ============================================================================


-- ----------------------------------------------------------------------------
-- Branches
-- ----------------------------------------------------------------------------
insert into branches (code, name) values
  ('JP', 'hololive Japan'),
  ('EN', 'hololive English'),
  ('ID', 'hololive Indonesia')
on conflict (code) do nothing;


-- ----------------------------------------------------------------------------
-- Generations
--
-- TODO: insert generations. Look up each branch's id with a subquery so you
-- never need to know the actual numbers. Example:
--
-- insert into generations (branch_id, name, debut_order) values
--   ((select id from branches where code = 'JP'), 'Gen 0', 0),
--   ((select id from branches where code = 'JP'), 'Gen 1', 1),
--   ((select id from branches where code = 'EN'), 'Myth', 0)
-- on conflict (branch_id, name) do nothing;
-- ----------------------------------------------------------------------------



-- ----------------------------------------------------------------------------
-- Talents
--
-- TODO: insert talents. data/talents.json has 39 starter entries to copy from
-- (remember they're unverified). Example:
--
-- insert into talents (id, name, name_jp, aliases, generation_id, status,
--                      debut_date, birth_month, birth_day, height_cm,
--                      hair_colors, fan_name, oshi_mark)
-- values (
--   'usada-pekora', 'Usada Pekora', '兎田ぺこら', '{Pekora, Peko}',
--   (select g.id from generations g
--      join branches b on b.id = g.branch_id
--     where b.code = 'JP' and g.name = 'Gen 3'),
--   'Active', '2019-07-17', 1, 12, 153,
--   '{White, Blue}', 'Nousagi', '👯'
-- )
-- on conflict (id) do nothing;
--
-- Notes:
--   '{Pekora, Peko}' is how you write a text[] list in SQL.
--   The generation lookup joins branches because "Gen 1" exists in more than
--   one branch; matching on the branch code too makes it unambiguous.
-- ----------------------------------------------------------------------------



-- daily_puzzles is NOT seeded: the app's scheduler fills it in automatically.
