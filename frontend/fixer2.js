//C:\quran-similarity-app\frontend\fixer2.js
const fs = require('fs');
const path = require('path');

const files = {
  './modules/ayah/ayah.model.js': `const db = require('../../config/database');

const getAyah = async (surah, ayah) => {
    return await db.get(\`SELECT surah, ayah, text, juzz, marhala, name, page FROM ayahs WHERE surah = ? AND ayah = ?\`, [surah, ayah]);
};
const getAllSurahs = async () => db.all(\`SELECT DISTINCT surah, name FROM ayahs ORDER BY surah ASC\`);
const getAyahsBySurah = async (surah) => db.all(\`SELECT ayah FROM ayahs WHERE surah = ? ORDER BY ayah ASC\`, [surah]);
const getAyahContext = async (surah, ayah) => {
    const current = await db.get(\`SELECT text FROM ayahs WHERE surah = ? AND ayah = ?\`, [surah, ayah]);
    const prev = ayah > 1 ? await db.get(\`SELECT text FROM ayahs WHERE surah = ? AND ayah = ?\`, [surah, ayah - 1]) : null;
    const next = await db.get(\`SELECT text FROM ayahs WHERE surah = ? AND ayah = ?\`, [surah, ayah + 1]);
    return { prev: prev ? prev.text : null, current: current ? current.text : null, next: next ? next.text : null };
};
const getPageDetails = async (page) => {
    const rows = await db.all(\`SELECT DISTINCT surah, name FROM ayahs WHERE page = ? ORDER BY surah ASC\`, [page]);
    if (rows.length === 0) return null;
    const result = { surahs: [] };
    for (const row of rows) {
        const ayahs = await db.all(\`SELECT ayah FROM ayahs WHERE page = ? AND surah = ? ORDER BY ayah ASC\`, [page, row.surah]);
        result.surahs.push({ surah: row.surah, name: row.name, ayahs: ayahs.map(a => a.ayah) });
    }
    return result;
};
const getPagesByJuzz = async (juzz) => {
    return await db.all(\`SELECT DISTINCT page FROM ayahs WHERE juzz = ? ORDER BY page ASC\`, [juzz]);
};
const getPagesInRange = async (start, end) => {
    return await db.all(\`SELECT DISTINCT page, juzz FROM ayahs WHERE page >= ? AND page <= ? ORDER BY page ASC\`, [start, end]);
};

module.exports = { getAyah, getAllSurahs, getAyahsBySurah, getAyahContext, getPageDetails, getPagesByJuzz, getPagesInRange };`,

  './modules/ayah/ayah.controller.js': `const AyahModel = require('./ayah.model');
const { formatSuccess, formatError } = require('../../utils/responseFormatter');

exports.getSurahs = async (req, res, next) => {
    try { const surahs = await AyahModel.getAllSurahs(); res.status(200).json(formatSuccess(surahs)); } catch (error) { next(error); }
};
exports.getAyahsBySurah = async (req, res, next) => {
    try { const ayahs = await AyahModel.getAyahsBySurah(req.params.surah); res.status(200).json(formatSuccess(ayahs)); } catch (error) { next(error); }
};
exports.getAyahContext = async (req, res, next) => {
    try {
        const { surah, ayah } = req.query;
        if (!surah || !ayah) return res.status(400).json(formatError("Surah and Ayah required"));
        const context = await AyahModel.getAyahContext(surah, ayah);
        res.status(200).json(formatSuccess(context));
    } catch (error) { next(error); }
};
exports.getPageDetails = async (req, res, next) => {
    try {
        const { page } = req.query;
        if (!page) return res.status(400).json(formatError("Page required"));
        const details = await AyahModel.getPageDetails(page);
        if (!details) return res.status(404).json(formatError("Page not found"));
        res.status(200).json(formatSuccess(details));
    } catch (error) { next(error); }
};
exports.getJuzzPages = async (req, res, next) => {
    try {
        const { juzz } = req.query;
        if (!juzz) return res.status(400).json(formatError("Juzz required"));
        const pages = await AyahModel.getPagesByJuzz(juzz);
        res.status(200).json(formatSuccess(pages.map(p => p.page)));
    } catch (error) { next(error); }
};
exports.getPagesInRange = async (req, res, next) => {
    try {
        const { start, end } = req.query;
        if (!start || !end) return res.status(400).json(formatError("Start and End pages required"));
        const pages = await AyahModel.getPagesInRange(start, end);
        res.status(200).json(formatSuccess(pages));
    } catch (error) { next(error); }
};`,

  './modules/ayah/ayah.routes.js': `const express = require('express');
const router = express.Router();
const ayahController = require('./ayah.controller');

// MUST be before /:surah/ayahs
router.get('/juzz-pages', ayahController.getJuzzPages);
router.get('/pages-in-range', ayahController.getPagesInRange);
router.get('/page-details', ayahController.getPageDetails);
router.get('/surahs', ayahController.getSurahs);
router.get('/context', ayahController.getAyahContext);
router.get('/:surah/ayahs', ayahController.getAyahsBySurah);

module.exports = router;`
};

for (const [filePath, content] of Object.entries(files)) {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  if (fs.existsSync(filePath)) fs.unlinkSync(filePath); 
  fs.writeFileSync(filePath, content, 'utf8');
  console.log('Fixed: ' + filePath);
}