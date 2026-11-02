-- ============================================================
-- AI Studio: fewer calls from the worker. Realtime is the main wake-up for new tasks,
-- so the fallback check (asks the database for pending tasks) runs every 120 sec, not 30.
-- Safe to run again.
-- ============================================================

update public.ai_studio_settings set fallback_sec = 120 where id = 1;

-- Check
select fallback_sec, heartbeat_sec from public.ai_studio_settings where id = 1;
