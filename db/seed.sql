-- languages
insert into languages (code, name) values
  ('JP', 'Japanese'),
  ('EN', 'English'),
  ('ID', 'Indonesian')
on conflict (code) do nothing;


-- generations
insert into generations (language_id, name, debut_order)
select l.id, v.name, v.debut_order
from (values
  ('JP', 'Gen 0', 0),
  ('JP', 'Gen 1', 1),
  ('JP', 'Gen 2', 2),
  ('JP', 'Gen 3', 3),
  ('JP', 'Gen 4', 4),
  ('JP', 'Gen 5', 5),
  ('JP', 'holoX', 6),
  ('EN', 'Myth', 0),
  ('EN', 'Project: HOPE', 1),
  ('EN', 'Council', 2),
  ('ID', 'ID Gen 1', 0),
  ('ID', 'ID Gen 2', 1),
  ('ID', 'ID Gen 3', 2)
) as v (language_code, name, debut_order)
join languages l on l.code = v.language_code
on conflict (language_id, name) do nothing;


-- talents
insert into talents (id, name, name_jp, aliases, generation_id, status, debut_date,
                     height_cm, hair_colors, fan_name, oshi_mark, in_pool)
select v.id, v.name, v.name_jp, v.aliases, g.id, v.status, v.debut_date::date,
       v.height_cm::smallint, v.hair_colors, v.fan_name, v.oshi_mark, true
from (values
  ('tokino-sora', 'Tokino Sora', 'ときのそら', array['Sora', 'Sora-chan']::text[], 'JP', 'Gen 0', 'Active', '2017-09-07', 160, array['Brown']::text[], 'Soratomo', '🐻💿'),
  ('roboco', 'Roboco', 'ロボ子さん', array['Roboco-san']::text[], 'JP', 'Gen 0', 'Active', '2018-03-04', 154, array['Brown']::text[], 'Robosa', '🤖'),
  ('sakura-miko', 'Sakura Miko', 'さくらみこ', array['Miko', 'Mikochi', 'Elite']::text[], 'JP', 'Gen 0', 'Active', '2018-08-01', 152, array['Pink']::text[], '35P', '🌸'),
  ('hoshimachi-suisei', 'Hoshimachi Suisei', '星街すいせい', array['Suisei', 'Suichan']::text[], 'JP', 'Gen 0', 'Active', '2018-03-22', 160, array['Blue']::text[], 'Hoshiyomi', '☄️'),
  ('shirakami-fubuki', 'Shirakami Fubuki', '白上フブキ', array['Fubuki', 'Fubuchan', 'Friend']::text[], 'JP', 'Gen 1', 'Active', '2018-06-01', 155, array['White']::text[], 'Sukonbu', '🌽'),
  ('natsuiro-matsuri', 'Natsuiro Matsuri', '夏色まつり', array['Matsuri', 'Matsurin']::text[], 'JP', 'Gen 1', 'Active', '2018-06-01', 152, array['Orange']::text[], 'Matsurisu', '🏮'),
  ('akai-haato', 'Akai Haato', '赤井はあと', array['Haato', 'Haachama']::text[], 'JP', 'Gen 1', 'Active', '2018-06-02', 154, array['Blonde']::text[], 'Haaton', '❤️'),
  ('aki-rosenthal', 'Aki Rosenthal', 'アキ・ローゼンタール', array['Aki', 'Akirose']::text[], 'JP', 'Gen 1', 'Active', '2018-06-01', 162, array['Blonde']::text[], 'Rosetai', '🍎'),
  ('minato-aqua', 'Minato Aqua', '湊あくあ', array['Aqua', 'Akutan']::text[], 'JP', 'Gen 2', 'Graduated', '2018-08-08', 148, array['Pink', 'Blue']::text[], 'Aqua Crew', '⚓'),
  ('oozora-subaru', 'Oozora Subaru', '大空スバル', array['Subaru', 'Duck']::text[], 'JP', 'Gen 2', 'Active', '2018-09-16', 154, array['Black']::text[], 'Subatomo', '🚑'),
  ('usada-pekora', 'Usada Pekora', '兎田ぺこら', array['Pekora', 'Peko', 'Pekochan']::text[], 'JP', 'Gen 3', 'Active', '2019-07-17', 153, array['White', 'Blue']::text[], 'Nousagi', '👯'),
  ('shiranui-flare', 'Shiranui Flare', '不知火フレア', array['Flare', 'Fuutan']::text[], 'JP', 'Gen 3', 'Active', '2019-08-07', 158, array['Blonde']::text[], 'Elfriends', '🔥'),
  ('shirogane-noel', 'Shirogane Noel', '白銀ノエル', array['Noel', 'Danchou']::text[], 'JP', 'Gen 3', 'Active', '2019-08-08', 150, array['Silver']::text[], 'Shirogane Kishidan', '⚔️'),
  ('houshou-marine', 'Houshou Marine', '宝鐘マリン', array['Marine', 'Senchou']::text[], 'JP', 'Gen 3', 'Active', '2019-08-11', 150, array['Red']::text[], 'Ichimi', '🏴‍☠️'),
  ('amane-kanata', 'Amane Kanata', '天音かなた', array['Kanata', 'PP Tenshi']::text[], 'JP', 'Gen 4', 'Active', '2019-12-27', 149, array['White', 'Blue']::text[], 'Heimin', '💫'),
  ('kiryu-coco', 'Kiryu Coco', '桐生ココ', array['Coco', 'Kaichou']::text[], 'JP', 'Gen 4', 'Graduated', '2019-12-28', 180, array['Blonde']::text[], 'Kiryu-kai', '🐉'),
  ('tsunomaki-watame', 'Tsunomaki Watame', '角巻わため', array['Watame', 'Wataame']::text[], 'JP', 'Gen 4', 'Active', '2019-12-29', 151, array['Blonde']::text[], 'Watamates', '🐏'),
  ('tokoyami-towa', 'Tokoyami Towa', '常闇トワ', array['Towa', 'TMT']::text[], 'JP', 'Gen 4', 'Active', '2020-01-03', 150, array['Purple']::text[], 'Tokoyami Kenzoku', '👾'),
  ('himemori-luna', 'Himemori Luna', '姫森ルーナ', array['Luna', 'Hime']::text[], 'JP', 'Gen 4', 'Active', '2020-01-04', 150, array['Pink']::text[], 'Luna Knights', '🍬'),
  ('yukihana-lamy', 'Yukihana Lamy', '雪花ラミィ', array['Lamy', 'Lamy-chan']::text[], 'JP', 'Gen 5', 'Active', '2020-08-12', 160, array['Blue']::text[], 'Yukimin', '☃️'),
  ('momosuzu-nene', 'Momosuzu Nene', '桃鈴ねね', array['Nene', 'Nenechi']::text[], 'JP', 'Gen 5', 'Active', '2020-08-13', 159, array['Orange']::text[], 'Nekko', '🍑'),
  ('shishiro-botan', 'Shishiro Botan', '獅白ぼたん', array['Botan', 'Shishiron']::text[], 'JP', 'Gen 5', 'Active', '2020-08-14', 166, array['Silver']::text[], 'SSRB', '♌'),
  ('omaru-polka', 'Omaru Polka', '尾丸ポルカ', array['Polka', 'Porukya']::text[], 'JP', 'Gen 5', 'Active', '2020-08-16', 157, array['Blonde']::text[], 'Omaru-za', '🎪'),
  ('la-darknesss', 'La+ Darknesss', 'ラプラス・ダークネス', array['Laplus', 'La+', 'Yamada']::text[], 'JP', 'holoX', 'Active', '2021-11-26', 139, array['Purple']::text[], null, '🛸💜'),
  ('mori-calliope', 'Mori Calliope', '森カリオペ', array['Calli', 'Calliope', 'Reaper']::text[], 'EN', 'Myth', 'Active', '2020-09-12', 167, array['Pink']::text[], 'Dead Beats', '💀'),
  ('takanashi-kiara', 'Takanashi Kiara', '小鳥遊キアラ', array['Kiara', 'Tenchou', 'Wawa']::text[], 'EN', 'Myth', 'Active', '2020-09-12', 165, array['Orange']::text[], 'KFP', '🐔'),
  ('ninomae-inanis', 'Ninomae Ina''nis', '一伊那尓栖', array['Ina', 'Inanis', 'Tako']::text[], 'EN', 'Myth', 'Active', '2020-09-13', 157, array['Purple', 'Orange']::text[], 'Takodachi', '🐙'),
  ('gawr-gura', 'Gawr Gura', 'がうる・ぐら', array['Gura', 'Goomba', 'Same']::text[], 'EN', 'Myth', 'Graduated', '2020-09-13', 141, array['White', 'Blue']::text[], 'Chumbuds', '🔱'),
  ('watson-amelia', 'Watson Amelia', 'ワトソン・アメリア', array['Ame', 'Amelia', 'Watson']::text[], 'EN', 'Myth', 'Affiliate', '2020-09-13', 150, array['Blonde']::text[], 'Teamates', '🔎'),
  ('irys', 'IRyS', 'アイリス', array['Irys', 'Hope']::text[], 'EN', 'Project: HOPE', 'Active', '2021-07-11', 165, array['Purple']::text[], 'IRyStocrats', '💎'),
  ('ouro-kronii', 'Ouro Kronii', 'オーロ・クロニー', array['Kronii', 'Kronichiwa']::text[], 'EN', 'Council', 'Active', '2021-08-22', 169, array['Blue']::text[], 'Kronies', '⏳'),
  ('hakos-baelz', 'Hakos Baelz', 'ハコス・ベールズ', array['Bae', 'Baelz']::text[], 'EN', 'Council', 'Active', '2021-08-22', 152, array['Red']::text[], 'Brats', '🎲'),
  ('ceres-fauna', 'Ceres Fauna', 'セレス・ファウナ', array['Fauna', 'Mother Nature']::text[], 'EN', 'Council', 'Graduated', '2021-08-22', 165, array['Green']::text[], 'Saplings', '🌿'),
  ('nanashi-mumei', 'Nanashi Mumei', '七詩ムメイ', array['Mumei', 'Moom']::text[], 'EN', 'Council', 'Graduated', '2021-08-22', 156, array['Brown']::text[], 'Hoomans', '🪶'),
  ('tsukumo-sana', 'Tsukumo Sana', '九十九佐命', array['Sana', 'Sanana']::text[], 'EN', 'Council', 'Graduated', '2021-08-22', null, array['Brown']::text[], 'Sanalites', '🪐'),
  ('moona-hoshinova', 'Moona Hoshinova', 'ムーナ・ホシノヴァ', array['Moona', 'Moon']::text[], 'ID', 'ID Gen 1', 'Active', '2020-04-11', 165, array['Purple']::text[], 'Moonafic', '🔮'),
  ('kureiji-ollie', 'Kureiji Ollie', 'クレイジー・オリー', array['Ollie', 'Zombie']::text[], 'ID', 'ID Gen 2', 'Active', '2020-12-04', 163, array['Red']::text[], 'Zomrade', '🧟'),
  ('pavolia-reine', 'Pavolia Reine', 'パヴォリア・レイネ', array['Reine', 'Reine-sama']::text[], 'ID', 'ID Gen 2', 'Active', '2020-12-05', 172, array['Blue']::text[], 'MERAKyats', '🦚'),
  ('kobo-kanaeru', 'Kobo Kanaeru', 'こぼ・かなえる', array['Kobo', 'Bocil']::text[], 'ID', 'ID Gen 3', 'Active', '2022-03-27', 150, array['Blue', 'White']::text[], 'Kobokerz', '☔')
) as v (id, name, name_jp, aliases, language_code, generation, status, debut_date,
       height_cm, hair_colors, fan_name, oshi_mark)
join languages l on l.code = v.language_code
join generations g on g.language_id = l.id and g.name = v.generation
on conflict (id) do nothing;
