// backend/scripts/migrateDb.js
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const db = new sqlite3.Database(path.resolve(__dirname, '../data/quran.db'));

db.serialize(() => {
  // Add missing columns safely (ALTER TABLE ignores if column exists via try/catch)
  const migrations = [
    `ALTER TABLE diary_logs ADD COLUMN time_spent INTEGER NOT NULL DEFAULT 0`,
    `ALTER TABLE diary_logs ADD COLUMN difficulty INTEGER NOT NULL DEFAULT 3`,
    `ALTER TABLE ayahs ADD COLUMN page INTEGER`,
  ];
  
  migrations.forEach(sql => {
    db.run(sql, err => {
      if (err && !err.message.includes('duplicate column')) {
        console.error(sql, err.message);
      } else {
        console.log('OK:', sql.substring(0, 50));
      }
    });
  });
});

db.close(() => console.log('Migration complete'));