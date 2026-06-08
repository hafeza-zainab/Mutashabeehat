-- Add to your existing schema.sql or run separately
-- Creates tables for saving coach chat sessions

CREATE TABLE IF NOT EXISTS chat_sessions (
    id          INTEGER  PRIMARY KEY AUTOINCREMENT,
    user_id     INTEGER  NOT NULL,
    title       TEXT     NOT NULL DEFAULT 'New Session',
    created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS chat_messages (
    id          INTEGER  PRIMARY KEY AUTOINCREMENT,
    session_id  INTEGER  NOT NULL,
    role        TEXT     NOT NULL CHECK(role IN ('user', 'assistant')),
    content     TEXT     NOT NULL,
    created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(session_id) REFERENCES chat_sessions(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_chat_sessions_user ON chat_sessions(user_id, updated_at);
CREATE INDEX IF NOT EXISTS idx_chat_messages_session ON chat_messages(session_id, created_at);