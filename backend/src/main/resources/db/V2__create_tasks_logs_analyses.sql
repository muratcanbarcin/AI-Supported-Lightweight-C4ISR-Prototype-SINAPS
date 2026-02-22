-- ============================================================================
-- C4ISR Backend - Database Schema v2
-- Creates: tasks, system_logs, ai_analyses
-- Run against: c4isr_db (PostgreSQL)
-- ============================================================================

-- 1. Tasks table - Stores task assignments for assets
CREATE TABLE IF NOT EXISTS tasks (
    id              SERIAL          PRIMARY KEY,
    asset_id        VARCHAR(50),
    title           VARCHAR(200)    NOT NULL,
    description     TEXT,
    status          VARCHAR(50)     DEFAULT 'PENDING',
    created_at      TIMESTAMP       DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_tasks_asset_id   ON tasks (asset_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status      ON tasks (status);
CREATE INDEX IF NOT EXISTS idx_tasks_created_at  ON tasks (created_at DESC);

-- 2. System Logs table - Stores operational event logs per asset
CREATE TABLE IF NOT EXISTS system_logs (
    id              SERIAL          PRIMARY KEY,
    asset_id        VARCHAR(50),
    event_type      VARCHAR(100),
    message         TEXT,
    created_at      TIMESTAMP       DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_system_logs_asset_id    ON system_logs (asset_id);
CREATE INDEX IF NOT EXISTS idx_system_logs_event_type  ON system_logs (event_type);
CREATE INDEX IF NOT EXISTS idx_system_logs_created_at  ON system_logs (created_at DESC);

-- 3. AI Analyses table - Stores AI-generated threat analyses
CREATE TABLE IF NOT EXISTS ai_analyses (
    id              SERIAL          PRIMARY KEY,
    asset_id        VARCHAR(50),
    threat_level    VARCHAR(50),
    recommendation  TEXT,
    is_alert        BOOLEAN         DEFAULT FALSE,
    created_at      TIMESTAMP       DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_ai_analyses_asset_id      ON ai_analyses (asset_id);
CREATE INDEX IF NOT EXISTS idx_ai_analyses_threat_level   ON ai_analyses (threat_level);
CREATE INDEX IF NOT EXISTS idx_ai_analyses_is_alert       ON ai_analyses (is_alert);
CREATE INDEX IF NOT EXISTS idx_ai_analyses_created_at     ON ai_analyses (created_at DESC);
