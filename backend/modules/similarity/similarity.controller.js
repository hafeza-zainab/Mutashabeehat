// C:\quran-similarity-app\backend\modules\similarity\similarity.controller.js

const SimilarityModel = require("./similarity.model");
const AyahModel       = require("../ayah/ayah.model");
const { applyFilters } = require("./filter.service");
const { formatSuccess, formatError } = require("../../utils/responseFormatter");

const strengthLabel = (score) => {
    if (score >= 0.8) return "High";
    if (score >= 0.5) return "Medium";
    return "Low";
};

exports.getSimilarities = async (req, res, next) => {
    try {
        const { surah, ayah, marhala, juz, page } = req.query;

        if (!surah || !ayah) {
            return res.status(400).json(formatError("surah and ayah query params are required."));
        }

        const sourceAyah = await AyahModel.getAyah(surah, ayah);
        if (!sourceAyah) {
            return res.status(404).json(formatError("Source ayah not found."));
        }

        const raw = await SimilarityModel.getSimilarities(surah, ayah);

        const parsed = raw.map((s) => ({
            ...s,
            tips: JSON.parse(s.tips || "[]"),
        }));

        const juzList  = juz ? juz.split(",").map((j) => j.trim()) : [];
        const filtered = applyFilters(parsed, marhala, juzList, page);

        const results = filtered.map((r) => ({
            ...r,
            highlight_mode: r.similarity_score >= 0.5 ? "similarities" : "differences",
            strength_label: strengthLabel(r.similarity_score),
        }));

        return res.status(200).json(formatSuccess({ source: sourceAyah, results }));
    } catch (err) {
        next(err);
    }
};

// ── PATCH /api/similarity/:id/tips ────────────────────────────────────────────
// Updates the tips JSON array for a similarity pair.
// Body: { tips: ["tip1", "tip2", ...] }
exports.updateTips = async (req, res, next) => {
    try {
        const { id }   = req.params;
        const { tips } = req.body;

        if (!Array.isArray(tips)) {
            return res.status(400).json(formatError("tips must be an array of strings."));
        }

        // Sanitise — each tip must be a non-empty string, max 500 chars
        const cleanTips = tips
            .filter((t) => typeof t === "string" && t.trim().length > 0)
            .map((t) => t.trim().slice(0, 500));

        await SimilarityModel.updateTips(id, cleanTips);

        return res.status(200).json(formatSuccess({ tips: cleanTips }, "Tips updated."));
    } catch (err) {
        next(err);
    }
};