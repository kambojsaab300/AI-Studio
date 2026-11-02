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
