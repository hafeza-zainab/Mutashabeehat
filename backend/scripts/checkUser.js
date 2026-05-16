// C:\quran-similarity-app\backend\scripts\checkUser.js
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const dbPath = path.resolve(__dirname, '../data/quran.db');

console.log('Looking for database at:', dbPath);

// Step 1: Does file exist?
if (!fs.existsSync(dbPath)) {
    console.log('❌ DATABASE FILE DOES NOT EXIST!');
    console.log('You need to run: node setupComplete.js');
    process.exit(1);
}

console.log('✅ Database file found');

// Step 2: Connect and check
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.log('❌ Cannot connect:', err.message);
        process.exit(1);
    }
    console.log('✅ Connected to database');
    
    // Step 3: List all tables
    db.all("SELECT name FROM sqlite_master WHERE type='table'", [], (err, tables) => {
        if (err) {
            console.log('❌ Error listing tables:', err.message);
            db.close();
            process.exit(1);
        }
        
        console.log('\n📋 Tables found:');
        tables.forEach(t => console.log('   - ' + t.name));
        
        // Step 4: Check users
        if (tables.some(t => t.name === 'users')) {
            db.all("SELECT id, username, email FROM users", [], (err, rows) => {
                if (err) {
                    console.log('❌ Error reading users:', err.message);
                } else if (rows.length === 0) {
                    console.log('\n⚠️ USERS TABLE IS EMPTY');
                    console.log('Please go to http://localhost:3000/signup and create an account first!');
                } else {
                    console.log('\n👤 Users:');
                    rows.forEach(row => {
                        console.log(`   ID: ${row.id} | Username: ${row.username} | Email: ${row.email}`);
                    });
                }
                db.close();
            });
        } else {
            console.log('\n❌ USERS TABLE DOES NOT EXIST!');
            console.log('Run: node setupComplete.js');
            db.close();
        }
    });
});