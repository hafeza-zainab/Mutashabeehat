/**
 * scripts/setup.js
 *
 * ONE script to rule them all. Run once (or any time) from the backend folder:
 *   node scripts/setup.js
 *
 * What it does, in order:
 *   1. Applies master schema (database/schema.sql)
 *   2. Runs any pending migration files from database/migrations/
 *   3. Imports ayah data from data/quran.json  (skips if already populated)
 *   4. Creates all coach / flashcard tables
 *
 * Safe to re-run — every statement uses IF NOT EXISTS / INSERT OR REPLACE.
 */

"use strict";

require("dotenv").config();

const sqlite3  = require("sqlite3").verbose();
const fs       = require("fs");
const path     = require("path");

const DB_PATH        = path.resolve(__dirname, "../data/quran.db");
const SCHEMA_PATH    = path.resolve(__dirname, "../database/schema.sql");
const MIGRATIONS_DIR = path.resolve(__dirname, "../database/migrations");
const JSON_PATH      = path.resolve(__dirname, "../data/quran.json");
const SURAH_NAMES    = require("../utils/surahNames");

// ─── DB helpers ───────────────────────────────────────────────────────────────

const db = new sqlite3.Database(DB_PATH, (err) => {
    if (err) { console.error("❌ Cannot open database:", err.message); process.exit(1); }
    console.log("✅ Connected to:", DB_PATH);
});

db.run("PRAGMA journal_mode=WAL");
db.run("PRAGMA foreign_keys=ON");

const run  = (sql, p = []) => new Promise((res, rej) => db.run(sql,  p, function (e) { e ? rej(e) : res({ id: this.lastID, changes: this.changes }); }));
const exec = (sql)          => new Promise((res, rej) => db.exec(sql,    (e)          => e ? rej(e) : res()));
const all  = (sql, p = []) => new Promise((res, rej) => db.all(sql,  p, (e, rows)   => e ? rej(e) : res(rows)));
const get  = (sql, p = []) => new Promise((res, rej) => db.get(sql,  p, (e, row)    => e ? rej(e) : res(row)));

// ─── Step 1: master schema ────────────────────────────────────────────────────

async function applySchema() {
    console.log("\n📋 Step 1: Applying master schema...");
    if (!fs.existsSync(SCHEMA_PATH)) throw new Error("database/schema.sql not found");
    await exec(fs.readFileSync(SCHEMA_PATH, "utf8"));
    console.log("   ✅ schema.sql applied");
}

// ─── Step 2: migrations ───────────────────────────────────────────────────────
// Migration files live in database/migrations/ and are named:
//   001_create_coach_tables.sql
//   002_add_flashcard_tables.sql
//   ... etc.
// They are applied in filename order and tracked in a schema_migrations table
// so each file runs exactly once.

async function runMigrations() {
    console.log("\n🔄 Step 2: Running migrations...");

    await run(`
        CREATE TABLE IF NOT EXISTS schema_migrations (
            filename TEXT PRIMARY KEY,
            applied_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `);

    if (!fs.existsSync(MIGRATIONS_DIR)) {
        console.log("   (no migrations/ directory — skipping)");
        return;
    }

    const files = fs.readdirSync(MIGRATIONS_DIR)
        .filter(f => f.endsWith(".sql"))
        .sort();

    const applied = new Set(
        (await all("SELECT filename FROM schema_migrations")).map(r => r.filename)
    );

    let ran = 0;
    for (const file of files) {
        if (applied.has(file)) continue;
        const sql = fs.readFileSync(path.join(MIGRATIONS_DIR, file), "utf8");
        await exec(sql);
        await run("INSERT INTO schema_migrations (filename) VALUES (?)", [file]);
        console.log(`   ✅ ${file}`);
        ran++;
    }

    if (ran === 0) console.log("   (all migrations already applied)");
}

// ─── Step 3: coach + flashcard tables ────────────────────────────────────────

async function createCoachTables() {
    console.log("\n💬 Step 3: Creating coach/flashcard tables...");

    const statements = [
        [`CREATE TABLE IF NOT EXISTS chat_sessions (
            id         INTEGER  PRIMARY KEY AUTOINCREMENT,
            user_id    INTEGER  NOT NULL,
            title      TEXT     NOT NULL DEFAULT 'New Session',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
        )`, "chat_sessions"],

        [`CREATE INDEX IF NOT EXISTS idx_chat_sessions_user
          ON chat_sessions(user_id, updated_at)`, "idx_chat_sessions_user"],

        [`CREATE TABLE IF NOT EXISTS chat_messages (
            id         INTEGER  PRIMARY KEY AUTOINCREMENT,
            session_id INTEGER  NOT NULL,
            role       TEXT     NOT NULL CHECK(role IN ('user', 'assistant')),
            content    TEXT     NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(session_id) REFERENCES chat_sessions(id) ON DELETE CASCADE
        )`, "chat_messages"],

        [`CREATE INDEX IF NOT EXISTS idx_chat_messages_session
          ON chat_messages(session_id, created_at)`, "idx_chat_messages_session"],

        [`CREATE TABLE IF NOT EXISTS coach_messages (
            id         INTEGER  PRIMARY KEY AUTOINCREMENT,
            user_id    INTEGER  NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
        )`, "coach_messages"],

        [`CREATE INDEX IF NOT EXISTS idx_coach_messages_user_date
          ON coach_messages(user_id, created_at)`, "idx_coach_messages_user_date"],

        [`CREATE TABLE IF NOT EXISTS flashcard_sets (
            id         INTEGER  PRIMARY KEY AUTOINCREMENT,
            user_id    INTEGER  NOT NULL,
            name       TEXT     NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
        )`, "flashcard_sets"],

        [`CREATE INDEX IF NOT EXISTS idx_flashcard_sets_user
          ON flashcard_sets(user_id)`, "idx_flashcard_sets_user"],

        [`CREATE TABLE IF NOT EXISTS flashcard_cards (
            id     INTEGER PRIMARY KEY AUTOINCREMENT,
            set_id INTEGER NOT NULL,
            front  TEXT    NOT NULL,
            back   TEXT    NOT NULL,
            FOREIGN KEY(set_id) REFERENCES flashcard_sets(id) ON DELETE CASCADE
        )`, "flashcard_cards"],

        [`CREATE INDEX IF NOT EXISTS idx_flashcard_cards_set
          ON flashcard_cards(set_id)`, "idx_flashcard_cards_set"],
    ];

    for (const [sql, label] of statements) {
        await run(sql);
        console.log(`   ✅ ${label}`);
    }
}

// ─── Step 4: import ayahs ─────────────────────────────────────────────────────

async function importAyahs() {
    console.log("\n📥 Step 4: Importing ayahs...");

    if (!fs.existsSync(JSON_PATH)) {
        console.log("   ⚠️  data/quran.json not found — skipping");
        return;
    }

    const existing = await get("SELECT COUNT(*) AS n FROM ayahs");
    if (existing?.n > 0) {
        console.log(`   (${existing.n} ayahs already in DB — skipping import)`);
        return;
    }

    const ayahs = JSON.parse(fs.readFileSync(JSON_PATH, "utf8"));
    await run("BEGIN TRANSACTION");
    let n = 0;
    for (const a of ayahs) {
        await run(
            `INSERT OR REPLACE INTO ayahs (surah, ayah, page, text, juz, marhala, name)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [a.Surah, a.Ayah, a.Page ?? 0, a.Text, a.Juz ?? a.Juzz, a.Marhala,
             SURAH_NAMES[a.Surah] || `Surah ${a.Surah}`]
        );
        n++;
    }
    await run("COMMIT");
    console.log(`   ✅ Imported ${n} ayahs`);
}

// ─── Step 5: verify ───────────────────────────────────────────────────────────

async function verify() {
    console.log("\n🔍 Step 5: Verifying tables...");
    const expected = [
        "ayahs", "similarities", "users", "diary_logs", "tasks", "user_themes",
        "chat_sessions", "chat_messages", "coach_messages",
        "flashcard_sets", "flashcard_cards",
    ];
    for (const t of expected) {
        const row = await get("SELECT name FROM sqlite_master WHERE type='table' AND name=?", [t]);
        console.log(row ? `   ✅ ${t}` : `   ❌ ${t} MISSING`);
    }
}

// ─── Main ─────────────────────────────────────────────────────────────────────

(async () => {
    try {
        await applySchema();
        await runMigrations();
        await createCoachTables();
        await importAyahs();
        await verify();
        console.log("\n🎉 Setup complete. Run: npm start\n");
    } catch (err) {
        console.error("\n❌ Setup failed:", err.message);
        process.exit(1);
    } finally {
        db.close();
    }
})();