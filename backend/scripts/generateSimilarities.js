// backend/scripts/generateSimilarities.js
const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');

const dbPath = path.resolve(__dirname, '../data/quran.db');
const jsonPath = path.resolve(__dirname, '../data/quran.json');

function removeTashkeel(text) {
    return text.replace(/[\u0610-\u061A\u064B-\u065F\u0670\u06D6-\u06DC\u06DF-\u06E4\u06E7-\u06E8\u06EA-\u06ED]/g, '');
}

function normalizeArabic(text) {
    let clean = removeTashkeel(text);
    clean = clean.replace(/ﷲ/g, 'الله');
    clean = clean.replace(/[أإآا]/g, 'ا');
    return clean;
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

function calculateSimilarity(wordsA, wordsB) {
    const setA = new Set(wordsA);
    const setB = new Set(wordsB);
    let intersection = 0;
    for (const word of setA) { if (setB.has(word)) intersection++; }
    const union = setA.size + setB.size - intersection;
    return union === 0 ? 0 : intersection / union;
}

// --- EXCLUSION RULES ---
const INTERNAL_EXCLUSIONS = [
    { surah: 26, text: normalizeArabic("وَإِنَّ رَبَّكَ لَهُوَ الْعَزِيزُ الرَّحِيمُ") },
    { surah: 54, text: normalizeArabic("فَكَيْفَ كَانَ عَذَابِي وَنُذُرِ") },
    { surah: 54, text: normalizeArabic("وَلَقَدْ يَسَّرْنَا الْقُرْآنَ لِلذِّكْرِ فَهَلْ مِن مُدَّكِرٍ") },
    { surah: 55, text: normalizeArabic("فَبِأَيِّ آلَاءِ رَبِّكُمَا تُكَذِّبَانِ") },
    { surah: 77, text: normalizeArabic("وَيْلٌ يَوْمَئِذٍ لِلْمُكَذِّبِينَ") }
];
// ------------------------

console.log('Starting strict similarity generation... This will take 1-2 minutes.');

const db = new sqlite3.Database(dbPath, (err) => { if (err) { console.error(err.message); process.exit(1); } });
const quranData = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));

// UPDATED: Extract 'Page' alongside Surah, Ayah, and words
const processedAyahs = quranData.map(a => ({
    surah: a.Surah,
    ayah: a.Ayah,
    page: a.Page || 0, // ADDED: Grab the page number (fallback to 0 just in case)
    words: normalizeArabic(a.Text).split(/\s+/).filter(w => w.length > 0)
}));

const uniquePairsMap = new Map();

for (let i = 0; i < processedAyahs.length; i++) {
    const a = processedAyahs[i];
    
    for (let j = i + 1; j < processedAyahs.length; j++) {
        const b = processedAyahs[j];
        
        // RULE 1: Skip any ayah with number 0
        if (a.ayah === 0 || b.ayah === 0) continue;

        // Optimization: Skip if length difference is massive
        if (Math.abs(a.words.length - b.words.length) > 15) continue;

        // RULE 2: Skip internal repetitive refrains
        let skipPair = false;
        if (a.surah === b.surah) {
            const textA = a.words.join(' ');
            const textB = b.words.join(' ');
            for (const rule of INTERNAL_EXCLUSIONS) {
                if (a.surah === rule.surah && textA.includes(rule.text) && textB.includes(rule.text)) {
                    skipPair = true;
                    break;
                }
            }
        }
        if (skipPair) continue;

        const score = calculateSimilarity(a.words, b.words);
        if (score >= 0.25) {
            const setA = new Set(a.words);
            const sharedWords = [...new Set(b.words)].filter(w => setA.has(w));
            const totalShared = sharedWords.length;
            
            const sequentialMatch = getMaxSequentialMatch(a.words, b.words);

            if (totalShared >= 5 || sequentialMatch >= 3) {
                const id1 = `${a.surah}:${a.ayah}`;
                const id2 = `${b.surah}:${b.ayah}`;
                const pair_id = id1 < id2 ? `${id1}_${id2}` : `${id2}_${id1}`;

                if (!uniquePairsMap.has(pair_id)) {
                    uniquePairsMap.set(pair_id, {
                        surah_1: id1 < id2 ? a.surah : b.surah,
                        ayah_1: id1 < id2 ? a.ayah : b.ayah,
                        page_1: id1 < id2 ? a.page : b.page, // ADDED: Page for ayah 1
                        
                        surah_2: id1 < id2 ? b.surah : a.surah,
                        ayah_2: id1 < id2 ? b.ayah : a.ayah,
                        page_2: id1 < id2 ? b.page : a.page, // ADDED: Page for ayah 2
                        
                        similarity_score: score,
                        shared_words: sharedWords,
                        tips: [] 
                    });
                }
            }
        }
    }
    if (i % 500 === 0) console.log(`Processed Surah ${a.surah}, Ayah ${a.ayah}...`);
}

console.log(`\nFiltering complete. Found ${uniquePairsMap.size} unique pairs.`);
console.log("Writing to unique_pairs.json...");

const jsonArray = Array.from(uniquePairsMap.values());
fs.writeFileSync(
    path.resolve(__dirname, '../data/unique_pairs.json'), 
    JSON.stringify(jsonArray, null, 2)
);

console.log("✅ SUCCESS! Exported to backend/data/unique_pairs.json (with page numbers)");
console.log("Repetitive internal pairs in Surahs 26, 54, 55, 77 have been removed.");

db.close();