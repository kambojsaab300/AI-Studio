-- ============================================================
-- AI Studio: NEW TASK TYPES (outfit change, background change, virtual try-on,
-- product scene, product catalog, project image). Run LAST (after ai_studio_alerts.sql).
-- Safe to run again.
--
-- Each new type uses the same columns as the old ones:
--   face_image_url  = main photo (person, product or design)
--   style_image_url = second photo (outfit, background, product, scene or style), optional for some types
-- ============================================================

-- 1. Allowed task types on the table
alter table public.ai_studio_tasks drop constraint if exists ai_studio_tasks_task_type_check;
alter table public.ai_studio_tasks add constraint ai_studio_tasks_task_type_check
  check (task_type in (
    'chat', 'photo_read', 'text_to_image', 'image_prompt', 'image_to_image', 'image_to_image_prompt',
    'outfit_change', 'background_change', 'virtual_tryon', 'product_scene', 'product_catalog', 'project_image',
    'image_edit', 'hair_change', 'shirt_change', 'suit_change', 'bg_change', 'face_swap', 'couple_photo', 'family_photo', 'outfit_change_ref',
    'ocr_text', 'product_tag', 'moderation_check',
    'poster_text', 'sticker_logo', 'remove_bg', 'restore_photo', 'outpaint', 'style_transfer', 'mockup', 'product_angles',
    'woman_earrings', 'woman_nose_pin', 'woman_shoes', 'woman_glasses',
    'man_glasses', 'man_suit', 'man_shirt', 'man_jeans', 'man_shorts', 'man_shoes',
    'pose_change'
  ));

-- 2. Upload check (admin and customer both go through this)
create or replace function public.upload_ai_studio_task(p_payload jsonb)
returns setof public.ai_studio_tasks
language plpgsql
as $$
declare
  v_type      text := p_payload->>'task_type';
  v_model     text := p_payload->>'model';
  v_prompt    text := nullif(btrim(p_payload->>'prompt'), '');
  v_aspect    text := nullif(p_payload->>'aspect_ratio', '');
  v_size      text := nullif(p_payload->>'image_size', '');
  v_face      text := nullif(btrim(p_payload->>'face_image_url'), '');
  v_style     text := nullif(btrim(p_payload->>'style_image_url'), '');
  v_input     text := nullif(btrim(p_payload->>'input_image_url'), '');
  v_user      text := coalesce(nullif(p_payload->>'user_id', ''), 'weargen_user_1');
  v_batch     int  := coalesce((p_payload->>'batch_count')::int, 1);
  v_image_types text[] := array[
    'text_to_image', 'image_prompt', 'image_to_image', 'image_to_image_prompt',
    'outfit_change', 'background_change', 'virtual_tryon', 'product_scene', 'product_catalog', 'project_image',
    'image_edit', 'hair_change', 'shirt_change', 'suit_change', 'bg_change', 'face_swap', 'couple_photo', 'family_photo', 'outfit_change_ref',
    'poster_text', 'sticker_logo', 'remove_bg', 'restore_photo', 'outpaint', 'style_transfer', 'mockup', 'product_angles',
    'woman_earrings', 'woman_nose_pin', 'woman_shoes', 'woman_glasses',
    'man_glasses', 'man_suit', 'man_shirt', 'man_jeans', 'man_shorts', 'man_shoes',
    'pose_change'
  ];
  v_face_types   text[] := array[
    'image_to_image', 'image_to_image_prompt', 'outfit_change', 'background_change',
    'virtual_tryon', 'product_scene', 'product_catalog', 'project_image', 'image_edit',
    'hair_change', 'shirt_change', 'suit_change', 'bg_change', 'face_swap', 'couple_photo', 'outfit_change_ref',
    'remove_bg', 'restore_photo', 'outpaint', 'style_transfer', 'mockup', 'product_angles',
    'woman_earrings', 'woman_nose_pin', 'woman_shoes', 'woman_glasses',
    'man_glasses', 'man_suit', 'man_shirt', 'man_jeans', 'man_shorts', 'man_shoes',
    'pose_change'
  ];
  v_style_types  text[] := array[
    'image_to_image', 'image_to_image_prompt', 'outfit_change', 'background_change', 'virtual_tryon',
    'image_edit', 'hair_change', 'shirt_change', 'suit_change', 'bg_change', 'face_swap', 'couple_photo', 'outfit_change_ref', 'mockup',
    'woman_earrings', 'woman_nose_pin', 'woman_shoes', 'woman_glasses',
    'man_glasses', 'man_suit', 'man_shirt', 'man_jeans', 'man_shorts', 'man_shoes'
  ];
  v_prompt_types text[] := array[
    'chat', 'image_prompt', 'image_to_image_prompt', 'text_to_image', 'product_scene', 'project_image',
    'image_edit', 'hair_change', 'shirt_change', 'suit_change', 'bg_change', 'face_swap', 'poster_text', 'sticker_logo', 'style_transfer',
    'woman_earrings', 'woman_nose_pin', 'woman_shoes', 'woman_glasses',
    'man_glasses', 'man_suit', 'man_shirt', 'man_jeans', 'man_shorts', 'man_shoes',
    'pose_change'
  ];
  v_is_image  boolean;
begin
  -- 1. Known task type
  if v_type is null or not (v_type = any (array['chat', 'photo_read', 'ocr_text', 'product_tag', 'moderation_check'] || v_image_types)) then
    raise exception 'Task type galat hai: %', v_type;
  end if;
  v_is_image := v_type = any (v_image_types);

  -- 2. Model matches the task type
  if v_is_image and not (v_model = any (ai_studio_image_models())) then
    raise exception 'Image task ke liye image model chahiye: %', v_model;
  end if;
  if not v_is_image and not (v_model = any (ai_studio_text_models())) then
    raise exception 'Text task ke liye text model chahiye: %', v_model;
  end if;

  -- 3. Required prompt
  if v_type = any (v_prompt_types) and v_prompt is null then
    raise exception 'Prompt khali nahi ho sakta (task: %)', v_type;
  end if;

  -- 4. Required inputs
  -- Family photo: the empty slots are kept (they keep the order of the roles), but at least 2 photos are needed
  if v_type = 'family_photo' and (
    select count(*) from jsonb_array_elements_text(coalesce(p_payload->'extra_image_urls', '[]'::jsonb)) x
     where btrim(x) <> ''
  ) < 2 then
    raise exception 'Parivar ki kam se kam 2 photos chahiye';
  end if;
  if v_type = any (v_face_types) and v_face is null then
    raise exception 'Pehli photo chahiye (task: %)', v_type;
  end if;
  if v_type = any (v_style_types) and v_style is null then
    raise exception 'Dusri photo chahiye (task: %)', v_type;
  end if;
  if v_type in ('image_prompt', 'photo_read', 'outfit_change_ref', 'ocr_text', 'product_tag', 'moderation_check') and v_input is null then
    raise exception 'Input photo chahiye (task: %)', v_type;
  end if;

  -- 5. Image settings
  if v_is_image then
    if v_aspect is null or not (v_aspect = any (array['1:1','2:3','3:2','3:4','4:3','4:5','5:4','9:16','16:9','21:9'])) then
      raise exception 'Aspect ratio galat hai: %', v_aspect;
    end if;
    if v_size is not null and not (v_size = any (array['0.5K','1K','2K','4K'])) then
      raise exception 'Image size galat hai: %', v_size;
    end if;
  end if;

  -- 6. Batch count 1-10
  if v_batch < 1 or v_batch > 10 then
    raise exception 'batch_count 1 se 10 ke beech hona chahiye';
  end if;

  -- 7. No duplicate: same user cannot queue the same task twice while it is pending or running
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

-- 3. Customer create: same checks as before, with the new task types allowed
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

  if p_payload->>'task_type' not in (
    'chat', 'text_to_image', 'image_to_image', 'image_prompt', 'image_to_image_prompt', 'photo_read',
    'outfit_change', 'background_change', 'virtual_tryon', 'product_scene', 'product_catalog', 'project_image',
    'image_edit', 'hair_change', 'shirt_change', 'suit_change', 'bg_change', 'face_swap', 'couple_photo', 'family_photo', 'outfit_change_ref',
    'ocr_text', 'product_tag', 'moderation_check',
    'poster_text', 'sticker_logo', 'remove_bg', 'restore_photo', 'outpaint', 'style_transfer', 'mockup', 'product_angles',
    'woman_earrings', 'woman_nose_pin', 'woman_shoes', 'woman_glasses',
    'man_glasses', 'man_suit', 'man_shirt', 'man_jeans', 'man_shorts', 'man_shoes',
    'pose_change'
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

-- 4. Gallery view: every image type (not chat or photo read)
create or replace view public.ai_studio_images as
  select id, user_id, task_type, model, prompt, aspect_ratio, image_size,
         output_image_url, output_image_urls, face_match_score, batch_count, created_at
    from public.ai_studio_tasks
   where task_type not in ('chat', 'photo_read')
     and status = 'done'
     and output_image_url is not null;
