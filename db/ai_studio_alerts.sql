-- ============================================================
-- AI Studio: EMAIL ALERTS through Brevo. Run LAST (after ai_studio_ops.sql). Safe to run again.
--
-- The database checks every minute (pg_cron) and sends the mail (pg_net -> Brevo HTTP API).
-- So alerts still go out when no admin screen is open and every worker is down.
-- Brevo: create an API key (v3) and verify the sender email in Brevo first.
-- ============================================================

-- 1. Extensions (Supabase: pg_net for HTTP, pg_cron for the every-minute check)
create extension if not exists pg_net;
create extension if not exists pg_cron;

-- 2. Settings: which mail to send and where. The Brevo key goes to the secrets table.
alter table public.ai_studio_settings add column if not exists alert_email_enabled boolean not null default false;
alter table public.ai_studio_settings add column if not exists alert_admin_email text not null default '';
alter table public.ai_studio_settings add column if not exists alert_sender_email text not null default '';
alter table public.ai_studio_settings add column if not exists alert_sender_name text not null default 'AI Studio';
alter table public.ai_studio_settings add column if not exists alert_cooldown_min int not null default 15 check (alert_cooldown_min between 1 and 1440);
alter table public.ai_studio_secrets add column if not exists brevo_api_key text;

-- 3. Alert history (also used for the cooldown, so the same alert is not sent again and again)
create table if not exists public.ai_studio_alert_log (
  id         bigint generated always as identity primary key,
  kind       text not null,
  message    text not null,
  created_at timestamptz not null default now()
);
alter table public.ai_studio_alert_log enable row level security;
drop policy if exists "ai_studio_alert_log admin only" on public.ai_studio_alert_log;
create policy "ai_studio_alert_log admin only" on public.ai_studio_alert_log for all to authenticated
  using (public.is_ai_studio_admin()) with check (public.is_ai_studio_admin());

-- 4. Send one mail through Brevo
create or replace function public.ai_studio_send_mail(p_subject text, p_text text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_cfg record;
  v_key text;
begin
  select * into v_cfg from public.ai_studio_settings where id = 1;
  select brevo_api_key into v_key from public.ai_studio_secrets where id = 1;
  if coalesce(v_key, '') = '' or v_cfg.alert_admin_email = '' or v_cfg.alert_sender_email = '' then
    raise exception 'Mail settings adhoore hain (Brevo key, admin email, sender email)';
  end if;

  perform net.http_post(
    url     := 'https://api.brevo.com/v3/smtp/email',
    headers := jsonb_build_object('api-key', v_key, 'content-type', 'application/json', 'accept', 'application/json'),
    body    := jsonb_build_object(
      'sender',      jsonb_build_object('email', v_cfg.alert_sender_email, 'name', v_cfg.alert_sender_name),
      'to',          jsonb_build_array(jsonb_build_object('email', v_cfg.alert_admin_email)),
      'subject',     p_subject,
      'textContent', p_text
    )
  );
end;
$$;

-- 5. The check: runs every minute. Each alert is sent once per cooldown period.
create or replace function public.ai_studio_check_alerts()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_cfg     record;
  v_pending int;
  v_live    int;
  r         record;
  v_recent  boolean;
begin
  select * into v_cfg from public.ai_studio_settings where id = 1;
  if not v_cfg.alert_email_enabled then
    return;
  end if;

  select count(*) into v_pending from public.ai_studio_tasks where status = 'pending';
  select count(*) into v_live from public.ai_studio_workers
   where last_seen >= now() - interval '60 seconds' and not paused and not drain;

  for r in
    select 'no_workers'::text as kind,
           'Sab workers offline hain, ' || v_pending || ' task pending hain' as msg
     where v_pending > 0 and v_live = 0
    union all
    select 'queue_high',
           'Queue bhari: ' || v_pending || ' task pending (limit ' || v_cfg.alert_queue_size || ')'
     where v_pending >= v_cfg.alert_queue_size
    union all
    select 'auto_pause:' || worker_id,
           worker_id || ' khud pause hua: ' || pause_reason
      from public.ai_studio_workers
     where pause_reason is not null
  loop
    select exists (
      select 1 from public.ai_studio_alert_log
       where kind = r.kind
         and created_at > now() - make_interval(mins => v_cfg.alert_cooldown_min)
    ) into v_recent;

    if not v_recent then
      insert into public.ai_studio_alert_log (kind, message) values (r.kind, r.msg);
      begin
        perform public.ai_studio_send_mail('[AI Studio] ' || r.msg, r.msg || ' (' || now() || ')');
      exception when others then
        -- settings incomplete or Brevo unreachable: the alert is still in the log
        raise notice 'mail nahi gaya: %', sqlerrm;
      end;
    end if;
  end loop;
end;
$$;

-- 6. Test mail from the admin screen
create or replace function public.ai_studio_send_test_mail()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_ai_studio_admin() then
    raise exception 'Sirf admin test mail bhej sakta hai';
  end if;
  perform public.ai_studio_send_mail('[AI Studio] Test mail', 'Ye test mail hai. Email alert settings sahi hain.');
end;
$$;

-- 7. Schedule the check every minute (only if pg_cron is available)
do $$
begin
  perform cron.schedule('ai-studio-alerts', '* * * * *', 'select public.ai_studio_check_alerts()');
exception when others then
  raise notice 'pg_cron nahi chal raha: %. Supabase dashboard mein Database > Extensions se pg_cron on karo.', sqlerrm;
end;
$$;
