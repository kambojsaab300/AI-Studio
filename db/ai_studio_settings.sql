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
