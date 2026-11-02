-- ============================================================
-- AI Studio: ONE table (ai_studio_tasks) for every task type, with its functions, views, workers and indexes.
-- Run this whole file in Supabase -> SQL Editor. Safe to run again.
-- Projects with the old gemini_* names: run ai_studio_migration.sql first.
-- ============================================================

-- ------------------------------------------------------------
-- 1. TASKS TABLE
-- ------------------------------------------------------------
-- Views are dropped and made again (their column lists change between versions; a view cannot drop columns)
drop view if exists public.ai_studio_worker_load, public.ai_studio_images, public.ai_studio_chat_messages, public.ai_studio_photo_reads cascade;

create table if not exists public.ai_studio_tasks (
  id               bigint generated always as identity primary key,

  -- Task type (decides which inputs are used and what comes back)
  --   chat                   : text only                         -> output_text
  --   image_to_image         : face ref + style ref              -> output_image_url
  --   image_prompt           : input image + prompt              -> output_image_url
  --   image_to_image_prompt  : face ref + style ref + prompt     -> output_image_url
  --   photo_read             : photo read                        -> output_text
  --   text_to_image          : prompt only                       -> output_image_url
  task_type        text not null
                   check (task_type in ('chat', 'image_to_image', 'image_prompt', 'image_to_image_prompt', 'photo_read', 'text_to_image')),

  model            text not null,                 -- e.g. gemini-3.1-flash-image-preview, gemini-3-flash-preview
  prompt           text,
  system_text      text,                          -- optional instruction (app has a default)
  aspect_ratio     text,                          -- image tasks only: 4:5, 9:16, 1:1 ...
  image_size       text,                          -- image tasks only: 1K / 2K / 4K (null if model has none)

  face_image_url   text,                          -- face reference (image_to_image, image_to_image_prompt)
  style_image_url  text,                          -- outfit / style / scene reference (same two types)
  input_image_url  text,                          -- single input photo (image_prompt, photo_read)
  extra_image_urls text[],                        -- more input photos (image_prompt, photo_read)

  conversation_id  text,                          -- chat history: same id = same conversation
  output_text      text,                          -- chat + photo_read result
  output_image_url  text,                         -- image result (first hosted URL)
  output_image_urls text[],                       -- all hosted URLs when batch_count > 1
  face_match_score numeric,                       -- 0-100, only when a face reference was used

  user_id          text not null default 'weargen_user_1',
  batch_count      int  not null default 1,

  status           text not null default 'pending'
                   check (status in ('pending', 'processing', 'done', 'failed')),
  error            text,
  worker_id        text,                          -- which worker owns the task (worker_1, worker_2 ...)
  locked_at        timestamptz,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

-- For databases that already had an older version of the table
alter table public.ai_studio_tasks add column if not exists extra_image_urls text[];
alter table public.ai_studio_tasks add column if not exists conversation_id text;
alter table public.ai_studio_tasks add column if not exists user_id text not null default 'weargen_user_1';
alter table public.ai_studio_tasks add column if not exists batch_count int not null default 1;
alter table public.ai_studio_tasks add column if not exists output_image_urls text[];
alter table public.ai_studio_tasks add column if not exists face_match_score numeric;
alter table public.ai_studio_tasks add column if not exists worker_id text;
alter table public.ai_studio_tasks add column if not exists locked_at timestamptz;

-- Security: RLS on, open policy for the app (dev only). Tighten before sharing.
alter table public.ai_studio_tasks enable row level security;
drop policy if exists "ai_studio_tasks open access" on public.ai_studio_tasks;
create policy "ai_studio_tasks open access"
  on public.ai_studio_tasks for all to anon, authenticated
  using (true) with check (true);

-- ------------------------------------------------------------
-- 2. INDEXES (only the ones the app and the functions use)
-- ------------------------------------------------------------
-- Worker: pending tasks in id order
create index if not exists ai_studio_tasks_pending_idx on public.ai_studio_tasks (id) where status = 'pending';
-- Worker: stuck 'processing' tasks
create index if not exists ai_studio_tasks_processing_idx on public.ai_studio_tasks (updated_at) where status = 'processing';
-- Fair share: how many tasks one worker holds
create index if not exists ai_studio_tasks_worker_idx on public.ai_studio_tasks (worker_id) where status = 'processing';
-- List: latest rows, all users
create index if not exists ai_studio_tasks_id_desc_idx on public.ai_studio_tasks (id desc);
-- List: latest rows for one user, and one user + status
create index if not exists ai_studio_tasks_user_id_desc_idx on public.ai_studio_tasks (user_id, id desc);
create index if not exists ai_studio_tasks_user_status_idx on public.ai_studio_tasks (user_id, status, id desc);
-- Chat: history and "wait for earlier messages"
create index if not exists ai_studio_tasks_conversation_idx on public.ai_studio_tasks (conversation_id, id);
create index if not exists ai_studio_tasks_conv_open_idx on public.ai_studio_tasks (conversation_id, id) where status in ('pending', 'processing');

-- ------------------------------------------------------------
-- 3. updated_at is set by the database on every change
-- ------------------------------------------------------------
create or replace function public.ai_studio_tasks_touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists ai_studio_tasks_touch on public.ai_studio_tasks;
create trigger ai_studio_tasks_touch
  before update on public.ai_studio_tasks
  for each row execute function public.ai_studio_tasks_touch_updated_at();

-- Old 2-argument claim (before workers existed). Removed so only the current one is left.
drop function if exists public.claim_ai_studio_task(bigint, timestamptz);

-- ------------------------------------------------------------
-- 4. WORKERS: each open tab is worker_1, worker_2 ... It is "alive" while it sends a heartbeat.
-- ------------------------------------------------------------
create table if not exists public.ai_studio_workers (
  worker_id  text primary key,
  last_seen  timestamptz not null default now(),
  started_at timestamptz not null default now(),
  paused     boolean not null default false
);
alter table public.ai_studio_workers add column if not exists paused boolean not null default false;

alter table public.ai_studio_workers enable row level security;
drop policy if exists "ai_studio_workers open access" on public.ai_studio_workers;
create policy "ai_studio_workers open access"
  on public.ai_studio_workers for all to anon, authenticated
  using (true) with check (true);

-- Register a worker: reuses p_wanted if it is free, otherwise the first free worker_N (1..50)
create or replace function public.register_ai_studio_worker(p_wanted text default null)
returns text
language plpgsql
as $$
declare
  v_id    text;
  i       int;
  v_stale timestamptz := now() - interval '30 seconds';
begin
  if p_wanted is not null then
    insert into public.ai_studio_workers (worker_id, last_seen) values (p_wanted, now())
      on conflict (worker_id) do update set last_seen = now()
        where public.ai_studio_workers.last_seen < v_stale;
    if found then return p_wanted; end if;
  end if;

  for i in 1..50 loop
    v_id := 'worker_' || i;
    insert into public.ai_studio_workers (worker_id, last_seen) values (v_id, now())
      on conflict (worker_id) do update set last_seen = now()
        where public.ai_studio_workers.last_seen < v_stale;
    if found then return v_id; end if;
  end loop;

  raise exception 'Sab worker slots bhare hain (worker_1 se worker_50)';
end;
$$;

-- ------------------------------------------------------------
-- 5. CLAIM: one task goes to exactly one worker. Paused workers get nothing.
--    Fair share: a worker may hold about (open tasks / live unpaused workers) tasks.
-- ------------------------------------------------------------
create or replace function public.claim_ai_studio_task(p_id bigint, p_worker_id text)
returns setof public.ai_studio_tasks
language plpgsql
as $$
declare
  v_live   int;
  v_open   int;
  v_mine   int;
  v_limit  int;
  v_paused boolean;
begin
  -- Serialize claims so two workers cannot both pass the limit check at the same time
  perform pg_advisory_xact_lock(hashtext('ai_studio_claim'));

  select paused into v_paused from public.ai_studio_workers where worker_id = p_worker_id;
  if v_paused is distinct from false then
    return;   -- paused (or unknown) worker takes nothing
  end if;

  select count(*) into v_live from public.ai_studio_workers
   where last_seen >= now() - interval '60 seconds' and not paused;
  v_live := greatest(v_live, 1);

  select count(*) into v_open from public.ai_studio_tasks where status in ('pending', 'processing');
  select count(*) into v_mine from public.ai_studio_tasks where status = 'processing' and worker_id = p_worker_id;

  v_limit := ceil(v_open::numeric / v_live);
  if v_mine >= v_limit then
    return;   -- this worker already has its share
  end if;

  return query
  update public.ai_studio_tasks t
     set status = 'processing', error = null, worker_id = p_worker_id, locked_at = now()
   where t.id = p_id
     and (
          t.status = 'pending'
       or (t.status = 'processing' and (
              t.updated_at < now() - interval '10 minutes'
           or t.worker_id is null
           or not exists (
                select 1 from public.ai_studio_workers w
                 where w.worker_id = t.worker_id and w.last_seen >= now() - interval '60 seconds')
          ))
     )
  returning t.*;
end;
$$;

-- ------------------------------------------------------------
-- 6. VALIDATION HELPERS + UPLOAD (rejects junk and duplicates)
-- ------------------------------------------------------------
create or replace function public.ai_studio_text_models() returns text[] language sql immutable as $$
  select array['gemini-3-flash-preview', 'gemini-2.5-flash'];
$$;

create or replace function public.ai_studio_image_models() returns text[] language sql immutable as $$
  select array['gemini-3.1-flash-image-preview', 'gemini-2.5-flash-image-preview'];
$$;

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
  v_is_image  boolean;
begin
  -- 1. Known task type
  if v_type not in ('chat', 'image_to_image', 'image_prompt', 'image_to_image_prompt', 'photo_read', 'text_to_image') then
    raise exception 'Task type galat hai: %', v_type;
  end if;
  v_is_image := v_type in ('image_to_image', 'image_prompt', 'image_to_image_prompt', 'text_to_image');

  -- 2. Model matches the task type
  if v_is_image and not (v_model = any (ai_studio_image_models())) then
    raise exception 'Image task ke liye image model chahiye: %', v_model;
  end if;
  if not v_is_image and not (v_model = any (ai_studio_text_models())) then
    raise exception 'Text task ke liye text model chahiye: %', v_model;
  end if;

  -- 3. Required prompt
  if v_type in ('chat', 'image_prompt', 'image_to_image_prompt', 'text_to_image') and v_prompt is null then
    raise exception 'Prompt khali nahi ho sakta (task: %)', v_type;
  end if;

  -- 4. Required inputs
  if v_type in ('image_to_image', 'image_to_image_prompt') and (v_face is null or v_style is null) then
    raise exception 'Face aur style dono reference chahiye (task: %)', v_type;
  end if;
  if v_type in ('image_prompt', 'photo_read') and v_input is null then
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

  -- 6. Batch count 1-4
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

-- ------------------------------------------------------------
-- 7. GET + PENDING functions (used by the app and the API)
-- ------------------------------------------------------------
-- GET ONE: a single task by id
create or replace function public.get_ai_studio_task(p_id bigint)
returns setof public.ai_studio_tasks
language sql stable
as $$
  select * from public.ai_studio_tasks where id = p_id;
$$;

-- GET LIST: latest tasks, optionally for one user and/or one status. Paged with limit + offset.
create or replace function public.get_ai_studio_tasks(
  p_user_id text default null,
  p_status  text default null,
  p_limit   int  default 100,
  p_offset  int  default 0
)
returns setof public.ai_studio_tasks
language sql stable
as $$
  select * from public.ai_studio_tasks
   where (p_user_id is null or user_id = p_user_id)
     and (p_status is null or status = p_status)
   order by id desc
   limit least(p_limit, 500) offset p_offset;
$$;

-- PENDING for the worker: pending tasks, plus tasks whose worker is gone or too old
create or replace function public.get_pending_ai_studio_tasks(p_stale_before timestamptz, p_limit int default 40)
returns setof public.ai_studio_tasks
language sql stable
as $$
  select t.* from public.ai_studio_tasks t
   where t.status = 'pending'
      or (t.status = 'processing' and (
             t.updated_at < p_stale_before
          or t.worker_id is null
          or not exists (
               select 1 from public.ai_studio_workers w
                where w.worker_id = t.worker_id and w.last_seen >= now() - interval '60 seconds')
         ))
   order by t.id asc
   limit least(p_limit, 200);
$$;

-- ------------------------------------------------------------
-- 8. VIEWS: one table, separate lists for each kind of result
-- ------------------------------------------------------------
-- Chat messages
create or replace view public.ai_studio_chat_messages as
  select id, user_id, conversation_id, prompt, output_text, status, error, created_at, updated_at
    from public.ai_studio_tasks
   where task_type = 'chat';

-- Photo read results
create or replace view public.ai_studio_photo_reads as
  select id, user_id, prompt, input_image_url, extra_image_urls, output_text, status, error, created_at, updated_at
    from public.ai_studio_tasks
   where task_type = 'photo_read';

-- Finished images, for the gallery
create or replace view public.ai_studio_images as
  select id, user_id, task_type, model, prompt, aspect_ratio, image_size,
         output_image_url, output_image_urls, face_match_score, batch_count, created_at
    from public.ai_studio_tasks
   where task_type in ('image_to_image', 'image_prompt', 'image_to_image_prompt', 'text_to_image')
     and status = 'done'
     and output_image_url is not null;

-- Admin: each worker with its current load, finished tasks and paused flag
create or replace view public.ai_studio_worker_load as
  select w.worker_id,
         w.last_seen,
         count(t.id) filter (where t.status = 'processing') as processing,
         count(t.id) filter (where t.status = 'done')       as done,
         w.paused
    from public.ai_studio_workers w
    left join public.ai_studio_tasks t on t.worker_id = w.worker_id
   group by w.worker_id, w.last_seen, w.paused;

-- ------------------------------------------------------------
-- 9. REALTIME: the app is told about task and worker changes
-- ------------------------------------------------------------
do $$ begin
  alter publication supabase_realtime add table public.ai_studio_tasks;
exception when duplicate_object then null;
end $$;
do $$ begin
  alter publication supabase_realtime add table public.ai_studio_workers;
exception when duplicate_object then null;
end $$;

-- ------------------------------------------------------------
-- 10. Refresh planner statistics once
-- ------------------------------------------------------------
analyze public.ai_studio_tasks;
analyze public.ai_studio_workers;

-- ============================================================
-- ADMIN ONLY: only a logged-in admin can change the paused flag of a worker.
-- Heartbeat (last_seen) and everything else stays open for the worker tabs.
-- How to make an admin: Supabase -> Authentication -> Users -> create the user, then run in SQL Editor:
--   update auth.users
--      set raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb) || '{"role": "admin"}'::jsonb
--    where email = 'admin@example.com';
-- (role is in app_metadata, so the user cannot change it from the app)
-- ============================================================
create or replace function public.ai_studio_guard_pause()
returns trigger
language plpgsql
as $$
begin
  if new.paused is distinct from old.paused then
    if coalesce(auth.jwt() -> 'app_metadata' ->> 'role', '') <> 'admin' then
      raise exception 'Sirf admin worker ko pause/resume kar sakta hai';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists ai_studio_workers_guard_pause on public.ai_studio_workers;
create trigger ai_studio_workers_guard_pause
  before update on public.ai_studio_workers
  for each row execute function public.ai_studio_guard_pause();
