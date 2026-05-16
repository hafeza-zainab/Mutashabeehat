// C:\quran-similarity-app\backend\modules\ayah\ayah.model.js
const db = require("../../config/database");

const getAyah = async (surah, ayah) => {
    return await db.get(
        `SELECT surah, ayah, text, juzz, marhala, name, page 
         FROM ayahs WHERE surah = ? AND ayah = ?`, 
        [surah, ayah]
    );
};

const getAllSurahs = async () => 
    db.all(`SELECT DISTINCT surah, name FROM ayahs ORDER BY surah ASC`);

const getAyahsBySurah = async (surah) => 
    db.all(`SELECT ayah FROM ayahs WHERE surah = ? ORDER BY ayah ASC`, [surah]);

const getAyahContext = async (surah, ayah) => {
    // Get current
    const current = await db.get(
        `SELECT text FROM ayahs WHERE surah = ? AND ayah = ?`, 
        [surah, ayah]
    );

    // Get PREVIOUS ayah (cross-surah aware)
    let prev = null;
    if (ayah > 1) {
        // Try same surah, ayah - 1
        prev = await db.get(
            `SELECT text FROM ayahs WHERE surah = ? AND ayah = ?`, 
            [surah, ayah - 1]
        );
    }
    // If still null and ayah == 1, try last ayah of previous surah
    if (!prev && ayah === 1 && surah > 1) {
        prev = await db.get(
            `SELECT text FROM ayahs WHERE surah = ? ORDER BY ayah DESC LIMIT 1`, 
            [surah - 1]
        );
    }

    // Get NEXT ayah (cross-surah aware, handles missing ayahs)
    let next = null;
    
    // Try same surah, ayah + 1
    next = await db.get(
        `SELECT text FROM ayahs WHERE surah = ? AND ayah = ?`, 
        [surah, ayah + 1]
    );
    
    // If not found, try next ayahs in same surah (handles gaps)
    if (!next) {
        next = await db.get(
            `SELECT text FROM ayahs WHERE surah = ? AND ayah > ? ORDER BY ayah ASC LIMIT 1`, 
            [surah, ayah]
        );
    }
    
    // If still not found, try first ayah of next surah
    if (!next && surah < 114) {
        next = await db.get(
            `SELECT text FROM ayahs WHERE surah = ? ORDER BY ayah ASC LIMIT 1`, 
            [surah + 1]
        );
    }

    return { 
        prev: prev ? prev.text : null, 
        current: current ? current.text : null, 
        next: next ? next.text : null 
    };
};

const getPageDetails = async (page) => {
    const rows = await db.all(
        `SELECT DISTINCT surah, name FROM ayahs WHERE page = ? ORDER BY surah ASC`, 
        [page]
    );
    if (rows.length === 0) return null;
    
    const result = { surahs: [] };
    for (const row of rows) {
        const ayahs = await db.all(
            `SELECT ayah FROM ayahs WHERE page = ? AND surah = ? ORDER BY ayah ASC`, 
            [page, row.surah]
        );
        result.surahs.push({ 
            surah: row.surah, 
            name: row.name, 
            ayahs: ayahs.map(a => a.ayah) 
        });
    }
    return result;
};

const getPagesByJuzz = async (juzz) => {
    return await db.all(
        `SELECT DISTINCT page FROM ayahs WHERE juzz = ? ORDER BY page ASC`, 
        [juzz]
    );
};

const getPagesInRange = async (start, end) => {
    return await db.all(
        `SELECT DISTINCT page, juzz FROM ayahs WHERE page >= ? AND page <= ? ORDER BY page ASC`, 
        [start, end]
    );
};

module.exports = { 
    getAyah, 
    getAllSurahs, 
    getAyahsBySurah, 
    getAyahContext, 
    getPageDetails, 
    getPagesByJuzz, 
    getPagesInRange 
};