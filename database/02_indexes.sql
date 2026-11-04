-- ====================================================================
-- AI STUDIO: MICROSOFT SQL SERVER HIGH-SPEED PERFORMANCE INDEXES
-- Optimizes queue polling, task claiming, app isolation, and history
-- ====================================================================

-- 1. High-speed Queue Polling Index (used by sp_get_pending_tasks every 2s)
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_ai_studio_tasks_pending_claim' AND object_id = OBJECT_ID('ai_studio_tasks'))
BEGIN
    CREATE NONCLUSTERED INDEX IX_ai_studio_tasks_pending_claim
    ON ai_studio_tasks (status, priority DESC, created_at ASC)
    INCLUDE (id, task_type, model, user_id, app_id, batch_count, worker_id, attempts);
END
GO

-- 2. Multi-App Customer Task Isolation & History Index
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_ai_studio_tasks_app_user_history' AND object_id = OBJECT_ID('ai_studio_tasks'))
BEGIN
    CREATE NONCLUSTERED INDEX IX_ai_studio_tasks_app_user_history
    ON ai_studio_tasks (app_id, user_id, created_at DESC)
    INCLUDE (status, task_type, model, output_image_url, output_image_urls, output_text, face_match_score, error);
END
GO

-- 3. Worker In-Flight Claim Tracking Index
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_ai_studio_tasks_worker_status' AND object_id = OBJECT_ID('ai_studio_tasks'))
BEGIN
    CREATE NONCLUSTERED INDEX IX_ai_studio_tasks_worker_status
    ON ai_studio_tasks (worker_id, status)
    INCLUDE (id, task_type, claimed_at);
END
GO

-- 4. App Catalog Mapping Index
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_ai_studio_app_tasks_lookup' AND object_id = OBJECT_ID('ai_studio_app_tasks'))
BEGIN
    CREATE NONCLUSTERED INDEX IX_ai_studio_app_tasks_lookup
    ON ai_studio_app_tasks (app_id, task_type);
END
GO

-- 5. Worker Heartbeat & Paused State Index
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_ai_studio_workers_last_seen' AND object_id = OBJECT_ID('ai_studio_workers'))
BEGIN
    CREATE NONCLUSTERED INDEX IX_ai_studio_workers_last_seen
    ON ai_studio_workers (last_seen DESC, paused, drain);
END
GO
