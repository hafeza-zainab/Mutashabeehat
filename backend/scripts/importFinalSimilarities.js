// backend/scripts/importFinalSimilarities.js
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const dbPath = path.resolve(__dirname, '../data/quran.db');
const dataPath = path.resolve(__dirname, '../data/unique_pairs.json');

const db = new sqlite3.Database(dbPath, (err) => {
    if (err) { console.error(err.message); process.exit(1); }
    console.log('Connected to database.');
});

let pairs = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

// SAFEGUARD: Filter out any pairs that contain Ayah 0
const validPairs = pairs.filter(pair => pair.ayah_1 !== 0 && pair.ayah_2 !== 0);
const discardedCount = pairs.length - validPairs.length;

if (discardedCount > 0) {
    console.log(`⚠️ Filtered out ${discardedCount} invalid pairs containing Ayah 0.`);
}

console.log(`Importing ${validPairs.length} valid pairs (creating ${validPairs.length * 2} DB rows)...`);

db.serialize(() => {
    db.run('BEGIN TRANSACTION');
    db.run('DELETE FROM similarities'); // Clear old ones

    validPairs.forEach(pair => { // <-- Notice we changed 'pairs' to 'validPairs' here
        const tipsString = JSON.stringify(pair.tips);
        const score = pair.similarity_score;

        // Insert Direction 1 -> 2
        // C:\quran-similarity-app\backend\scripts\importFinalSimilarities.js
db.run(
    `INSERT OR IGNORE INTO similarities (source_surah, source_ayah, source_page, target_surah, target_ayah, target_page, similarity_score, tips) 
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [pair.surah_1, pair.ayah_1, pair.page_1, pair.surah_2, pair.ayah_2, pair.page_2, score, tipsString]
);

db.run(
    `INSERT OR IGNORE INTO similarities (source_surah, source_ayah, source_page, target_surah, target_ayah, target_page, similarity_score, tips) 
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [pair.surah_2, pair.ayah_2, pair.page_2, pair.surah_1, pair.ayah_1, pair.page_1, score, tipsString]
);
    });

    db.run('COMMIT', (err) => {
        if (err) console.error(err);
        else console.log(`✅ SUCCESS! Database populated with bidirectional pairs and shared tips.`);
        db.close();
    });
});