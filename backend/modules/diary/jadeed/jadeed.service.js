// C:\quran-similarity-app\backend\modules\diary\jadeed\jadeed.service.js
const repo = require('../diary.repository');
const SURAH_NAMES = require('../../../utils/surahNames');

exports.createJadeedLog = async (userId, payload) => {
    const date = payload.date || new Date().toISOString().split('T')[0];
    const fromPage = parseInt(payload.from_page);
    const toPage = parseInt(payload.to_page) || fromPage;
    const juzz = payload.juzz;

    if (!fromPage || !juzz) throw new Error("Missing page or juzz info");

    const fromName = payload.range_from_name || SURAH_NAMES[parseInt(payload.range_from_surah)] || `Surah ${payload.range_from_surah}`;
    const toName = payload.range_to_name || (payload.range_to_surah ? (SURAH_NAMES[parseInt(payload.range_to_surah)] || `Surah ${payload.range_to_surah}`) : "");

    const rangeFrom = `Jadeed - Juzz ${juzz} - Pages ${fromPage} to ${toPage}`;
    const ayahInfo = `${fromName} (${payload.range_from_surah}):${payload.range_from_ayah}`;
    const rangeTo = (payload.range_to_surah && payload.range_to_ayah)
        ? `${ayahInfo} to ${toName} (${payload.range_to_surah}):${payload.range_to_ayah}`
        : ayahInfo;

    await repo.createLog(userId, 'jadeed', rangeFrom, rangeTo, Number(payload.score), payload.notes || '', date);
};