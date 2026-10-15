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
  ('JP', 'GAMERS', 3),
  ('JP', 'Gen 3', 4),
  ('JP', 'Gen 4', 5),
  ('JP', 'Gen 5', 6),
  ('JP', 'holoX', 7),
  ('JP', 'ReGLOSS', 8),
  ('JP', 'FLOW GLOW', 9),
  ('JP', 'ASOBI★MAWARI-TAI!', 10),
  ('EN', 'Myth', 0),
  ('EN', 'Promise', 1),
  ('EN', 'Council', 2),
  ('EN', 'Advent', 3),
  ('EN', 'Justice', 4),
  ('ID', 'AREA15', 0),
  ('ID', 'holoro', 1),
  ('ID', 'holoh3ro', 2)
) as v (language_code, name, debut_order)
join languages l on l.code = v.language_code
on conflict (language_id, name) do update set debut_order = excluded.debut_order;


-- talents
insert into talents (id, name, name_jp, aliases, generation_id, status, debut_date,
                     height_cm, hair_colors, fan_name, oshi_mark, youtube_url)
select v.id, v.name, v.name_jp, v.aliases, g.id, v.status, v.debut_date::date,
       v.height_cm::smallint, v.hair_colors, v.fan_name, v.oshi_mark, v.youtube_url
from (values
  ('tokino-sora', 'Tokino Sora', 'ときのそら', array['Sora-chan', 'Sora-senpai', 'Mama of hololive']::text[], 'JP', 'Gen 0', 'Active', '2017-09-07', 160, array['Brown']::text[], 'Soratomo', '🐻💿', 'https://www.youtube.com/channel/UCp6993wxpyDPHUpavwDFqgg'),
  ('roboco', 'Robocosan', 'ロボ子さん', array['Roboco', 'Roboco-san']::text[], 'JP', 'Gen 0', 'Active', '2018-03-09', 154, array['Brown']::text[], 'Robosa', '🤖', 'https://www.youtube.com/channel/UCDqI2jOz0weumE8s7paEk6g'),
  ('hoshimachi-suisei', 'Hoshimachi Suisei', '星街すいせい', array['Sui-chan', 'Suichan']::text[], 'JP', 'Gen 0', 'Active', '2018-03-22', 160, array['Blue']::text[], 'Hoshiyomi', '☄️', 'https://www.youtube.com/channel/UC5CwaMl1eIgY8h02uZw7u8A'),
  ('sakura-miko', 'Sakura Miko', 'さくらみこ', array['Mikochi', 'Elite Miko']::text[], 'JP', 'Gen 0', 'Active', '2018-08-01', 152, array['Pink']::text[], '35P', '🌸', 'https://www.youtube.com/channel/UC-hM6YJuNYVAmUWxeIr9FeA'),
  ('azki', 'AZKi', 'AZKi', array['Azu', 'Virtual Diva']::text[], 'JP', 'Gen 0', 'Active', '2018-11-15', 158, array['Black', 'Pink', 'Blue']::text[], null, '⚒️', 'https://www.youtube.com/channel/UC0TXe_LYZ4scaW2XMyi5_kw'),
  ('aki-rosenthal', 'Aki Rosenthal', 'アキ・ローゼンタール', array['AkiRose', 'Akirose']::text[], 'JP', 'Gen 1', 'Active', '2018-06-01', 162, array['Blonde']::text[], 'Rosetai', '🍎', 'https://www.youtube.com/channel/UCFTLzh12_nrtzqBPsTCqenA'),
  ('natsuiro-matsuri', 'Natsuiro Matsuri', '夏色まつり', array['Matsuri-chan', 'Wasshoi']::text[], 'JP', 'Gen 1', 'Active', '2018-06-01', 152, array['Brown', 'Orange']::text[], 'Matsurisu', '🏮', 'https://www.youtube.com/channel/UCQ0UDLQCjY0rmuxCDE38FGg'),
  ('shirakami-fubuki', 'Shirakami Fubuki', '白上フブキ', array['Fubuchan', 'Fubuki-senpai', 'Friend', 'Kurokami']::text[], 'JP', 'Gen 1', 'Active', '2018-06-01', 155, array['White']::text[], 'Sukonbu', '🌽', 'https://www.youtube.com/channel/UCdn5BQ06XqgXoAxIhbqw5Rg'),
  ('akai-haato', 'Akai Haato', '赤井はあと', array['Haachama', 'Haato-sama']::text[], 'JP', 'Gen 1', 'Active', '2018-06-02', 154, array['Blonde']::text[], 'Haaton', '❤️', 'https://www.youtube.com/channel/UC1CfXB_kRs3C-zaeTG3oGyg'),
  ('minato-aqua', 'Minato Aqua', '湊あくあ', array['Akutan', 'Aqua-tan']::text[], 'JP', 'Gen 2', 'Graduated', '2018-08-08', 148, array['Pink', 'Blue']::text[], 'Aqua Crew', '⚓', 'https://www.youtube.com/channel/UC1opHUrw8rvnsadT-iGp7Cg'),
  ('murasaki-shion', 'Murasaki Shion', '紫咲シオン', array['Shion-chan', 'Kusogaki']::text[], 'JP', 'Gen 2', 'Graduated', '2018-08-17', 145, array['Silver', 'White']::text[], null, '🌙', 'https://www.youtube.com/channel/UCXTpFs_3PqI41qX2d9tL2Rw'),
  ('nakiri-ayame', 'Nakiri Ayame', '百鬼あやめ', array['Ojou']::text[], 'JP', 'Gen 2', 'Active', '2018-09-03', 152, array['Silver', 'White', 'Red']::text[], null, '😈', 'https://www.youtube.com/channel/UC7fk0CB07ly8oSl0aqKkqFg'),
  ('yuzuki-choco', 'Yuzuki Choco', '癒月ちょこ', array['Choco-sensei']::text[], 'JP', 'Gen 2', 'Active', '2018-09-04', 165, array['Blonde']::text[], null, '💋', 'https://www.youtube.com/channel/UC1suqwovbL1kzsoaZgFZLKg'),
  ('oozora-subaru', 'Oozora Subaru', '大空スバル', array['Shuba', 'Duck']::text[], 'JP', 'Gen 2', 'Active', '2018-09-16', 154, array['Black']::text[], 'Subatomo', '🚑', 'https://www.youtube.com/channel/UCvzGlP9oQwU--Y0r9id_jnA'),
  ('ookami-mio', 'Ookami Mio', '大神ミオ', array['Mio-sha', 'Mio-mama']::text[], 'JP', 'GAMERS', 'Active', '2018-12-07', 160, array['Black', 'Red']::text[], null, '🌲', 'https://www.youtube.com/channel/UCp-5t9SrOQwXMU7iIjQfARg'),
  ('nekomata-okayu', 'Nekomata Okayu', '猫又おかゆ', array['Okayun', 'Okanyan', 'Mogu Mogu']::text[], 'JP', 'GAMERS', 'Active', '2019-04-06', 152, array['Purple']::text[], null, '🍙', 'https://www.youtube.com/channel/UCvaTdHTWBGv3MKj3KVqJVCw'),
  ('inugami-korone', 'Inugami Korone', '戌神ころね', array['Koro-san', 'Doggo', 'YUBI YUBI']::text[], 'JP', 'GAMERS', 'Active', '2019-04-13', 156, array['Brown']::text[], null, '🥐', 'https://www.youtube.com/channel/UChAnqc_AY5_I3Px5dig3X1Q'),
  ('usada-pekora', 'Usada Pekora', '兎田ぺこら', array['Peko', 'Peko-chan', 'Pekora-chan']::text[], 'JP', 'Gen 3', 'Active', '2019-07-17', 153, array['White', 'Blue']::text[], 'Nousagi', '👯', 'https://www.youtube.com/channel/UC1DCedRgGHBdm81E1llLhOQ'),
  ('shiranui-flare', 'Shiranui Flare', '不知火フレア', array['Fuutan']::text[], 'JP', 'Gen 3', 'Active', '2019-08-07', 158, array['Blonde']::text[], 'Elfriends', '🔥', 'https://www.youtube.com/channel/UCvInZx9h3jC2JzsIzoOebWg'),
  ('shirogane-noel', 'Shirogane Noel', '白銀ノエル', array['Danchou']::text[], 'JP', 'Gen 3', 'Active', '2019-08-08', 158, array['Silver']::text[], 'Shirogane Kishidan', '⚔️', 'https://www.youtube.com/channel/UCdyqAaZDKHXg4Ahi7VENThQ'),
  ('houshou-marine', 'Houshou Marine', '宝鐘マリン', array['Senchou', 'Marine Senchou']::text[], 'JP', 'Gen 3', 'Active', '2019-08-11', 150, array['Red']::text[], 'Ichimi', '🏴‍☠️', 'https://www.youtube.com/channel/UCCzUftO8KOVkV4wQG1vkUvg'),
  ('amane-kanata', 'Amane Kanata', '天音かなた', array['Kanatan', 'PP Tenshi', 'Gorilla']::text[], 'JP', 'Gen 4', 'Graduated', '2019-12-27', 148, array['White', 'Blue', 'Pink']::text[], 'Heimin', '💫', 'https://www.youtube.com/channel/UCZlDXzGoo7d44bwdNObFacg'),
  ('kiryu-coco', 'Kiryu Coco', '桐生ココ', array['Kaichou', 'Coco']::text[], 'JP', 'Gen 4', 'Graduated', '2019-12-29', 180, array['Orange', 'Blonde']::text[], 'Kiryu-kai', '🐉', 'https://www.youtube.com/channel/UCS9uQI-jC3DE0L4IpXyvr6w'),
  ('tsunomaki-watame', 'Tsunomaki Watame', '角巻わため', array['Watame', 'Watame did nothing wrong']::text[], 'JP', 'Gen 4', 'Active', '2019-12-29', 151, array['Blonde']::text[], 'Watamates', '🐏', 'https://www.youtube.com/channel/UCqm3BQLlJfvkTsX_hvm0UmA'),
  ('tokoyami-towa', 'Tokoyami Towa', '常闇トワ', array['TMT', 'Towa-sama']::text[], 'JP', 'Gen 4', 'Active', '2020-01-03', 150, array['Purple', 'Pink']::text[], 'Tokoyami Kenzoku', '👾', 'https://www.youtube.com/channel/UC1uv2Oq6kNxgATlCiez59hw'),
  ('himemori-luna', 'Himemori Luna', '姫森ルーナ', array['Lunatan', 'Hime']::text[], 'JP', 'Gen 4', 'Active', '2020-01-04', 147, array['Pink']::text[], 'Luna Knights', '🍬', 'https://www.youtube.com/channel/UCa9Y57gfeY0Zro_noHRVrnw'),
  ('yukihana-lamy', 'Yukihana Lamy', '雪花ラミィ', array['Lamy-chan']::text[], 'JP', 'Gen 5', 'Active', '2020-08-12', 162, array['Blue']::text[], 'Yukimin', '☃️', 'https://www.youtube.com/channel/UCFKOVgVbGmX65RxO3EtH3iw'),
  ('momosuzu-nene', 'Momosuzu Nene', '桃鈴ねね', array['Nenechi', 'Super Nenechi']::text[], 'JP', 'Gen 5', 'Active', '2020-08-13', 159, array['Orange', 'Blonde']::text[], 'Nekko', '🍑🥟', 'https://www.youtube.com/channel/UCAWSyEs_Io8MtpY3m-zqILA'),
  ('shishiro-botan', 'Shishiro Botan', '獅白ぼたん', array['Shishiron', 'Lion']::text[], 'JP', 'Gen 5', 'Active', '2020-08-14', 166, array['Silver', 'Grey']::text[], 'SSRB', '♌', 'https://www.youtube.com/channel/UCUKD-uaobj9jiqB-VXt71mA'),
  ('omaru-polka', 'Omaru Polka', '尾丸ポルカ', array['Polka', 'Omaru-za']::text[], 'JP', 'Gen 5', 'Active', '2020-08-16', 152, array['Blonde', 'Red']::text[], 'Omaru-za', '🎪', 'https://www.youtube.com/channel/UCK9V2B22uJYu3N7eR_BT9QA'),
  ('la-darknesss', 'La+ Darknesss', 'ラプラス・ダークネス', array['Laplus', 'La+-sama', 'Yamada']::text[], 'JP', 'holoX', 'Active', '2021-11-26', 139, array['Purple', 'Silver']::text[], null, '🛸💜', 'https://www.youtube.com/channel/UCENwRMx5Yh42zWpzURebzTw'),
  ('takane-lui', 'Takane Lui', '鷹嶺ルイ', array['Lui-nee']::text[], 'JP', 'holoX', 'Active', '2021-11-27', 161, array['Pink', 'Brown']::text[], null, '🥀', 'https://www.youtube.com/channel/UCs9_O1tRPMQTHQ-N_L6FU2g'),
  ('hakui-koyori', 'Hakui Koyori', '博衣こより', array['Koyo']::text[], 'JP', 'holoX', 'Active', '2021-11-28', 153, array['Pink']::text[], null, '🧪', 'https://www.youtube.com/channel/UC6eWCld0KwmyHFbAqK3V-Rw'),
  ('sakamata-chloe', 'Sakamata Chloe', '沙花叉クロヱ', array['Chloe', 'Sakamata', 'Chloe-chan']::text[], 'JP', 'holoX', 'Affiliate', '2021-11-29', null, array['Black', 'White', 'Red']::text[], null, '🎣', 'https://www.youtube.com/channel/UCIBY1ollUsauvVi4hW4cumw'),
  ('kazama-iroha', 'Kazama Iroha', '風真いろは', array['Gozaru', 'Iroha-dono']::text[], 'JP', 'holoX', 'Active', '2021-11-30', 156, array['Blonde', 'Green']::text[], null, '🍃', 'https://www.youtube.com/channel/UC_vMYWcDjmfdpH6r4TTn1MQ'),
  ('hiodoshi-ao', 'Hiodoshi Ao', '火威青', array['Ao-kun', 'Ao']::text[], 'JP', 'ReGLOSS', 'Graduated', '2023-09-09', null, array['Blue']::text[], null, '🖋️', null),
  ('ichijou-ririka', 'Ichijou Ririka', '一条莉々華', array['Ririka-shachou']::text[], 'JP', 'ReGLOSS', 'Active', '2023-09-09', null, '{}'::text[], null, '🌃', 'https://www.youtube.com/channel/UCtyWhCj3AqKh2dXctLkDtng'),
  ('otonose-kanade', 'Otonose Kanade', '音乃瀬奏', array['Kanade', 'Kanatan']::text[], 'JP', 'ReGLOSS', 'Active', '2023-09-09', null, '{}'::text[], null, '🎹✨', 'https://www.youtube.com/channel/UCWQtYtq9EOB4-I5P-3fh8lA'),
  ('juufuutei-raden', 'Juufuutei Raden', '儒烏風亭らでん', array['Raden', 'Raden-chan']::text[], 'JP', 'ReGLOSS', 'Active', '2023-09-10', null, '{}'::text[], null, '🐚', 'https://www.youtube.com/channel/UCdXAk5MpyLD8594lm_OvtGQ'),
  ('todoroki-hajime', 'Todoroki Hajime', '轟はじめ', array['Ban-chou', 'Hajime-chan']::text[], 'JP', 'ReGLOSS', 'Active', '2023-09-10', null, '{}'::text[], null, '🐧⚡', 'https://www.youtube.com/channel/UC1iA6_NT4mtAcIII6ygrvCw'),
  ('isaki-riona', 'Isaki Riona', '響咲リオナ', array['Riona']::text[], 'JP', 'FLOW GLOW', 'Active', '2024-11-09', 160, '{}'::text[], null, null, 'https://www.youtube.com/channel/UC9LSiN9hXI55svYEBrrK-tw'),
  ('kikirara-vivi', 'Kikirara Vivi', '綺々羅々ヴィヴィ', array['Vivi']::text[], 'JP', 'FLOW GLOW', 'Active', '2024-11-09', 161, '{}'::text[], null, null, 'https://www.youtube.com/channel/UCGzTVXqMQHa4AgJVJIVvtDQ'),
  ('koganei-niko', 'Koganei Niko', '虎金妃笑虎', array['Niko-tan']::text[], 'JP', 'FLOW GLOW', 'Active', '2024-11-09', 172, '{}'::text[], null, null, 'https://www.youtube.com/channel/UCuI_opAVX6qbxZY-a-AxFuQ'),
  ('mizumiya-su', 'Mizumiya Su', '水宮枢', array['Su-chan']::text[], 'JP', 'FLOW GLOW', 'Active', '2024-11-09', 145, '{}'::text[], null, null, 'https://www.youtube.com/channel/UCjk2nKmHzgH5Xy-C5qYRd5A'),
  ('rindo-chihaya', 'Rindo Chihaya', '輪堂千速', array['Chihaya']::text[], 'JP', 'FLOW GLOW', 'Active', '2024-11-09', 168, '{}'::text[], null, null, 'https://www.youtube.com/channel/UCKMWFR6lAstLa7Vbf5dH7ig'),
  ('achichi-mela', 'Achichi Mela', '熱千めら', array['Mela']::text[], 'JP', 'ASOBI★MAWARI-TAI!', 'Active', '2026-09-24', 149, '{}'::text[], null, '🧯', 'https://www.youtube.com/@AchichiMela'),
  ('sorashina-sopia', 'Sorashina Sopia', '宙科そぴあ', array['Sopia']::text[], 'JP', 'ASOBI★MAWARI-TAI!', 'Active', '2026-09-24', 153, '{}'::text[], null, '📡', 'https://www.youtube.com/@SorashinaSopia'),
  ('hyakuto-kyoko', 'Hyakuto Kyoko', '百灯キョーコ', array['Kyoko']::text[], 'JP', 'ASOBI★MAWARI-TAI!', 'Active', '2026-09-25', 162, '{}'::text[], null, '👮📢', 'https://www.youtube.com/@HyakutoKyoko'),
  ('suzuna-tsuzuri', 'Suzuna Tsuzuri', '鈴鳴つづり', array['Tsuzuri']::text[], 'JP', 'ASOBI★MAWARI-TAI!', 'Active', '2026-09-25', 155, '{}'::text[], null, '🐐💌', 'https://www.youtube.com/@SuzunaTsuzuri'),
  ('mori-calliope', 'Mori Calliope', '森カリオペ', array['Calli', 'Mori', 'Reaper']::text[], 'EN', 'Myth', 'Active', '2020-09-12', 167, array['Pink']::text[], 'Dead Beats', '💀', 'https://www.youtube.com/channel/UCL_qhgtOy0dy1Agp8vkySQg'),
  ('takanashi-kiara', 'Takanashi Kiara', '小鳥遊キアラ', array['Tenchou', 'Kusotori']::text[], 'EN', 'Myth', 'Active', '2020-09-12', 165, array['Orange']::text[], 'KFP', '🐔', 'https://www.youtube.com/channel/UCHsx4Hqa-1ORjQTh9TYDhww'),
  ('gawr-gura', 'Gawr Gura', 'がうる・ぐら', array['Gura', 'Same', 'Goomba']::text[], 'EN', 'Myth', 'Graduated', '2020-09-13', 141, array['White', 'Blue']::text[], 'Chumbuds', '🔱', 'https://www.youtube.com/channel/UCoSrY_IQQVpmIRZ9Xf-y93g'),
  ('ninomae-inanis', 'Ninomae Ina''nis', '一伊那尓栖', array['Ina', 'Tako']::text[], 'EN', 'Myth', 'Active', '2020-09-13', 157, array['Purple', 'Orange']::text[], 'Takodachi', '🐙', 'https://www.youtube.com/channel/UCMwGHR0BTZuLsmjY_NT5Pwg'),
  ('watson-amelia', 'Watson Amelia', 'ワトソン・アメリア', array['Ame', 'Amelia', 'Detective']::text[], 'EN', 'Myth', 'Affiliate', '2020-09-13', 150, array['Blonde']::text[], 'Teamates', '🔎', 'https://www.youtube.com/channel/UCyl1z3jo3XHR1riLFKG5UAg'),
  ('irys', 'IRyS', 'IRyS', array['Hope', 'Nephilim']::text[], 'EN', 'Promise', 'Active', '2021-07-11', 166, array['Black', 'Purple', 'Pink']::text[], 'IRyStocrats', '💎', 'https://www.youtube.com/channel/UC8rcEBzJSleTkf_-agPM20g'),
  ('ouro-kronii', 'Ouro Kronii', 'オーロ・クロニー', array['Kronii', 'Warden of Time']::text[], 'EN', 'Promise', 'Active', '2021-08-22', 168, array['Blue']::text[], 'Kronies', '⏳', 'https://www.youtube.com/channel/UCmbs8T6MWqUHP1tIQvSgKrg'),
  ('hakos-baelz', 'Hakos Baelz', 'ハコス・ベールズ', array['Bae', 'Rat']::text[], 'EN', 'Promise', 'Active', '2021-08-23', 149, array['White', 'Red', 'Black']::text[], 'Brats', '🎲', 'https://www.youtube.com/channel/UCgmPnx-EEeOrZSg5Tiw7ZRQ'),
  ('ceres-fauna', 'Ceres Fauna', 'セレス・ファウナ', array['Fauna', 'Mother Nature']::text[], 'EN', 'Council', 'Graduated', '2021-08-22', null, array['Green', 'Blonde']::text[], 'Saplings', '🌿', 'https://www.youtube.com/channel/UCO_aKKYxn4tvrqPjcTzZ6EQ'),
  ('tsukumo-sana', 'Tsukumo Sana', '九十九佐命', array['Sana', 'Sanana', 'Speaker of Space']::text[], 'EN', 'Council', 'Graduated', '2021-08-22', null, array['Brown']::text[], 'Sanalites', '🪐', 'https://www.youtube.com/channel/UCsUj0dszADCGbF3gNrQEuSQ'),
  ('nanashi-mumei', 'Nanashi Mumei', '七詩ムメイ', array['Mumei', 'Moom', 'Guardian of Civilization']::text[], 'EN', 'Council', 'Graduated', '2021-08-23', null, array['Brown']::text[], 'Hoomans', '🪶', 'https://www.youtube.com/channel/UC3n5uGu18FoCy23ggWWp8tA'),
  ('koseki-bijou', 'Koseki Bijou', '古石ビジュー', array['Biboo', 'Rock']::text[], 'EN', 'Advent', 'Active', '2023-07-29', null, array['Purple']::text[], null, '🗿', 'https://www.youtube.com/channel/UC9p_lqQ0FEDz327Vgf5JwqA'),
  ('shiori-novella', 'Shiori Novella', 'シオリ・ノヴェラ', array['Shiori']::text[], 'EN', 'Advent', 'Active', '2023-07-29', null, array['Black', 'White']::text[], null, '👁️‍🗨️', 'https://www.youtube.com/channel/UCgnfPPb9JI3e9A4cXHnWbyg'),
  ('fuwawa-abyssgard', 'Fuwawa Abyssgard', 'フワワ・アビスガード', array['Fuwawa', 'FuwaMoco']::text[], 'EN', 'Advent', 'Active', '2023-07-30', null, array['Blue', 'Pink']::text[], null, '🐾', 'https://www.youtube.com/channel/UCt9H_RpQzhxzlyBxFqrdHqA'),
  ('mococo-abyssgard', 'Mococo Abyssgard', 'モココ・アビスガード', array['Mococo', 'FuwaMoco']::text[], 'EN', 'Advent', 'Active', '2023-07-30', null, array['Pink', 'Blue']::text[], null, '🐾', 'https://www.youtube.com/channel/UCt9H_RpQzhxzlyBxFqrdHqA'),
  ('nerissa-ravencroft', 'Nerissa Ravencroft', 'ネリッサ・レイヴンクロフト', array['Rissa']::text[], 'EN', 'Advent', 'Active', '2023-07-30', null, array['Blue', 'Black']::text[], null, '🎼', 'https://www.youtube.com/channel/UC_sFNM0z0MWm9A6WlKPuMMg'),
  ('elizabeth-rose-bloodflame', 'Elizabeth Rose Bloodflame', 'エリザベス・ローズ・ブラッドフレイム', array['Liz', 'ERB']::text[], 'EN', 'Justice', 'Active', '2024-06-22', null, array['Red']::text[], null, null, 'https://www.youtube.com/channel/UCW5uhrG1eCBYditmhL0Ykjw'),
  ('gigi-murin', 'Gigi Murin', 'ジジ・ムリン', array['GG', 'Gigi']::text[], 'EN', 'Justice', 'Active', '2024-06-22', null, array['Orange']::text[], null, null, 'https://www.youtube.com/channel/UCDHABijvPBnJm7F-KlNME3w'),
  ('cecilia-immergreen', 'Cecilia Immergreen', 'セシリア・イマーグリーン', array['CC', 'Ceci']::text[], 'EN', 'Justice', 'Active', '2024-06-23', null, array['Green']::text[], null, null, 'https://www.youtube.com/channel/UCvN5h1ShZtc7nly3pezRayg'),
  ('raora-panthera', 'Raora Panthera', 'ラオーラ・パンテーラ', array['Raora']::text[], 'EN', 'Justice', 'Active', '2024-06-23', null, array['Pink']::text[], null, null, 'https://www.youtube.com/channel/UCl69AEx4MdqMZH7Jtsm7Tig'),
  ('ayunda-risu', 'Ayunda Risu', 'アユンダ・リス', array['Risu', 'Squirrel']::text[], 'ID', 'AREA15', 'Active', '2020-04-10', 143, array['Brown']::text[], null, '🐿️', 'https://www.youtube.com/channel/UCOyYb1c43VlX9rc_lT6NKQw'),
  ('moona-hoshinova', 'Moona Hoshinova', 'ムーナ・ホシノヴァ', array['Moona-sama', 'Moon']::text[], 'ID', 'AREA15', 'Active', '2020-04-11', 165, array['Purple']::text[], 'Moonafic', '🔮', 'https://www.youtube.com/channel/UCP0BspO_AMEe3aQqqpo89Dg'),
  ('airani-iofifteen', 'Airani Iofifteen', 'アイラニ・イオフィフティーン', array['Iofi']::text[], 'ID', 'AREA15', 'Active', '2020-04-12', 150, array['Green']::text[], null, '🎨', 'https://www.youtube.com/channel/UCAoy6rzhSf4ydcYjJw3WoVg'),
  ('kureiji-ollie', 'Kureiji Ollie', 'クレイジー・オリー', array['Ollie', 'Zombie']::text[], 'ID', 'holoro', 'Active', '2020-12-04', 160, array['Red']::text[], 'Zomrade', '🧟‍♀️', 'https://www.youtube.com/channel/UCYz_5n-uDuChHtLo7My1HnQ'),
  ('anya-melfissa', 'Anya Melfissa', 'アーニャ・メルフィッサ', array['Anya', 'Keris']::text[], 'ID', 'holoro', 'Active', '2020-12-05', 147, array['Blonde']::text[], null, '🍂', 'https://www.youtube.com/channel/UC727SQYUvx5pDDGQpTICNWg'),
  ('pavolia-reine', 'Pavolia Reine', 'パヴォリア・レイネ', array['Reine-sama', 'Reine']::text[], 'ID', 'holoro', 'Active', '2020-12-06', 172, array['Blue', 'White']::text[], 'MERAKyats', '🦚', 'https://www.youtube.com/channel/UChgTyjG-pdNvxxhdsXfHQ5Q'),
  ('vestia-zeta', 'Vestia Zeta', 'ベスティア・ゼータ', array['Agent Zeta']::text[], 'ID', 'holoh3ro', 'Active', '2022-03-25', null, array['Grey', 'Silver']::text[], null, '📜', 'https://www.youtube.com/channel/UCTvHWSfBZgtxE4sILOaurIQ'),
  ('kaela-kovalskia', 'Kaela Kovalskia', 'カエラ・コヴァルスキア', array['Kaela', 'Blacksmith']::text[], 'ID', 'holoh3ro', 'Active', '2022-03-26', 173, array['Orange']::text[], null, '🔨', 'https://www.youtube.com/channel/UCZLZ8Jjx_RN2CXloOmgTHVg'),
  ('kobo-kanaeru', 'Kobo Kanaeru', 'こぼ・かなえる', array['Kobo-chan', 'Bocil']::text[], 'ID', 'holoh3ro', 'Active', '2022-03-27', 150, array['Blue', 'White']::text[], 'Kobokerz', '☔', 'https://www.youtube.com/channel/UCjLEmnpCNeisMxy134KPwWw')
) as v (id, name, name_jp, aliases, language_code, generation, status, debut_date,
       height_cm, hair_colors, fan_name, oshi_mark, youtube_url)
join languages l on l.code = v.language_code
join generations g on g.language_id = l.id and g.name = v.generation
on conflict (id) do update set
  name          = excluded.name,
  name_jp       = excluded.name_jp,
  aliases       = excluded.aliases,
  generation_id = excluded.generation_id,
  status        = excluded.status,
  debut_date    = excluded.debut_date,
  height_cm     = excluded.height_cm,
  hair_colors   = excluded.hair_colors,
  fan_name      = coalesce(excluded.fan_name, talents.fan_name),
  oshi_mark     = excluded.oshi_mark,
  youtube_url   = excluded.youtube_url;


-- remove unused generations and languages
delete from generations g
where not exists (select 1 from talents t where t.generation_id = g.id);

delete from languages l
where not exists (select 1 from generations g where g.language_id = l.id);
