-- birthdays
-- Stored as 'MM-DD' text: most talents have no official birth year, and
-- formatHint's 'monthDay' format reads this shape.
alter table talents
  add column if not exists birthday text check (birthday ~ '^(0[1-9]|1[0-2])-(0[1-9]|[12][0-9]|3[01])$');

-- talent_profiles was created with t.*, which Postgres expands when the view is
-- made, so recreate it to pick up the new column. It has to be dropped first:
-- t.* puts birthday before generation/branch, and create or replace can only
-- append columns.
drop view if exists talent_profiles;
create view talent_profiles
with (security_invoker = on) as
select
  t.*,
  g.name as generation,
  l.code as branch
from talents t
join generations g on g.id = t.generation_id
join languages l on l.id = g.language_id;

update talents t
set birthday = v.birthday
from (values
  -- JP
  ('tokino-sora',          '05-15'),
  ('roboco',               '05-23'),
  ('hoshimachi-suisei',    '03-22'),
  ('sakura-miko',          '03-05'),
  ('azki',                 '07-01'),
  ('aki-rosenthal',        '02-17'),
  ('natsuiro-matsuri',     '07-22'),
  ('shirakami-fubuki',     '10-05'),
  ('akai-haato',           '08-10'),
  ('minato-aqua',          '12-01'),
  ('murasaki-shion',       '06-08'),
  ('nakiri-ayame',         '12-13'),
  ('yuzuki-choco',         '02-14'),
  ('oozora-subaru',        '07-02'),
  ('ookami-mio',           '08-20'),
  ('nekomata-okayu',       '02-22'),
  ('inugami-korone',       '10-01'),
  ('usada-pekora',         '01-12'),
  ('shiranui-flare',       '04-02'),
  ('shirogane-noel',       '11-24'),
  ('houshou-marine',       '07-30'),
  ('amane-kanata',         '04-22'),
  ('kiryu-coco',           '06-17'),
  ('tsunomaki-watame',     '06-06'),
  ('tokoyami-towa',        '08-08'),
  ('himemori-luna',        '10-10'),
  ('yukihana-lamy',        '11-15'),
  ('momosuzu-nene',        '03-02'),
  ('shishiro-botan',       '09-08'),
  ('omaru-polka',          '01-30'),
  ('la-darknesss',         '05-25'),
  ('takane-lui',           '06-11'),
  ('hakui-koyori',         '03-15'),
  ('sakamata-chloe',       '05-18'),
  ('kazama-iroha',         '06-18'),
  -- EN
  ('mori-calliope',        '04-04'),
  ('takanashi-kiara',      '07-06'),
  ('gawr-gura',            '06-20'),
  ('ninomae-inanis',       '05-20'),
  ('watson-amelia',        '01-06'),
  ('irys',                 '03-07'),
  ('ouro-kronii',          '03-14'),
  ('hakos-baelz',          '02-29'),
  ('ceres-fauna',          '03-21'),
  ('tsukumo-sana',         '06-10'),
  ('nanashi-mumei',        '08-04'),
  -- ID
  ('ayunda-risu',          '01-15'),
  ('moona-hoshinova',      '02-15'),
  ('airani-iofifteen',     '07-15'),
  ('kureiji-ollie',        '10-13'),
  ('anya-melfissa',        '03-12'),
  ('pavolia-reine',        '09-09'),
  ('vestia-zeta',          '12-10'),
  ('kaela-kovalskia',      '08-30'),
  ('kobo-kanaeru',         '12-12')

  -- TODO: not filled in yet, check official profiles and add:
  -- ReGLOSS:   hiodoshi-ao, otonose-kanade, ichijou-ririka, juufuutei-raden, todoroki-hajime
  -- FLOW GLOW: isaki-riona, koganei-niko, mizumiya-su, rindo-chihaya, kikirara-vivi
  -- (newest):  achichi-mela, sorashina-sopia, hyakuto-kyoko, suzuna-tsuzuri
  -- Advent:    shiori-novella, koseki-bijou, fuwawa-abyssgard, mococo-abyssgard, nerissa-ravencroft
  -- Justice:   elizabeth-rose-bloodflame, gigi-murin, cecilia-immergreen, raora-panthera
) as v(id, birthday)
where t.id = v.id;
