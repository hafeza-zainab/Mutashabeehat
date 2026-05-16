// C:\quran-similarity-app\backend\scripts\importHistory.js
const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');

const dbPath = path.resolve(__dirname, '../data/quran.db');
const jadeedPath = path.resolve(__dirname, '../data/jadeed_history.txt');
const murajahPath = path.resolve(__dirname, '../data/murajah_history.txt');

// ⚠️ CHANGE THIS TO YOUR ID
const USER_ID = 2; 

const fixDate = (d) => {
    const p = d.trim().split('/');
    if(p.length === 3) return `${p[2]}-${p[1]}-${p[0]}`;
    return d;
};

const db = new sqlite3.Database(dbPath, (err) => {
    if (err) { console.error(err.message); process.exit(1); }
    console.log('Connected to database.');
});

async function importData() {
    try {
        // Clean slate for this user to prevent duplicates
// Only deletes text-file history, IGNORES heatmap data (which contains "Page")
await db.run("DELETE FROM diary_logs WHERE user_id = ? AND type IN ('jadeed', 'murajah') AND range_from NOT LIKE '%Page%'", [USER_ID]);        console.log('Cleaned old imported history for User', USER_ID);

        db.serialize(() => {
            db.run('BEGIN TRANSACTION');

            // ==========================================
            // 1. JADEED
            // ==========================================
            if (fs.existsSync(jadeedPath)) {
                const lines = fs.readFileSync(jadeedPath, 'utf8').split('\n').filter(l => l.trim());
                let count = 0;
                
                lines.forEach(line => {
                    const parts = line.split(',');
                    if (parts.length >= 4) {
                        const date = fixDate(parts[0]);
                        const rangeFrom = parts[1].trim();
                        const rangeTo = parts[2].trim();
                        const score = parseInt(parts[3].trim());
                        
                        if (!isNaN(score) && date.includes('-')) {
                            db.run(
                                `INSERT INTO diary_logs (user_id, type, range_from, range_to, score, notes, created_at) VALUES (?, ?, ?, ?, ?, '', ?)`,
                                [USER_ID, 'jadeed', rangeFrom, rangeTo, score, date]
                            );
                            count++;
                        }
                    }
                });
                console.log(`✅ Imported ${count} Jadeed entries.`);
            }

            // ==========================================
            // 2. MURAJAH (BULLETPROOF FOR MULTIPLE JUZZ PER LINE)
            // ==========================================
            if (fs.existsSync(murajahPath)) {
                const lines = fs.readFileSync(murajahPath, 'utf8').split('\n').filter(l => l.trim());
                let count = 0;
                
                lines.forEach(line => {
                    const dateMatch = line.match(/(\d{2}\/\d{2}\/\d{4})/);
                    if (!dateMatch) return;
                    
                    const date = fixDate(dateMatch[1]);
                    
                    // MAGIC FIX: Find ALL "(number)" pairs on the line, not just the first one!
                    // Matches formats like: "→ 1 (8)", "→ 1 (8), 2 (9)", "1 (8) , 2 (9)"
                    const juzzMatches = [...line.matchAll(/(\d+)\s*\((\d+)\)/g)];
                    
                    if (juzzMatches.length > 0) {
                        juzzMatches.forEach(match => {
                            const juzz = match[1];
                            const score = parseInt(match[2]);
                            
                            db.run(
                                `INSERT INTO diary_logs (user_id, type, range_from, range_to, score, notes, created_at) VALUES (?, ?, ?, '', ?, '', ?)`,
                                [USER_ID, 'murajah', `Juzz ${juzz}`, score, date]
                            );
                            count++;
                        });
                    }
                });
                console.log(`✅ Imported ${count} Murajah entries.`);
            }

            db.run('COMMIT', (err) => {
                if (err) console.error('❌ Commit failed:', err);
                else console.log('\n🎉 Import complete!');
                db.close();
            });
        });
    } catch (error) {
        console.error('❌ Import Error:', error);
        db.close();
    }
}

importData();