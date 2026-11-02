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
