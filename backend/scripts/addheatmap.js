const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');

const dbPath = path.resolve(__dirname, 'backend/data/quran.db');
const dataPath = path.resolve(__dirname, 'backend/data/heatmap_data.txt');

const db = new sqlite3.Database(dbPath, (err) => {
    if (err) { console.error('DB Error:', err.message); process.exit(1); }
    console.log('Connected to SQLite.');
});

const dbAsync = {
    run: (sql, params = []) => new Promise((resolve, reject) => {
        db.run(sql, params, function(err) { if (err) reject(err); else resolve({ changes: this.changes }); });
    })
};

function parseData(text) {
    const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    let currentJuz = 0;
    const entries = [];
    const juzRegex = /(?:Juz|Sipara|Siparah)\s+(\d+)/i;
    const pageRegex = /Page\s+(\d+)\((\d+)\)\s*→\s*([\d.]+)/;

    for (const line of lines) {
        const juzMatch = line.match(juzRegex);
        if (juzMatch) { currentJuz = parseInt(juzMatch[1]); continue; }
        const pageMatch = line.match(pageRegex);
        if (pageMatch && currentJuz > 0) {
            const localPage = parseInt(pageMatch[1]);
            const score = parseFloat(pageMatch[3]);
            const rangeFrom = `Juz ${currentJuz} - Page ${localPage}`;
            entries.push({ rangeFrom, score });
        }
    }
    return entries;
}

async function fixData() {
    try {
        if (!fs.existsSync(dataPath)) { console.error(`ERROR: Missing ${dataPath}`); process.exit(1); }
        const rawData = fs.readFileSync(dataPath, 'utf8');
        const entries = parseData(rawData);
        const USER_ID = 4;
        const OLD_DATE = '2023-01-01';

        const delRes = await dbAsync.run(`DELETE FROM diary_logs WHERE user_id = ? AND DATE(created_at) = DATE('now')`, [USER_ID]);
        console.log(`🗑️ Deleted ${delRes.changes} entries from today.`);

        const sql = `INSERT INTO diary_logs (user_id, type, range_from, range_to, score, notes, created_at) VALUES (?, 'murajah', ?, '', ?, '', ?)`;
        let inserted = 0;
        for (const entry of entries) {
            await dbAsync.run(sql, [USER_ID, entry.rangeFrom, entry.score, OLD_DATE]);
            inserted++;
        }

        console.log(`\n✅ Re-imported ${inserted} entries (${OLD_DATE}).`);
    } catch (error) {
        console.error('❌ Failed:', error.message);
    } finally {
        db.close();
    }
}

fixData();