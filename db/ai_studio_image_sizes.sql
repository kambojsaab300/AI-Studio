-- ============================================================
-- AI Studio: the two image models that support 1K, 2K and 4K sizes.
-- Safe to run again. Run after ai_studio_engine.sql (or after ai_studio_apps.sql).
-- Sets kind, aspects, sizes and turns them on, so the task form and the customer app show the size options.
-- ============================================================

insert into public.ai_studio_models (model_id, kind, label, aspects, sizes, enabled) values
  ('gemini-3.1-flash-image-preview', 'image', 'AI Studio 3.1 Flash Image',
   array['1:1','2:3','3:2','3:4','4:3','4:5','5:4','9:16','16:9','21:9'], array['1K','2K','4K'], true)
on conflict (model_id) do update set
  kind    = 'image',
  label   = excluded.label,
  aspects = excluded.aspects,
  sizes   = excluded.sizes,
  enabled = true;

-- Check: these two should show kind 'image' with sizes 1K, 2K, 4K
select model_id, kind, enabled, aspects, sizes
  from public.ai_studio_models
 where model_id = 'gemini-3.1-flash-image-preview';
