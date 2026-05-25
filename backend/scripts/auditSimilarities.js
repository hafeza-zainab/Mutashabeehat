// C:\quran-similarity-app\backend\scripts\auditSimilarities.js
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const dbPath = path.resolve(__dirname, '../data/quran.db');

function removeTashkeel(text) {
    return text.replace(/[\u0610-\u061A\u064B-\u065F\u0670\u06D6-\u06DC\u06DF-\u06E4\u06E7-\u06E8\u06EA-\u06ED]/g, '');
}

function normalizeArabic(text) {
    let clean = removeTashkeel(text);
    clean = clean.replace(/ﷲ/g, 'الله');
    clean = clean.replace(/[أإآا]/g, 'ا');
    clean = clean.replace(/ى/g, 'ي');
    return clean;
}

function calculateJaccard(textA, textB) {
    const wordsA = new Set(normalizeArabic(textA).split(/\s+/).filter(w => w.length > 0));
    const wordsB = new Set(normalizeArabic(textB).split(/\s+/).filter(w => w.length > 0));
    
    let intersection = 0;
    for (const word of wordsA) {
        if (wordsB.has(word)) intersection++;
    }
    
    const union = wordsA.size + wordsB.size - intersection;
    return union === 0 ? 0 : intersection / union;
}

function getMaxSequentialMatch(wordsA, wordsB) {
    let maxSeq = 0;
    for (let i = 0; i < wordsA.length; i++) {
        for (let j = 0; j < wordsB.length; j++) {
            let k = 0;
            while (i + k < wordsA.length && j + k < wordsB.length && wordsA[i + k] === wordsB[j + k]) {
                k++;
            }
            if (k > maxSeq) maxSeq = k;
        }
    }
    return maxSeq;
}

function calculateFinalScore(textA, textB) {
    const wordsA = normalizeArabic(textA).split(/\s+/).filter(w => w.length > 0);
    const wordsB = normalizeArabic(textB).split(/\s+/).filter(w => w.length > 0);
    
    const jaccard = calculateJaccard(textA, textB);
    const sequential = getMaxSequentialMatch(wordsA, wordsB);
    const setA = new Set(wordsA);
    const sharedCount = [...new Set(wordsB)].filter(w => setA.has(w)).length;
    
    // Same logic as generateSimilarities.js
    if (sharedCount >= 5 || sequential >= 3) {
        return jaccard; // Raw Jaccard is stored in DB
    }
    return jaccard;
}

const db = new sqlite3.Database(dbPath, async (err) => {
    if (err) { console.error(err.message); process.exit(1); }
    
    console.log('='.repeat(60));
    console.log('SIMILARITY AUDIT REPORT');
    console.log('='.repeat(60));
    
    // Get all similarities
    const similarities = await new Promise((resolve, reject) => {
        db.all(`
            SELECT 
                s.source_surah, s.source_ayah, 
                s.target_surah, s.target_ayah, 
                s.similarity_score as stored_score,
                a1.text as source_text,
                a2.text as target_text
            FROM similarities s
            JOIN ayahs a1 ON s.source_surah = a1.surah AND s.source_ayah = a1.ayah
            JOIN ayahs a2 ON s.target_surah = a2.surah AND s.target_ayah = a2.ayah
            ORDER BY s.source_surah, s.source_ayah, s.target_surah, s.target_ayah
        `, [], (err, rows) => err ? reject(err) : resolve(rows));
    });
    
    console.log(`\nTotal pairs to check: ${similarities.length}\n`);
    
    let mismatches = [];
    let checked = 0;
    let totalDrift = 0;
    
    for (const row of similarities) {
        const calculatedScore = calculateFinalScore(row.source_text, row.target_text);
        const storedScore = row.stored_score;
        const drift = Math.abs(calculatedScore - storedScore);
        
        if (drift > 0.001) {
            mismatches.push({
                source: `${row.source_surah}:${row.source_ayah}`,
                target: `${row.target_surah}:${row.target_ayah}`,
                stored: storedScore.toFixed(4),
                calculated: calculatedScore.toFixed(4),
                drift: drift.toFixed(4),
                sourceWords: normalizeArabic(row.source_text).split(/\s+/).length,
                targetWords: normalizeArabic(row.target_text).split(/\s+/).length,
                sharedWords: [...new Set(normalizeArabic(row.target_text).split(/\s+/))].filter(w => new Set(normalizeArabic(row.source_text).split(/\s+/)).has(w)).length
            });
            totalDrift += drift;
        }
        checked++;
        
        if (checked % 1000 === 0) {
            process.stdout.write(`Checked ${checked}/${similarities.length}...\r`);
        }
    }
    
    console.log(`\n${'='.repeat(60)}`);
    console.log(`AUDIT COMPLETE`);
    console.log(`${'='.repeat(60)}`);
    console.log(`Pairs checked: ${checked}`);
    console.log(`Mismatches found: ${mismatches.length}`);
    console.log(`Average drift: ${mismatches.length > 0 ? (totalDrift / mismatches.length).toFixed(6) : 0}`);
    
    if (mismatches.length > 0) {
        console.log(`\n⚠️  TOP 20 MISMATCHES:`);
        console.log('-'.repeat(80));
        
        mismatches
            .sort((a, b) => parseFloat(b.drift) - parseFloat(a.drift))
            .slice(0, 20)
            .forEach(m => {
                console.log(`${m.source} → ${m.target}`);
                console.log(`  Stored: ${m.stored} | Calculated: ${m.calculated} | Drift: ${m.drift}`);
                console.log(`  Source words: ${m.sourceWords} | Target words: ${m.targetWords} | Shared: ${m.sharedWords}`);
                console.log('');
            });
        
        // Show the specific case from screenshot
        const specificCase = mismatches.find(m => 
            m.source === '22:10' && (m.target === '3:182' || m.target === '8:51')
        );
        
        if (specificCase) {
            console.log('═'.repeat(80));
            console.log('YOUR SPECIFIC CASE (Al-Hajj 22:10):');
            console.log('═'.repeat(80));
            console.log(`Source text: ${normalizeArabic(specificCase.sourceWords > 0 ? '' : '[loading...]')}`);
            console.log(`Source words: ${specificCase.sourceWords}`);
            console.log('');
            console.log(`→ Target 3:182: Stored ${specificCase.stored} vs Calculated ${specificCase.calculated}`);
            console.log(`→ Target 8:51:   Check if in list above`);
            console.log('═'.repeat(80));
        }
    } else {
        console.log('\n✅ ALL SCORES ARE CORRECT!');
    }
    
    db.close();
});