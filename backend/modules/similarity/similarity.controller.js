//C:\quran-similarity-app\backend\modules\similarity\similarity.controller.js
const SimilarityModel = require("./similarity.model");
const AyahModel = require("../ayah/ayah.model");
const { applyFilters } = require("./filter.service");
const { formatSuccess, formatError } = require("../../utils/responseFormatter");
exports.getSimilarities = async (req, res, next) => {
    try {
        const { surah, ayah, marhala, juzz, page } = req.query;
        if (!surah || !ayah) return res.status(400).json(formatError("Surah and Ayah are required"));
        const sourceAyah = await AyahModel.getAyah(surah, ayah);
        if (!sourceAyah) throw formatError("Source Ayah not found", 404);
        let similarities = await SimilarityModel.getSimilarities(surah, ayah);
        similarities = similarities.map(s => ({ ...s, tips: JSON.parse(s.tips || "[]") }));
        const filteredResults = applyFilters(similarities, marhala, juzz ? juzz.split(",") : [], page);
        const finalResults = filteredResults.map(r => ({
            ...r,
            highlight_mode: r.similarity_score >= 0.5 ? "similarities" : "differences",
            strength_label: r.similarity_score >= 0.8 ? "High" : r.similarity_score >= 0.5 ? "Medium" : "Low"
        }));
        return res.status(200).json(formatSuccess({ source: sourceAyah, results: finalResults }));
    } catch (error) { next(error); }
};