// C:\quran-similarity-app\backend\scripts\generateSimilarities.js
/**
 * scripts/generateSimilarities.js
 *
 * Compares all ayah pairs and writes unique_pairs.json.
 * Run this offline — it is CPU-intensive.
 *
 * Usage:
 *   node scripts/generateSimilarities.js
 *
 * Then import results:
 *   node scripts/importSimilarities.js
 */

const fs   = require("fs");
const path = require("path");

const JSON_PATH  = path.resolve(__dirname, "../data/quran.json");
const OUT_PATH   = path.resolve(__dirname, "../data/unique_pairs.json");

// ─── Arabic normalisation ─────────────────────────────────────────────────────

const removeTashkeel = (text) =>
    text.replace(/[\u0610-\u061A\u064B-\u065F\u0670\u06D6-\u06DC\u06DF-\u06E4\u06E7-\u06E8\u06EA-\u06ED]/g, "");

const normalizeArabic = (text) => {
    let t = removeTashkeel(text);
    t = t.replace(/ﷲ/g, "الله");
    t = t.replace(/[أإآا]/g, "ا");
    t = t.replace(/ى/g, "ي");
    return t;
};

// ─── Scoring ──────────────────────────────────────────────────────────────────

const jaccardSimilarity = (setA, setB) => {
    let intersection = 0;
    for (const w of setA) if (setB.has(w)) intersection++;
    const union = setA.size + setB.size - intersection;
    return union === 0 ? 0 : intersection / union;
};

const maxSequentialMatch = (wordsA, wordsB) => {
    let max = 0;
    for (let i = 0; i < wordsA.length; i++) {
        for (let j = 0; j < wordsB.length; j++) {
            let k = 0;
            while (i + k < wordsA.length && j + k < wordsB.length && wordsA[i + k] === wordsB[j + k]) k++;
            if (k > max) max = k;
        }
    }
    return max;
};

// Repeated-verse exclusions (e.g. the refrain in Surah Ar-Rahman)
const INTERNAL_EXCLUSIONS = [
    { surah: 26, text: normalizeArabic("وَإِنَّ رَبَّكَ لَهُوَ الْعَزِيزُ الرَّحِيمُ") },
    { surah: 54, text: normalizeArabic("فَكَيْفَ كَانَ عَذَابِي وَنُذُرِ") },
    { surah: 54, text: normalizeArabic("وَلَقَدْ يَسَّرْنَا الْقُرْآنَ لِلذِّكْرِ فَهَلْ مِن مُدَّكِرٍ") },
    { surah: 55, text: normalizeArabic("فَبِأَيِّ آلَاءِ رَبِّكُمَا تُكَذِّبَانِ") },
    { surah: 77, text: normalizeArabic("وَيْلٌ يَوْمَئِذٍ لِلْمُكَذِّبِينَ") },
];

// ─── Main ─────────────────────────────────────────────────────────────────────

console.log("Loading quran.json...");
const quranData = JSON.parse(fs.readFileSync(JSON_PATH, "utf8"));

const ayahs = quranData.map((a) => ({
    surah: a.Surah,
    ayah:  a.Ayah,
    page:  a.Page || 0,
    words: normalizeArabic(a.Text).split(/\s+/).filter((w) => w.length > 0),
}));

console.log(`Processing ${ayahs.length} ayahs...`);

const uniquePairs = new Map();

for (let i = 0; i < ayahs.length; i++) {
    const a = ayahs[i];
    if (a.ayah === 0) continue;

    const setA = new Set(a.words);

    for (let j = i + 1; j < ayahs.length; j++) {
        const b = ayahs[j];
        if (b.ayah === 0) continue;
        if (Math.abs(a.words.length - b.words.length) > 15) continue;

        // Skip known repeated refrains within the same surah
        if (a.surah === b.surah) {
            const textA = a.words.join(" ");
            const textB = b.words.join(" ");
            let skip = false;
            for (const rule of INTERNAL_EXCLUSIONS) {
                if (a.surah === rule.surah && textA.includes(rule.text) && textB.includes(rule.text)) {
                    skip = true;
                    break;
                }
            }
            if (skip) continue;
        }

        const setB       = new Set(b.words);
        const score      = jaccardSimilarity(setA, setB);
        if (score < 0.25) continue;

        const sharedWords = [...setB].filter((w) => setA.has(w));
        const sequential  = maxSequentialMatch(a.words, b.words);

        if (sharedWords.length >= 5 || sequential >= 3) {
            const id1 = `${a.surah}:${a.ayah}`;
            const id2 = `${b.surah}:${b.ayah}`;
            const key = id1 < id2 ? `${id1}_${id2}` : `${id2}_${id1}`;

            if (!uniquePairs.has(key)) {
                const [first, second] = id1 < id2 ? [a, b] : [b, a];
                uniquePairs.set(key, {
                    surah_1: first.surah,  ayah_1: first.ayah,  page_1: first.page,
                    surah_2: second.surah, ayah_2: second.ayah, page_2: second.page,
                    similarity_score: score,
                    tips: [],
                });
            }
        }
    }

    if (i % 500 === 0) process.stdout.write(`  Progress: ${i}/${ayahs.length}\r`);
}

console.log(`\n\nFound ${uniquePairs.size} unique pairs.`);
fs.writeFileSync(OUT_PATH, JSON.stringify([...uniquePairs.values()], null, 2));
console.log("✅ Exported to unique_pairs.json\n");