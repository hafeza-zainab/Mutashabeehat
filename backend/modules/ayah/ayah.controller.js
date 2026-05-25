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