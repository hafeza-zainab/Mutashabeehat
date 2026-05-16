-- Drop old tables to ensure a completely clean slate
DROP TABLE IF EXISTS similarities;
DROP TABLE IF EXISTS ayahs;

-- Create Ayahs Table
CREATE TABLE ayahs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    surah INTEGER NOT NULL,
    ayah INTEGER NOT NULL,
    text TEXT NOT NULL,
    juzz INTEGER NOT NULL,
    marhala TEXT NOT NULL,
    name TEXT,
    UNIQUE(surah, ayah)
);

-- Create Similarities Table
-- Create Similarities Table
CREATE TABLE similarities (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    source_surah INTEGER NOT NULL,
    source_ayah INTEGER NOT NULL,
    source_page INTEGER,          -- ADDED THIS
    target_surah INTEGER NOT NULL,
    target_ayah INTEGER NOT NULL,
    target_page INTEGER,          -- ADDED THIS
    similarity_score REAL NOT NULL,
    tips TEXT DEFAULT '[]',
    UNIQUE(source_surah, source_ayah, target_surah, target_ayah)
);

-- Performance Indexes
CREATE INDEX idx_source ON similarities(source_surah, source_ayah);
CREATE INDEX idx_target ON similarities(target_surah, target_ayah);
CREATE INDEX idx_juzz ON ayahs(juzz);

-- Users Table
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL
);

-- Diary Logs Table
-- Diary Logs Table
CREATE TABLE IF NOT EXISTS diary_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    type TEXT NOT NULL,
    range_from TEXT NOT NULL,
    range_to TEXT NOT NULL,
    score INTEGER NOT NULL CHECK(score >= 1 AND score <= 10),
    notes TEXT DEFAULT '',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id)
);

-- Daily Reflections Table
CREATE TABLE IF NOT EXISTS daily_reflections (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    reflection TEXT NOT NULL,
    date TEXT NOT NULL UNIQUE,
    FOREIGN KEY(user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    category TEXT NOT NULL,
    status TEXT DEFAULT 'pending',
    date TEXT NOT NULL,
    FOREIGN KEY(user_id) REFERENCES users(id)
);