// C:\quran-similarity-app\backend\scripts\previewThemes.js
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const dbPath = path.resolve(__dirname, '../data/quran.db');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) { console.error(err); process.exit(1); }
});

const USER_ID = 2;

// Each theme set to a DIFFERENT milestone so you see every visual state
const THEMES = [
    { id: 'forest',    streak: 365, max: 400, label: '365d — Legendary 🏔️' },
    { id: 'house',     streak: 200, max: 250, label: '200d — Aurora 🌈' },
    { id: 'sky',       streak: 100, max: 150, label: '100d — Galaxy 🔭' },
    { id: 'lanterns',  streak: 60,  max: 90,  label: '60d — Nebula 🌌' },
    { id: 'garden',    streak: 30,  max: 45,  label: '30d — Lantern 🏮' },
    { id: 'library',   streak: 14,  max: 20,  label: '14d — Star Cluster ⭐' },
    { id: 'mountain',  streak: 7,   max: 10,  label: '7d — Crescent 🌙' },
    { id: 'oasis',     streak: 365, max: 380, label: '365d — Legendary 🌆' },
    { id: 'ship',      streak: 100, max: 120, label: '100d — Galaxy 🧭' },
    { id: 'city',      streak: 365, max: 420, label: '365d — Legendary ✨' },
];

console.log(`\n🎨 Seeding preview themes for user ${USER_ID}...\n`);

db.serialize(() => {
    // Step 1: Remove existing themes for this user
    db.run('DELETE FROM user_themes WHERE user_id = ?', [USER_ID], (err) => {
        if (err) console.error('Delete error:', err);

        let count = 0;

        // Step 2: Insert all 10 themes (NONE active → forces theme selector)
        THEMES.forEach(theme => {
            db.run(
                `INSERT INTO user_themes 
                    (user_id, theme_id, streak, max_streak, frozen_streak, is_active) 
                 VALUES (?, ?, ?, ?, ?, 0)`,
                [USER_ID, theme.id, theme.streak, theme.max, theme.streak - 1],
                (err) => {
                    if (err) {
                        console.error(`  ❌ ${theme.id}: ${err.message}`);
                    } else {
                        console.log(`  ✅ ${theme.id.padEnd(12)} ${theme.label}`);
                    }
                    count++;
                    if (count === THEMES.length) finish();
                }
            );
        });
    });
});

function finish() {
    console.log('\n' + '─'.repeat(50));
    console.log('✅ All 10 themes seeded!');
    console.log('─'.repeat(50));
    console.log('\nWhat you will see:');
    console.log('  1. Theme selector modal appears on next load');
    console.log('  2. Each theme card shows its preview streak level');
    console.log('  3. Click any theme → banner shows at that milestone');
    console.log('  4. Switch freely between all 10 themes');
    console.log('\nVisual levels you can preview:');
    console.log('  🏔️  forest   → Legendary (365d)');
    console.log('  🌈  house    → Aurora (200d)');
    console.log('  🔭  sky      → Galaxy (100d)');
    console.log('  🌌  lanterns → Nebula (60d)');
    console.log('  🏮  garden   → Lantern (30d)');
    console.log('  ⭐  library  → Star Cluster (14d)');
    console.log('  🌙  mountain → Crescent (7d)');
    console.log('  🌆  oasis    → Legendary (365d)');
    console.log('  🧭  ship     → Galaxy (100d)');
    console.log('  ✨  city     → Legendary (365d)');
    console.log('\nTo reset later: DELETE FROM user_themes WHERE user_id = 2;\n');

    db.close();
}