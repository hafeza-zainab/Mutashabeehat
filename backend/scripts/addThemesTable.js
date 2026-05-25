// C:\quran-similarity-app\backend\scripts\addThemesTable.js
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const dbPath = path.resolve(__dirname, '../data/quran.db');
const db = new sqlite3.Database(dbPath, (err) => { if (err) console.error(err); });

db.serialize(() => {
    db.run(`
        CREATE TABLE IF NOT EXISTS user_themes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            theme_id TEXT NOT NULL,
            streak INTEGER DEFAULT 0,
            max_streak INTEGER DEFAULT 0,
            frozen_streak INTEGER DEFAULT 0,
            last_log_date TEXT,
            is_active INTEGER DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(user_id, theme_id),
            FOREIGN KEY(user_id) REFERENCES users(id)
        );
    `);
    db.run('CREATE INDEX IF NOT EXISTS idx_user_theme_active ON user_themes(user_id, is_active)');
});
db.close(() => console.log('✅ user_themes table ready'));