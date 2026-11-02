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
