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
