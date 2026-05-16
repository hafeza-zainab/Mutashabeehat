// C:\quran-similarity-app\backend\fixDB.js
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const dbPath = path.resolve(__dirname, 'data/quran.db');

console.log('Connecting to database...');
const db = new sqlite3.Database(dbPath, function(err) {
    if (err) { console.error('DB Error:', err.message); process.exit(1); }
    console.log('Checking current state...');

    db.get("SELECT COUNT(*) as count FROM diary_logs", [], function(err, row) {
        if (err) { console.error('Check failed:', err.message); process.exit(1); }
        
        var count = row ? row.count : 0;
        console.log('Found ' + count + ' rows.');

        if (count === 0) {
            console.log('Table is empty or missing. Creating fresh table...');
            db.serialize(function() {
                db.run(`CREATE TABLE IF NOT EXISTS diary_logs (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    user_id INTEGER NOT NULL,
                    type TEXT NOT NULL,
                    range_from TEXT NOT NULL,
                    range_to TEXT NOT NULL,
                    score INTEGER NOT NULL CHECK(score >= 1 AND score <= 10),
                    notes TEXT DEFAULT '',
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY(user_id) REFERENCES users(id)
                )`, function(err) {
                    if (err) { console.error('Create failed:', err.message); process.exit(1); }
                    console.log('✅ Fresh table created!');
                    db.close();
                });
            });
            return;
        }

        console.log('Table exists with data. No action needed.');
        db.close();
    });
});