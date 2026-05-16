// C:\quran-similarity-app\backend\scripts\setupComplete.js
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const dbPath = path.resolve(__dirname, '../data/quran.db');
const jsonPath = path.resolve(__dirname, '../data/quran.json');
const mappingPath = path.resolve(__dirname, '../data/page_mapping.txt');

// Ensure data directory exists
const dataDir = path.dirname(dbPath);
if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
}

// Delete old database if exists
if (fs.existsSync(dbPath)) {
    fs.unlinkSync(dbPath);
    console.log('🗑️ Deleted old database.');
}

console.log('📦 Creating fresh database...');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('❌ Failed to create database:', err.message);
        process.exit(1);
    }
    console.log('✅ Database file created.');
});

// ============================================
// STEP 1: CREATE ALL TABLES
// ============================================
console.log('\n📋 Creating tables...');

db.serialize(() => {
    // 1. Ayahs Table
    db.run(`
        CREATE TABLE IF NOT EXISTS ayahs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            surah INTEGER NOT NULL,
            ayah INTEGER NOT NULL,
            text TEXT NOT NULL,
            juzz INTEGER NOT NULL,
            marhala TEXT NOT NULL,
            name TEXT,
            page INTEGER,
            UNIQUE(surah, ayah)
        );
    `, (err) => {
        if (err) console.error('❌ Ayahs table error:', err.message);
        else console.log('✅ ayahs table created');
    });

    // 2. Similarities Table
    db.run(`
        CREATE TABLE IF NOT EXISTS similarities (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            source_surah INTEGER NOT NULL,
            source_ayah INTEGER NOT NULL,
            source_page INTEGER,
            target_surah INTEGER NOT NULL,
            target_ayah INTEGER NOT NULL,
            target_page INTEGER,
            similarity_score REAL NOT NULL,
            tips TEXT DEFAULT '[]',
            UNIQUE(source_surah, source_ayah, target_surah, target_ayah)
        );
    `, (err) => {
        if (err) console.error('❌ Similarities table error:', err.message);
        else console.log('✅ similarities table created');
    });

    // 3. Users Table
    db.run(`
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL
        );
    `, (err) => {
        if (err) console.error('❌ Users table error:', err.message);
        else console.log('✅ users table created');
    });

    // 4. Diary Logs Table (THE MISSING TABLE!)
    db.run(`
        CREATE TABLE IF NOT EXISTS diary_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            type TEXT NOT NULL,
            range_from TEXT NOT NULL,
            range_to TEXT NOT NULL,
            score INTEGER NOT NULL CHECK(score >= 0 AND score <= 10),
            notes TEXT DEFAULT '',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(user_id) REFERENCES users(id)
        );
    `, (err) => {
        if (err) console.error('❌ Diary logs table error:', err.message);
        else console.log('✅ diary_logs table created');
    });

    // 5. Daily Reflections Table
    db.run(`
        CREATE TABLE IF NOT EXISTS daily_reflections (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            reflection TEXT NOT NULL,
            date TEXT NOT NULL UNIQUE,
            FOREIGN KEY(user_id) REFERENCES users(id)
        );
    `, (err) => {
        if (err) console.error('❌ Reflections table error:', err.message);
        else console.log('✅ daily_reflections table created');
    });

    // 6. Tasks Table
    db.run(`
        CREATE TABLE IF NOT EXISTS tasks (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            title TEXT NOT NULL,
            category TEXT NOT NULL,
            status TEXT DEFAULT 'pending',
            date TEXT NOT NULL,
            FOREIGN KEY(user_id) REFERENCES users(id)
        );
    `, (err) => {
        if (err) console.error('❌ Tasks table error:', err.message);
        else console.log('✅ tasks table created');
    });

    // ============================================
    // STEP 2: CREATE INDEXES
    // ============================================
    console.log('\n dataIndexes...');
    
    db.run('CREATE INDEX IF NOT EXISTS idx_source ON similarities(source_surah, source_ayah)', (err) => {
        if (!err) console.log('✅ idx_source created');
    });
    db.run('CREATE INDEX IF NOT EXISTS idx_target ON similarities(target_surah, target_ayah)', (err) => {
        if (!err) console.log('✅ idx_target created');
    });
    db.run('CREATE INDEX IF NOT EXISTS idx_juzz ON ayahs(juzz)', (err) => {
        if (!err) console.log('✅ idx_juzz created');
    });
    db.run('CREATE INDEX IF NOT EXISTS idx_page ON ayahs(page)', (err) => {
        if (!err) console.log('✅ idx_page created');
    });
    db.run('CREATE INDEX IF NOT EXISTS idx_diary_user_date ON diary_logs(user_id, created_at)', (err) => {
        if (!err) console.log('✅ idx_diary_user_date created');
    });
    db.run('CREATE INDEX IF NOT EXISTS idx_tasks_user_date ON tasks(user_id, date)', (err) => {
        if (!err) console.log('✅ idx_tasks_user_date created');
    });

    // ============================================
    // STEP 3: IMPORT AYAHS FROM quran.json
    // ============================================
    console.log('\n📥 Importing ayahs from quran.json...');
    
    if (!fs.existsSync(jsonPath)) {
        console.error('❌ quran.json not found at:', jsonPath);
        db.close();
        process.exit(1);
    }

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

    const quranData = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
    
    db.run('BEGIN TRANSACTION');
    
    let insertedCount = 0;
    const sql = `INSERT OR REPLACE INTO ayahs (surah, ayah, page, text, juzz, marhala, name) VALUES (?, ?, ?, ?, ?, ?, ?)`;
    
    quranData.forEach((ayah) => {
        db.run(sql, [
            ayah.Surah, 
            ayah.Ayah, 
            ayah.Page || 0, 
            ayah.Text, 
            ayah.Juzz, 
            ayah.Marhala, 
            SURAH_NAMES[ayah.Surah] || `Surah ${ayah.Surah}`
        ], function(err) {
            if (!err && this.changes > 0) insertedCount++;
        });
    });
    
    db.run('COMMIT', (err) => {
        if (err) {
            console.error('❌ Import failed:', err.message);
        } else {
            console.log(`✅ Imported ${insertedCount} ayahs`);
        }

        // ============================================
        // STEP 4: VERIFY TABLES
        // ============================================
        console.log('\n🔍 Verifying tables...');
        
        const tablesToCheck = ['ayahs', 'similarities', 'users', 'diary_logs', 'daily_reflections', 'tasks'];
        
        let checkCount = 0;
        tablesToCheck.forEach(table => {
            db.all(`SELECT name FROM sqlite_master WHERE type='table' AND name='${table}'`, [], (err, rows) => {
                checkCount++;
                if (rows && rows.length > 0) {
                    console.log(`✅ ${table} - EXISTS`);
                } else {
                    console.log(`❌ ${table} - MISSING!`);
                }
                
                if (checkCount === tablesToCheck.length) {
                    console.log('\n' + '='.repeat(50));
                    console.log('SETUP COMPLETE!');
                    console.log('='.repeat(50));
                    console.log(`\nDatabase created at: ${dbPath}`);
                    console.log('\nNow run: npm start');
                    db.close();
                }
            });
        });
    });
});