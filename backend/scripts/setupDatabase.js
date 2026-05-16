// backend/scripts/setupDatabase.js
const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');

try {
    const dbPath = path.resolve(__dirname, '../data/quran.db');
    const sqlPath = path.resolve(__dirname, '../database/schema.sql');

    console.log("Looking for SQL at:", sqlPath);
    
    if (!fs.existsSync(sqlPath)) {
        console.error("❌ ERROR: schema.sql file does NOT exist!");
        process.exit(1);
    }

    console.log("Connecting to DB (will create file if missing)...");
    
    // SQLite will create quran.db automatically if it doesn't exist
    const db = new sqlite3.Database(dbPath, (err) => {
        if (err) {
            console.error('❌ Error opening database:', err.message);
        } else {
            console.log('✅ Connected to the database.');
            
            const sql = fs.readFileSync(sqlPath, 'utf8');
            
            db.exec(sql, (err) => {
                if (err) {
                    console.error('❌ Error running SQL:', err.message);
                } else {
                    console.log('✅ Tables and indexes created successfully!');
                }
                
                db.close((err) => {
                    if (err) console.error(err.message);
                });
            });
        }
    });
} catch (error) {
    console.error("❌ FATAL ERROR:", error.message);
}