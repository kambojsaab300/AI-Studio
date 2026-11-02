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
