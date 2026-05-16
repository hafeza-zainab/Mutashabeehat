//C:\quran-similarity-app\backend\scripts\add-tasks-table.js
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const dbPath = path.resolve(__dirname, '../data/quran.db');
const db = new sqlite3.Database(dbPath, (err) => { if(err) console.error(err); });

console.log("Adding tasks table...");
db.run(`
    CREATE TABLE IF NOT EXISTS tasks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        title TEXT NOT NULL,
        category TEXT NOT NULL, -- 'murajah', 'jadeed', 'juzz_hali', 'tasmee', 'general'
        status TEXT DEFAULT 'pending', -- 'pending', 'in_progress', 'completed'
        date TEXT NOT NULL,
        FOREIGN KEY(user_id) REFERENCES users(id)
    );
`);
db.close(() => console.log("✅ Tasks table ready!"));