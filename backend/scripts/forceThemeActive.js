// C:\quran-similarity-app\backend\scripts\forceThemeActive.js
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const dbPath = path.resolve(__dirname, '../data/quran.db');
const db = new sqlite3.Database(dbPath, (err) => { if (err) console.error(err); });

const USER_ID = 2;

// Change these to preview any theme at any streak
const THEME_ID = 'forest';
const STREAK = 365;

db.serialize(() => {
    db.run('UPDATE user_themes SET is_active = 0 WHERE user_id = ?', [USER_ID], () => {
        db.run(
            `UPDATE user_themes 
             SET is_active = 1, streak = ?, max_streak = ?, frozen_streak = ?, last_log_date = DATE('now')
             WHERE user_id = ? AND theme_id = ?`,
            [STREAK, STREAK, STREAK - 1, USER_ID, THEME_ID],
            (err) => {
                if (err) console.error(err);
                else console.log(`✅ ${THEME_ID} set to ${STREAK} days for user ${USER_ID}`);
                db.close();
            }
        );
    });
});