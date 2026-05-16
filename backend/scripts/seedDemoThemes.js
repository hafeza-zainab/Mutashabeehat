// C:\quran-similarity-app\backend\scripts\seedDemoThemes.js
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const dbPath = path.resolve(__dirname, '../data/quran.db');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) { console.error(err); process.exit(1); }
});

const USER_ID = 2;
const STREAK = 365;

const THEMES = [
    'forest', 'house', 'sky', 'lanterns', 'garden',
    'library', 'mountain', 'oasis', 'ship', 'city'
];

console.log(`\n🎨 Seeding DEMO themes for user ${USER_ID} at ${STREAK} days...\n`);

db.serialize(() => {
    // Clear existing
    db.run('DELETE FROM user_themes WHERE user_id = ?', [USER_ID], (err) => {
        if (err) { console.error('Delete error:', err); db.close(); return; }

        let count = 0;
        const today = new Date().toISOString().split('T')[0];

        THEMES.forEach((themeId, index) => {
            const isActive = index === 0 ? 1 : 0; // forest active by default
            const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

            db.run(
                `INSERT INTO user_themes 
                    (user_id, theme_id, streak, max_streak, frozen_streak, last_log_date, is_active) 
                 VALUES (?, ?, ?, ?, ?, ?, ?)`,
                [USER_ID, themeId, STREAK, STREAK, STREAK, yesterday, isActive],
                (err) => {
                    if (err) {
                        console.error(`  ❌ ${themeId}: ${err.message}`);
                    } else {
                        const badge = isActive ? '← ACTIVE' : '';
                        console.log(`  ✅ ${themeId.padEnd(12)} ${STREAK} days  ${badge}`);
                    }
                    count++;
                    if (count === THEMES.length) {
                        console.log('\n' + '─'.repeat(45));
                        console.log('✅ All 10 themes at 5-year progress!');
                        console.log('─'.repeat(45));
                        console.log('\nSwitch freely — all themes stay at 365 days.');
                        console.log('No 7-day lock applies.\n');
                        db.close();
                    }
                }
            );
        });
    });
});