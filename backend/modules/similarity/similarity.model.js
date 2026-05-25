// C:\quran-similarity-app\backend\modules\similarity\similarity.model.js
const db = require("../../config/database");

const getSimilarities = async (surah, ayah) => {
    return await db.all(
        `SELECT s.target_surah, s.target_ayah, s.target_page, s.similarity_score, s.tips,
                a.text, a.juz, a.marhala, a.name
         FROM similarities s
         JOIN ayahs a ON s.target_surah = a.surah AND s.target_ayah = a.ayah
         WHERE s.source_surah = ? AND s.source_ayah = ?`,
        [surah, ayah]
    );
};

module.exports = { getSimilarities };