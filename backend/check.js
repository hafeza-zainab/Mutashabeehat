const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const dbPath = path.resolve(__dirname, './data/quran.db');
const db = new sqlite3.Database(dbPath);

console.log("Checking Database for User 2...\n");

db.serialize(() => {
    // 1. Check if data exists
    console.log("--- CHECK 1: Total Data ---");
    db.all("SELECT type, COUNT(*) as count, MIN(created_at) as oldest, MAX(created_at) as newest FROM diary_logs WHERE user_id = 2 GROUP BY type", [], (err, rows) => {
        if (err) console.error(err);
        else console.log(rows);
    });

    // 2. Check Qur'an Map format
    console.log("\n--- CHECK 2: Qur'an Map Format (range_from) ---");
    db.all("SELECT range_from FROM diary_logs WHERE user_id = 2 AND type = 'murajah' AND range_from LIKE '%Page%' LIMIT 5", [], (err, rows) => {
        if (err) console.error(err);
        else console.log(rows);
    });

    // 3. Check dates for chart
    console.log("\n--- CHECK 3: Date Grouping for Chart ---");
    db.all("SELECT DATE(created_at) as d, SUM(score) as total FROM diary_logs WHERE user_id = 2 AND created_at > '2019-01-01' GROUP BY d LIMIT 5", [], (err, rows) => {
        if (err) console.error(err);
        else console.log(rows);
    });
});

db.close();