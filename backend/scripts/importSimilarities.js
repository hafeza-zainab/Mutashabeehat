// backend/scripts/importSimilarities.js
/**
 * scripts/importSimilarities.js
 *
 * Reads unique_pairs.json and populates the similarities table bidirectionally.
 * Run after generateSimilarities.js.
 *
 * Usage:
 *   node scripts/importSimilarities.js
 */

require("dotenv").config();

const sqlite3 = require("sqlite3").verbose();
const fs      = require("fs");
const path    = require("path");

const DB_PATH   = path.resolve(__dirname, "../data/quran.db");
const DATA_PATH = path.resolve(__dirname, "../data/unique_pairs.json");

const db = new sqlite3.Database(DB_PATH, (err) => {
    if (err) { console.error("❌", err.message); process.exit(1); }
    console.log("Connected to database.");
});

const run = (sql, p = []) =>
    new Promise((res, rej) => db.run(sql, p, function (e) { e ? rej(e) : res(this); }));

async function importSimilarities() {
    if (!fs.existsSync(DATA_PATH)) {
        console.error("❌ unique_pairs.json not found. Run generateSimilarities.js first.");
        process.exit(1);
    }

    const allPairs = JSON.parse(fs.readFileSync(DATA_PATH, "utf8"));

    // Filter out any bad data with ayah = 0
    const pairs = allPairs.filter((p) => p.ayah_1 !== 0 && p.ayah_2 !== 0);
    const discarded = allPairs.length - pairs.length;
    if (discarded > 0) console.log(`⚠️  Filtered out ${discarded} invalid pairs (ayah = 0).`);

    console.log(`Importing ${pairs.length} pairs → ${pairs.length * 2} rows...`);

    await run("BEGIN TRANSACTION");
    await run("DELETE FROM similarities");

    try {
        const INSERT = `
            INSERT OR IGNORE INTO similarities
                (source_surah, source_ayah, source_page, target_surah, target_ayah, target_page, similarity_score, tips)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;

        for (const p of pairs) {
            const tips = JSON.stringify(p.tips || []);
            await run(INSERT, [p.surah_1, p.ayah_1, p.page_1, p.surah_2, p.ayah_2, p.page_2, p.similarity_score, tips]);
            await run(INSERT, [p.surah_2, p.ayah_2, p.page_2, p.surah_1, p.ayah_1, p.page_1, p.similarity_score, tips]);
        }

        await run("COMMIT");
        console.log("✅ Similarities imported successfully.\n");
    } catch (err) {
        await run("ROLLBACK");
        console.error("❌ Import failed:", err.message);
        process.exit(1);
    } finally {
        db.close();
    }
}

importSimilarities();