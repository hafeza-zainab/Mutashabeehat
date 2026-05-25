//C:\quran-similarity-app\backend\scripts\add-users-table.js
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const dbPath = path.resolve(__dirname, '../data/quran.db');
const db = new sqlite3.Database(dbPath, (err) => { if(err) console.error(err); });

console.log("Adding users table...");
db.run(`
    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL
    );
`, (err) => {
    if(err) console.error(err);
    else console.log("✅ Users table ready!");
    db.close();
});