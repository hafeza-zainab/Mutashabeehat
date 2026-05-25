// C:\quran-similarity-app\backend\scripts\importHistory.js
/**
 * scripts/importHistory.js
 *
 * Imports historical diary data from text files into the database.
 *
 * Files read (all in ../data/):
 *   - heatmap_data.txt  → Juz/Page level murajah scores
 *   - murajah_history.txt → dated murajah log entries
 *   - jadeed_history.txt  → dated jadeed log entries
 *
 * Usage:
 *   USER_ID=2 node scripts/importHistory.js
 *   node scripts/importHistory.js           # defaults to USER_ID=1
 */

require("dotenv").config();

const sqlite3 = require("sqlite3").verbose();
const fs      = require("fs");
const path    = require("path");

const DB_PATH = path.resolve(__dirname, "../data/quran.db");
const USER_ID = parseInt(process.env.USER_ID || "1", 10);

const db = new sqlite3.Database(DB_PATH, (err) => {
    if (err) { console.error("❌", err.message); process.exit(1); }
});

const run = (sql, p = []) =>
    new Promise((res, rej) => db.run(sql, p, function (e) { e ? rej(e) : res(this); }));

// dd/mm/yyyy → yyyy-mm-dd
const fixDate = (d) => {
    const [dd, mm, yyyy] = d.trim().split("/");
    return `${yyyy}-${mm}-${dd}`;
};

async function importAll() {
    let total = 0;
    await run("BEGIN TRANSACTION");

    try {
        // ── 1. Heatmap (Juz/Page scores) ──────────────────────────────────
        const heatPath = path.resolve(__dirname, "../data/heatmap_data.txt");
        if (fs.existsSync(heatPath)) {
            await run(
                `DELETE FROM diary_logs WHERE user_id = ? AND type = 'murajah' AND range_from LIKE '%Page%'`,
                [USER_ID]
            );

            const lines = fs.readFileSync(heatPath, "utf8").split("\n");
            let juz = 0, count = 0;

            for (const line of lines) {
                const juzMatch = line.match(/(?:Sipara|Siparah|Juzz|Juz)\s+(\d+)/i);
                if (juzMatch) { juz = parseInt(juzMatch[1]); continue; }

                const pageMatch = line.match(/Page\s+(\d+)\((\d+)\)\s*→\s*([\d.]+)/);
                if (pageMatch && juz > 0) {
                    const localPage = parseInt(pageMatch[1]);
                    const realPage  = parseInt(pageMatch[2]);
                    const page      = realPage > localPage ? realPage : localPage;
                    const score     = parseFloat(pageMatch[3]);
                    const rangeFrom = `Juz ${juz} - Page ${page}`;

                    await run(
                        `INSERT INTO diary_logs (user_id, type, range_from, range_to, score, time_spent, difficulty, created_at)
                         VALUES (?, 'murajah', ?, '', ?, 0, 3, '2023-01-01T00:00:00')`,
                        [USER_ID, rangeFrom, score]
                    );
                    count++;
                }
            }
            console.log(`✅ Heatmap: ${count} entries`);
            total += count;
        }

        // ── 2. Murajah history ─────────────────────────────────────────────
        const murPath = path.resolve(__dirname, "../data/murajah_history.txt");
        if (fs.existsSync(murPath)) {
            await run(
                `DELETE FROM diary_logs WHERE user_id = ? AND type = 'murajah' AND range_from NOT LIKE '%Page%'`,
                [USER_ID]
            );

            const lines = fs.readFileSync(murPath, "utf8").split("\n");
            let count = 0;

            for (const line of lines) {
                if (line.startsWith("#") || !line.trim()) continue;
                const dateMatch = line.match(/(\d{2}\/\d{2}\/\d{4})/);
                if (!dateMatch) continue;

                const date    = fixDate(dateMatch[1]);
                const matches = [...line.matchAll(/(\d+)\s*\((\d+)\)/g)];

                for (const m of matches) {
                    await run(
                        `INSERT INTO diary_logs (user_id, type, range_from, range_to, score, time_spent, difficulty, created_at)
                         VALUES (?, 'murajah', ?, '', ?, 0, 3, ?)`,
                        [USER_ID, `Juz ${m[1]}`, parseInt(m[2]), `${date}T00:00:00`]
                    );
                    count++;
                }
            }
            console.log(`✅ Murajah: ${count} entries`);
            total += count;
        }

        // ── 3. Jadeed history ──────────────────────────────────────────────
        const jadPath = path.resolve(__dirname, "../data/jadeed_history.txt");
        if (fs.existsSync(jadPath)) {
            await run(`DELETE FROM diary_logs WHERE user_id = ? AND type = 'jadeed'`, [USER_ID]);

            const lines = fs.readFileSync(jadPath, "utf8").split("\n");
            let count = 0;

            for (const line of lines) {
                if (line.startsWith("#") || !line.trim()) continue;
                const parts = line.split(",");
                if (parts.length < 4) continue;

                const date      = fixDate(parts[0]);
                const rangeFrom = parts[1].trim();
                const rangeTo   = parts[2].trim();
                const score     = parseInt(parts[3].trim(), 10);

                if (!isNaN(score)) {
                    await run(
                        `INSERT INTO diary_logs (user_id, type, range_from, range_to, score, time_spent, difficulty, created_at)
                         VALUES (?, 'jadeed', ?, ?, ?, 0, 3, ?)`,
                        [USER_ID, rangeFrom, rangeTo, score, `${date}T00:00:00`]
                    );
                    count++;
                }
            }
            console.log(`✅ Jadeed: ${count} entries`);
            total += count;
        }

        await run("COMMIT");
        console.log(`\n🎉 Total imported: ${total} entries for user ${USER_ID}\n`);
    } catch (err) {
        await run("ROLLBACK");
        console.error("❌ Import failed:", err.message);
        process.exit(1);
    } finally {
        db.close();
    }
}

importAll();