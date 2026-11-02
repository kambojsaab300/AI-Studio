-- ============================================================
-- AI STUDIO: FULL DATABASE SETUP (one file)
-- Run this whole file once in Supabase SQL Editor, top to bottom.
-- It is the same as running these files in this order:
--   ai_studio_tasks, ai_studio_admin, ai_studio_settings, ai_studio_customer,
--   ai_studio_ops, ai_studio_alerts, ai_studio_task_types, ai_studio_prompts, ai_studio_tools,
--   ai_studio_catalog, ai_studio_family_roles, ai_studio_engine, ai_studio_v2
-- Later definitions replace earlier ones (create or replace), so the final version is what stays.
-- ============================================================

-- ################ FROM ai_studio_tasks.sql ################
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


-- ################ FROM ai_studio_admin.sql ################
-- ============================================================
-- AI Studio: ADMIN LOGIN + SECURITY. Run AFTER ai_studio_tasks.sql. Safe to run again.
--
-- Who can do what after this file:
--   Anyone with the anon key (worker app):  read tasks and workers; register, heartbeat, claim and
--                                           complete a task ONLY through the functions below.
--   Logged-in admin (admin app):             create / change / delete tasks; pause / resume workers.
--   Nobody else:                             direct writes to the tables are blocked.
-- ============================================================

-- ------------------------------------------------------------
-- 1. ADMIN LIST: a user is admin only if their auth id is in this table
-- ------------------------------------------------------------
-- Functions whose return type changed in a later version must be dropped first (Postgres cannot change a return type)
drop function if exists public.worker_heartbeat(text);

create table if not exists public.ai_studio_admins (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);
alter table public.ai_studio_admins enable row level security;
-- No policies on purpose: nobody reads or writes this table through the API.

create or replace function public.is_ai_studio_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.ai_studio_admins a where a.user_id = auth.uid());
$$;

-- ------------------------------------------------------------
-- 2. REPLACE THE OPEN POLICIES with role-based ones
-- ------------------------------------------------------------
drop policy if exists "ai_studio_tasks open access" on public.ai_studio_tasks;
drop policy if exists "ai_studio_workers open access" on public.ai_studio_workers;

drop policy if exists "ai_studio_tasks read" on public.ai_studio_tasks;
create policy "ai_studio_tasks read"
  on public.ai_studio_tasks for select to anon, authenticated
  using (true);

drop policy if exists "ai_studio_tasks admin write" on public.ai_studio_tasks;
create policy "ai_studio_tasks admin write"
  on public.ai_studio_tasks for all to authenticated
  using (public.is_ai_studio_admin())
  with check (public.is_ai_studio_admin());

drop policy if exists "ai_studio_workers read" on public.ai_studio_workers;
create policy "ai_studio_workers read"
  on public.ai_studio_workers for select to anon, authenticated
  using (true);

drop policy if exists "ai_studio_workers admin write" on public.ai_studio_workers;
create policy "ai_studio_workers admin write"
  on public.ai_studio_workers for all to authenticated
  using (public.is_ai_studio_admin())
  with check (public.is_ai_studio_admin());

-- ------------------------------------------------------------
-- 3. WORKER FUNCTIONS run with the owner's rights (security definer), so the worker app
--    (anon key) can do its job without any direct write permission on the tables.
-- ------------------------------------------------------------
alter function public.register_ai_studio_worker(text) security definer set search_path = public;
alter function public.claim_ai_studio_task(bigint, text) security definer set search_path = public;

-- Heartbeat: "I am alive". Returns the paused flag so the worker knows if the admin paused it.
create or replace function public.worker_heartbeat(p_worker_id text)
returns boolean
language sql
security definer
set search_path = public
as $$
  update public.ai_studio_workers
     set last_seen = now()
   where worker_id = p_worker_id
  returning paused;
$$;

-- Release: the tab is closing. Its tasks can go to other workers right away.
create or replace function public.worker_release(p_worker_id text)
returns void
language sql
security definer
set search_path = public
as $$
  update public.ai_studio_workers
     set last_seen = '1970-01-01T00:00:00Z'
   where worker_id = p_worker_id;
$$;

-- Complete / fail / release a task. Only the worker that owns the task (status = processing) can change it.
-- p_patch keys: status ('done' | 'failed' | 'pending'), output_text, output_image_url, output_image_urls (array),
--               face_match_score, error
create or replace function public.worker_complete_task(p_id bigint, p_worker_id text, p_patch jsonb)
returns setof public.ai_studio_tasks
language sql
security definer
set search_path = public
as $$
  update public.ai_studio_tasks t
     set status            = coalesce(p_patch->>'status', t.status),
         output_text       = coalesce(p_patch->>'output_text', t.output_text),
         output_image_url  = coalesce(p_patch->>'output_image_url', t.output_image_url),
         output_image_urls = case when jsonb_typeof(p_patch->'output_image_urls') = 'array'
                                  then array(select jsonb_array_elements_text(p_patch->'output_image_urls'))
                                  else t.output_image_urls end,
         face_match_score  = coalesce((p_patch->>'face_match_score')::numeric, t.face_match_score),
         error             = p_patch->>'error'
   where t.id = p_id
     and t.worker_id = p_worker_id
     and t.status = 'processing'
  returning t.*;
$$;

-- ------------------------------------------------------------
-- 4. HOW TO MAKE SOMEONE ADMIN (run once per admin, after creating the user in Supabase Auth):
--    insert into public.ai_studio_admins (user_id)
--    select id from auth.users where email = 'admin@example.com';
-- ------------------------------------------------------------

-- Default admin: the account mohit@gmail.com becomes admin when it exists (this does not create the account)
insert into public.ai_studio_admins (user_id)
select id from auth.users where email = 'mohit@gmail.com'
on conflict (user_id) do nothing;


-- ################ FROM ai_studio_settings.sql ################
-- ============================================================
-- AI Studio: WORKER SETTINGS + ImgBB column. Run AFTER ai_studio_tasks.sql, ai_studio_admin.sql. Safe to run again.
--
-- Settings are read by every worker while it runs, so you can change them without touching the code:
--   update public.ai_studio_settings set task_concurrency = 20 where id = 1;
-- ============================================================

-- 1. One row of settings
create table if not exists public.ai_studio_settings (
  id                   int primary key default 1 check (id = 1),
  task_concurrency     int not null default 20 check (task_concurrency between 1 and 50),   -- tasks one worker runs at once
  gemini_concurrency   int not null default 8  check (gemini_concurrency between 1 and 16), -- model calls one worker runs at once
  photos_per_task_max  int not null default 10 check (photos_per_task_max between 1 and 10),-- photos per task (upper limit)
  updated_at           timestamptz not null default now()
);
insert into public.ai_studio_settings (id) values (1) on conflict (id) do nothing;

alter table public.ai_studio_settings enable row level security;
drop policy if exists "ai_studio_settings read" on public.ai_studio_settings;
create policy "ai_studio_settings read"
  on public.ai_studio_settings for select to anon, authenticated
  using (true);
drop policy if exists "ai_studio_settings admin write" on public.ai_studio_settings;
create policy "ai_studio_settings admin write"
  on public.ai_studio_settings for all to authenticated
  using (public.is_ai_studio_admin())
  with check (public.is_ai_studio_admin());

-- Workers get live changes
do $$ begin
  alter publication supabase_realtime add table public.ai_studio_settings;
exception when duplicate_object then null;
end $$;

-- 2. ImgBB links next to the Cloudinary links
alter table public.ai_studio_tasks add column if not exists imgbb_image_urls text[];

-- 3. Result saving now also takes the ImgBB links (same security rule as before: only the owning worker)
create or replace function public.worker_complete_task(p_id bigint, p_worker_id text, p_patch jsonb)
returns setof public.ai_studio_tasks
language sql
security definer
set search_path = public
as $$
  update public.ai_studio_tasks t
     set status            = coalesce(p_patch->>'status', t.status),
         output_text       = coalesce(p_patch->>'output_text', t.output_text),
         output_image_url  = coalesce(p_patch->>'output_image_url', t.output_image_url),
         output_image_urls = case when jsonb_typeof(p_patch->'output_image_urls') = 'array'
                                  then array(select jsonb_array_elements_text(p_patch->'output_image_urls'))
                                  else t.output_image_urls end,
         imgbb_image_urls  = case when jsonb_typeof(p_patch->'imgbb_image_urls') = 'array'
                                  then array(select jsonb_array_elements_text(p_patch->'imgbb_image_urls'))
                                  else t.imgbb_image_urls end,
         face_match_score  = coalesce((p_patch->>'face_match_score')::numeric, t.face_match_score),
         error             = p_patch->>'error'
   where t.id = p_id
     and t.worker_id = p_worker_id
     and t.status = 'processing'
  returning t.*;
$$;

-- ============================================================
-- WORKER CONFIG: upload switches, Cloudinary settings and the ImgBB key. All set by the admin.
-- ============================================================
alter table public.ai_studio_settings add column if not exists cloudinary_enabled boolean not null default true;
alter table public.ai_studio_settings add column if not exists cloudinary_cloud_name text not null default 'draaqjcre';
alter table public.ai_studio_settings add column if not exists cloudinary_upload_preset text not null default 'ml_default';
alter table public.ai_studio_settings add column if not exists imgbb_enabled boolean not null default false;

-- Secrets: only the logged-in admin can read or write. Workers get the key through get_worker_config().
create table if not exists public.ai_studio_secrets (
  id            int primary key default 1 check (id = 1),
  imgbb_api_key text
);
insert into public.ai_studio_secrets (id) values (1) on conflict (id) do nothing;
alter table public.ai_studio_secrets enable row level security;
drop policy if exists "ai_studio_secrets admin only" on public.ai_studio_secrets;
create policy "ai_studio_secrets admin only"
  on public.ai_studio_secrets for all to authenticated
  using (public.is_ai_studio_admin())
  with check (public.is_ai_studio_admin());

-- One call for the worker: limits, upload settings and keys. Only a registered worker can call it.
create or replace function public.get_worker_config(p_worker_id text)
returns json
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_cfg record;
  v_key text;
begin
  if not exists (select 1 from public.ai_studio_workers where worker_id = p_worker_id) then
    raise exception 'Worker registered nahi hai';
  end if;
  select * into v_cfg from public.ai_studio_settings where id = 1;
  select imgbb_api_key into v_key from public.ai_studio_secrets where id = 1;
  return json_build_object(
    'task_concurrency', v_cfg.task_concurrency,
    'gemini_concurrency', v_cfg.gemini_concurrency,
    'photos_per_task_max', v_cfg.photos_per_task_max,
    'cloudinary_enabled', v_cfg.cloudinary_enabled,
    'cloudinary_cloud_name', v_cfg.cloudinary_cloud_name,
    'cloudinary_upload_preset', v_cfg.cloudinary_upload_preset,
    'imgbb_enabled', v_cfg.imgbb_enabled,
    'imgbb_api_key', v_key
  );
end;
$$;


-- ################ FROM ai_studio_customer.sql ################
-- ============================================================
-- AI Studio: CUSTOMER access. Run AFTER ai_studio_tasks.sql and ai_studio_admin.sql. Safe to run again.
--
-- After this file:
--   Customer (logged in):   creates tasks with customer_create_task(), sees ONLY their own tasks.
--   Admin (logged in):      everything, as before.
--   Worker (anon key):      still reads tasks (see the note at the end), writes only through worker functions.
-- ============================================================

-- 1. Customers see only their own rows (user_id = their login id). Admins keep full access through the admin policy.
drop policy if exists "ai_studio_tasks read" on public.ai_studio_tasks;
drop policy if exists "ai_studio_tasks read anon" on public.ai_studio_tasks;
create policy "ai_studio_tasks read anon"
  on public.ai_studio_tasks for select to anon
  using (true);

drop policy if exists "ai_studio_tasks read own" on public.ai_studio_tasks;
create policy "ai_studio_tasks read own"
  on public.ai_studio_tasks for select to authenticated
  using (user_id = auth.uid()::text);

-- 2. Views bypass row rules, so the anon key must not read them (the admin app uses worker_load only)
revoke select on public.ai_studio_chat_messages, public.ai_studio_photo_reads, public.ai_studio_images from anon;

-- 3. CUSTOMER CREATE: the customer's id is set by the server (never trusted from the app),
--    and only the task types customers may use are accepted.
create or replace function public.customer_create_task(p_payload jsonb)
returns setof public.ai_studio_tasks
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid text := auth.uid()::text;
begin
  if v_uid is null then
    raise exception 'Pehle login karo';
  end if;
  if p_payload->>'task_type' not in ('chat', 'text_to_image', 'image_to_image', 'image_prompt', 'image_to_image_prompt', 'photo_read') then
    raise exception 'Ye kaam is app se nahi banaya ja sakta';
  end if;
  return query
    select * from public.upload_ai_studio_task(jsonb_set(p_payload, '{user_id}', to_jsonb(v_uid)));
end;
$$;

-- ------------------------------------------------------------
-- NOTE (important before public launch):
-- The worker app still reads the tasks table with the anon key, and the anon key is inside every app.
-- Anyone who has that key can read all tasks. To close this, workers must log in (worker accounts)
-- or read through functions only. Until then, keep the app private.
-- ------------------------------------------------------------


-- ################ FROM ai_studio_ops.sql ################
-- ============================================================
-- AI Studio: OPERATIONS. Run LAST (after ai_studio_tasks, admin, settings, customer). Safe to run again.
-- Adds: per-worker limit, drain, auto-pause, model on/off, retries, timeout, Gemini budget,
--       per-user daily quota, priority, maintenance message, admin action log, alerts data.
-- ============================================================

-- 1. SETTINGS (one row)
alter table public.ai_studio_settings add column if not exists max_attempts int not null default 2 check (max_attempts between 1 and 5);
alter table public.ai_studio_settings add column if not exists retry_delay_sec int not null default 30 check (retry_delay_sec between 0 and 3600);
alter table public.ai_studio_settings add column if not exists task_timeout_sec int not null default 300 check (task_timeout_sec between 60 and 3600);
alter table public.ai_studio_settings add column if not exists alert_queue_size int not null default 50;
alter table public.ai_studio_settings add column if not exists user_daily_task_limit int not null default 0;   -- 0 = no limit
alter table public.ai_studio_settings add column if not exists daily_gemini_budget int not null default 0;     -- 0 = unlimited
alter table public.ai_studio_settings add column if not exists maintenance_on boolean not null default false;
alter table public.ai_studio_settings add column if not exists maintenance_message text not null default 'System abhi maintenance mein hai. Thodi der baad try karo.';

-- 2. TASKS
alter table public.ai_studio_tasks add column if not exists attempts int not null default 0;
alter table public.ai_studio_tasks add column if not exists next_run_at timestamptz;
alter table public.ai_studio_tasks add column if not exists priority int not null default 0;
create index if not exists ai_studio_tasks_queue_idx on public.ai_studio_tasks (priority desc, id) where status = 'pending';

-- 3. WORKERS
alter table public.ai_studio_workers add column if not exists drain boolean not null default false;
alter table public.ai_studio_workers add column if not exists pause_reason text;
alter table public.ai_studio_workers add column if not exists task_limit int;   -- per-worker override (null = global)

-- 4. MODEL ON / OFF
create table if not exists public.ai_studio_models (
  model_id text primary key,
  enabled  boolean not null default true
);
insert into public.ai_studio_models (model_id) values
  ('gemini-3.1-flash-image-preview'), ('gemini-2.5-flash-image-preview'),
  ('gemini-3-flash-preview'), ('gemini-2.5-flash')
on conflict (model_id) do nothing;
alter table public.ai_studio_models enable row level security;
drop policy if exists "ai_studio_models read" on public.ai_studio_models;
create policy "ai_studio_models read" on public.ai_studio_models for select to anon, authenticated using (true);
drop policy if exists "ai_studio_models admin write" on public.ai_studio_models;
create policy "ai_studio_models admin write" on public.ai_studio_models for all to authenticated
  using (public.is_ai_studio_admin()) with check (public.is_ai_studio_admin());

-- 5. GEMINI USAGE PER DAY (only through functions)
create table if not exists public.ai_studio_usage (
  day       date not null,
  worker_id text not null,
  calls     int  not null default 0,
  primary key (day, worker_id)
);
alter table public.ai_studio_usage enable row level security;

-- 6. ADMIN ACTION LOG
create table if not exists public.ai_studio_admin_log (
  id       bigint generated always as identity primary key,
  at       timestamptz not null default now(),
  admin_id uuid default auth.uid(),
  action   text not null,
  target   text,
  details  jsonb
);
alter table public.ai_studio_admin_log enable row level security;
drop policy if exists "ai_studio_admin_log admin only" on public.ai_studio_admin_log;
create policy "ai_studio_admin_log admin only" on public.ai_studio_admin_log for all to authenticated
  using (public.is_ai_studio_admin()) with check (public.is_ai_studio_admin());

-- 7. WORKER LOAD VIEW: adds drain, pause reason and override (appended at the end)
create or replace view public.ai_studio_worker_load as
  select w.worker_id,
         w.last_seen,
         count(t.id) filter (where t.status = 'processing') as processing,
         count(t.id) filter (where t.status = 'done')       as done,
         w.paused,
         w.drain,
         w.pause_reason,
         w.task_limit
    from public.ai_studio_workers w
    left join public.ai_studio_tasks t on t.worker_id = w.worker_id
   group by w.worker_id, w.last_seen, w.paused, w.drain, w.pause_reason, w.task_limit;

-- 8. HEARTBEAT: returns paused and drain (new return type, so drop first)
drop function if exists public.worker_heartbeat(text);
create function public.worker_heartbeat(p_worker_id text)
returns json
language sql
security definer
set search_path = public
as $$
  update public.ai_studio_workers
     set last_seen = now()
   where worker_id = p_worker_id
  returning json_build_object('paused', paused, 'drain', drain);
$$;

-- 9. AUTO-PAUSE: the worker pauses itself (5 failures in a row, or a bad key). Admin resumes it.
create or replace function public.worker_auto_pause(p_worker_id text, p_reason text)
returns void
language sql
security definer
set search_path = public
as $$
  update public.ai_studio_workers
     set paused = true, pause_reason = p_reason
   where worker_id = p_worker_id;
$$;

-- 10. GEMINI BUDGET: takes calls from today's budget. Returns false when the budget is used up.
create or replace function public.worker_budget_take(p_worker_id text, p_calls int default 1)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_budget int;
  v_used   int;
begin
  perform pg_advisory_xact_lock(hashtext('ai_studio_budget'));
  select daily_gemini_budget into v_budget from public.ai_studio_settings where id = 1;
  select coalesce(sum(calls), 0) into v_used from public.ai_studio_usage where day = current_date;
  if v_budget > 0 and v_used + p_calls > v_budget then
    return false;
  end if;
  insert into public.ai_studio_usage (day, worker_id, calls) values (current_date, p_worker_id, p_calls)
    on conflict (day, worker_id) do update set calls = public.ai_studio_usage.calls + excluded.calls;
  return true;
end;
$$;

-- 11. WORKER CONFIG: everything a worker needs in one call
create or replace function public.get_worker_config(p_worker_id text)
returns json
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_cfg      record;
  v_w        record;
  v_key      text;
  v_used     int;
  v_disabled text[];
begin
  select * into v_w from public.ai_studio_workers where worker_id = p_worker_id;
  if not found then
    raise exception 'Worker registered nahi hai';
  end if;
  select * into v_cfg from public.ai_studio_settings where id = 1;
  select imgbb_api_key into v_key from public.ai_studio_secrets where id = 1;
  select coalesce(sum(calls), 0) into v_used from public.ai_studio_usage where day = current_date;
  select coalesce(array_agg(model_id), '{}') into v_disabled from public.ai_studio_models where not enabled;
  return json_build_object(
    'task_concurrency', coalesce(v_w.task_limit, v_cfg.task_concurrency),
    'gemini_concurrency', v_cfg.gemini_concurrency,
    'photos_per_task_max', v_cfg.photos_per_task_max,
    'max_attempts', v_cfg.max_attempts,
    'retry_delay_sec', v_cfg.retry_delay_sec,
    'task_timeout_sec', v_cfg.task_timeout_sec,
    'budget_left', case when v_cfg.daily_gemini_budget = 0 then null else greatest(v_cfg.daily_gemini_budget - v_used, 0) end,
    'disabled_models', v_disabled,
    'cloudinary_enabled', v_cfg.cloudinary_enabled,
    'cloudinary_cloud_name', v_cfg.cloudinary_cloud_name,
    'cloudinary_upload_preset', v_cfg.cloudinary_upload_preset,
    'imgbb_enabled', v_cfg.imgbb_enabled,
    'imgbb_api_key', v_key
  );
end;
$$;

-- 12. RESULT SAVE: also sets attempts and next_run_at (for retries)
create or replace function public.worker_complete_task(p_id bigint, p_worker_id text, p_patch jsonb)
returns setof public.ai_studio_tasks
language sql
security definer
set search_path = public
as $$
  update public.ai_studio_tasks t
     set status            = coalesce(p_patch->>'status', t.status),
         output_text       = coalesce(p_patch->>'output_text', t.output_text),
         output_image_url  = coalesce(p_patch->>'output_image_url', t.output_image_url),
         output_image_urls = case when jsonb_typeof(p_patch->'output_image_urls') = 'array'
                                  then array(select jsonb_array_elements_text(p_patch->'output_image_urls'))
                                  else t.output_image_urls end,
         imgbb_image_urls  = case when jsonb_typeof(p_patch->'imgbb_image_urls') = 'array'
                                  then array(select jsonb_array_elements_text(p_patch->'imgbb_image_urls'))
                                  else t.imgbb_image_urls end,
         face_match_score  = coalesce((p_patch->>'face_match_score')::numeric, t.face_match_score),
         error             = p_patch->>'error',
         attempts          = coalesce((p_patch->>'attempts')::int, t.attempts),
         next_run_at       = case when p_patch ? 'next_run_at' then (p_patch->>'next_run_at')::timestamptz else t.next_run_at end
   where t.id = p_id
     and t.worker_id = p_worker_id
     and t.status = 'processing'
  returning t.*;
$$;

-- 13. PENDING LIST: higher priority first, and a retry waits until its next_run_at
create or replace function public.get_pending_ai_studio_tasks(p_stale_before timestamptz, p_limit int default 40)
returns setof public.ai_studio_tasks
language sql
stable
as $$
  select t.* from public.ai_studio_tasks t
   where (t.status = 'pending' and (t.next_run_at is null or t.next_run_at <= now()))
      or (t.status = 'processing' and (
             t.updated_at < p_stale_before
          or t.worker_id is null
          or not exists (
               select 1 from public.ai_studio_workers w
                where w.worker_id = t.worker_id and w.last_seen >= now() - interval '60 seconds')
         ))
   order by t.priority desc, t.id asc
   limit least(p_limit, 200);
$$;

-- 14. CLAIM: paused or draining workers get nothing; per-worker override; retries wait their time
create or replace function public.claim_ai_studio_task(p_id bigint, p_worker_id text)
returns setof public.ai_studio_tasks
language plpgsql
security definer
set search_path = public
as $$
declare
  v_w     record;
  v_live  int;
  v_open  int;
  v_mine  int;
  v_limit numeric;
begin
  perform pg_advisory_xact_lock(hashtext('ai_studio_claim'));

  select * into v_w from public.ai_studio_workers where worker_id = p_worker_id;
  if not found or v_w.paused or v_w.drain then
    return;
  end if;

  select count(*) into v_live from public.ai_studio_workers
   where last_seen >= now() - interval '60 seconds' and not paused and not drain;
  v_live := greatest(v_live, 1);

  select count(*) into v_open from public.ai_studio_tasks where status in ('pending', 'processing');
  select count(*) into v_mine from public.ai_studio_tasks where status = 'processing' and worker_id = p_worker_id;

  v_limit := coalesce(v_w.task_limit, ceil(v_open::numeric / v_live));
  if v_mine >= v_limit then
    return;
  end if;

  return query
  update public.ai_studio_tasks t
     set status = 'processing', error = null, worker_id = p_worker_id, locked_at = now()
   where t.id = p_id
     and (
          (t.status = 'pending' and (t.next_run_at is null or t.next_run_at <= now()))
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

-- 15. CUSTOMER CREATE: maintenance, model on/off and daily quota are checked here
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

  if p_payload->>'task_type' not in ('chat', 'text_to_image', 'image_to_image', 'image_prompt', 'image_to_image_prompt', 'photo_read') then
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


-- ################ FROM ai_studio_alerts.sql ################
-- ============================================================
-- AI Studio: EMAIL ALERTS through Brevo. Run LAST (after ai_studio_ops.sql). Safe to run again.
--
-- The database checks every minute (pg_cron) and sends the mail (pg_net -> Brevo HTTP API).
-- So alerts still go out when no admin screen is open and every worker is down.
-- Brevo: create an API key (v3) and verify the sender email in Brevo first.
-- ============================================================

-- 1. Extensions (Supabase: pg_net for HTTP, pg_cron for the every-minute check)
create extension if not exists pg_net;
create extension if not exists pg_cron;

-- 2. Settings: which mail to send and where. The Brevo key goes to the secrets table.
alter table public.ai_studio_settings add column if not exists alert_email_enabled boolean not null default false;
alter table public.ai_studio_settings add column if not exists alert_admin_email text not null default '';
alter table public.ai_studio_settings add column if not exists alert_sender_email text not null default '';
alter table public.ai_studio_settings add column if not exists alert_sender_name text not null default 'AI Studio';
alter table public.ai_studio_settings add column if not exists alert_cooldown_min int not null default 15 check (alert_cooldown_min between 1 and 1440);
alter table public.ai_studio_secrets add column if not exists brevo_api_key text;

-- 3. Alert history (also used for the cooldown, so the same alert is not sent again and again)
create table if not exists public.ai_studio_alert_log (
  id         bigint generated always as identity primary key,
  kind       text not null,
  message    text not null,
  created_at timestamptz not null default now()
);
alter table public.ai_studio_alert_log enable row level security;
drop policy if exists "ai_studio_alert_log admin only" on public.ai_studio_alert_log;
create policy "ai_studio_alert_log admin only" on public.ai_studio_alert_log for all to authenticated
  using (public.is_ai_studio_admin()) with check (public.is_ai_studio_admin());

-- 4. Send one mail through Brevo
create or replace function public.ai_studio_send_mail(p_subject text, p_text text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_cfg record;
  v_key text;
begin
  select * into v_cfg from public.ai_studio_settings where id = 1;
  select brevo_api_key into v_key from public.ai_studio_secrets where id = 1;
  if coalesce(v_key, '') = '' or v_cfg.alert_admin_email = '' or v_cfg.alert_sender_email = '' then
    raise exception 'Mail settings adhoore hain (Brevo key, admin email, sender email)';
  end if;

  perform net.http_post(
    url     := 'https://api.brevo.com/v3/smtp/email',
    headers := jsonb_build_object('api-key', v_key, 'content-type', 'application/json', 'accept', 'application/json'),
    body    := jsonb_build_object(
      'sender',      jsonb_build_object('email', v_cfg.alert_sender_email, 'name', v_cfg.alert_sender_name),
      'to',          jsonb_build_array(jsonb_build_object('email', v_cfg.alert_admin_email)),
      'subject',     p_subject,
      'textContent', p_text
    )
  );
end;
$$;

-- 5. The check: runs every minute. Each alert is sent once per cooldown period.
create or replace function public.ai_studio_check_alerts()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_cfg     record;
  v_pending int;
  v_live    int;
  r         record;
  v_recent  boolean;
begin
  select * into v_cfg from public.ai_studio_settings where id = 1;
  if not v_cfg.alert_email_enabled then
    return;
  end if;

  select count(*) into v_pending from public.ai_studio_tasks where status = 'pending';
  select count(*) into v_live from public.ai_studio_workers
   where last_seen >= now() - interval '60 seconds' and not paused and not drain;

  for r in
    select 'no_workers'::text as kind,
           'Sab workers offline hain, ' || v_pending || ' task pending hain' as msg
     where v_pending > 0 and v_live = 0
    union all
    select 'queue_high',
           'Queue bhari: ' || v_pending || ' task pending (limit ' || v_cfg.alert_queue_size || ')'
     where v_pending >= v_cfg.alert_queue_size
    union all
    select 'auto_pause:' || worker_id,
           worker_id || ' khud pause hua: ' || pause_reason
      from public.ai_studio_workers
     where pause_reason is not null
  loop
    select exists (
      select 1 from public.ai_studio_alert_log
       where kind = r.kind
         and created_at > now() - make_interval(mins => v_cfg.alert_cooldown_min)
    ) into v_recent;

    if not v_recent then
      insert into public.ai_studio_alert_log (kind, message) values (r.kind, r.msg);
      begin
        perform public.ai_studio_send_mail('[AI Studio] ' || r.msg, r.msg || ' (' || now() || ')');
      exception when others then
        -- settings incomplete or Brevo unreachable: the alert is still in the log
        raise notice 'mail nahi gaya: %', sqlerrm;
      end;
    end if;
  end loop;
end;
$$;

-- 6. Test mail from the admin screen
create or replace function public.ai_studio_send_test_mail()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_ai_studio_admin() then
    raise exception 'Sirf admin test mail bhej sakta hai';
  end if;
  perform public.ai_studio_send_mail('[AI Studio] Test mail', 'Ye test mail hai. Email alert settings sahi hain.');
end;
$$;

-- 7. Schedule the check every minute (only if pg_cron is available)
do $$
begin
  perform cron.schedule('ai-studio-alerts', '* * * * *', 'select public.ai_studio_check_alerts()');
exception when others then
  raise notice 'pg_cron nahi chal raha: %. Supabase dashboard mein Database > Extensions se pg_cron on karo.', sqlerrm;
end;
$$;


-- ################ FROM ai_studio_task_types.sql ################
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


-- ################ FROM ai_studio_prompts.sql ################
-- ============================================================
-- AI Studio: TASK PROMPTS in the database. Run LAST (after ai_studio_task_types.sql).
-- Safe to run again.
--
-- Every image task type has one row here. The final text sent to Gemini is:
--   [system_text]                      what to create, what must stay the same
--   [role_text]                        IMAGE 1 / IMAGE 2 rules
--   Prompt: "..."                      the customer's / admin's own words
--   [NEGATIVE CONSTRAINTS]: negative_text
--   enabled                            off = the worker refuses these tasks and the database refuses new ones
--
-- prompt_version: when this file raises the number below, the seed rewrites the row.
-- Admin edits stay until the next version bump (then the seed text wins again).
-- ============================================================

-- 1. Table
create table if not exists public.ai_studio_prompts (
  task_type     text primary key
                check (task_type in (
                  'text_to_image', 'image_prompt', 'image_to_image', 'image_to_image_prompt',
                  'outfit_change', 'background_change', 'virtual_tryon', 'product_scene', 'product_catalog', 'project_image',
                  'image_edit', 'hair_change', 'shirt_change', 'suit_change', 'bg_change', 'face_swap', 'couple_photo', 'family_photo', 'outfit_change_ref',
                  'ocr_text', 'product_tag', 'moderation_check',
                  'poster_text', 'sticker_logo', 'remove_bg', 'restore_photo', 'outpaint', 'style_transfer', 'mockup', 'product_angles',
                  'woman_earrings', 'woman_nose_pin', 'woman_shoes', 'woman_glasses',
                  'man_glasses', 'man_suit', 'man_shirt', 'man_jeans', 'man_shorts', 'man_shoes',
                  'pose_change'
                )),
  system_text   text not null check (btrim(system_text) <> ''),
  role_text     text not null default '',
  negative_text text not null default '',
  enabled       boolean not null default true,
  prompt_version int not null default 1,
  updated_at    timestamptz not null default now()
);

-- Existing databases: add the new columns if the table was made before
alter table public.ai_studio_prompts add column if not exists negative_text text not null default '';
alter table public.ai_studio_prompts add column if not exists prompt_version int not null default 1;

alter table public.ai_studio_prompts enable row level security;
drop policy if exists "ai_studio_prompts admin" on public.ai_studio_prompts;
create policy "ai_studio_prompts admin" on public.ai_studio_prompts for all to authenticated
  using (public.is_ai_studio_admin()) with check (public.is_ai_studio_admin());

-- 2. Seed. Version 2 = this set. A row is rewritten only when its stored version is lower.
insert into public.ai_studio_prompts (task_type, system_text, role_text, negative_text, prompt_version) values

  ('text_to_image',
   $s$Create one photorealistic image that matches the user's prompt exactly. Natural lighting, real textures, realistic proportions.$s$,
   '',
   $n$CGI, 3D render, cartoon, anime, painting, illustration, deformed anatomy, extra limbs, distorted hands, text, watermark, signature:1.5$n$, 2),

  ('image_prompt',
   $s$Create a new photo based on IMAGE 1 and the user's prompt. Keep the main subject of IMAGE 1 recognisable and realistic.$s$,
   $r$IMAGE 1 = the input photo. Use its subject, composition and colours as the base of the new photo.$r$,
   $n$CGI, 3D render, cartoon, painting, deformed anatomy, extra limbs, distorted hands, text, watermark, signature:1.5$n$, 2),

  ('image_to_image',
   $s$Keep 100% facial identity from the reference face. Output one realistic photo.$s$,
   $r$IMAGE 1 = face identity to keep exactly. IMAGE 2 = outfit, style and scene to copy.$r$,
   $n$changed face:3.0, altered face:3.0, different face:3.0, face swap:3.0, modified facial features:3.0, new identity:3.0, smooth skin filter:2.0, plastic skin:2.0, beauty filter:2.0, wearing clothes from face reference:2.0, CGI, 3D render, cartoon, anime, deformed face, bad anatomy, extra limbs, missing fingers, mutated hands, text, watermark, signature:1.5$n$, 2),

  ('image_to_image_prompt',
   $s$Keep 100% facial identity from the reference face. Output one realistic photo that follows the user's prompt.$s$,
   $r$IMAGE 1 = face identity to keep exactly. IMAGE 2 = outfit, style and scene to copy.$r$,
   $n$changed face:3.0, altered face:3.0, different face:3.0, face swap:3.0, modified facial features:3.0, new identity:3.0, smooth skin filter:2.0, plastic skin:2.0, beauty filter:2.0, wearing clothes from face reference:2.0, CGI, 3D render, cartoon, anime, deformed face, bad anatomy, extra limbs, missing fingers, mutated hands, text, watermark, signature:1.5$n$, 2),

  ('outfit_change',
   $s$Dress the person from IMAGE 1 in the outfit from IMAGE 2. The person must stay exactly the same. Output one realistic photo.$s$,
   $r$IMAGE 1 = the person. Keep this exact person unchanged: same face, skin, hair, body, pose, expression and background. IMAGE 2 = the outfit. Copy its colours, fabric, pattern and cut exactly. Change nothing else.$r$,
   $n$changed face:3.0, altered face:3.0, different face:3.0, face swap:3.0, new identity:3.0, original outfit kept:2.5, outfit from wrong reference:2.0, changed pose:2.0, changed background:1.5, smooth skin filter:2.0, plastic skin:2.0, CGI, 3D render, cartoon, deformed body, bad anatomy, extra limbs, missing fingers, mutated hands, text, watermark, signature:1.5$n$, 2),

  ('background_change',
   $s$Place the person from IMAGE 1 into the background from IMAGE 2. The person stays exactly the same; only the background changes. Output one realistic photo.$s$,
   $r$IMAGE 1 = the person. Keep this exact person unchanged: same face, skin, hair, body, pose and clothes. IMAGE 2 = the new background. Use its environment, perspective and light, and match the person's light and shadows to it.$r$,
   $n$changed face:3.0, altered face:3.0, different face:3.0, new identity:3.0, original background kept:2.5, changed outfit:2.5, changed pose:2.0, floating subject:2.0, mismatched lighting:1.8, cut-out edges:2.0, halo around subject:2.0, smooth skin filter:2.0, CGI, 3D render, cartoon, deformed body, bad anatomy, extra limbs, text, watermark, signature:1.5$n$, 2),

  ('virtual_tryon',
   $s$Show the customer from IMAGE 1 wearing or using the product from IMAGE 2. The customer stays exactly the same. Output one realistic photo.$s$,
   $r$IMAGE 1 = the customer. Keep this exact face, body, hair, pose and background. IMAGE 2 = the product (clothing, jewellery or bag). Copy its exact design, colours and shape, and fit it naturally on the customer.$r$,
   $n$changed face:3.0, altered face:3.0, different face:3.0, new identity:3.0, wrong product design:2.5, altered product colour:2.5, product missing:2.0, unnatural product fit:2.0, product floating off the body:2.0, smooth skin filter:2.0, CGI, 3D render, cartoon, deformed body, bad anatomy, extra limbs, missing fingers, mutated hands, text, watermark, signature:1.5$n$, 2),

  ('product_scene',
   $s$Place the EXACT product from IMAGE 1 into a realistic scene described by the user's prompt. The product must look identical to the reference. Match the scene's light to the product. Output one realistic photo.$s$,
   $r$IMAGE 1 = the product. Keep its shape, proportions, colours, material, logo, printed text and labels identical. Do not add, remove or redesign any part. If IMAGE 2 is given, use it as the scene reference only.$r$,
   $n$changed logo:3.0, altered text:3.0, wrong colour:2.5, reshaped product:3.0, extra product parts:2.5, cropped product:2.0, product floating unnaturally:2.0, mismatched lighting:1.8, product too small to read:1.5, watermark, text overlay, CGI, 3D render, cartoon, deformed$n$, 2),

  ('product_catalog',
   $s$Clean commercial catalog photograph of the EXACT product from IMAGE 1. The product is the hero. Plain seamless studio background, soft even light, full product visible, sharp focus, true colour. Output one realistic photo.$s$,
   $r$IMAGE 1 = the product. Keep its shape, proportions, colours, material, logo, printed text and labels identical. Do not add, remove or redesign any part.$r$,
   $n$changed logo:3.0, altered text:3.0, wrong colour:2.5, reshaped product:3.0, extra parts:2.5, cropped product:2.0, product partly hidden:2.0, shadows covering product:1.5, background clutter:2.0, props in frame:1.5, watermark, text overlay, CGI, 3D render, deformed$n$, 2),

  ('project_image',
   $s$Create a new visual that follows the design in IMAGE 1 closely, keeping its layout, colours and key elements. Output one realistic, high-quality image that follows the user's prompt.$s$,
   $r$IMAGE 1 = the design or project photo. Keep its layout and key elements. If IMAGE 2 is given, use it as the style reference only (colours, mood, texture); do not copy its objects.$r$,
   $n$changed layout:2.5, missing key elements:2.5, added unrelated objects:2.0, altered colours from design:2.0, distorted geometry:2.5, text, watermark, signature:1.5, CGI, 3D render, deformed$n$, 2),

  ('image_edit',
   $s$Edit the photo from IMAGE 1 only inside the area marked red in IMAGE 2. Apply the user's instruction (change colour, add text, remove text) only to that area, so it blends naturally with the rest of the photo. Output one realistic photo.$s$,
   $r$IMAGE 1 = the photo to edit. IMAGE 2 = mask: the red area is the only area you may change. Everything outside the red area must stay exactly the same.$r$,
   $n$changes outside the marked area:3.0, altered face:3.0, changed background:2.5, different lighting outside mask:2.0, visible seam:2.0, blurry edit:2.0, mismatched colours:1.8, extra objects:1.5, CGI, cartoon, watermark, signature:1.5$n$, 2),

  ('hair_change',
   $s$Change ONLY the hair of the person in IMAGE 1, inside the area marked red in IMAGE 2. Apply the hairstyle, colour or length the user describes. Keep the face, skin, expression, body, clothes and background exactly the same. Make the hair look natural, with real strands and correct light.$s$,
   $r$IMAGE 1 = the photo. IMAGE 2 = mask: the red area is the only area you may change. Everything outside the red area must stay exactly the same.$r$,
   $n$changed face:3.0, altered facial features:3.0, changed skin tone:2.5, changed clothes:2.5, changed background:2.5, changes outside the red area:3.0, unnatural hair edges:2.0, wig look:1.8, visible seam:2.0, CGI, cartoon, watermark, signature:1.5$n$, 2),

  ('shirt_change',
   $s$Change ONLY the top / shirt of the person in IMAGE 1, inside the area marked red in IMAGE 2, to the colour, fabric and design the user describes. Keep the face, hair, body, pose, trousers and background exactly the same. Keep folds and lighting realistic.$s$,
   $r$IMAGE 1 = the photo. IMAGE 2 = mask: the red area is the only area you may change. Everything outside the red area must stay exactly the same.$r$,
   $n$changed face:3.0, altered facial features:3.0, changed hair:2.5, changed pose:2.5, changed background:2.5, changed trousers:2.0, changes outside the red area:3.0, flat unrealistic fabric:2.0, wrong fit:1.8, visible seam:2.0, CGI, cartoon, watermark, signature:1.5$n$, 2),

  ('suit_change',
   $s$Change ONLY the outfit of the person in IMAGE 1, inside the area marked red in IMAGE 2, into the suit (jacket and shirt) the user describes. Keep the face, hair, body, pose and background exactly the same. The suit must fit the body and follow the pose, with realistic folds and lighting.$s$,
   $r$IMAGE 1 = the photo. IMAGE 2 = mask: the red area is the only area you may change. Everything outside the red area must stay exactly the same.$r$,
   $n$changed face:3.0, altered facial features:3.0, changed hair:2.5, changed pose:2.5, changed background:2.5, original casual clothes kept:2.5, changes outside the red area:3.0, wrong fit:2.0, flat unrealistic fabric:2.0, visible seam:2.0, CGI, cartoon, watermark, signature:1.5$n$, 2),

  ('bg_change',
   $s$Replace ONLY the background inside the area marked red in IMAGE 2 with the background the user describes. The person in IMAGE 1 (face, hair, body, pose, clothes) must stay exactly the same. Match the light, perspective and shadows of the person to the new background, and keep the edges around the person clean.$s$,
   $r$IMAGE 1 = the photo. IMAGE 2 = mask: the red area is the background only. Do not change any pixel of the person.$r$,
   $n$changed face:3.0, altered person:3.0, changed clothes:2.5, changed pose:2.5, cut-out edges:2.0, halo around subject:2.0, mismatched lighting:1.8, visible seam:2.0, changes outside the red area:3.0, CGI, cartoon, watermark, signature:1.5$n$, 2),

  ('face_swap',
   $s$Swap the face: put the face of the person in IMAGE 1 onto the person in IMAGE 2. The result must show the same identity as IMAGE 1: same facial features, skin tone and eyes. Keep everything else from IMAGE 2 exactly the same: pose, head angle, body, outfit, hair style, background, lighting and camera. Output one realistic photo.$s$,
   $r$IMAGE 1 = the face to use (identity source). IMAGE 2 = the reference photo: its scene, pose, outfit and background stay exactly the same. Only the face of the person in IMAGE 2 is replaced by the face of IMAGE 1.$r$,
   $n$different person:3.0, identity not matching IMAGE 1:3.0, changed pose:2.5, changed outfit:2.5, changed background:2.5, changed lighting:2.0, two faces:2.0, skin tone mismatch:2.0, smooth skin filter:2.0, plastic skin:2.0, CGI, 3D render, cartoon, deformed face, bad anatomy, text, watermark, signature:1.5$n$, 2),

  ('couple_photo',
   $s$Create one realistic photo of a couple: the girl from IMAGE 1 and the boy from IMAGE 2, together in the same frame, standing or sitting naturally close to each other. Both keep their exact own identity (face, skin tone, hair, body). Use a relaxed, natural couple pose with correct body proportions, and the same lighting, scale and perspective for both. Output one realistic photo.$s$,
   $r$IMAGE 1 = the girl. Keep her exact face, skin tone, hair and body identical to the photo. IMAGE 2 = the boy. Keep his exact face, skin tone, hair and body identical to the photo. Each person keeps their own outfit from their photo unless the user asks for a change. Never blend or merge the two faces.$r$,
   $n$merged faces:3.0, face swap between the two:3.0, changed face of the girl:3.0, changed face of the boy:3.0, different identity:3.0, extra person:2.5, missing person:2.5, unnatural body contact:2.5, extra limbs:2.5, missing fingers:2.0, mismatched scale:2.0, mismatched lighting:1.8, smooth skin filter:2.0, plastic skin:2.0, CGI, 3D render, cartoon, deformed face, bad anatomy, text, watermark, signature:1.5$n$, 2),

  ('family_photo',
   $s$Create one realistic family photo with every family member from the reference photos in the same frame, standing or sitting together naturally. Each member keeps their exact own identity (face, skin tone, hair, body and apparent age). Natural family pose with correct body proportions, and the same lighting, scale and perspective for everyone. Output one realistic photo.$s$,
   $r$Each IMAGE is one family member. The order of the members is given at the end of the instruction. Keep each person's face identical to their own photo; never merge or swap faces. Each person keeps their own outfit from their photo unless the user asks for a change. Children stay children, and grandparents stay at their own age.$r$,
   $n$merged faces:3.0, swapped faces:3.0, changed identity:3.0, missing family member:2.5, extra person:2.5, wrong age of a person:2.5, unnatural body contact:2.5, extra limbs:2.5, missing fingers:2.0, mismatched scale:2.0, mismatched lighting:1.8, smooth skin filter:2.0, plastic skin:2.0, CGI, 3D render, cartoon, deformed face, bad anatomy, text, watermark, signature:1.5$n$, 2),

  ('outfit_change_ref',
   $s$Dress the person from IMAGE 3 (the photo reference) in the outfit from IMAGE 2. The person must look exactly like the person in IMAGE 1 (the face reference): same face, skin tone, hair and body identity. Keep the pose, background, camera and lighting of IMAGE 3 exactly the same. Output one realistic photo.$s$,
   $r$IMAGE 1 = face reference: the identity to keep exactly. IMAGE 2 = outfit: copy its exact colours, fabric, pattern and cut onto the person. IMAGE 3 = photo reference: the base photo. Keep everything in it except the outfit.$r$,
   $n$changed face:3.0, face not matching IMAGE 1:3.0, different identity:3.0, changed pose:2.5, changed background:2.5, changed camera or lighting:2.0, original outfit kept:2.5, outfit from wrong reference:2.0, wrong outfit colours:2.0, smooth skin filter:2.0, plastic skin:2.0, CGI, 3D render, cartoon, deformed body, bad anatomy, extra limbs, missing fingers, mutated hands, text, watermark, signature:1.5$n$, 2),

  ('ocr_text',
   $s$Read all visible text in IMAGE 1 exactly as it is written, line by line, in the original language and spelling. Keep numbers, prices, dates and symbols exact. If a part is unreadable, write [unreadable] in its place. Output only the text, nothing else.$s$,
   '', '', 2),

  ('product_tag',
   $s$Look at the product in IMAGE 1 and return its tags as plain text, one per line: Category, Main colour, Secondary colours, Material, Pattern, Style, Size (only if visible), Short title (max 12 words). Describe only what is clearly visible. If unsure, write unclear. Output only these lines.$s$,
   '', '', 2),

  ('moderation_check',
   $s$Check IMAGE 1 and return exactly these lines: Blur: yes or no. Brightness: good, too dark or too bright. Subject visible: yes or no. Inappropriate content: yes or no (with the reason if yes). Number of faces: a number. Output only these lines.$s$,
   '', '', 2),

  ('poster_text',
   $s$Design one clean, professional poster or banner. Write the exact text the user gives, with correct spelling, clear readable typography and enough contrast. If IMAGE 1 is given, use it as the main visual and keep the product or person in it unchanged. Output one high-quality design.$s$,
   $r$IMAGE 1 = the main visual to place on the poster (optional). Keep it unchanged; add the text and layout around it.$r$,
   $n$misspelled text:3.0, wrong numbers or prices:3.0, unreadable text:2.5, text cut off:2.0, changed product:2.5, extra random text:2.0, cluttered layout:1.8, watermark, signature:1.5$n$, 2),

  ('sticker_logo',
   $s$Create one flat, clean logo or sticker illustration of the user's description. Place it centred on a solid pure white background (#FFFFFF), with no shadow, no gradient and no border. Crisp edges and bold simple shapes. No text unless the user asks for it.$s$,
   '',
   $n$shadow:2.0, gradient background:2.5, background texture:2.5, photo realistic background:2.0, cut edges:1.8, blurry edges:2.0, watermark, signature:1.5$n$, 2),

  ('remove_bg',
   $s$Cut out the main subject of IMAGE 1 exactly as it is. Keep every pixel of the subject unchanged (shape, colour, texture, labels, logo). Place it on a solid pure white background (#FFFFFF) with no shadow and no other objects.$s$,
   $r$IMAGE 1 = the photo. Only the background becomes pure white. The subject must not be altered.$r$,
   $n$altered subject:3.0, changed colour:2.5, missing parts of subject:2.5, background left behind:2.5, shadow:2.0, soft halo around subject:2.0, changed logo or text:3.0, extra objects:2.0$n$, 2),

  ('restore_photo',
   $s$Restore and enhance IMAGE 1: remove noise, scratches, blur and colour fading, and sharpen it into a clean, high-resolution photo. Keep every face identical to the original, with natural skin texture. Keep the composition and everything else unchanged.$s$,
   $r$IMAGE 1 = the old or low quality photo. Keep the same people, pose, clothes and background. Only the quality changes.$r$,
   $n$changed face:3.0, altered facial features:3.0, smooth plastic skin:2.5, added objects:2.0, changed composition:2.5, colour shift:2.0, over-sharpened halos:1.8, watermark, text:1.5$n$, 2),

  ('outpaint',
   $s$Extend IMAGE 1 to fill the requested aspect ratio. Keep the main subject exactly as it is and continue the background, floor, sky or scenery naturally at the new edges, with matching light, perspective and texture. Do not crop or move the subject.$s$,
   $r$IMAGE 1 = the photo to extend. The original area stays the same; only the new edges are generated.$r$,
   $n$changed subject:3.0, moved subject:2.5, visible seam:2.5, mismatched perspective:2.0, mismatched lighting:2.0, repeated pattern artefacts:1.8, extra objects:1.5, distorted anatomy:2.0, watermark, signature:1.5$n$, 2),

  ('style_transfer',
   $s$Redraw IMAGE 1 in the art style the user describes (for example sketch, pencil drawing, oil painting, watercolour or cartoon). Keep the composition, the subjects and their positions the same. Apply the style consistently over the whole image.$s$,
   $r$IMAGE 1 = the source image. Keep the same subjects, layout and pose. Only the rendering style changes.$r$,
   $n$changed composition:2.5, missing subjects:2.5, added objects:2.0, inconsistent style:2.0, text, watermark, signature:1.5$n$, 2),

  ('mockup',
   $s$Place the design from IMAGE 1 realistically onto the product in IMAGE 2 (t-shirt, mug, bag or similar). Follow the product's shape, folds, curves and lighting so the design looks printed on it. Keep the product photo otherwise unchanged.$s$,
   $r$IMAGE 1 = the design or artwork (logo or print). Copy it exactly, without changing its colours or text. IMAGE 2 = the product photo: keep its shape, background and lighting.$r$,
   $n$altered design:3.0, misspelled design text:3.0, changed product shape:2.5, design floating above product:2.5, flat unrealistic print:2.0, changed background:2.0, extra objects:1.8, watermark, signature:1.5$n$, 2),

  ('product_angles',
   $s$Create one clean studio photo of the EXACT product from IMAGE 1, shown from the camera angle given at the end of the instruction. The product is the hero: same shape, proportions, colours, material, logo, printed text and labels. Plain seamless studio background, soft even light, full product visible, sharp focus.$s$,
   $r$IMAGE 1 = the product. Do not add, remove or redesign any part. Only the viewing angle changes.$r$,
   $n$changed logo:3.0, altered text:3.0, wrong colour:2.5, reshaped product:3.0, extra parts:2.5, cropped product:2.0, background clutter:2.0, props in frame:1.5, watermark, CGI, 3D render, deformed$n$, 2),

  ('woman_earrings',
   $s$Add or change ONLY the earrings of the woman in IMAGE 1, inside the red area in IMAGE 2 (the ear area). The earrings must sit naturally on the earlobe, at the same size and height on both ears, and match the light. Keep her face, hair and everything else exactly the same.$s$,
   $r$IMAGE 1 = the photo. IMAGE 2 = mask: the red area is the only area you may change. Everything outside the red area must stay exactly the same.$r$,
   $n$changed face:3.0, altered facial features:3.0, changed hair:2.5, changed clothes:2.5, changes outside the red area:3.0, uneven earrings:2.0, floating earring:2.0, mismatched lighting:1.8, visible seam:2.0, CGI, cartoon, watermark, signature:1.5$n$, 2),

  ('woman_nose_pin',
   $s$Add or change ONLY the nose pin or nose ring of the woman in IMAGE 1, inside the red area in IMAGE 2 (the nostril area). It must be small and natural, sitting on the side of the nostril, matching the skin tone and light. Keep her face and everything else exactly the same.$s$,
   $r$IMAGE 1 = the photo. IMAGE 2 = mask: the red area is the only area you may change. Everything outside the red area must stay exactly the same.$r$,
   $n$changed face:3.0, altered facial features:3.0, oversized nose ring:2.5, nose ring in wrong place:2.5, changed skin tone:2.0, changes outside the red area:3.0, visible seam:2.0, CGI, cartoon, watermark, signature:1.5$n$, 2),

  ('woman_shoes',
   $s$Change ONLY the shoes of the woman in IMAGE 1, inside the red area in IMAGE 2 (the feet). Use the style, colour and material the user describes, with correct perspective, size and contact with the ground. Keep her legs, outfit, face and background exactly the same.$s$,
   $r$IMAGE 1 = the photo. IMAGE 2 = mask: the red area is the only area you may change. Everything outside the red area must stay exactly the same.$r$,
   $n$changed legs:3.0, changed outfit:2.5, changed face:3.0, changes outside the red area:3.0, wrong shoe size:2.0, floating shoes:2.0, wrong perspective:2.0, mismatched lighting:1.8, visible seam:2.0, CGI, cartoon, watermark, signature:1.5$n$, 2),

  ('woman_glasses',
   $s$Add or change ONLY the glasses of the woman in IMAGE 1, inside the red area in IMAGE 2 (the eyes area). The glasses must sit correctly on the nose and ears, with the right perspective and realistic reflections. Keep her eyes, face, hair and everything else identical.$s$,
   $r$IMAGE 1 = the photo. IMAGE 2 = mask: the red area is the only area you may change. Everything outside the red area must stay exactly the same.$r$,
   $n$changed face:3.0, altered eyes:3.0, changed eye colour:2.5, changed hair:2.5, changes outside the red area:3.0, crooked glasses:2.0, glasses floating off the face:2.0, unrealistic reflections:1.8, visible seam:2.0, CGI, cartoon, watermark, signature:1.5$n$, 2),

  ('man_glasses',
   $s$Add or change ONLY the glasses of the man in IMAGE 1, inside the red area in IMAGE 2 (the eyes area). The glasses must sit correctly on the nose and ears, with the right perspective and realistic reflections. Keep his eyes, face, beard, hair and everything else identical.$s$,
   $r$IMAGE 1 = the photo. IMAGE 2 = mask: the red area is the only area you may change. Everything outside the red area must stay exactly the same.$r$,
   $n$changed face:3.0, altered eyes:3.0, changed eye colour:2.5, changed beard:2.5, changed hair:2.5, changes outside the red area:3.0, crooked glasses:2.0, glasses floating off the face:2.0, unrealistic reflections:1.8, visible seam:2.0, CGI, cartoon, watermark, signature:1.5$n$, 2),

  ('man_suit',
   $s$Change ONLY the outfit of the man in IMAGE 1, inside the red area in IMAGE 2, into the suit (jacket and trousers) the user describes. The suit must fit his body and follow his pose, with realistic folds and lighting. Keep his face, hair, beard, pose and background exactly the same.$s$,
   $r$IMAGE 1 = the photo. IMAGE 2 = mask: the red area is the only area you may change. Everything outside the red area must stay exactly the same.$r$,
   $n$changed face:3.0, altered facial features:3.0, changed beard:2.5, changed hair:2.5, changed pose:2.5, changed background:2.5, original casual clothes kept:2.5, changes outside the red area:3.0, wrong fit:2.0, flat unrealistic fabric:2.0, visible seam:2.0, CGI, cartoon, watermark, signature:1.5$n$, 2),

  ('man_shirt',
   $s$Change ONLY the shirt of the man in IMAGE 1, inside the red area in IMAGE 2, to the colour, fabric and style the user describes. Keep his face, beard, hair, trousers, pose and background exactly the same. Keep folds and lighting realistic.$s$,
   $r$IMAGE 1 = the photo. IMAGE 2 = mask: the red area is the only area you may change. Everything outside the red area must stay exactly the same.$r$,
   $n$changed face:3.0, altered facial features:3.0, changed beard:2.5, changed hair:2.5, changed pose:2.5, changed trousers:2.0, changes outside the red area:3.0, flat unrealistic fabric:2.0, wrong fit:1.8, visible seam:2.0, CGI, cartoon, watermark, signature:1.5$n$, 2),

  ('man_jeans',
   $s$Change ONLY the trousers of the man in IMAGE 1, inside the red area in IMAGE 2, into the jeans the user describes. Keep his shirt, shoes, face, beard, pose and background exactly the same. Realistic fit, folds and denim texture.$s$,
   $r$IMAGE 1 = the photo. IMAGE 2 = mask: the red area is the only area you may change. Everything outside the red area must stay exactly the same.$r$,
   $n$changed face:3.0, altered facial features:3.0, changed shirt:2.5, changed shoes:2.0, changed pose:2.5, changed background:2.5, changes outside the red area:3.0, wrong fit:2.0, plastic denim texture:2.0, visible seam:2.0, CGI, cartoon, watermark, signature:1.5$n$, 2),

  ('man_shorts',
   $s$Change ONLY the trousers of the man in IMAGE 1, inside the red area in IMAGE 2, into the shorts the user describes. Keep his shirt, shoes, legs, face, beard, pose and background exactly the same. Realistic length, fit and folds.$s$,
   $r$IMAGE 1 = the photo. IMAGE 2 = mask: the red area is the only area you may change. Everything outside the red area must stay exactly the same.$r$,
   $n$changed face:3.0, altered facial features:3.0, changed shirt:2.5, changed shoes:2.0, changed pose:2.5, changed background:2.5, changes outside the red area:3.0, wrong length:2.0, unnatural legs:2.5, visible seam:2.0, CGI, cartoon, watermark, signature:1.5$n$, 2),

  ('man_shoes',
   $s$Change ONLY the shoes of the man in IMAGE 1, inside the red area in IMAGE 2 (the feet). Use the style, colour and material the user describes, with correct perspective, size and contact with the ground. Keep his legs, trousers, face and background exactly the same.$s$,
   $r$IMAGE 1 = the photo. IMAGE 2 = mask: the red area is the only area you may change. Everything outside the red area must stay exactly the same.$r$,
   $n$changed legs:3.0, changed trousers:2.5, changed face:3.0, changes outside the red area:3.0, wrong shoe size:2.0, floating shoes:2.0, wrong perspective:2.0, mismatched lighting:1.8, visible seam:2.0, CGI, cartoon, watermark, signature:1.5$n$, 2),

  ('pose_change',
   $s$Change the pose of the person in IMAGE 1 to the pose the user describes (for example front view, back view, side view, walking, sitting, hands in pockets). Keep the same person: identical face, skin tone, hair, body proportions, outfit and colours. Keep the background and lighting. The new pose must be natural and anatomically correct.$s$,
   $r$IMAGE 1 = the person photo. Keep the identity and the outfit exactly; only the body pose and the viewing angle change.$r$,
   $n$changed face:3.0, different identity:3.0, changed outfit:2.5, changed clothes colours:2.5, changed background:2.5, anatomy errors:2.5, extra limbs:2.5, missing fingers:2.0, twisted body:2.0, mismatched lighting:1.8, plastic skin:2.0, CGI, 3D render, cartoon, deformed, watermark, signature:1.5$n$, 2)

on conflict (task_type) do update set
  system_text   = excluded.system_text,
  role_text     = excluded.role_text,
  negative_text = excluded.negative_text,
  prompt_version = excluded.prompt_version,
  updated_at    = now()
where public.ai_studio_prompts.prompt_version < excluded.prompt_version;

-- 3. The worker gets the prompts through this function (only a registered worker)
create or replace function public.get_task_prompts(p_worker_id text)
returns json
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if not exists (select 1 from public.ai_studio_workers where worker_id = p_worker_id) then
    raise exception 'Worker registered nahi hai';
  end if;
  return coalesce((
    select json_agg(json_build_object(
      'task_type', task_type,
      'system_text', system_text,
      'role_text', role_text,
      'negative_text', negative_text,
      'enabled', enabled
    ))
    from public.ai_studio_prompts
  ), '[]'::json);
end;
$$;

-- 4. Strict rule in the database: a task of a type with no enabled prompt cannot be saved.
--    The trigger runs as the function owner, so customers cannot skip it.
create or replace function public.ai_studio_require_prompt()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.task_type in ('chat', 'photo_read') then
    return new;
  end if;
  if not exists (select 1 from public.ai_studio_prompts where task_type = new.task_type and enabled) then
    raise exception 'Is kaam ka prompt band hai ya DB mein nahi hai: %', new.task_type;
  end if;
  return new;
end;
$$;

drop trigger if exists ai_studio_require_prompt on public.ai_studio_tasks;
create trigger ai_studio_require_prompt
  before insert on public.ai_studio_tasks
  for each row execute function public.ai_studio_require_prompt();


-- ################ FROM ai_studio_tools.sql ################
-- ============================================================
-- AI Studio: MULTI-TOOL (chat tool, image tool, and more later). Run LAST (after ai_studio_prompts.sql).
-- Safe to run again.
--
-- A TOOL is one kind of work with its own workers:
--   chat  : text tasks (chat, photo read, OCR, tags, photo check)
--   image : image tasks (everything that makes a photo)
-- Each task belongs to one tool (from its task type). Each worker has a list of tools
-- and only takes tasks of those tools. The admin sets all of this from the Tools screen.
-- ============================================================

-- 1. Tools
create table if not exists public.ai_studio_tools (
  tool       text primary key check (tool ~ '^[a-z_]{2,30}$'),
  label      text not null,
  enabled    boolean not null default true,
  created_at timestamptz not null default now()
);
alter table public.ai_studio_tools enable row level security;
drop policy if exists "ai_studio_tools admin" on public.ai_studio_tools;
create policy "ai_studio_tools admin" on public.ai_studio_tools for all to authenticated
  using (public.is_ai_studio_admin()) with check (public.is_ai_studio_admin());

insert into public.ai_studio_tools (tool, label) values
  ('chat',  'Chat / text tool'),
  ('image', 'Image tool')
on conflict (tool) do nothing;

-- 2. Which task type belongs to which tool (the admin can change it)
create table if not exists public.ai_studio_tool_types (
  task_type text primary key,
  tool      text not null references public.ai_studio_tools (tool) on update cascade
);
alter table public.ai_studio_tool_types enable row level security;
drop policy if exists "ai_studio_tool_types admin" on public.ai_studio_tool_types;
create policy "ai_studio_tool_types admin" on public.ai_studio_tool_types for all to authenticated
  using (public.is_ai_studio_admin()) with check (public.is_ai_studio_admin());

insert into public.ai_studio_tool_types (task_type, tool)
select t, 'chat' from unnest(array['chat', 'photo_read', 'ocr_text', 'product_tag', 'moderation_check']) t
on conflict (task_type) do nothing;

insert into public.ai_studio_tool_types (task_type, tool)
select t, 'image' from unnest(array[
  'text_to_image', 'image_prompt', 'image_to_image', 'image_to_image_prompt',
  'outfit_change', 'background_change', 'virtual_tryon', 'product_scene', 'product_catalog', 'project_image',
  'image_edit', 'hair_change', 'shirt_change', 'suit_change', 'bg_change', 'face_swap', 'couple_photo',
  'family_photo', 'outfit_change_ref', 'poster_text', 'sticker_logo', 'remove_bg', 'restore_photo',
  'outpaint', 'style_transfer', 'mockup', 'product_angles',
  'woman_earrings', 'woman_nose_pin', 'woman_shoes', 'woman_glasses',
  'man_glasses', 'man_suit', 'man_shirt', 'man_jeans', 'man_shorts', 'man_shoes', 'pose_change'
]) t
on conflict (task_type) do nothing;

-- 3. Columns: each task has a tool, each worker has its tools (existing workers get all tools)
alter table public.ai_studio_tasks add column if not exists tool text not null default 'image';
alter table public.ai_studio_workers add column if not exists tools text[] not null default array['chat', 'image'];

-- 4. A new task gets its tool from its type. A task of a tool that is switched off is refused.
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
  select tool into v_tool from public.ai_studio_tool_types where task_type = new.task_type;
  new.tool := coalesce(v_tool, 'image');

  select enabled into v_enabled from public.ai_studio_tools where tool = new.tool;
  if v_enabled is not true then
    raise exception 'Ye tool abhi band hai: %', new.tool;
  end if;
  return new;
end;
$$;

drop trigger if exists ai_studio_set_tool on public.ai_studio_tasks;
create trigger ai_studio_set_tool
  before insert on public.ai_studio_tasks
  for each row execute function public.ai_studio_set_tool();

-- 5. Server rule: a worker can only get (claim) a task of a tool it has
create or replace function public.ai_studio_check_worker_tool()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.worker_id is not null and new.worker_id is distinct from old.worker_id then
    if not exists (
      select 1 from public.ai_studio_workers w
       where w.worker_id = new.worker_id and new.tool = any (w.tools)
    ) then
      raise exception 'Ye worker is tool (%) ka kaam nahi le sakta', new.tool;
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists ai_studio_check_worker_tool on public.ai_studio_tasks;
create trigger ai_studio_check_worker_tool
  before update on public.ai_studio_tasks
  for each row execute function public.ai_studio_check_worker_tool();

-- 6. The worker's pending list: only the tools this worker has (same rules as get_pending_ai_studio_tasks)
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
   limit least(p_limit, 200);
$$;

-- 7. Admin sets which tools a worker has
create or replace function public.ai_studio_set_worker_tools(p_worker_id text, p_tools text[])
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_ai_studio_admin() then
    raise exception 'Sirf admin worker ke tools badal sakta hai';
  end if;
  if exists (select 1 from unnest(p_tools) t where t not in (select tool from public.ai_studio_tools)) then
    raise exception 'Ek tool galat hai';
  end if;
  update public.ai_studio_workers set tools = p_tools where worker_id = p_worker_id;
end;
$$;


-- ################ FROM ai_studio_catalog.sql ################
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


-- ################ FROM ai_studio_family_roles.sql ################
-- ============================================================
-- AI Studio: FAMILY ROLES in the database. Run LAST (after ai_studio_catalog.sql).
-- Safe to run again (the seed is only added for missing roles).
--
-- A family photo has one slot per enabled role, in sort_order. The admin can switch roles on/off,
-- change their names and add new ones from the Tools screen.
-- Each family task keeps the role keys it was made with (family_role_keys), so a later change
-- of roles never mixes up the photos of a task that is already queued.
-- ============================================================

-- 1. The roles
create table if not exists public.ai_studio_family_roles (
  role_key       text primary key check (role_key ~ '^[a-z_]{2,30}$'),
  label_admin    text not null,
  label_customer text not null,
  prompt_text    text not null,
  sort_order     int not null default 0,
  enabled        boolean not null default true,
  updated_at     timestamptz not null default now()
);

alter table public.ai_studio_family_roles enable row level security;
drop policy if exists "ai_studio_family_roles admin" on public.ai_studio_family_roles;
create policy "ai_studio_family_roles admin" on public.ai_studio_family_roles for all to authenticated
  using (public.is_ai_studio_admin()) with check (public.is_ai_studio_admin());

insert into public.ai_studio_family_roles (role_key, label_admin, label_customer, prompt_text, sort_order) values
  ('man',         'Aadmi (papa)',    'Aadmi (papa)',    'man',         10),
  ('woman',       'Aurat (mummy)',   'Aurat (mummy)',   'woman',       20),
  ('baby_boy',    'Baby boy',        'Baby boy',        'baby boy',    30),
  ('baby_girl',   'Baby girl',       'Baby girl',       'baby girl',   40),
  ('grandmother', 'Dadi / nani',     'Dadi / nani',     'grandmother', 50),
  ('grandfather', 'Dada / nana',     'Dada / nana',     'grandfather', 60)
on conflict (role_key) do nothing;

-- 2. The apps read the enabled roles (no login needed; no secrets)
create or replace function public.get_family_roles()
returns json
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(json_agg(row_to_json(x) order by x.sort_order, x.role_key), '[]'::json)
    from (
      select role_key, label_admin, label_customer, prompt_text, sort_order
        from public.ai_studio_family_roles
       where enabled
    ) x;
$$;

-- 3. A family task keeps the role keys of the moment it was made.
--    The photos must come one per enabled role (in the same order), otherwise the task is refused.
alter table public.ai_studio_tasks add column if not exists family_role_keys text[];

create or replace function public.ai_studio_family_snapshot()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_keys text[];
  v_n    int;
begin
  if new.task_type <> 'family_photo' then
    return new;
  end if;
  select array_agg(role_key order by sort_order, role_key) into v_keys
    from public.ai_studio_family_roles where enabled;
  v_n := coalesce(array_length(new.extra_image_urls, 1), 0);
  if v_n <> coalesce(array_length(v_keys, 1), 0) then
    raise exception 'Parivar ke roles badal gaye hain, page refresh karo (slots %, roles %)', v_n, coalesce(array_length(v_keys, 1), 0);
  end if;
  new.family_role_keys := v_keys;
  return new;
end;
$$;

drop trigger if exists ai_studio_family_snapshot on public.ai_studio_tasks;
create trigger ai_studio_family_snapshot
  before insert on public.ai_studio_tasks
  for each row execute function public.ai_studio_family_snapshot();


-- ################ FROM ai_studio_engine.sql ################
-- ============================================================
-- AI Studio: ENGINE SETTINGS in the database. Run LAST (after ai_studio_family_roles.sql).
-- Safe to run again.
--
-- The worker app reads these through get_worker_config(), so changing a model, a threshold,
-- a URL or a compression size needs no new worker code:
--   ai_studio_models   : per model: kind (image / text), label, aspect ratios, sizes
--   ai_studio_settings : face check (model, threshold, retries), Gemini and ImgBB URLs,
--                        stale time, image size and quality
-- ============================================================

-- 1. Model capabilities (the model list itself is still ai_studio_models: on / off)
alter table public.ai_studio_models add column if not exists kind text;
alter table public.ai_studio_models add column if not exists label text;
alter table public.ai_studio_models add column if not exists aspects text[] not null default '{}';
alter table public.ai_studio_models add column if not exists sizes text[] not null default '{}';

insert into public.ai_studio_models (model_id, kind, label, aspects, sizes) values
  ('gemini-3.1-flash-image-preview', 'image', 'AI Studio 3.1 Flash Image', array['1:1','2:3','3:2','3:4','4:3','4:5','5:4','9:16','16:9','21:9'], array['1K','2K','4K']),
  ('gemini-2.5-flash-image-preview', 'image', 'AI Studio 2.5 Flash Image', array['1:1','2:3','3:2','3:4','4:3','4:5','5:4','9:16','16:9','21:9'], '{}'::text[]),
  ('gemini-3-flash-preview',         'text',  'AI Studio 3 Flash (text)',  '{}'::text[], '{}'::text[]),
  ('gemini-2.5-flash',               'text',  'AI Studio 2.5 Flash (text)', '{}'::text[], '{}'::text[])
on conflict (model_id) do update set
  kind    = coalesce(public.ai_studio_models.kind, excluded.kind),
  label   = coalesce(public.ai_studio_models.label, excluded.label),
  aspects = case when public.ai_studio_models.kind is null then excluded.aspects else public.ai_studio_models.aspects end,
  sizes   = case when public.ai_studio_models.kind is null then excluded.sizes else public.ai_studio_models.sizes end;

-- 2. Worker engine settings
alter table public.ai_studio_settings add column if not exists match_model text not null default 'gemini-3-flash-preview';
alter table public.ai_studio_settings add column if not exists match_threshold int not null default 70 check (match_threshold between 0 and 100);
alter table public.ai_studio_settings add column if not exists match_retries int not null default 2 check (match_retries between 0 and 5);
alter table public.ai_studio_settings add column if not exists gemini_base text not null default 'https://generativelanguage.googleapis.com/v1beta/models';
alter table public.ai_studio_settings add column if not exists imgbb_upload_url text not null default 'https://api.imgbb.com/1/upload';
alter table public.ai_studio_settings add column if not exists stale_min int not null default 10 check (stale_min between 1 and 240);
alter table public.ai_studio_settings add column if not exists image_max_side int not null default 2048 check (image_max_side between 512 and 4096);
alter table public.ai_studio_settings add column if not exists image_quality numeric not null default 0.85 check (image_quality between 0.5 and 1);

-- 3. WORKER CONFIG: everything the worker needs (this replaces the older version; same fields plus the engine settings)
create or replace function public.get_worker_config(p_worker_id text)
returns json
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_cfg      record;
  v_w        record;
  v_key      text;
  v_used     int;
  v_disabled text[];
  v_caps     json;
begin
  select * into v_w from public.ai_studio_workers where worker_id = p_worker_id;
  if not found then
    raise exception 'Worker registered nahi hai';
  end if;
  select * into v_cfg from public.ai_studio_settings where id = 1;
  select imgbb_api_key into v_key from public.ai_studio_secrets where id = 1;
  select coalesce(sum(calls), 0) into v_used from public.ai_studio_usage where day = current_date;
  select coalesce(array_agg(model_id), '{}') into v_disabled from public.ai_studio_models where not enabled;
  select coalesce(json_object_agg(model_id, json_build_object(
           'kind', kind, 'label', label, 'aspects', aspects, 'sizes', sizes)), '{}'::json)
    into v_caps
    from public.ai_studio_models where kind is not null;
  return json_build_object(
    'task_concurrency', coalesce(v_w.task_limit, v_cfg.task_concurrency),
    'gemini_concurrency', v_cfg.gemini_concurrency,
    'photos_per_task_max', v_cfg.photos_per_task_max,
    'max_attempts', v_cfg.max_attempts,
    'retry_delay_sec', v_cfg.retry_delay_sec,
    'task_timeout_sec', v_cfg.task_timeout_sec,
    'budget_left', case when v_cfg.daily_gemini_budget = 0 then null else greatest(v_cfg.daily_gemini_budget - v_used, 0) end,
    'disabled_models', v_disabled,
    'model_caps', v_caps,
    'match_model', v_cfg.match_model,
    'match_threshold', v_cfg.match_threshold,
    'match_retries', v_cfg.match_retries,
    'gemini_base', v_cfg.gemini_base,
    'imgbb_upload_url', v_cfg.imgbb_upload_url,
    'stale_min', v_cfg.stale_min,
    'image_max_side', v_cfg.image_max_side,
    'image_quality', v_cfg.image_quality,
    'cloudinary_enabled', v_cfg.cloudinary_enabled,
    'cloudinary_cloud_name', v_cfg.cloudinary_cloud_name,
    'cloudinary_upload_preset', v_cfg.cloudinary_upload_preset,
    'imgbb_enabled', v_cfg.imgbb_enabled,
    'imgbb_api_key', v_key
  );
end;
$$;


-- ################ FROM ai_studio_v2.sql ################
-- ============================================================
-- AI Studio: V2 (models from DB, worker timers from DB, clean-up buttons). Run LAST (after ai_studio_engine.sql).
-- Safe to run again.
--
--   1. Model list comes from ai_studio_models (admin and customer apps read it; no model list in code).
--   2. Heartbeat and fallback timers come from ai_studio_settings (worker reads them with the config).
--   3. Clean-up: put stuck (processing) tasks back to pending, and delete failed tasks,
--      for one worker or for all workers. Admin only. Each call returns how many rows it changed.
-- ============================================================

-- 1. Timers for the worker
alter table public.ai_studio_settings add column if not exists heartbeat_sec int not null default 20 check (heartbeat_sec between 5 and 120);
alter table public.ai_studio_settings add column if not exists fallback_sec int not null default 60 check (fallback_sec between 10 and 600);

-- 2. Which model ids are image or text models (used by the upload check). Read from the model table.
create or replace function public.ai_studio_image_models()
returns text[]
language sql
stable
as $$
  select coalesce(array_agg(model_id), '{}'::text[]) from public.ai_studio_models where kind = 'image';
$$;

create or replace function public.ai_studio_text_models()
returns text[]
language sql
stable
as $$
  select coalesce(array_agg(model_id), '{}'::text[]) from public.ai_studio_models where kind = 'text';
$$;

-- 3. The model list for the apps (no login needed; holds no secrets)
create or replace function public.get_model_list()
returns json
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(json_agg(row_to_json(x) order by x.kind, x.model_id), '[]'::json)
    from (
      select model_id, kind, label, aspects, sizes, enabled
        from public.ai_studio_models
       where kind is not null
    ) x;
$$;

-- 4. WORKER CONFIG (latest): same fields as before, plus the timers
create or replace function public.get_worker_config(p_worker_id text)
returns json
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_cfg      record;
  v_w        record;
  v_key      text;
  v_used     int;
  v_disabled text[];
  v_caps     json;
begin
  select * into v_w from public.ai_studio_workers where worker_id = p_worker_id;
  if not found then
    raise exception 'Worker registered nahi hai';
  end if;
  select * into v_cfg from public.ai_studio_settings where id = 1;
  select imgbb_api_key into v_key from public.ai_studio_secrets where id = 1;
  select coalesce(sum(calls), 0) into v_used from public.ai_studio_usage where day = current_date;
  select coalesce(array_agg(model_id), '{}') into v_disabled from public.ai_studio_models where not enabled;
  select coalesce(json_object_agg(model_id, json_build_object(
           'kind', kind, 'label', label, 'aspects', aspects, 'sizes', sizes)), '{}'::json)
    into v_caps
    from public.ai_studio_models where kind is not null;
  return json_build_object(
    'task_concurrency', coalesce(v_w.task_limit, v_cfg.task_concurrency),
    'gemini_concurrency', v_cfg.gemini_concurrency,
    'photos_per_task_max', v_cfg.photos_per_task_max,
    'max_attempts', v_cfg.max_attempts,
    'retry_delay_sec', v_cfg.retry_delay_sec,
    'task_timeout_sec', v_cfg.task_timeout_sec,
    'budget_left', case when v_cfg.daily_gemini_budget = 0 then null else greatest(v_cfg.daily_gemini_budget - v_used, 0) end,
    'disabled_models', v_disabled,
    'model_caps', v_caps,
    'match_model', v_cfg.match_model,
    'match_threshold', v_cfg.match_threshold,
    'match_retries', v_cfg.match_retries,
    'gemini_base', v_cfg.gemini_base,
    'imgbb_upload_url', v_cfg.imgbb_upload_url,
    'stale_min', v_cfg.stale_min,
    'image_max_side', v_cfg.image_max_side,
    'image_quality', v_cfg.image_quality,
    'heartbeat_sec', v_cfg.heartbeat_sec,
    'fallback_sec', v_cfg.fallback_sec,
    'cloudinary_enabled', v_cfg.cloudinary_enabled,
    'cloudinary_cloud_name', v_cfg.cloudinary_cloud_name,
    'cloudinary_upload_preset', v_cfg.cloudinary_upload_preset,
    'imgbb_enabled', v_cfg.imgbb_enabled,
    'imgbb_api_key', v_key
  );
end;
$$;

-- 5. CLEAN-UP (admin only)
-- Stuck tasks: tasks that a worker is holding (processing). They go back to pending.
-- p_worker_id = one worker, NULL = every worker.
create or replace function public.ai_studio_release_tasks(p_worker_id text default null)
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  v_n int;
begin
  if not public.is_ai_studio_admin() then
    raise exception 'Sirf admin task wapas bhej sakta hai';
  end if;
  update public.ai_studio_tasks
     set status = 'pending', worker_id = null, locked_at = null
   where status = 'processing'
     and (p_worker_id is null or worker_id = p_worker_id);
  get diagnostics v_n = row_count;
  return v_n;
end;
$$;

-- Failed tasks: deleted. p_worker_id = the failed tasks of one worker, NULL = every failed task.
create or replace function public.ai_studio_clear_failed(p_worker_id text default null)
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  v_n int;
begin
  if not public.is_ai_studio_admin() then
    raise exception 'Sirf admin failed tasks hata sakta hai';
  end if;
  delete from public.ai_studio_tasks
   where status = 'failed'
     and (p_worker_id is null or worker_id = p_worker_id);
  get diagnostics v_n = row_count;
  return v_n;
end;
$$;

-- 4. Less traffic: the worker hears about list changes through realtime, not by polling.
do $$
declare
  t text;
begin
  foreach t in array array['ai_studio_prompts', 'ai_studio_task_catalog', 'ai_studio_family_roles', 'ai_studio_models', 'ai_studio_settings'] loop
    if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and tablename = t) then
      execute format('alter publication supabase_realtime add table public.%I', t);
    end if;
  end loop;
end
$$;

-- Longer timers by default (heartbeat 30 s, fallback 10 min). Rows that still have the old values move to the new ones.
alter table public.ai_studio_settings alter column heartbeat_sec set default 30;
alter table public.ai_studio_settings alter column fallback_sec set default 600;
update public.ai_studio_settings set heartbeat_sec = 30 where heartbeat_sec = 20;
update public.ai_studio_settings set fallback_sec = 600 where fallback_sec = 60;



-- ============================================================
-- AI Studio: MULTI-APP. Run LAST (after ai_studio_catalog.sql).
-- Safe to run again.
--
-- One AI Studio serves several apps (WearGen, PPP, ...). Each app:
--   ai_studio_apps        : the app list (on / off)
--   ai_studio_app_tasks   : which task types the app shows (a feature can be in one app or in many)
-- Every task records its app in ai_studio_tasks.app_id, so each record shows where it came from.
-- Old tasks become 'weargen' (the default).
-- ============================================================

-- 1. The app list
create table if not exists public.ai_studio_apps (
  app_id      text primary key,
  label       text not null,
  enabled     boolean not null default true,
  sort        int not null default 0,
  updated_at  timestamptz not null default now()
);

alter table public.ai_studio_apps enable row level security;
drop policy if exists "ai_studio_apps admin" on public.ai_studio_apps;
create policy "ai_studio_apps admin" on public.ai_studio_apps for all to authenticated
  using (public.is_ai_studio_admin()) with check (public.is_ai_studio_admin());

insert into public.ai_studio_apps (app_id, label, sort) values
  ('weargen', 'WearGen', 10),
  ('ppp', 'PPP', 20)
on conflict (app_id) do nothing;

-- 2. Which task types each app shows
create table if not exists public.ai_studio_app_tasks (
  app_id     text not null references public.ai_studio_apps(app_id) on update cascade on delete cascade,
  task_type  text not null references public.ai_studio_task_catalog(task_type) on update cascade on delete cascade,
  primary key (app_id, task_type)
);

alter table public.ai_studio_app_tasks enable row level security;
drop policy if exists "ai_studio_app_tasks admin" on public.ai_studio_app_tasks;
create policy "ai_studio_app_tasks admin" on public.ai_studio_app_tasks for all to authenticated
  using (public.is_ai_studio_admin()) with check (public.is_ai_studio_admin());

-- Every existing task type goes to every app at first (admin can then remove some per app)
insert into public.ai_studio_app_tasks (app_id, task_type)
select a.app_id, c.task_type
  from public.ai_studio_apps a
  cross join public.ai_studio_task_catalog c
on conflict do nothing;

-- 3. The app of each task (old tasks get 'weargen')
alter table public.ai_studio_tasks add column if not exists app_id text not null default 'weargen';
alter table public.ai_studio_tasks drop constraint if exists ai_studio_tasks_app_id_fkey;
alter table public.ai_studio_tasks add constraint ai_studio_tasks_app_id_fkey
  foreign key (app_id) references public.ai_studio_apps(app_id) on update cascade;
create index if not exists ai_studio_tasks_app_idx on public.ai_studio_tasks (app_id, status);

-- 4. A task's app is checked when it is set (the customer entry point checks before inserting).
--    The check runs on update only: a new row starts as 'weargen' and is moved to its app right after.
create or replace function public.ai_studio_check_app()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (
    select 1
      from public.ai_studio_apps a
      join public.ai_studio_app_tasks m on m.app_id = a.app_id
     where a.app_id = new.app_id
       and a.enabled
       and m.task_type = new.task_type
  ) then
    raise exception 'Ye kaam is app mein nahi hai: % / %', new.app_id, new.task_type;
  end if;
  return new;
end;
$$;

drop trigger if exists ai_studio_check_app on public.ai_studio_tasks;
create trigger ai_studio_check_app
  before update of app_id, task_type on public.ai_studio_tasks
  for each row execute function public.ai_studio_check_app();

-- 5. The apps read the list of apps (no login needed; it holds no secrets)
create or replace function public.get_app_list()
returns json
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(json_agg(row_to_json(x) order by x.sort, x.app_id), '[]'::json)
    from (select app_id, label, sort from public.ai_studio_apps where enabled) x;
$$;

-- 6. The catalog now says which apps show each type (apps = the enabled apps that have it)
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
             coalesce(tt.tool, 'image') as tool,
             coalesce((
               select array_agg(m.app_id order by m.app_id)
                 from public.ai_studio_app_tasks m
                 join public.ai_studio_apps a on a.app_id = m.app_id
                where m.task_type = c.task_type and a.enabled
             ), '{}'::text[]) as apps
        from public.ai_studio_task_catalog c
        left join public.ai_studio_tool_types tt on tt.task_type = c.task_type
       where c.enabled
    ) x;
$$;

-- 7. The customer app sends its app_id. The task is saved with that app (after the usual checks).
create or replace function public.customer_create_task(p_payload jsonb)
returns setof public.ai_studio_tasks
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid text := auth.uid()::text;
  v_app text := coalesce(nullif(p_payload->>'app_id', ''), 'weargen');
  r     public.ai_studio_tasks;
begin
  if v_uid is null then
    raise exception 'Pehle login karo';
  end if;
  if p_payload->>'task_type' not in ('chat', 'text_to_image', 'image_to_image', 'image_prompt', 'image_to_image_prompt', 'photo_read') then
    raise exception 'Ye kaam is app se nahi banaya ja sakta';
  end if;
  if not exists (
    select 1 from public.ai_studio_app_tasks m
      join public.ai_studio_apps a on a.app_id = m.app_id
     where m.app_id = v_app and m.task_type = p_payload->>'task_type' and a.enabled
  ) then
    raise exception 'Ye kaam is app mein nahi hai';
  end if;
  for r in
    select * from public.upload_ai_studio_task(jsonb_set(p_payload, '{user_id}', to_jsonb(v_uid)))
  loop
    update public.ai_studio_tasks set app_id = v_app where id = r.id returning * into r;
    return next r;
  end loop;
  return;
end;
$$;


-- ============================================================
-- AI Studio: the two image models that support 1K, 2K and 4K sizes.
-- Safe to run again. Run after ai_studio_engine.sql (or after ai_studio_apps.sql).
-- Sets kind, aspects, sizes and turns them on, so the task form and the customer app show the size options.
-- ============================================================

insert into public.ai_studio_models (model_id, kind, label, aspects, sizes, enabled) values
  ('gemini-3.1-flash-image-preview', 'image', 'AI Studio 3.1 Flash Image',
   array['1:1','2:3','3:2','3:4','4:3','4:5','5:4','9:16','16:9','21:9'], array['1K','2K','4K'], true)
on conflict (model_id) do update set
  kind    = 'image',
  label   = excluded.label,
  aspects = excluded.aspects,
  sizes   = excluded.sizes,
  enabled = true;

-- Check: these two should show kind 'image' with sizes 1K, 2K, 4K
select model_id, kind, enabled, aspects, sizes
  from public.ai_studio_models
 where model_id = 'gemini-3.1-flash-image-preview';


-- ============================================================
-- AI Studio: how long each task took. Stored in the database by a trigger, so the worker code does not change.
--   finished_at  : when the task became done or failed
--   duration_ms  : from queued (created_at) to finished  (what the customer waits)
--   process_ms   : from the worker's pick-up (locked_at) to finished  (how long the worker worked)
-- A task that goes back to pending or processing (retry, clean-up) gets its times cleared.
-- Safe to run again.
-- ============================================================

alter table public.ai_studio_tasks add column if not exists finished_at timestamptz;
alter table public.ai_studio_tasks add column if not exists duration_ms int;
alter table public.ai_studio_tasks add column if not exists process_ms int;

create or replace function public.ai_studio_task_time()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.status in ('done', 'failed') then
    if old.status is distinct from new.status or new.finished_at is null then
      new.finished_at := now();
      new.duration_ms := round(extract(epoch from (new.finished_at - new.created_at)) * 1000);
      new.process_ms  := round(extract(epoch from (new.finished_at - coalesce(new.locked_at, new.created_at))) * 1000);
    end if;
  else
    new.finished_at := null;
    new.duration_ms := null;
    new.process_ms  := null;
  end if;
  return new;
end;
$$;

drop trigger if exists ai_studio_task_time on public.ai_studio_tasks;
create trigger ai_studio_task_time
  before update of status on public.ai_studio_tasks
  for each row execute function public.ai_studio_task_time();

-- Check: how long the last finished tasks took
select id, status, duration_ms, process_ms, finished_at
  from public.ai_studio_tasks
 where finished_at is not null
 order by finished_at desc
 limit 5;


-- ============================================================
-- AI Studio: fewer calls from the worker. Realtime is the main wake-up for new tasks,
-- so the fallback check (asks the database for pending tasks) runs every 120 sec, not 30.
-- Safe to run again.
-- ============================================================

update public.ai_studio_settings set fallback_sec = 10 where id = 1;

-- Check
select fallback_sec, heartbeat_sec from public.ai_studio_settings where id = 1;
