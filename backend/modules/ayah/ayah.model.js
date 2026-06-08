// C:\quran-similarity-app\backend\modules\ayah\ayah.model.js
const db = require("../../config/database");

const getAyah = (surah, ayah) =>
    db.get(
        "SELECT surah, ayah, text, juz, marhala, name, page FROM ayahs WHERE surah = ? AND ayah = ?",
        [surah, ayah]
    );

const getAllSurahs = () =>
    db.all("SELECT DISTINCT surah, name FROM ayahs ORDER BY surah ASC");

const getAyahsBySurah = (surah) =>
    db.all("SELECT ayah FROM ayahs WHERE surah = ? ORDER BY ayah ASC", [surah]);

const getAyahContext = async (surah, ayah) => {
    const [prev, current, next] = await Promise.all([
        ayah > 1
            ? db.get("SELECT text FROM ayahs WHERE surah = ? AND ayah = ?", [surah, Number(ayah) - 1])
            : Promise.resolve(null),
        db.get("SELECT text FROM ayahs WHERE surah = ? AND ayah = ?", [surah, ayah]),
        db.get("SELECT text FROM ayahs WHERE surah = ? AND ayah = ?", [surah, Number(ayah) + 1]),
    ]);
    return {
        prev:    prev?.text    ?? null,
        current: current?.text ?? null,
        next:    next?.text    ?? null,
    };
};

const getPageDetails = async (page) => {
    const rows = await db.all(
        "SELECT DISTINCT surah, name, juz FROM ayahs WHERE page = ? ORDER BY surah ASC",
        [page]
    );
    if (rows.length === 0) return null;

    const surahs = await Promise.all(
        rows.map(async (row) => {
            const ayahs = await db.all(
                "SELECT ayah FROM ayahs WHERE page = ? AND surah = ? ORDER BY ayah ASC",
                [page, row.surah]
            );
            return { surah: row.surah, name: row.name, juz: row.juz, ayahs: ayahs.map((a) => a.ayah) };
        })
    );

    return { surahs };
};

const getPagesByJuz = (juz) =>
    db.all("SELECT DISTINCT page FROM ayahs WHERE juz = ? ORDER BY page ASC", [juz]);

const getPagesInRange = (start, end) =>
    db.all(
        "SELECT DISTINCT page, juz FROM ayahs WHERE page >= ? AND page <= ? ORDER BY page ASC",
        [start, end]
    );



// ── ADD to backend/modules/ayah/ayah.model.js ──────────────────────────────

// Get all ayahs for a page with full data
const getAyahsByPage = (page) =>
    db.all(
        `SELECT surah, ayah, text, juz, marhala, name, page 
         FROM ayahs 
         WHERE page = ? AND ayah != 0
         ORDER BY surah ASC, ayah ASC`,
        [page]
    );

// Get all ayahs for a surah with full data (including ayah 0 for Surah 1 only)
const getFullAyahsBySurah = (surah) => {
    const surahNum = parseInt(surah);
    if (surahNum === 1) {
        // Include ayah 0 for Al-Fatihah (Bismillah IS ayah 1)
        return db.all(
            `SELECT surah, ayah, text, juz, marhala, name, page 
             FROM ayahs WHERE surah = ? ORDER BY ayah ASC`,
            [surah]
        );
    }
    // Exclude ayah 0 (Bismillah header) for all other surahs
    return db.all(
        `SELECT surah, ayah, text, juz, marhala, name, page 
         FROM ayahs WHERE surah = ? AND ayah != 0 ORDER BY ayah ASC`,
        [surah]
    );
};

// Get juz summary — all surahs, pages, ayah counts for a juz
const getJuzSummary = (juz) =>
    db.all(
        `SELECT surah, name, page, juz, marhala, COUNT(*) as ayah_count
         FROM ayahs
         WHERE juz = ? AND ayah != 0
         GROUP BY surah, page
         ORDER BY surah ASC, page ASC`,
        [juz]
    );

// EXPORT additions — add these to module.exports at bottom of ayah.model.js:
// getAyahsByPage, getFullAyahsBySurah, getJuzSummary

module.exports = {
    getAyah,
    getAllSurahs,
    getAyahsBySurah,
    getAyahContext,
    getPageDetails,
    getPagesByJuz,
    getPagesInRange,
    getAyahsByPage,
    getFullAyahsBySurah,
    getJuzSummary
};

