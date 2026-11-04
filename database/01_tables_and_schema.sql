-- ====================================================================
-- AI STUDIO: MICROSOFT SQL SERVER DATABASE SCHEMA
-- High-Performance T-SQL Architecture for ASP.NET Core Web API
-- ====================================================================

-- 1. Users Table (Admin & Customers)
IF OBJECT_ID('ai_studio_users', 'U') IS NULL
BEGIN
    CREATE TABLE ai_studio_users (
        id NVARCHAR(100) PRIMARY KEY DEFAULT NEWID(),
        email NVARCHAR(255) NOT NULL UNIQUE,
        password_hash NVARCHAR(255) NOT NULL,
        role NVARCHAR(50) NOT NULL DEFAULT 'customer', -- 'admin' or 'customer'
        created_at DATETIMEOFFSET NOT NULL DEFAULT SYSDATETIMEOFFSET()
    );
END
GO

-- 2. Admins Table
IF OBJECT_ID('ai_studio_admins', 'U') IS NULL
BEGIN
    CREATE TABLE ai_studio_admins (
        user_id NVARCHAR(100) PRIMARY KEY,
        created_at DATETIMEOFFSET NOT NULL DEFAULT SYSDATETIMEOFFSET()
    );
END
GO

-- 3. Global System Settings Table
IF OBJECT_ID('ai_studio_settings', 'U') IS NULL
BEGIN
    CREATE TABLE ai_studio_settings (
        id INT PRIMARY KEY DEFAULT 1,
        task_concurrency INT NOT NULL DEFAULT 20,
        gemini_concurrency INT NOT NULL DEFAULT 16,
        photos_per_task_max INT NOT NULL DEFAULT 10,
        cloudinary_enabled BIT NOT NULL DEFAULT 1,
        cloudinary_cloud_name NVARCHAR(100) NOT NULL DEFAULT 'draaqjcre',
        cloudinary_upload_preset NVARCHAR(100) NOT NULL DEFAULT 'ml_default',
        imgbb_enabled BIT NOT NULL DEFAULT 0,
        imgbb_api_key NVARCHAR(255) NULL,
        max_attempts INT NOT NULL DEFAULT 2,
        retry_delay_sec INT NOT NULL DEFAULT 30,
        task_timeout_sec INT NOT NULL DEFAULT 300,
        alert_queue_size INT NOT NULL DEFAULT 50,
        user_daily_task_limit INT NOT NULL DEFAULT 0,
        daily_gemini_budget INT NOT NULL DEFAULT 0,
        maintenance_on BIT NOT NULL DEFAULT 0,
        maintenance_message NVARCHAR(MAX) NOT NULL DEFAULT 'System abhi maintenance mein hai. Thodi der baad try karo.',
        alert_email_enabled BIT NOT NULL DEFAULT 0,
        alert_admin_email NVARCHAR(255) NOT NULL DEFAULT '',
        alert_sender_email NVARCHAR(255) NOT NULL DEFAULT '',
        alert_sender_name NVARCHAR(255) NOT NULL DEFAULT 'AI Studio',
        alert_cooldown_min INT NOT NULL DEFAULT 15,
        match_model NVARCHAR(100) NOT NULL DEFAULT 'gemini-3-flash-preview',
        match_threshold INT NOT NULL DEFAULT 70,
        match_retries INT NOT NULL DEFAULT 2,
        gemini_base NVARCHAR(500) NOT NULL DEFAULT 'https://generativelanguage.googleapis.com/v1beta/models',
        imgbb_upload_url NVARCHAR(500) NOT NULL DEFAULT 'https://api.imgbb.com/1/upload',
        stale_min INT NOT NULL DEFAULT 10,
        image_max_side INT NOT NULL DEFAULT 2048,
        image_quality DECIMAL(3,2) NOT NULL DEFAULT 0.85,
        heartbeat_sec INT NOT NULL DEFAULT 30,
        fallback_sec INT NOT NULL DEFAULT 2,
        worker_recycle_after_tasks INT NOT NULL DEFAULT 50,
        updated_at DATETIMEOFFSET NOT NULL DEFAULT SYSDATETIMEOFFSET()
    );
END
GO

-- 4. Multi-Tenant Applications Table (WearGen, PPP, etc.)
IF OBJECT_ID('ai_studio_apps', 'U') IS NULL
BEGIN
    CREATE TABLE ai_studio_apps (
        app_id NVARCHAR(100) PRIMARY KEY,
        name NVARCHAR(255) NOT NULL,
        description NVARCHAR(MAX) NULL,
        theme_color NVARCHAR(50) NOT NULL DEFAULT '#EAB308',
        enabled BIT NOT NULL DEFAULT 1,
        created_at DATETIMEOFFSET NOT NULL DEFAULT SYSDATETIMEOFFSET(),
        updated_at DATETIMEOFFSET NOT NULL DEFAULT SYSDATETIMEOFFSET()
    );
END
GO

-- 5. Task Catalog Table (All Tools & AI Capabilities)
IF OBJECT_ID('ai_studio_task_catalog', 'U') IS NULL
BEGIN
    CREATE TABLE ai_studio_task_catalog (
        task_type NVARCHAR(100) PRIMARY KEY,
        label NVARCHAR(255) NOT NULL,
        customer_label NVARCHAR(255) NULL,
        hint NVARCHAR(MAX) NULL,
        output NVARCHAR(50) NOT NULL DEFAULT 'image',
        inputs NVARCHAR(MAX) NULL, -- JSON array
        optional NVARCHAR(MAX) NULL, -- JSON array
        labels NVARCHAR(MAX) NULL, -- JSON object
        customer_labels NVARCHAR(MAX) NULL, -- JSON object
        extras NVARCHAR(MAX) NULL, -- JSON object
        prompt_required BIT NOT NULL DEFAULT 0,
        face_check BIT NOT NULL DEFAULT 0,
        edit BIT NOT NULL DEFAULT 0,
        transparent BIT NOT NULL DEFAULT 0,
        angles BIT NOT NULL DEFAULT 0,
        family BIT NOT NULL DEFAULT 0,
        per_photo BIT NOT NULL DEFAULT 0,
        customer_visible BIT NOT NULL DEFAULT 1,
        enabled BIT NOT NULL DEFAULT 1,
        sort INT NOT NULL DEFAULT 100,
        updated_at DATETIMEOFFSET NOT NULL DEFAULT SYSDATETIMEOFFSET()
    );
END
GO

-- 6. App Task Mapping Table (Which App Has Which Tools)
IF OBJECT_ID('ai_studio_app_tasks', 'U') IS NULL
BEGIN
    CREATE TABLE ai_studio_app_tasks (
        app_id NVARCHAR(100) NOT NULL,
        task_type NVARCHAR(100) NOT NULL,
        created_at DATETIMEOFFSET NOT NULL DEFAULT SYSDATETIMEOFFSET(),
        PRIMARY KEY (app_id, task_type)
    );
END
GO

-- 7. Prompts Configuration Table
IF OBJECT_ID('ai_studio_prompts', 'U') IS NULL
BEGIN
    CREATE TABLE ai_studio_prompts (
        task_type NVARCHAR(100) PRIMARY KEY,
        system_text NVARCHAR(MAX) NOT NULL,
        role_text NVARCHAR(MAX) NOT NULL,
        negative_text NVARCHAR(MAX) NULL,
        prompt_version INT NOT NULL DEFAULT 1,
        enabled BIT NOT NULL DEFAULT 1,
        updated_at DATETIMEOFFSET NOT NULL DEFAULT SYSDATETIMEOFFSET()
    );
END
GO

-- 8. Workers Registration & Health Table
IF OBJECT_ID('ai_studio_workers', 'U') IS NULL
BEGIN
    CREATE TABLE ai_studio_workers (
        worker_id NVARCHAR(100) PRIMARY KEY,
        last_seen DATETIMEOFFSET NOT NULL DEFAULT SYSDATETIMEOFFSET(),
        started_at DATETIMEOFFSET NOT NULL DEFAULT SYSDATETIMEOFFSET(),
        paused BIT NOT NULL DEFAULT 0,
        pause_reason NVARCHAR(MAX) NULL,
        drain BIT NOT NULL DEFAULT 0,
        task_limit INT NULL,
        tools NVARCHAR(MAX) NOT NULL DEFAULT '["chat","image"]',
        task_types NVARCHAR(MAX) NULL
    );
END
GO

-- 9. Primary Tasks Execution Table
IF OBJECT_ID('ai_studio_tasks', 'U') IS NULL
BEGIN
    CREATE TABLE ai_studio_tasks (
        id BIGINT IDENTITY(1,1) PRIMARY KEY,
        task_type NVARCHAR(100) NOT NULL,
        model NVARCHAR(100) NOT NULL,
        prompt NVARCHAR(MAX) NULL,
        system_text NVARCHAR(MAX) NULL,
        aspect_ratio NVARCHAR(50) NULL,
        image_size NVARCHAR(50) NULL,
        face_image_url NVARCHAR(MAX) NULL,
        style_image_url NVARCHAR(MAX) NULL,
        input_image_url NVARCHAR(MAX) NULL,
        extra_image_urls NVARCHAR(MAX) NULL, -- JSON array
        conversation_id NVARCHAR(100) NULL,
        user_id NVARCHAR(100) NOT NULL,
        app_id NVARCHAR(100) NOT NULL DEFAULT 'weargen',
        batch_count INT NOT NULL DEFAULT 1,
        priority INT NOT NULL DEFAULT 0,
        family_role_keys NVARCHAR(MAX) NULL, -- JSON array
        status NVARCHAR(50) NOT NULL DEFAULT 'pending', -- pending, processing, completed, failed
        output_image_url NVARCHAR(MAX) NULL,
        output_image_urls NVARCHAR(MAX) NULL, -- JSON array of generated photos
        output_text NVARCHAR(MAX) NULL, -- Generated text / chat answer
        face_match_score DECIMAL(5,2) NULL,
        error NVARCHAR(MAX) NULL,
        attempts INT NOT NULL DEFAULT 0,
        worker_id NVARCHAR(100) NULL,
        process_ms INT NULL,
        duration_ms INT NULL,
        claimed_at DATETIMEOFFSET NULL,
        finished_at DATETIMEOFFSET NULL,
        created_at DATETIMEOFFSET NOT NULL DEFAULT SYSDATETIMEOFFSET(),
        updated_at DATETIMEOFFSET NOT NULL DEFAULT SYSDATETIMEOFFSET()
    );
END
GO

-- 10. AI Studio Usage & Budget Table
IF OBJECT_ID('ai_studio_usage', 'U') IS NULL
BEGIN
    CREATE TABLE ai_studio_usage (
        [day] DATE NOT NULL,
        worker_id NVARCHAR(100) NOT NULL,
        calls INT NOT NULL DEFAULT 0,
        PRIMARY KEY ([day], worker_id)
    );
END
GO

-- 11. Family Roles Table
IF OBJECT_ID('ai_studio_family_roles', 'U') IS NULL
BEGIN
    CREATE TABLE ai_studio_family_roles (
        role_key NVARCHAR(100) PRIMARY KEY,
        label_admin NVARCHAR(255) NOT NULL,
        label_customer NVARCHAR(255) NOT NULL,
        prompt_text NVARCHAR(MAX) NOT NULL,
        sort_order INT NOT NULL DEFAULT 100,
        enabled BIT NOT NULL DEFAULT 1,
        updated_at DATETIMEOFFSET NOT NULL DEFAULT SYSDATETIMEOFFSET()
    );
END
GO

-- 12. AI Models Table
IF OBJECT_ID('ai_studio_models', 'U') IS NULL
BEGIN
    CREATE TABLE ai_studio_models (
        id NVARCHAR(100) PRIMARY KEY,
        name NVARCHAR(255) NOT NULL,
        provider NVARCHAR(100) NOT NULL DEFAULT 'google',
        enabled BIT NOT NULL DEFAULT 1,
        is_default BIT NOT NULL DEFAULT 0,
        created_at DATETIMEOFFSET NOT NULL DEFAULT SYSDATETIMEOFFSET()
    );
END
GO

-- 13. Audit & Action Logs Table
IF OBJECT_ID('ai_studio_action_log', 'U') IS NULL
BEGIN
    CREATE TABLE ai_studio_action_log (
        id BIGINT IDENTITY(1,1) PRIMARY KEY,
        actor NVARCHAR(100) NOT NULL,
        action NVARCHAR(100) NOT NULL,
        details NVARCHAR(MAX) NULL,
        created_at DATETIMEOFFSET NOT NULL DEFAULT SYSDATETIMEOFFSET()
    );
END
GO
