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
