-- ============================================================
-- C4ISR CHAT HISTORY — Persistent Multi-Session Chat Storage
-- Purpose: Store chat sessions and messages for the AI Assistant
-- Run Order: 03 (after init-vector.sql)
-- ============================================================

-- ============================================================
-- chat_sessions: Each conversation thread
-- ============================================================
CREATE TABLE IF NOT EXISTS chat_sessions (
    id          BIGSERIAL PRIMARY KEY,
    title       VARCHAR(100)    DEFAULT '',
    created_at  TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    updated_at  TIMESTAMP       DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_chat_sessions_updated
ON chat_sessions (updated_at DESC);

-- ============================================================
-- chat_messages: Individual messages within a session
-- ============================================================
CREATE TABLE IF NOT EXISTS chat_messages (
    id          BIGSERIAL PRIMARY KEY,
    session_id  BIGINT          NOT NULL REFERENCES chat_sessions(id) ON DELETE CASCADE,
    role        VARCHAR(20)     NOT NULL CHECK (role IN ('user', 'assistant')),
    content     TEXT            NOT NULL,
    cited_rule  TEXT            DEFAULT '',
    created_at  TIMESTAMP       DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_chat_messages_session
ON chat_messages (session_id, created_at ASC);

-- Permissions
GRANT ALL PRIVILEGES ON TABLE chat_sessions TO admin;
GRANT ALL PRIVILEGES ON TABLE chat_messages TO admin;
GRANT USAGE, SELECT ON SEQUENCE chat_sessions_id_seq TO admin;
GRANT USAGE, SELECT ON SEQUENCE chat_messages_id_seq TO admin;

-- Metadata
COMMENT ON TABLE  chat_sessions              IS 'AI Chat conversation threads';
COMMENT ON TABLE  chat_messages              IS 'Individual messages within a chat session';
COMMENT ON COLUMN chat_messages.role         IS 'Message sender: user or assistant';
COMMENT ON COLUMN chat_messages.cited_rule   IS 'RAG doctrine cited in AI response (if any)';
