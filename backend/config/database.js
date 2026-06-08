//C:\quran-similarity-app\backend\config\database.js
const sqlite3 = require("sqlite3").verbose();
const path = require("path");

const dbPath = process.env.DATABASE_PATH
    ? path.resolve(process.env.DATABASE_PATH)
    : path.resolve(__dirname, "../data/quran.db");

const db = new sqlite3.Database(dbPath, (err) => {
    if (err) console.error("DB Connection Error:", err.message);
    else console.log("Connected to SQLite at:", dbPath);
});

// Enable WAL mode for better concurrent read performance
db.run("PRAGMA journal_mode=WAL");
db.run("PRAGMA foreign_keys=ON");

const dbAsync = {
    run: (sql, params = []) =>
        new Promise((resolve, reject) => {
            db.run(sql, params, function (err) {
                if (err) reject(err);
                else resolve({ id: this.lastID, changes: this.changes });
            });
        }),

    all: (sql, params = []) =>
        new Promise((resolve, reject) => {
            db.all(sql, params, (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        }),

    get: (sql, params = []) =>
        new Promise((resolve, reject) => {
            db.get(sql, params, (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        }),

    // Helper for running multiple statements in a transaction
    transaction: async (fn) => {
        await dbAsync.run("BEGIN TRANSACTION");
        try {
            const result = await fn(dbAsync);
            await dbAsync.run("COMMIT");
            return result;
        } catch (err) {
            await dbAsync.run("ROLLBACK");
            throw err;
        }
    },
};

module.exports = dbAsync;
