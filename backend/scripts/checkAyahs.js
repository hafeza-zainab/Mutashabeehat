// C:\quran-similarity-app\backend\scripts\checkAyahs.js
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const dbPath = path.resolve(__dirname, '../data/quran.db');

const db = new sqlite3.Database(dbPath, (err) => {
    if (err) { console.error(err.message); process.exit(1); }
});

console.log('=== Checking Ayahs ===\n');

// Standard ayah counts
const LENGTHS = [
    0, 7, 286, 200, 176, 120, 165, 206, 75, 129, 111,
    123, 111, 43, 52, 99, 128, 111, 110, 98, 135,
    112, 78, 64, 77, 227, 93, 88, 69, 60, 34,
    30, 73, 54, 45, 83, 182, 88, 75, 85, 54,
    53, 89, 59, 37, 35, 36, 38, 29, 45,
    60, 49, 18,
    49,30,46,35,45,31,31,29,24,22,22,20,18,16,14,11,8,6,5,4,6,5,4,5,6,4,5,6,5,5,6,4,5,5,4,5,6,8,6,5,4,4,5,3,6,3,5,4,5,4,3,4,5,4,3,3,4,5,5,4,3,2,3,4,3,2,3,3,4,2,3,3,1,1,1,1,1,1,1,1
];

let problemsFound = 0;
let checked = 0;

function checkSurah(surah) {
    const len = LENGTHS[surah];
    if (!len) { checked++; return; }

    // Surah 1: ayahs 1 to 7 (NO Ayah 0)
    // Surahs 2-114: ayahs 0 to N (HAS Ayah 0)
    const minAyah = (surah === 1) ? 1 : 0;
    const maxAyah = len;
    const expectedCount = (surah === 1) ? len : len + 1;

    db.all(
        `SELECT ayah FROM ayahs WHERE surah = ? ORDER BY ayah ASC`,
        [surah],
        (err, rows) => {
            checked++;
            if (err) return;

            const actual = rows.length;
            const existing = rows.map(r => r.ayah);
            const missing = [];

            for (let a = minAyah; a <= maxAyah; a++) {
                if (!existing.includes(a)) missing.push(a);
            }

            if (actual !== expectedCount || missing.length > 0) {
                problemsFound++;
                console.log(`❌ Surah ${surah}: Expected ${expectedCount} (${minAyah}-${maxAyah}), found ${actual}, missing: [${missing.join(',')}]`);
            }
            
            if (checked === 114) {
                console.log('\n' + '='.repeat(40));
                if (problemsFound === 0) {
                    console.log('✅ Database is perfect!');
                } else {
                    console.log(`❌ ${problemsFound} surah(s) have issues`);
                }
                console.log('='.repeat(40));
                db.close();
            }
        }
    );
}

for (let s = 1; s <= 114; s++) checkSurah(s);