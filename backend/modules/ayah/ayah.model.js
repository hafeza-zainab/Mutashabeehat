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

module.exports = {
    getAyah,
    getAllSurahs,
    getAyahsBySurah,
    getAyahContext,
    getPageDetails,
    getPagesByJuz,
    getPagesInRange,
};