// C:\quran-similarity-app\backend\scripts\resetThemes.js
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const dbPath = path.resolve(__dirname, '../data/quran.db');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) { console.error(err); process.exit(1); }
});

const USER_ID = 2;

db.run('DELETE FROM user_themes WHERE user_id = ?', [USER_ID], function(err) {
    if (err) console.error('❌', err.message);
    else console.log(`✅ All themes cleared for user ${USER_ID}`);
    db.close();
});