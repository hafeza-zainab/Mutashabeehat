// backend/scripts/addPageColumn.js
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const dbPath = path.resolve(__dirname, '../data/quran.db');
const db = new sqlite3.Database(dbPath, (err) => { if(err) console.error(err); });

console.log("Adding page column safely...");
db.serialize(() => {
    db.run(`ALTER TABLE ayahs ADD COLUMN page INTEGER;`);
    db.run(`CREATE INDEX IF NOT EXISTS idx_page ON ayahs(page);`);
});
db.close(() => console.log("✅ Page column added to database!"));