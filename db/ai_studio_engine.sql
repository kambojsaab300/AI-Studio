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
