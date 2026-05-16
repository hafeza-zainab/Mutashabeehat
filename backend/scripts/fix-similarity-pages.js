//C:\quran-similarity-app\backend\scripts\fix-similarity-pages.js
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const dbPath = path.resolve(__dirname, '../data/quran.db');
const db = new sqlite3.Database(dbPath, (err) => { if(err) console.error(err); });

console.log("Fixing similarity pages...");

db.serialize(() => {
    // 1. Safely try to add the columns (if they don't exist)
    db.run(`ALTER TABLE similarities ADD COLUMN source_page INTEGER;`, (err) => {
        if (err && !err.message.includes('duplicate column name')) console.error("Error adding source_page:", err.message);
    });
    
    db.run(`ALTER TABLE similarities ADD COLUMN target_page INTEGER;`, (err) => {
        if (err && !err.message.includes('duplicate column name')) console.error("Error adding target_page:", err.message);
    });

    // 2. Instantly copy the pages from the ayahs table into the similarities table
    console.log("Copying pages for source ayahs...");
    db.run(`UPDATE similarities SET source_page = (SELECT page FROM ayahs WHERE ayahs.surah = similarities.source_surah AND ayahs.ayah = similarities.source_ayah)`, (err) => {
        if(err) console.error("Source update failed:", err);
        else console.log("✅ Source pages updated!");
    });

    console.log("Copying pages for target ayahs...");
    db.run(`UPDATE similarities SET target_page = (SELECT page FROM ayahs WHERE ayahs.surah = similarities.target_surah AND ayahs.ayah = similarities.target_ayah)`, (err) => {
        if(err) console.error("Target update failed:", err);
        else console.log("✅ Target pages updated!");
    });
});

db.close(() => console.log("Done! Restart your backend server."));