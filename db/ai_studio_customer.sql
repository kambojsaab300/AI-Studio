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
