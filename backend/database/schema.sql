-- ============================================================
-- Quran Similarity App — Master Schema
-- Single source of truth. Run via: node scripts/setupDatabase.js
-- ============================================================

PRAGMA foreign_keys = ON;

-- ------------------------------------------------------------
-- Core Quran data
-- ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS ayahs (
    id       INTEGER PRIMARY KEY AUTOINCREMENT,
    surah    INTEGER NOT NULL,
    ayah     INTEGER NOT NULL,
    text     TEXT    NOT NULL,
    juz      INTEGER NOT NULL,
    marhala  TEXT    NOT NULL,
    name     TEXT,
    page     INTEGER,
    UNIQUE(surah, ayah)
);

CREATE TABLE IF NOT EXISTS similarities (
    id               INTEGER PRIMARY KEY AUTOINCREMENT,
    source_surah     INTEGER NOT NULL,
    source_ayah      INTEGER NOT NULL,
    source_page      INTEGER,
    target_surah     INTEGER NOT NULL,
    target_ayah      INTEGER NOT NULL,
    target_page      INTEGER,
    similarity_score REAL    NOT NULL,
    tips             TEXT    DEFAULT '[]',
    UNIQUE(source_surah, source_ayah, target_surah, target_ayah)
);

-- ------------------------------------------------------------
-- Users
-- ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS users (
    id       INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT    UNIQUE NOT NULL,
    email    TEXT    UNIQUE NOT NULL,
    password TEXT    NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ------------------------------------------------------------
-- Diary
-- ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS diary_logs (
    id          INTEGER  PRIMARY KEY AUTOINCREMENT,
    user_id     INTEGER  NOT NULL,
    type        TEXT     NOT NULL CHECK(type IN ('murajah','tasmee','ikhtebar','jadeed','Juz_Hali')),
    range_from  TEXT     NOT NULL,
    range_to    TEXT     NOT NULL DEFAULT '',
    score       INTEGER  NOT NULL CHECK(score >= 0 AND score <= 10),
    created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ------------------------------------------------------------
-- Tasks
-- ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS tasks (
    id         INTEGER  PRIMARY KEY AUTOINCREMENT,
    user_id    INTEGER  NOT NULL,
    title      TEXT     NOT NULL,
    category   TEXT     NOT NULL CHECK(category IN ('murajah','jadeed','Juz_Hali','tasmee','general')),
    status     TEXT     NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','in_progress','completed')),
    date       TEXT     NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ------------------------------------------------------------
-- Themes / Streaks
-- ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS user_themes (
    id             INTEGER  PRIMARY KEY AUTOINCREMENT,
    user_id        INTEGER  NOT NULL,
    theme_id       TEXT     NOT NULL,
    streak         INTEGER  NOT NULL DEFAULT 0,
    max_streak     INTEGER  NOT NULL DEFAULT 0,
    frozen_streak  INTEGER  NOT NULL DEFAULT 0,
    last_log_date  TEXT,
    is_active      INTEGER  NOT NULL DEFAULT 0,
    created_at     DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, theme_id),
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ------------------------------------------------------------
-- Indexes
-- ------------------------------------------------------------

CREATE INDEX IF NOT EXISTS idx_similarities_source  ON similarities(source_surah, source_ayah);
CREATE INDEX IF NOT EXISTS idx_similarities_target  ON similarities(target_surah, target_ayah);
CREATE INDEX IF NOT EXISTS idx_ayahs_juz            ON ayahs(juz);
CREATE INDEX IF NOT EXISTS idx_ayahs_page           ON ayahs(page);
CREATE INDEX IF NOT EXISTS idx_diary_user_date      ON diary_logs(user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_tasks_user_date      ON tasks(user_id, date);
CREATE INDEX IF NOT EXISTS idx_themes_user_active   ON user_themes(user_id, is_active);
