// C:\quran-similarity-app\backend\modules\ayah\ayah.controller.js
const AyahModel = require("./ayah.model");
const { formatSuccess, formatError } = require("../../utils/responseFormatter");

exports.getSurahs = async (req, res, next) => {
    try {
        const surahs = await AyahModel.getAllSurahs();
        res.status(200).json(formatSuccess(surahs));
    } catch (err) { next(err); }
};

exports.getAyahsBySurah = async (req, res, next) => {
    try {
        const ayahs = await AyahModel.getAyahsBySurah(req.params.surah);
        res.status(200).json(formatSuccess(ayahs));
    } catch (err) { next(err); }
};

exports.getAyahContext = async (req, res, next) => {
    try {
        const { surah, ayah } = req.query;
        if (!surah || !ayah) {
            return res.status(400).json(formatError("surah and ayah query params are required."));
        }
        const context = await AyahModel.getAyahContext(surah, ayah);
        res.status(200).json(formatSuccess(context));
    } catch (err) { next(err); }
};

exports.getPageDetails = async (req, res, next) => {
    try {
        const { page } = req.query;
        if (!page) return res.status(400).json(formatError("page query param is required."));
        const details = await AyahModel.getPageDetails(page);
        if (!details) return res.status(404).json(formatError("Page not found."));
        res.status(200).json(formatSuccess(details));
    } catch (err) { next(err); }
};

// FIX: was "getJuzzPages" in routes but "getJuzPages" in controller — unified to getJuzPages
exports.getJuzPages = async (req, res, next) => {
    try {
        const { juz } = req.query;
        if (!juz) return res.status(400).json(formatError("juz query param is required."));
        const pages = await AyahModel.getPagesByJuz(juz);
        res.status(200).json(formatSuccess(pages.map((p) => p.page)));
    } catch (err) { next(err); }
};

exports.getPagesInRange = async (req, res, next) => {
    try {
        const { start, end } = req.query;
        if (!start || !end) {
            return res.status(400).json(formatError("start and end query params are required."));
        }
        const pages = await AyahModel.getPagesInRange(start, end);
        res.status(200).json(formatSuccess(pages));
    } catch (err) { next(err); }
};

exports.getAyahsByPage = async (req, res, next) => {
    try {
        const { surah } = req.params;
        const ayahs = await AyahModel.getFullAyahsBySurah(surah);
        res.status(200).json(formatSuccess(ayahs));
    } catch (err) { next(err); }
};

exports.getFirstWords = async (req, res, next) => {
    try {
        const { surah } = req.params;
        const surahNum  = parseInt(surah);
        const ayahs     = await AyahModel.getFullAyahsBySurah(surah);

        // Ayah 0 = Bismillah header — only counted in Surah 1 (Al-Fatihah)
        // Surah 9 (At-Tawbah) has no Bismillah at all
        const filtered = ayahs.filter(a =>
            surahNum === 1 ? true : a.ayah !== 0
        );

        const withFirstWords = filtered.map(a => ({
            ayah:      a.ayah,
            text:      a.text,
            firstWord: a.text.trim().split(/\s+/)[0] || "",
        }));

        res.status(200).json(formatSuccess(withFirstWords));
    } catch (err) { next(err); }
};

exports.getPageFull = async (req, res, next) => {
    try {
        const { page } = req.params;
        if (!page) return res.status(400).json(formatError("page param required."));
 
        const ayahs = await AyahModel.getAyahsByPage(page);
        if (!ayahs.length) return res.status(404).json(formatError("No ayahs found for this page."));
 
        // Group by surah for structured response
        const bysurah = {};
        ayahs.forEach(a => {
            if (!bysurah[a.surah]) {
                bysurah[a.surah] = {
                    surah: a.surah,
                    name:  a.name,
                    juz:   a.juz,
                    marhala: a.marhala,
                    page:  a.page,
                    ayahs: [],
                };
            }
            bysurah[a.surah].ayahs.push({
                ayah:      a.ayah,
                text:      a.text,
                firstWord: a.text.trim().split(/\s+/)[0] || "",
            });
        });
 
        const surahs      = Object.values(bysurah);
        const totalAyahs  = ayahs.length;
        const firstAyah   = ayahs[0];
        const lastAyah    = ayahs[ayahs.length - 1];
 
        res.status(200).json(formatSuccess({
            page:       Number(page),
            juz:        firstAyah.juz,
            marhala:    firstAyah.marhala,
            totalAyahs,
            surahs,
            firstAyah: { surah: firstAyah.surah, ayah: firstAyah.ayah, name: firstAyah.name },
            lastAyah:  { surah: lastAyah.surah,  ayah: lastAyah.ayah,  name: lastAyah.name  },
        }));
    } catch (err) { next(err); }
};
 
// GET /api/ayah/:surah/full  — all ayahs for a surah with full data
exports.getSurahFull = async (req, res, next) => {
    try {
        const { surah } = req.params;
        const ayahs = await AyahModel.getFullAyahsBySurah(surah);
        if (!ayahs.length) return res.status(404).json(formatError("Surah not found."));
 
        const withFirstWords = ayahs.map(a => ({
            ayah:      a.ayah,
            text:      a.text,
            firstWord: a.text.trim().split(/\s+/)[0] || "",
            page:      a.page,
            juz:       a.juz,
            marhala:   a.marhala,
        }));
 
        res.status(200).json(formatSuccess({
            surah:   Number(surah),
            name:    ayahs[0].name,
            juz:     ayahs[0].juz,
            marhala: ayahs[0].marhala,
            page:    ayahs[0].page,
            totalAyahs: ayahs.length,
            ayahs:   withFirstWords,
        }));
    } catch (err) { next(err); }
};
 
// GET /api/ayah/juz/:juz/full  — juz summary
exports.getJuzFull = async (req, res, next) => {
    try {
        const { juz } = req.params;
        const rows = await AyahModel.getJuzSummary(juz);
        if (!rows.length) return res.status(404).json(formatError("Juz not found."));
 
        res.status(200).json(formatSuccess({
            juz:     Number(juz),
            marhala: rows[0].marhala,
            entries: rows.map(r => ({
                surah:      r.surah,
                name:       r.name,
                page:       r.page,
                ayah_count: r.ayah_count,
            })),
            totalAyahs: rows.reduce((s, r) => s + r.ayah_count, 0),
            pages: [...new Set(rows.map(r => r.page))].sort((a, b) => a - b),
        }));
    } catch (err) { next(err); }
};
 
 