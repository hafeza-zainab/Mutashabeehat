// backend/scripts/rebuildDiaryLogs.js
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const db = new sqlite3.Database(path.resolve(__dirname, '../data/quran.db'));

db.serialize(() => {
    db.run(`ALTER TABLE diary_logs RENAME TO diary_logs_old`);
    db.run(`
        CREATE TABLE diary_logs (
            id          INTEGER  PRIMARY KEY AUTOINCREMENT,
            user_id     INTEGER  NOT NULL,
            type        TEXT     NOT NULL,
            range_from  TEXT     NOT NULL,
            range_to    TEXT     NOT NULL DEFAULT '',
            score       INTEGER  NOT NULL,
            created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
        )
    `);
    db.run(`
        INSERT INTO diary_logs (id, user_id, type, range_from, range_to, score, created_at)
        SELECT id, user_id, type, range_from, range_to, score, created_at
        FROM diary_logs_old
    `);
    db.run(`DROP TABLE diary_logs_old`);
    console.log('Done — diary_logs rebuilt without time_spent/difficulty');
});

db.close();