const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');

const dbPath = path.resolve(__dirname, '../data/quran.db');
const dataPath = path.resolve(__dirname, '../data/heatmap_data.txt');

const db = new sqlite3.Database(dbPath, (err) => {
    if (err) { console.error('DB Error:', err.message); process.exit(1); }
});

const dbAsync = {
    run: (sql, params = []) => new Promise((resolve, reject) => {
        db.run(sql, params, function(err) { if (err) reject(err); else resolve({ changes: this.changes }); });
    }),
    all: (sql, params = []) => new Promise((resolve, reject) => {
        db.all(sql, params, (err, rows) => { if (err) reject(err); else resolve(rows); });
    })
};

async function run() {
    const USER_ID = 2; // Your ID
    const OLD_DATE = '2023-01-01';

    try {
        // 1. Check if pages already exist so we NEVER duplicate or delete
        const existing = await dbAsync.all(`SELECT id FROM diary_logs WHERE user_id = ? AND range_from LIKE '%Page%' LIMIT 1`, [USER_ID]);
        
        if (existing.length > 0) {
            console.log(`✅ Heatmap data already exists (${existing.length} found). Doing nothing to keep it safe.`);
            db.close();
            return;
        }

        // 2. Parse and Insert
        const rawData = fs.readFileSync(dataPath, 'utf8');
        const lines = rawData.split('\n').map(l => l.trim()).filter(l => l.length > 0);
        let currentJuzz = 0;
        let inserted = 0;

        db.run('BEGIN TRANSACTION');

        for (const line of lines) {
            const juzzMatch = line.match(/Sipara\s+(\d+)/i);
            if (juzzMatch) { currentJuzz = parseInt(juzzMatch[1]); continue; }
            
            const pageMatch = line.match(/Page\s+(\d+)\((\d+)\)\s*→\s*([\d.]+)/);
            if (pageMatch && currentJuzz > 0) {
                const localPage = parseInt(pageMatch[1]);
                const score = parseFloat(pageMatch[3]);
                const rangeFrom = `Juzz ${currentJuzz} - Page ${localPage}`;
                
                await dbAsync.run(
                    `INSERT INTO diary_logs (user_id, type, range_from, range_to, score, notes, created_at) VALUES (?, 'murajah', ?, '', ?, '', ?)`,
                    [USER_ID, rangeFrom, score, OLD_DATE]
                );
                inserted++;
            }
        }

        db.run('COMMIT');
        console.log(`✅ SUCCESS! Safely inserted ${inserted} page entries.`);
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        db.close();
    }
}

run();