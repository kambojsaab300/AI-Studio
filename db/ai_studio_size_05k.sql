-- ============================================================
-- AI Studio: the smallest image size, 0.5K, is allowed too (1K, 2K, 4K were already).
-- Safe to run again. Rewrites the size check in every live function that has it.
-- Which models support 0.5K is set on the Models screen (admin), not here.
-- ============================================================

do $$
declare
  f record;
begin
  for f in
    select p.oid, p.proname
      from pg_proc p
      join pg_namespace n on n.oid = p.pronamespace
     where n.nspname = 'public'
       and position('''1K'',''2K'',''4K''' in p.prosrc) > 0
  loop
    execute replace(
      pg_get_functiondef(f.oid),
      $q$array['1K','2K','4K']$q$,
      $q$array['0.5K','1K','2K','4K']$q$
    );
    raise notice 'updated: %', f.proname;
  end loop;
end
$$;

-- Check: the size check now lists 0.5K in the live functions
select p.proname
  from pg_proc p
  join pg_namespace n on n.oid = p.pronamespace
 where n.nspname = 'public'
   and position('''0.5K'',''1K'',''2K'',''4K''' in p.prosrc) > 0;
