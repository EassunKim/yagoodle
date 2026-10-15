-- preview: which talents have an icon in the "talents" bucket
select t.id, t.name, o.name as file
from talents t
left join storage.objects o
  on o.bucket_id = 'talents'
 and lower(o.name) = lower(replace(t.name, ' ', '_') || '_-_Icon.webp')
order by o.name nulls first, t.name;


-- set image_url from the matching icon
update talents t
set image_url = 'https://xlwdhrjixksbwnapkyqp.supabase.co/storage/v1/object/public/talents/' || o.name
from storage.objects o
where o.bucket_id = 'talents'
  and lower(o.name) = lower(replace(t.name, ' ', '_') || '_-_Icon.webp');


-- check
select count(*) filter (where image_url is not null) as with_icon,
       count(*) filter (where image_url is null)     as without_icon
from talents;
