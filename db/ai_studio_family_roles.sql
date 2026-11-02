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
