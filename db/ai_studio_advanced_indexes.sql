-- ============================================================
-- AI Studio: Advanced Performance & Pagination Indexes
-- ============================================================

-- 1. Index for Status-based tab pagination in Task History
IF NOT EXISTS (
    SELECT 1 FROM sys.indexes 
    WHERE name = 'IX_ai_studio_tasks_status_id' 
      AND object_id = OBJECT_ID('ai_studio_tasks')
)
BEGIN
    CREATE NONCLUSTERED INDEX IX_ai_studio_tasks_status_id 
    ON ai_studio_tasks (status, id DESC)
    INCLUDE (task_type, model, prompt, aspect_ratio, image_size, output_image_url, worker_id, app_id, created_at, duration_ms, error);
    PRINT 'Created index IX_ai_studio_tasks_status_id';
END
ELSE
BEGIN
    PRINT 'Index IX_ai_studio_tasks_status_id already exists';
END
GO

-- 2. Index for Customer / User task feed lookup
IF NOT EXISTS (
    SELECT 1 FROM sys.indexes 
    WHERE name = 'IX_ai_studio_tasks_user_id' 
      AND object_id = OBJECT_ID('ai_studio_tasks')
)
BEGIN
    CREATE NONCLUSTERED INDEX IX_ai_studio_tasks_user_id 
    ON ai_studio_tasks (user_id, id DESC)
    INCLUDE (status, app_id, output_image_url, created_at);
    PRINT 'Created index IX_ai_studio_tasks_user_id';
END
ELSE
BEGIN
    PRINT 'Index IX_ai_studio_tasks_user_id already exists';
END
GO

-- 3. Index for Admin Audit Log pagination
IF NOT EXISTS (
    SELECT 1 FROM sys.indexes 
    WHERE name = 'IX_ai_studio_admin_log_id' 
      AND object_id = OBJECT_ID('ai_studio_admin_log')
)
BEGIN
    CREATE NONCLUSTERED INDEX IX_ai_studio_admin_log_id 
    ON ai_studio_admin_log (id DESC);
    PRINT 'Created index IX_ai_studio_admin_log_id';
END
ELSE
BEGIN
    PRINT 'Index IX_ai_studio_admin_log_id already exists';
END
GO
