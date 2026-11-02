-- ============================================================
-- AI Studio: TASK CATALOG in the database. Run LAST (after ai_studio_tools.sql).
-- Safe to run again (the seed is only added for new task types; admin edits stay).
--
-- The catalog decides everything about a task type:
--   label / customer_label / hint : the names and help text on each screen
--   output                        : 'image' or 'text'
--   inputs / optional / labels    : which photo slots it uses (face, style, input) and their names
--   prompt_required, face_check, edit (brush mask), transparent (PNG), angles, family, extras
--   customer_visible              : shown in the customer app
--   enabled                       : off = nobody can create or run this task type
-- The tool of a task type is in ai_studio_tool_types (ai_studio_tools.sql).
-- Which workers run which type: ai_studio_workers.task_types (NULL = every type of its tools).
-- ============================================================

-- 1. The catalog table
create table if not exists public.ai_studio_task_catalog (
  task_type         text primary key,
  label             text not null,
  customer_label    text,
  hint              text,
  output            text not null check (output in ('image', 'text')),
  inputs            text[] not null default '{}',
  optional          text[] not null default '{}',
  labels            jsonb not null default '{}'::jsonb,
  customer_labels   jsonb,
  extras            boolean not null default false,
  prompt_required   boolean not null default false,
  face_check        boolean not null default false,
  edit              boolean not null default false,
  transparent       boolean not null default false,
  angles            text[],
  family            boolean not null default false,
  customer_visible  boolean not null default false,
  enabled           boolean not null default true,
  sort              int not null default 0,
  updated_at        timestamptz not null default now()
);

alter table public.ai_studio_task_catalog enable row level security;
drop policy if exists "ai_studio_task_catalog admin" on public.ai_studio_task_catalog;
create policy "ai_studio_task_catalog admin" on public.ai_studio_task_catalog for all to authenticated
  using (public.is_ai_studio_admin()) with check (public.is_ai_studio_admin());

-- 2. Workers: which task types each worker runs (NULL = all types of its tools)
alter table public.ai_studio_workers add column if not exists task_types text[];

-- 3. The seed (generated from the task types that were in the apps). Added only for missing types.
-- Task catalog seed (generated from the hardcoded lists that were in the apps).
insert into public.ai_studio_task_catalog (task_type, label, customer_label, hint, output, inputs, optional, labels, customer_labels, extras, prompt_required, face_check, edit, transparent, angles, family, customer_visible, sort) values
  ('chat', 'Chat (sirf text)', 'Chat', 'Sawal poocho. Same conversation ID se purani baat yaad rehti hai.', 'text', '{}'::text[], '{}'::text[], '{}'::jsonb, '{}'::jsonb, false, true, false, false, false, null, false, true, 10),
  ('photo_read', 'Photo Read → Text', 'Photo ke baare mein batao', 'Photo do, uske baare mein text jawab milega.', 'text', array['input']::text[], '{}'::text[], '{}'::jsonb, '{}'::jsonb, true, false, false, false, false, null, false, true, 20),
  ('text_to_image', 'Prompt → Photo', 'Prompt se photo banao', 'Sirf apna prompt likho, photo ban jayegi.', 'image', '{}'::text[], '{}'::text[], '{}'::jsonb, '{}'::jsonb, false, true, false, false, false, null, false, true, 30),
  ('image_prompt', 'Image + Prompt → Photo', 'Ek photo + prompt se nayi photo banao', 'Ek photo aur prompt do. Chaho to aur photos bhi de sakte ho.', 'image', array['input']::text[], '{}'::text[], '{}'::jsonb, '{}'::jsonb, true, true, false, false, false, null, false, true, 40),
  ('image_to_image', 'Image → Image (face + style)', 'Apna chehra + style se photo banao', 'Apna chehra aur jo kapde / style chahiye uski photo do.', 'image', array['face', 'style']::text[], '{}'::text[], '{}'::jsonb, '{}'::jsonb, false, false, true, false, false, null, false, true, 50),
  ('image_to_image_prompt', 'Image → Image + Prompt', 'Chehra + style + prompt se photo banao', 'Chehra, style photo aur prompt do.', 'image', array['face', 'style']::text[], '{}'::text[], '{}'::jsonb, '{}'::jsonb, false, true, true, false, false, null, false, true, 60),
  ('outfit_change', 'Outfit change (person + naya outfit)', 'Outfit badlo (aap wahi, naya outfit)', 'Apni photo aur jo outfit pehnana hai uski photo do.', 'image', array['face', 'style']::text[], '{}'::text[], '{"face":"Person ki photo","style":"Naye outfit ki photo"}'::jsonb, '{"face":"Apni photo","style":"Naye outfit ki photo"}'::jsonb, false, false, true, false, false, null, false, true, 70),
  ('background_change', 'Background change (person + naya background)', 'Background badlo (aap wahi, naya background)', 'Aap same rahoge, sirf background badlega.', 'image', array['face', 'style']::text[], '{}'::text[], '{"face":"Person ki photo","style":"Naye background ki photo"}'::jsonb, '{"face":"Apni photo","style":"Naye background ki photo"}'::jsonb, false, false, true, false, false, null, false, true, 80),
  ('virtual_tryon', 'Virtual try-on (customer + product)', 'Virtual try-on (product aap par dekho)', 'Apni photo aur product ki photo do. Product aap par dikhega.', 'image', array['face', 'style']::text[], '{}'::text[], '{"face":"Customer / model ki photo","style":"Product ki photo (kapda, jewellery, bag)"}'::jsonb, '{"face":"Apni photo","style":"Product ki photo (kapda, jewellery, bag)"}'::jsonb, false, false, true, false, false, null, false, true, 90),
  ('product_scene', 'Product scene (product scene mein)', 'Product ko scene mein dikhao', 'Product ki photo do, aur batao kahan dikhana hai (cafe, beach, studio).', 'image', array['face', 'style']::text[], array['style']::text[], '{"face":"Product ki photo","style":"Scene / background ki photo (optional)"}'::jsonb, '{"face":"Product ki photo","style":"Scene ki photo (optional)"}'::jsonb, false, true, false, false, false, null, false, true, 100),
  ('product_catalog', 'Product catalog photo', 'Product catalog photo', 'Product ki photo do. Prompt mein angle batao (jaise front view, side view).', 'image', array['face']::text[], '{}'::text[], '{"face":"Product ki photo"}'::jsonb, '{"face":"Product ki photo"}'::jsonb, false, false, false, false, false, null, false, true, 110),
  ('project_image', 'Project image (design se naya visual)', 'Design / project se naya visual', 'Design ki photo do, aur batao kaisa visual chahiye.', 'image', array['face', 'style']::text[], array['style']::text[], '{"face":"Design / project ki photo","style":"Style reference (optional)"}'::jsonb, '{"face":"Design / project ki photo","style":"Style reference (optional)"}'::jsonb, false, true, false, false, false, null, false, true, 120),
  ('image_edit', 'Photo edit (brush se area badlo)', 'Photo ka hissa badlo (brush se)', 'Photo do, phir brush se jo hissa badalna hai use laal karo. Sirf wahi hissa badlega. Prompt mein batao kya karna hai: rang badlo, text add karo, ya text hatao.', 'image', array['face', 'style']::text[], '{}'::text[], '{"face":"Edit wali photo","style":"Mask (brush se select kiya area)"}'::jsonb, '{"face":"Edit wali photo","style":"Mask (brush se area select karo)"}'::jsonb, false, true, false, true, false, null, false, true, 130),
  ('hair_change', 'Hair change (brush se baal)', 'Baal badlo (brush se)', 'Photo do, phir brush se baal wala hissa laal karo. Prompt mein batao: kaisa hairstyle, rang ya length.', 'image', array['face', 'style']::text[], '{}'::text[], '{"face":"Photo","style":"Mask (brush se baal wala area)"}'::jsonb, '{"face":"Apni photo","style":"Mask (brush se baal wala area)"}'::jsonb, false, true, false, true, false, null, false, true, 140),
  ('shirt_change', 'Shirt / top change (brush se)', 'Shirt / top badlo (brush se)', 'Photo do, phir brush se shirt wala hissa laal karo. Prompt mein batao: rang, kapda ya design.', 'image', array['face', 'style']::text[], '{}'::text[], '{"face":"Photo","style":"Mask (brush se shirt wala area)"}'::jsonb, '{"face":"Apni photo","style":"Mask (brush se shirt wala area)"}'::jsonb, false, true, false, true, false, null, false, true, 150),
  ('suit_change', 'Suit change (brush se)', 'Suit badlo (brush se)', 'Photo do, phir brush se outfit wala hissa laal karo. Prompt mein batao: suit ka rang aur style.', 'image', array['face', 'style']::text[], '{}'::text[], '{"face":"Photo","style":"Mask (brush se outfit wala area)"}'::jsonb, '{"face":"Apni photo","style":"Mask (brush se outfit wala area)"}'::jsonb, false, true, false, true, false, null, false, true, 160),
  ('bg_change', 'Background change (brush se background)', 'Background badlo (brush se, aap wahi rahoge)', 'Photo do, phir brush se background wala hissa laal karo. Aap same rahoge. Prompt mein naya background batao.', 'image', array['face', 'style']::text[], '{}'::text[], '{"face":"Photo","style":"Mask (brush se background wala area)"}'::jsonb, '{"face":"Apni photo","style":"Mask (brush se background wala area)"}'::jsonb, false, true, false, true, false, null, false, true, 170),
  ('face_swap', 'Face swap (apna chehra reference par)', 'Face swap (apna chehra reference photo par)', 'Apne chehre ki photo do aur jis photo par lagana hai woh do. Reference photo ka pose, kapde aur background same rahenge.', 'image', array['face', 'style']::text[], '{}'::text[], '{"face":"Aapka chehra (face photo)","style":"Reference photo (jisme chehra lagana hai)"}'::jsonb, '{"face":"Aapka chehra (face photo)","style":"Reference photo (jisme chehra lagana hai)"}'::jsonb, false, false, true, false, false, null, false, true, 180),
  ('couple_photo', 'Couple photo (girl + boy)', 'Couple photo (ladki + ladka)', 'Ladki ki photo aur ladke ki photo do. Chaho to prompt mein pose ya jagah batao (jaise beach, cafe).', 'image', array['face', 'style']::text[], '{}'::text[], '{"face":"Girl ki photo","style":"Boy ki photo"}'::jsonb, '{"face":"Ladki ki photo","style":"Ladke ki photo"}'::jsonb, false, false, false, false, false, null, false, true, 190),
  ('family_photo', 'Family photo (parivar)', 'Family photo (parivar ek saath)', 'Jo log photo mein chahiye unki photo do: aadmi, aurat, baby boy, baby girl, dadi / nani, dada / nana. Jo nahi hai use khali chhodo. Kam se kam 2 photos chahiye.', 'image', '{}'::text[], '{}'::text[], '{}'::jsonb, '{}'::jsonb, true, false, false, false, false, null, true, true, 200),
  ('outfit_change_ref', 'Outfit change (face ref + outfit + photo ref)', 'Outfit badlo (chehra + photo + outfit)', 'Teen photos do: aapka chehra, outfit ki photo, aur wo photo jis mein outfit badalna hai. Chehra same rahega.', 'image', array['face', 'style', 'input']::text[], '{}'::text[], '{"face":"Chehra ref (identity)","style":"Outfit ki photo","input":"Photo ref (jis photo mein outfit badalna hai)"}'::jsonb, '{"face":"Chehra ref (aapka chehra)","style":"Outfit ki photo","input":"Photo ref (jis photo mein outfit badalna hai)"}'::jsonb, false, false, true, false, false, null, false, true, 210),
  ('ocr_text', 'OCR (photo se text padho)', 'Photo se text padho (OCR)', 'Bill, label, card ya kisi bhi photo ka text padh kar dikhayega.', 'text', array['input']::text[], '{}'::text[], '{"input":"Photo (jis mein text hai)"}'::jsonb, '{"input":"Photo (jis mein text hai)"}'::jsonb, false, false, false, false, false, null, false, true, 220),
  ('product_tag', 'Product tag (rang, material, category)', 'Product ke tags (rang, material, category)', 'Product ki photo do. Rang, material, category aur chhota title milega.', 'text', array['input']::text[], '{}'::text[], '{"input":"Product ki photo"}'::jsonb, '{"input":"Product ki photo"}'::jsonb, false, false, false, false, false, null, false, true, 230),
  ('moderation_check', 'Photo check (blur / inappropriate)', 'Photo check (blur / inappropriate)', 'Photo blur hai ya nahi, aur content theek hai ya nahi, ye batayega.', 'text', array['input']::text[], '{}'::text[], '{"input":"Check karne wali photo"}'::jsonb, '{"input":"Check karne wali photo"}'::jsonb, false, false, false, false, false, null, false, true, 240),
  ('poster_text', 'Poster / banner (text ke saath)', 'Poster / banner (apna text likho)', 'Jo text chahiye prompt mein likho (naam, price, offer). Photo dena optional hai.', 'image', array['face']::text[], array['face']::text[], '{"face":"Main photo / product (optional)"}'::jsonb, '{"face":"Main photo (optional)"}'::jsonb, false, true, false, false, false, null, false, true, 250),
  ('sticker_logo', 'Logo / sticker (transparent)', 'Logo / sticker (transparent)', 'Logo ya sticker ka description likho. Background transparent hoga.', 'image', '{}'::text[], '{}'::text[], '{}'::jsonb, '{}'::jsonb, false, true, false, false, true, null, false, true, 260),
  ('remove_bg', 'Background remove (transparent PNG)', 'Background hatao (transparent PNG)', 'Photo do, background hat jayega aur transparent PNG milegi.', 'image', array['face']::text[], '{}'::text[], '{"face":"Product / photo"}'::jsonb, '{"face":"Product / photo"}'::jsonb, false, false, false, false, true, null, false, true, 270),
  ('restore_photo', 'Photo restore / upscale', 'Purani photo sudharo (restore)', 'Purani ya blur photo do. Chehra same rahega, quality badhegi.', 'image', array['face']::text[], '{}'::text[], '{"face":"Purani / kam quality photo"}'::jsonb, '{"face":"Purani / kam quality photo"}'::jsonb, false, false, true, false, false, null, false, true, 280),
  ('outpaint', 'Aspect extend (bina crop ke)', 'Photo ka aspect badhao (bina crop)', 'Photo ko naye aspect (jaise 9:16) mein bada kiya jayega. Subject same rahega.', 'image', array['face']::text[], '{}'::text[], '{"face":"Photo (aspect badhana hai)"}'::jsonb, '{"face":"Photo"}'::jsonb, false, false, true, false, false, null, false, true, 290),
  ('style_transfer', 'Style transfer (sketch, painting, cartoon)', 'Style badlo (sketch, painting, cartoon)', 'Photo do, aur prompt mein style batao: sketch, oil painting, cartoon.', 'image', array['face']::text[], '{}'::text[], '{"face":"Photo"}'::jsonb, '{"face":"Photo"}'::jsonb, false, true, false, false, false, null, false, true, 300),
  ('mockup', 'Mockup (design ko product par)', 'Mockup (design product par)', 'Design ki photo aur product ki photo do. Design product par print dikhega.', 'image', array['face', 'style']::text[], '{}'::text[], '{"face":"Design / artwork","style":"Product photo (t-shirt, mug, bag)"}'::jsonb, '{"face":"Design / artwork","style":"Product photo (t-shirt, mug, bag)"}'::jsonb, false, false, false, false, false, null, false, true, 310),
  ('product_angles', 'Product multi-angle (alag angles)', 'Product ke alag angles', 'Product ki photo do. Har photo mein alag angle hoga (front, side, back, top). Batch se photos badhao.', 'image', array['face']::text[], '{}'::text[], '{"face":"Product ki photo"}'::jsonb, '{"face":"Product ki photo"}'::jsonb, false, false, false, false, false, array['front view', 'left side view', 'back view', 'three-quarter view', 'top view']::text[], false, true, 320),
  ('woman_earrings', 'Earrings (woman, brush se)', 'Earrings badlo (woman, brush se)', 'Photo do, phir brush se kaan wala hissa laal karo. Prompt mein batao: earring ka design aur rang.', 'image', array['face', 'style']::text[], '{}'::text[], '{"face":"Photo (woman)","style":"Mask (brush se kaan wala area)"}'::jsonb, '{"face":"Apni photo","style":"Mask (brush se kaan wala area)"}'::jsonb, false, true, false, true, false, null, false, true, 330),
  ('woman_nose_pin', 'Nose pin / nose ring (woman, brush se)', 'Nose pin badlo (woman, brush se)', 'Photo do, brush se naak wala hissa laal karo. Prompt mein nose pin ka design batao.', 'image', array['face', 'style']::text[], '{}'::text[], '{"face":"Photo (woman)","style":"Mask (brush se naak wala area)"}'::jsonb, '{"face":"Apni photo","style":"Mask (brush se naak wala area)"}'::jsonb, false, true, false, true, false, null, false, true, 340),
  ('woman_shoes', 'Shoes (woman, brush se)', 'Shoes badlo (woman, brush se)', 'Photo do, brush se pair wala hissa laal karo. Prompt mein shoes ka style aur rang batao.', 'image', array['face', 'style']::text[], '{}'::text[], '{"face":"Photo (woman)","style":"Mask (brush se pair wala area)"}'::jsonb, '{"face":"Apni photo","style":"Mask (brush se pair wala area)"}'::jsonb, false, true, false, true, false, null, false, true, 350),
  ('woman_glasses', 'Glasses (woman, brush se)', 'Glasses badlo (woman, brush se)', 'Photo do, brush se aankhon wala hissa laal karo. Prompt mein glasses ka style batao.', 'image', array['face', 'style']::text[], '{}'::text[], '{"face":"Photo (woman)","style":"Mask (brush se aankhon wala area)"}'::jsonb, '{"face":"Apni photo","style":"Mask (brush se aankhon wala area)"}'::jsonb, false, true, false, true, false, null, false, true, 360),
  ('man_glasses', 'Glasses (man, brush se)', 'Glasses badlo (man, brush se)', 'Photo do, brush se aankhon wala hissa laal karo. Prompt mein glasses ka style batao.', 'image', array['face', 'style']::text[], '{}'::text[], '{"face":"Photo (man)","style":"Mask (brush se aankhon wala area)"}'::jsonb, '{"face":"Apni photo","style":"Mask (brush se aankhon wala area)"}'::jsonb, false, true, false, true, false, null, false, true, 370),
  ('man_suit', 'Suit (man, brush se)', 'Suit badlo (man, brush se)', 'Photo do, brush se outfit wala hissa laal karo. Prompt mein suit ka rang aur style batao.', 'image', array['face', 'style']::text[], '{}'::text[], '{"face":"Photo (man)","style":"Mask (brush se outfit wala area)"}'::jsonb, '{"face":"Apni photo","style":"Mask (brush se outfit wala area)"}'::jsonb, false, true, false, true, false, null, false, true, 380),
  ('man_shirt', 'Shirt (man, brush se)', 'Shirt badlo (man, brush se)', 'Photo do, brush se shirt wala hissa laal karo. Prompt mein rang aur kapda batao.', 'image', array['face', 'style']::text[], '{}'::text[], '{"face":"Photo (man)","style":"Mask (brush se shirt wala area)"}'::jsonb, '{"face":"Apni photo","style":"Mask (brush se shirt wala area)"}'::jsonb, false, true, false, true, false, null, false, true, 390),
  ('man_jeans', 'Jeans (man, brush se)', 'Jeans badlo (man, brush se)', 'Photo do, brush se pant wala hissa laal karo. Prompt mein jeans ka rang aur fit batao.', 'image', array['face', 'style']::text[], '{}'::text[], '{"face":"Photo (man)","style":"Mask (brush se pant wala area)"}'::jsonb, '{"face":"Apni photo","style":"Mask (brush se pant wala area)"}'::jsonb, false, true, false, true, false, null, false, true, 400),
  ('man_shorts', 'Shorts (man, brush se)', 'Shorts badlo (man, brush se)', 'Photo do, brush se pant wala hissa laal karo. Prompt mein shorts ka rang aur length batao.', 'image', array['face', 'style']::text[], '{}'::text[], '{"face":"Photo (man)","style":"Mask (brush se pant wala area)"}'::jsonb, '{"face":"Apni photo","style":"Mask (brush se pant wala area)"}'::jsonb, false, true, false, true, false, null, false, true, 410),
  ('man_shoes', 'Shoes (man, brush se)', 'Shoes badlo (man, brush se)', 'Photo do, brush se pair wala hissa laal karo. Prompt mein shoes ka style aur rang batao.', 'image', array['face', 'style']::text[], '{}'::text[], '{"face":"Photo (man)","style":"Mask (brush se pair wala area)"}'::jsonb, '{"face":"Apni photo","style":"Mask (brush se pair wala area)"}'::jsonb, false, true, false, true, false, null, false, true, 420),
  ('pose_change', 'Pose change (front, back, side)', 'Pose badlo (front, back, side)', 'Photo do aur batao kaunsa pose chahiye: front view, back view, side view, walking ya sitting. Chehra aur kapde same rahenge.', 'image', array['face']::text[], '{}'::text[], '{"face":"Person ki photo"}'::jsonb, '{"face":"Apni photo"}'::jsonb, false, true, true, false, false, null, false, true, 430)
on conflict (task_type) do nothing;

-- 4. The apps read the catalog through this (no login needed; it holds no secrets).
--    Each row also says which tool the type belongs to.
create or replace function public.get_task_catalog()
returns json
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(json_agg(row_to_json(x) order by x.sort, x.task_type), '[]'::json)
    from (
      select c.task_type, c.label, c.customer_label, c.hint, c.output, c.inputs, c.optional, c.labels,
             c.customer_labels, c.extras, c.prompt_required, c.face_check, c.edit, c.transparent,
             c.angles, c.family, c.customer_visible, c.sort,
             coalesce(tt.tool, 'image') as tool
        from public.ai_studio_task_catalog c
        left join public.ai_studio_tool_types tt on tt.task_type = c.task_type
       where c.enabled
    ) x;
$$;

-- 5. A new task: its tool comes from the mapping, and it is refused if the type or the tool is off
create or replace function public.ai_studio_set_tool()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_tool    text;
  v_enabled boolean;
begin
  select enabled into v_enabled from public.ai_studio_task_catalog where task_type = new.task_type;
  if v_enabled is not true and new.task_type not in ('chat', 'photo_read') then
    raise exception 'Ye kaam abhi band hai: %', new.task_type;
  end if;

  select tool into v_tool from public.ai_studio_tool_types where task_type = new.task_type;
  new.tool := coalesce(v_tool, 'image');

  select enabled into v_enabled from public.ai_studio_tools where tool = new.tool;
  if v_enabled is not true then
    raise exception 'Ye tool abhi band hai: %', new.tool;
  end if;
  return new;
end;
$$;

-- 6. The worker's pending list: its tools AND its own task types (NULL = all types of its tools)
create or replace function public.get_pending_for_worker(p_worker_id text, p_stale_before timestamptz, p_limit int default 40)
returns setof public.ai_studio_tasks
language sql
stable
security definer
set search_path = public
as $$
  select p.* from public.get_pending_ai_studio_tasks(p_stale_before, 200) p
   where p.tool in (
           select unnest(w.tools) from public.ai_studio_workers w where w.worker_id = p_worker_id
         )
     and exists (
           select 1 from public.ai_studio_workers w
            where w.worker_id = p_worker_id
              and (w.task_types is null or p.task_type = any (w.task_types))
         )
   limit least(p_limit, 200);
$$;

-- 7. Admin sets which task types a worker runs (NULL = all types of its tools)
create or replace function public.ai_studio_set_worker_task_types(p_worker_id text, p_types text[])
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_ai_studio_admin() then
    raise exception 'Sirf admin worker ke kaam badal sakta hai';
  end if;
  if p_types is not null and exists (
       select 1 from unnest(p_types) t where t not in (select task_type from public.ai_studio_task_catalog)
     ) then
    raise exception 'Ek task type galat hai';
  end if;
  update public.ai_studio_workers set task_types = p_types where worker_id = p_worker_id;
end;
$$;

-- 8. The customer can only create a type that the catalog shows to customers and that is enabled
create or replace function public.customer_create_task(p_payload jsonb)
returns setof public.ai_studio_tasks
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid   text := auth.uid()::text;
  v_cfg   record;
  v_on    boolean;
  v_today int;
begin
  if v_uid is null then
    raise exception 'Pehle login karo';
  end if;

  select * into v_cfg from public.ai_studio_settings where id = 1;
  if v_cfg.maintenance_on then
    raise exception '%', v_cfg.maintenance_message;
  end if;

  if not exists (
    select 1 from public.ai_studio_task_catalog
     where task_type = p_payload->>'task_type' and customer_visible and enabled
  ) then
    raise exception 'Ye kaam is app se nahi banaya ja sakta';
  end if;

  select enabled into v_on from public.ai_studio_models where model_id = p_payload->>'model';
  if v_on is false then
    raise exception 'Ye model abhi band hai, dusra chuno';
  end if;

  if v_cfg.user_daily_task_limit > 0 then
    select count(*) into v_today from public.ai_studio_tasks
     where user_id = v_uid and created_at >= date_trunc('day', now());
    if v_today >= v_cfg.user_daily_task_limit then
      raise exception 'Aaj ka limit (%) khatam ho gaya, kal try karo', v_cfg.user_daily_task_limit;
    end if;
  end if;

  return query
    select * from public.upload_ai_studio_task(jsonb_set(p_payload, '{user_id}', to_jsonb(v_uid)));
end;
$$;

-- 9. The upload check: every rule (which photos, prompt, family, size) comes from the catalog row
create or replace function public.upload_ai_studio_task(p_payload jsonb)
returns setof public.ai_studio_tasks
language plpgsql
as $$
declare
  v_cat     public.ai_studio_task_catalog%rowtype;
  v_type    text := p_payload->>'task_type';
  v_model   text := p_payload->>'model';
  v_prompt  text := nullif(btrim(p_payload->>'prompt'), '');
  v_aspect  text := nullif(p_payload->>'aspect_ratio', '');
  v_size    text := nullif(p_payload->>'image_size', '');
  v_face    text := nullif(btrim(p_payload->>'face_image_url'), '');
  v_style   text := nullif(btrim(p_payload->>'style_image_url'), '');
  v_input   text := nullif(btrim(p_payload->>'input_image_url'), '');
  v_user    text := coalesce(nullif(p_payload->>'user_id', ''), 'weargen_user_1');
  v_batch   int  := coalesce((p_payload->>'batch_count')::int, 1);
  v_is_image boolean;
begin
  -- 1. Known, enabled task type
  select * into v_cat from public.ai_studio_task_catalog where task_type = v_type and enabled;
  if not found then
    raise exception 'Task type galat ya band hai: %', v_type;
  end if;
  v_is_image := v_cat.output = 'image';

  -- 2. Model matches the output
  if v_is_image and not (v_model = any (ai_studio_image_models())) then
    raise exception 'Image task ke liye image model chahiye: %', v_model;
  end if;
  if not v_is_image and not (v_model = any (ai_studio_text_models())) then
    raise exception 'Text task ke liye text model chahiye: %', v_model;
  end if;

  -- 3. Required prompt
  if v_cat.prompt_required and v_prompt is null then
    raise exception 'Prompt khali nahi ho sakta (task: %)', v_type;
  end if;

  -- 4. Required photos (a slot listed in "optional" may be left empty)
  if 'face' = any (v_cat.inputs) and not ('face' = any (v_cat.optional)) and v_face is null then
    raise exception 'Pehli photo chahiye (task: %)', v_type;
  end if;
  if 'style' = any (v_cat.inputs) and not ('style' = any (v_cat.optional)) and v_style is null then
    raise exception 'Dusri photo chahiye (task: %)', v_type;
  end if;
  if 'input' = any (v_cat.inputs) and not ('input' = any (v_cat.optional)) and v_input is null then
    raise exception 'Input photo chahiye (task: %)', v_type;
  end if;

  -- 5. Family: the slots may be empty, but at least 2 photos are needed
  if v_cat.family and (
    select count(*) from jsonb_array_elements_text(coalesce(p_payload->'extra_image_urls', '[]'::jsonb)) x
     where btrim(x) <> ''
  ) < 2 then
    raise exception 'Parivar ki kam se kam 2 photos chahiye';
  end if;

  -- 6. Image settings
  if v_is_image then
    if v_aspect is null or not (v_aspect = any (array['1:1','2:3','3:2','3:4','4:3','4:5','5:4','9:16','16:9','21:9'])) then
      raise exception 'Aspect ratio galat hai: %', v_aspect;
    end if;
    if v_size is not null and not (v_size = any (array['0.5K','1K','2K','4K'])) then
      raise exception 'Image size galat hai: %', v_size;
    end if;
  end if;

  -- 7. Batch count 1-10
  if v_batch < 1 or v_batch > 10 then
    raise exception 'batch_count 1 se 10 ke beech hona chahiye';
  end if;

  -- 8. No duplicate: same user cannot queue the same task twice while it is pending or running
  if exists (
    select 1 from public.ai_studio_tasks t
     where t.user_id = v_user
       and t.status in ('pending', 'processing')
       and t.task_type = v_type
       and t.model = v_model
       and coalesce(t.prompt, '') = coalesce(v_prompt, '')
       and coalesce(t.face_image_url, '') = coalesce(v_face, '')
       and coalesce(t.style_image_url, '') = coalesce(v_style, '')
       and coalesce(t.input_image_url, '') = coalesce(v_input, '')
  ) then
    raise exception 'Ye same task pehle se queue mein hai';
  end if;

  return query
  with ins as (
    insert into public.ai_studio_tasks (
      task_type, model, prompt, system_text, aspect_ratio, image_size,
      face_image_url, style_image_url, input_image_url, extra_image_urls,
      conversation_id, user_id, batch_count, status
    )
    values (
      v_type, v_model, v_prompt,
      nullif(p_payload->>'system_text', ''),
      case when v_is_image then v_aspect end,
      case when v_is_image then v_size end,
      v_face, v_style, v_input,
      case when jsonb_typeof(p_payload->'extra_image_urls') = 'array'
           then array(select jsonb_array_elements_text(p_payload->'extra_image_urls')) end,
      nullif(p_payload->>'conversation_id', ''),
      v_user,
      case when v_is_image then v_batch else 1 end,
      'pending'
    )
    returning *
  )
  select * from ins;
end;
$$;

-- 11. Photos one by one: up to 10 photos, the same prompt on each (one result per photo)
alter table public.ai_studio_task_catalog add column if not exists per_photo boolean not null default false;

insert into public.ai_studio_task_catalog (task_type, label, customer_label, hint, output, inputs, optional, labels, customer_labels, extras, prompt_required, face_check, edit, transparent, angles, family, customer_visible, per_photo, sort) values
  ('per_photo_prompt', 'Har photo par same prompt (10 tak)', 'Har photo par ek naya result (10 photo tak)',
   'Ek saath 10 photos tak do. Har photo par same prompt chalega aur har photo ka alag result milega.',
   'image', '{}'::text[], '{}'::text[], '{}'::jsonb, '{"extras":"Photos (10 tak)"}'::jsonb,
   true, true, false, false, false, null, false, true, true, 190)
on conflict (task_type) do nothing;

insert into public.ai_studio_tool_types (task_type, tool) values ('per_photo_prompt', 'image')
on conflict (task_type) do nothing;

-- The old fixed list on the prompts table must go before a new type can get a prompt row
alter table public.ai_studio_prompts drop constraint if exists ai_studio_prompts_task_type_check;

insert into public.ai_studio_prompts (task_type, system_text, role_text, negative_text, prompt_version) values
  ('per_photo_prompt',
   $s$Apply the user's prompt to IMAGE 1 and create one realistic, high-quality photo. Keep the main subject of IMAGE 1 recognisable, and keep it unchanged unless the prompt asks for a change. Output one photo.$s$,
   $r$IMAGE 1 = the input photo for this result.$r$,
   $n$CGI, 3D render, cartoon, deformed anatomy, extra limbs, distorted hands, text, watermark, signature:1.5$n$, 2)
on conflict (task_type) do nothing;

-- 12. Prompts belong to a catalog type: a new type needs only a catalog row and a prompt row (no list in the table)
alter table public.ai_studio_prompts drop constraint if exists ai_studio_prompts_task_type_check;
do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'ai_studio_prompts_task_type_fk') then
    alter table public.ai_studio_prompts add constraint ai_studio_prompts_task_type_fk
      foreign key (task_type) references public.ai_studio_task_catalog (task_type) on update cascade;
  end if;
end;
$$;

-- 13. A photo-by-photo task can have 1 to 10 photos (checked before the task is saved)
create or replace function public.ai_studio_check_per_photo()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_per boolean;
  v_n   int;
begin
  select per_photo into v_per from public.ai_studio_task_catalog where task_type = new.task_type;
  if v_per then
    select count(*) into v_n from unnest(coalesce(new.extra_image_urls, '{}'::text[])) x where btrim(x) <> '';
    if v_n < 1 or v_n > 10 then
      raise exception 'Ek baar mein 1 se 10 photos tak de sakte ho (abhi %)', v_n;
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists ai_studio_check_per_photo on public.ai_studio_tasks;
create trigger ai_studio_check_per_photo
  before insert on public.ai_studio_tasks
  for each row execute function public.ai_studio_check_per_photo();

-- 14. The catalog for the apps now also says which types work photo by photo
create or replace function public.get_task_catalog()
returns json
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(json_agg(row_to_json(x) order by x.sort, x.task_type), '[]'::json)
    from (
      select c.task_type, c.label, c.customer_label, c.hint, c.output, c.inputs, c.optional, c.labels,
             c.customer_labels, c.extras, c.prompt_required, c.face_check, c.edit, c.transparent,
             c.angles, c.family, c.customer_visible, c.per_photo, c.sort,
             coalesce(tt.tool, 'image') as tool
        from public.ai_studio_task_catalog c
        left join public.ai_studio_tool_types tt on tt.task_type = c.task_type
       where c.enabled
    ) x;
$$;
