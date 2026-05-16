// C:\quran-similarity-app\backend\scripts\fixAllPages.js
const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');

const dbPath = path.resolve(__dirname, '../data/quran.db');
const mappingPath = path.resolve(__dirname, '../data/page_mapping.txt');

const mappingText = fs.readFileSync(mappingPath, 'utf8');
const lines = mappingText.trim().split('\n');

const boundaries = [];
for (const line of lines) {
    const match = line.match(/(\d+)\s*\|\s*\d+:\d+\s*→\s*(\d+):(\d+)/);
    if (match) {
        boundaries.push({
            page: parseInt(match[1]),
            endSurah: parseInt(match[2]),
            endAyah: parseInt(match[3])
        });
    }
}
boundaries.sort((a, b) => a.page - b.page);

console.log(`Parsed ${boundaries.length} page boundaries`);

const db = new sqlite3.Database(dbPath, (err) => {
    if (err) { console.error('DB Error:', err.message); process.exit(1); }
    console.log('Connected to database.\n');

    // STEP 1: Fetch ALL ayahs first (no transaction yet)
    console.log('Fetching all ayahs...');
    
    db.all(`SELECT id, surah, ayah FROM ayahs ORDER BY surah ASC, ayah ASC`, [], (err, ayahs) => {
        if (err) {
            console.error('Fetch error:', err.message);
            db.close();
            return;
        }

        console.log(`Found ${ayahs.length} ayahs\n`);
        console.log('Calculating page assignments...\n');

        // STEP 2: Calculate pages in memory (synchronous, no DB calls)
        let boundaryIndex = 0;
        let currentPage = boundaries[0].page;
        const updates = []; // Store [id, page] pairs

        for (const ayah of ayahs) {
            updates.push([ayah.id, currentPage]);

            // Check boundaries
            while (boundaryIndex < boundaries.length) {
                const b = boundaries[boundaryIndex];
                
                if (ayah.surah === b.endSurah && ayah.ayah === b.endAyah) {
                    boundaryIndex++;
                    if (boundaryIndex < boundaries.length) {
                        currentPage = boundaries[boundaryIndex].page;
                    }
                    break;
                } else if (ayah.surah > b.endSurah || 
                          (ayah.surah === b.endSurah && ayah.ayah > b.endAyah)) {
                    console.log(`SKIPPED: Page ${b.page} (${b.endSurah}:${b.endAyah}) - at ${ayah.surah}:${ayah.ayah}`);
                    boundaryIndex++;
                    if (boundaryIndex < boundaries.length) {
                        currentPage = boundaries[boundaryIndex].page;
                    }
                } else {
                    break;
                }
            }
        }

        console.log(`\nCalculated ${updates.length} page assignments`);
        console.log(`Last ayah assigned to page: ${updates[updates.length - 1][1]}\n`);

        // STEP 3: Now do the transaction
        console.log('Writing to database...');
        
        db.serialize(() => {
            db.run('BEGIN TRANSACTION');

            const stmt = db.prepare(`UPDATE ayahs SET page = ? WHERE id = ?`);
            
            for (const [id, page] of updates) {
                stmt.run(page, id);
            }
            
            stmt.finalize((err) => {
                if (err) {
                    console.error('Statement error:', err.message);
                    db.run('ROLLBACK');
                    db.close();
                    return;
                }

                db.run('COMMIT', (err) => {
                    if (err) {
                        console.error('Commit error:', err.message);
                        db.close();
                        return;
                    }

                    console.log(`Updated ${updates.length} ayahs\n`);

                    // STEP 4: Verify
                    console.log('--- VERIFICATION ---\n');
                    
                    db.all(`SELECT DISTINCT page FROM ayahs WHERE page > 0 ORDER BY page ASC`, [], (err, rows) => {
                        if (err) { console.error('Verify error:', err.message); db.close(); return; }
                        
                        const pages = rows.map(r => r.page);
                        console.log(`Pages with data: ${pages.length} of 604`);
                        
                        const missing = [];
                        for (let p = 1; p <= 604; p++) {
                            if (!pages.includes(p)) missing.push(p);
                        }
                        
                        if (missing.length === 0) {
                            console.log('ALL 604 PAGES EXIST!');
                        } else {
                            console.log(`Missing ${missing.length} pages: ${missing.join(', ')}`);
                        }

                        console.log('\n--- SPECIFIC CHECKS ---\n');
                        
                        [
                            { name: 'Juzz 10 (182-201)', min: 182, max: 201 },
                            { name: 'Juzz 20 (382-401)', min: 382, max: 401 },
                            { name: 'Juzz 30 (582-604)', min: 582, max: 604 }
                        ].forEach(check => {
                            const found = pages.filter(p => p >= check.min && p <= check.max);
                            const expected = check.max - check.min + 1;
                            if (found.length === expected) {
                                console.log(`OK ${check.name}: All ${expected} pages present`);
                            } else {
                                console.log(`MISSING ${check.name}: Only ${found.length} of ${expected}`);
                            }
                        });

                        db.run('CREATE INDEX IF NOT EXISTS idx_page ON ayahs(page)', () => {
                            console.log('\nDone!');
                            db.close();
                        });
                    });
                });
            });
        });
    });
});