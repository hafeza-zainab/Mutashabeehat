const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');

const dbPath = path.resolve(__dirname, '../data/quran.db');
const USER_ID = 2; // Your ID

const db = new sqlite3.Database(dbPath, (err) => {
    if (err) { console.error(err.message); process.exit(1); }
    console.log('Connected to database.');
});

const fixDate = (d) => {
    const p = d.trim().split('/');
    return `${p[2]}-${p[1]}-${p[0]}`;
};

function runQuery(sql, params) {
    return new Promise((resolve, reject) => {
        db.run(sql, params, function(err) { if (err) reject(err); else resolve(); });
    });
}

async function run() {
    try {
        // 1. CLEAN SLATE for User 2
        await runQuery("DELETE FROM diary_logs WHERE user_id = ?", [USER_ID]);
        console.log('🧹 Cleaned all old diary logs for User 2.\n');

        db.run('BEGIN TRANSACTION');
        let total = 0;

        // ==========================================
        // 1. QUR'AN MAP (heatmap_data.txt)
        // ==========================================
        console.log('Processing heatmap_data.txt...');
        const heatTxt = fs.readFileSync(path.resolve(__dirname, '../data/heatmap_data.txt'), 'utf8');
        const heatLines = heatTxt.split('\n');
        let currentJuzz = 0, heatCount = 0;
        
        for (const line of heatLines) {
           // BULLETPROOF: Catches "Sipara", "Siparah", "Juzz", "Juz"
            const jMatch = line.match(/(?:Sipara|Siparah|Juzz|Juz)\s+(\d+)/i);
            if (jMatch) { currentJuzz = parseInt(jMatch[1]); continue; }
            
            const pMatch = line.match(/Page\s+(\d+)\((\d+)\)\s*→\s*([\d.]+)/);
            if (pMatch && currentJuzz > 0) {
                const localPage = parseInt(pMatch[1]);
                const realPageMaybe = parseInt(pMatch[2]);
                // If Page 1(22), extract the 22! If Page 1(1), just use 1.
                const page = (realPageMaybe > localPage) ? realPageMaybe : localPage;
                const score = parseFloat(pMatch[3]);
                // Exact format expected by frontend map
                const rangeFrom = `Juzz ${currentJuzz} - Page ${page}`;
                await runQuery(
                    `INSERT INTO diary_logs (user_id, type, range_from, range_to, score, notes, created_at) VALUES (?, 'murajah', ?, '', ?, '', '2023-01-01')`,
                    [USER_ID, rangeFrom, score]
                );
                heatCount++;
            }
        }
        console.log(`✅ Imported ${heatCount} Heatmap pages.`);
        total += heatCount;

        // ==========================================
        // 2. MURAJAH (murajah_history.txt)
        // ==========================================
        console.log('Processing murajah_history.txt...');
        const murTxt = fs.readFileSync(path.resolve(__dirname, '../data/murajah_history.txt'), 'utf8');
        const murLines = murTxt.split('\n');
        let murCount = 0;
        
        for (const line of murLines) {
            // Skip comments and empty lines
            if (line.startsWith('#') || line.startsWith('-') || line.trim() === '') continue;
            
                        const dateMatch = line.match(/(\d{2}\/\d{2}\/\d{4})/);
            if (dateMatch) {
                const date = fixDate(dateMatch[1]);
                
                // BULLETPROOF: Matches ANY arrow (→, ->, -->, -) and grabs ALL Juzz on the line
            const juzzMatches = [...line.matchAll(/(\d+)\s*\((\d+)\)/g)];
                
                if (juzzMatches.length > 0) {
                    for (const jm of juzzMatches) {
                        const juzz = jm[1];
                        const score = parseInt(jm[2]);
                        const rangeFrom = `Juzz ${juzz}`;
                        await runQuery(
                            `INSERT INTO diary_logs (user_id, type, range_from, range_to, score, notes, created_at) VALUES (?, 'murajah', ?, '', ?, '', ?)`,
                            [USER_ID, rangeFrom, score, date]
                        );
                        murCount++;
                    }
                }
            }
        }
        console.log(`✅ Imported ${murCount} Murajah entries.`);
        total += murCount;

        // ==========================================
        // 3. JADEED (jadeed_history.txt)
        // ==========================================
        console.log('Processing jadeed_history.txt...');
        const jadTxt = fs.readFileSync(path.resolve(__dirname, '../data/jadeed_history.txt'), 'utf8');
        const jadLines = jadTxt.split('\n');
        let jadCount = 0;
        
        for (const line of jadLines) {
            if (line.startsWith('#') || line.startsWith('-') || line.trim() === '') continue;
            
            const parts = line.split(',');
            if (parts.length >= 4) {
                const date = fixDate(parts[0]);
                const rangeFrom = parts[1].trim();
                const rangeTo = parts[2].trim();
                const score = parseInt(parts[3].trim());
                
                if (!isNaN(score)) {
                    await runQuery(
                        `INSERT INTO diary_logs (user_id, type, range_from, range_to, score, notes, created_at) VALUES (?, 'jadeed', ?, ?, ?, '', ?)`,
                        [USER_ID, rangeFrom, rangeTo, score, date]
                    );
                    jadCount++;
                }
            }
        }
        console.log(`✅ Imported ${jadCount} Jadeed entries.`);
        total += jadCount;

        db.run('COMMIT', (err) => {
            if (err) console.error('❌ Commit failed:', err);
            else console.log(`\n🎉 SUCCESS! Total imported: ${total} entries.`);
            db.close();
        });

    } catch(err) {
        console.error("❌ Fatal error:", err);
        db.close();
    }
}

run();