-- ====================================================================
-- AI STUDIO: MICROSOFT SQL SERVER INITIAL SEED DATA
-- Default apps, settings, catalog items, and production prompts
-- ====================================================================

-- 1. Initialize Global Settings
IF NOT EXISTS (SELECT 1 FROM ai_studio_settings WHERE id = 1)
BEGIN
    INSERT INTO ai_studio_settings (id, task_concurrency, gemini_concurrency, fallback_sec, worker_recycle_after_tasks)
    VALUES (1, 20, 16, 2, 50);
END
GO

-- 2. Initialize Default Multi-Tenant Apps
IF NOT EXISTS (SELECT 1 FROM ai_studio_apps WHERE app_id = 'weargen')
BEGIN
    INSERT INTO ai_studio_apps (app_id, name, description, theme_color, enabled)
    VALUES ('weargen', 'WearGen Studio', 'AI Fashion, Model Try-On, Saree, Jewellery & Studio Generations', '#EAB308', 1);
END
GO

IF NOT EXISTS (SELECT 1 FROM ai_studio_apps WHERE app_id = 'ppp')
BEGIN
    INSERT INTO ai_studio_apps (app_id, name, description, theme_color, enabled)
    VALUES ('ppp', 'PPP Photo Studio', 'AI Portrait, Passport & Professional Photography Studio', '#3B82F6', 1);
END
GO
