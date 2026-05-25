// backend/scripts/setupDatabase.js
/**
 * scripts/setupDatabase.js
 *
 * Creates all tables, indexes, and imports ayah data from quran.json.
 * Safe to re-run — uses CREATE TABLE IF NOT EXISTS and INSERT OR REPLACE.
 *
 * Usage:
 *   node scripts/setupDatabase.js
 */

require("dotenv").config();

const sqlite3 = require("sqlite3").verbose();
const fs      = require("fs");
const path    = require("path");

const DB_PATH   = path.resolve(__dirname, "../data/quran.db");
const SQL_PATH  = path.resolve(__dirname, "../database/schema.sql");
const JSON_PATH = path.resolve(__dirname, "../data/quran.json");

const SURAH_NAMES = require("../utils/surahNames");

// ─── Helpers ─────────────────────────────────────────────────────────────────

const db = new sqlite3.Database(DB_PATH, (err) => {
    if (err) { console.error("❌ Cannot open database:", err.message); process.exit(1); }
    console.log("✅ Connected to:", DB_PATH);
});

const run  = (sql, p = []) => new Promise((res, rej) => db.run(sql, p, function (e) { e ? rej(e) : res({ id: this.lastID, changes: this.changes }); }));
const exec = (sql)          => new Promise((res, rej) => db.exec(sql, (e) => e ? rej(e) : res()));
const all  = (sql, p = []) => new Promise((res, rej) => db.all(sql, p, (e, rows) => e ? rej(e) : res(rows)));
const get  = (sql, p = []) => new Promise((res, rej) => db.get(sql, p, (e, row) => e ? rej(e) : res(row)));

async function migrateLegacyAyahsTable() {
    const columns = await all("PRAGMA table_info(ayahs)");
    if (columns.length === 0) return;

    const names = new Set(columns.map((column) => column.name));
    if (names.has("juzz") && !names.has("juz")) {
        console.log("Renaming legacy ayahs.juzz column to ayahs.juz...");
        await run("ALTER TABLE ayahs RENAME COLUMN juzz TO juz");
    }
}

async function migrateTaskCategoriesTable() {
    const table = await get("SELECT sql FROM sqlite_master WHERE type = 'table' AND name = 'tasks'");
    if (!table) return;

    const columns = await all("PRAGMA table_info(tasks)");
    const names = new Set(columns.map((column) => column.name));
    const hasCreatedAt = names.has("created_at");
    const createdAtSelect = hasCreatedAt ? "created_at" : "CURRENT_TIMESTAMP";

    if (table.sql.includes("Juz_Hali") && !table.sql.includes("juz_hali") && !table.sql.includes("juzz_hali")) {
        return;
    }

    console.log("Migrating tasks.category to use Juz_Hali...");
    await exec(`
        PRAGMA foreign_keys = OFF;

        CREATE TABLE tasks_new (
            id         INTEGER  PRIMARY KEY AUTOINCREMENT,
            user_id    INTEGER  NOT NULL,
            title      TEXT     NOT NULL,
            category   TEXT     NOT NULL CHECK(category IN ('murajah','jadeed','Juz_Hali','tasmee','general')),
            status     TEXT     NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','in_progress','completed')),
            date       TEXT     NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
        );

        INSERT INTO tasks_new (id, user_id, title, category, status, date, created_at)
        SELECT id, user_id, title,
               CASE category
                   WHEN 'juz_hali' THEN 'Juz_Hali'
                   WHEN 'juzz_hali' THEN 'Juz_Hali'
                   ELSE category
               END,
               COALESCE(status, 'pending'), date, ${createdAtSelect}
        FROM tasks
        WHERE category IN ('murajah','jadeed','juz_hali','juzz_hali','Juz_Hali','tasmee','general');

        DROP TABLE tasks;
        ALTER TABLE tasks_new RENAME TO tasks;
        PRAGMA foreign_keys = ON;
    `);
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function setup() {
    try {
        await migrateLegacyAyahsTable();
        await migrateTaskCategoriesTable();

        // 1. Apply schema
        console.log("\n📋 Applying schema...");
        if (!fs.existsSync(SQL_PATH)) throw new Error("schema.sql not found at " + SQL_PATH);
        await exec(fs.readFileSync(SQL_PATH, "utf8"));
        console.log("✅ Schema applied.");

        // 2. Import ayahs
        console.log("\n📥 Importing ayahs...");
        if (!fs.existsSync(JSON_PATH)) throw new Error("quran.json not found at " + JSON_PATH);
        const ayahs = JSON.parse(fs.readFileSync(JSON_PATH, "utf8"));

        await run("BEGIN TRANSACTION");
        let imported = 0;
        for (const a of ayahs) {
            await run(
                `INSERT OR REPLACE INTO ayahs (surah, ayah, page, text, juz, marhala, name)
                 VALUES (?, ?, ?, ?, ?, ?, ?)`,
                [a.Surah, a.Ayah, a.Page ?? 0, a.Text, a.Juz ?? a.Juzz, a.Marhala,
                 SURAH_NAMES[a.Surah] || `Surah ${a.Surah}`]
            );
            imported++;
        }
        await run("COMMIT");
        console.log(`✅ Imported ${imported} ayahs.`);

        // 3. Verify
        console.log("\n🔍 Verifying tables...");
        const tables = ["ayahs", "similarities", "users", "diary_logs", "tasks", "user_themes"];
        for (const t of tables) {
            const row = await new Promise((res, rej) =>
                db.get(`SELECT name FROM sqlite_master WHERE type='table' AND name=?`, [t], (e, r) => e ? rej(e) : res(r))
            );
            console.log(row ? `  ✅ ${t}` : `  ❌ ${t} MISSING`);
        }

        console.log("\n🎉 Setup complete. Run: npm start\n");
    } catch (err) {
        await run("ROLLBACK").catch(() => {});
        console.error("❌ Setup failed:", err.message);
        process.exit(1);
    } finally {
        db.close();
    }
}

setup();
