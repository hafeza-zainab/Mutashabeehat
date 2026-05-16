// backend/scripts/2-import-quran.js
const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');

const SURAH_NAMES = [
    "", "Al-Fatihah", "Al-Baqarah", "Aal-E-Imran", "An-Nisa", "Al-Ma'idah", "Al-An'am", "Al-A'raf", "Al-Anfal", "At-Tawbah", "Yunus",
    "Hud", "Yusuf", "Ar-Ra'd", "Ibrahim", "Al-Hijr", "An-Nahl", "Al-Isra", "Al-Kahf", "Maryam", "Taha", "Al-Anbiya", "Al-Hajj",
    "Al-Mu'minun", "An-Nur", "Al-Furqan", "Ash-Shu'ara", "An-Naml", "Al-Qasas", "Al-Ankabut", "Ar-Rum", "Luqman", "As-Sajdah", "Al-Ahzab",
    "Saba", "Fatir", "Ya-Sin", "As-Saffat", "Sad", "Az-Zumar", "Ghafir", "Fussilat", "Ash-Shura", "Az-Zukhruf", "Ad-Dukhan", "Al-Jathiyah",
    "Al-Ahqaf", "Muhammad", "Al-Fath", "Al-Hujurat", "Qaf", "Adh-Dhariyat", "At-Tur", "An-Najm", "Al-Qamar", "Ar-Rahman", "Al-Waqi'ah",
    "Al-Hadid", "Al-Mujadila", "Al-Hashr", "Al-Mumtahanah", "As-Saff", "Al-Jumu'ah", "Al-Munafiqun", "At-Taghabun", "At-Talaq", "At-Tahrim",
    "Al-Mulk", "Al-Qalam", "Al-Haqqah", "Al-Ma'arij", "Nuh", "Al-Jinn", "Al-Muzzammil", "Al-Muddaththir", "Al-Qiyamah", "Al-Insan",
    "Al-Mursalat", "An-Naba", "An-Nazi'at", "Abasa", "At-Takwir", "Al-Infitar", "Al-Mutaffifin", "Al-Inshiqaq", "Al-Buruj", "At-Tariq",
    "Al-A'la", "Al-Ghashiyah", "Al-Fajr", "Al-Balad", "Ash-Shams", "Al-Layl", "Ad-Duhaa", "Ash-Sharh", "At-Tin", "Al-Alaq", "Al-Qadr",
    "Al-Bayyinah", "Az-Zalzalah", "Al-Adiyat", "Al-Qari'ah", "At-Takathur", "Al-Asr", "Al-Humazah", "Al-Fil", "Quraysh", "Al-Ma'un",
    "Al-Kawthar", "Al-Kafirun", "An-Nasr", "Al-Masad", "Al-Ikhlas", "Al-Falaq", "An-Nas"
];

const dbPath = path.resolve(__dirname, '../data/quran.db');
const jsonPath = path.resolve(__dirname, '../data/quran.json');

const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('❌ Error connecting to database:', err.message);
        process.exit(1);
    }
    console.log('✅ Connected to database.');
});

console.log('📂 Reading quran.json...');
const jsonData = fs.readFileSync(jsonPath, 'utf8');
const ayahs = JSON.parse(jsonData);

console.log(`📊 Found ${ayahs.length} ayahs to import...`);

// UPDATED SQL to include 'page'
const sql = `INSERT OR REPLACE INTO ayahs (surah, ayah, page, text, juzz, marhala, name) VALUES (?, ?, ?, ?, ?, ?, ?)`;

let insertedCount = 0;

db.serialize(() => {
    db.run('BEGIN TRANSACTION');

    // The loop where 'item' is defined
    ayahs.forEach((item) => {
        db.run(sql, [item.Surah, item.Ayah, item.Page, item.Text, item.Juzz, item.Marhala, SURAH_NAMES[item.Surah]], function(err) {
            if (err) {
                console.error(`❌ Error inserting ${item.Surah}:${item.Ayah}`, err.message);
            } else if (this.changes > 0) {
                insertedCount++;
            }
        });
    });

    db.run('COMMIT', (err) => {
        if (err) {
            console.error('❌ Error committing transaction:', err.message);
        } else {
            console.log(`✅ Successfully imported ${insertedCount} ayahs into the database!`);
        }
        
        db.close((err) => {
            if (err) console.error(err.message);
        });
    });
});