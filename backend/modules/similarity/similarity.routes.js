// C:\quran-similarity-app\backend\modules\similarity\similarity.routes.js
"use strict";

const express    = require("express");
const router     = express.Router();
const controller = require("./similarity.controller");
const auth       = require("../../middleware/authMiddleware");

// Public — no auth needed for similarity search
router.get("/", controller.getSimilarities);

// ── PATCH /api/similarity/:id/tips ───────────────────────────────────────────
// Used by SidePanel and CoachPage to save / update tips on a similarity pair.
// Body: { tips: string[] }
router.patch("/:id/tips", auth, async (req, res, next) => {
    try {
        const db   = require("../../config/database");
        const { tips } = req.body;

        if (!Array.isArray(tips)) {
            return res.status(400).json({
                success: false,
                message: "tips must be an array of strings.",
            });
        }

        // Sanitise: keep only non-empty strings, max 500 chars each, max 20 tips
        const cleaned = tips
            .filter((t) => typeof t === "string" && t.trim().length > 0)
            .map((t) => t.trim().slice(0, 500))
            .slice(0, 20);

        const result = await db.run(
            "UPDATE similarities SET tips = ? WHERE id = ?",
            [JSON.stringify(cleaned), req.params.id]
        );

        if (result.changes === 0) {
            return res.status(404).json({
                success: false,
                message: "Similarity pair not found.",
            });
        }

        res.json({ success: true, data: { tips: cleaned } });
    } catch (err) {
        next(err);
    }
});

// Also patch by source/target (alternative lookup used by some frontends)
// PATCH /api/similarity/by-pair/tips?ss=X&sa=Y&ts=A&ta=B
router.patch("/by-pair/tips", auth, async (req, res, next) => {
    try {
        const db = require("../../config/database");
        const { ss, sa, ts, ta } = req.query; // source_surah, source_ayah, target_surah, target_ayah
        const { tips } = req.body;

        if (!ss || !sa || !ts || !ta) {
            return res.status(400).json({
                success: false,
                message: "Query params ss, sa, ts, ta are all required.",
            });
        }
        if (!Array.isArray(tips)) {
            return res.status(400).json({
                success: false,
                message: "tips must be an array.",
            });
        }

        const cleaned = tips
            .filter((t) => typeof t === "string" && t.trim())
            .map((t) => t.trim().slice(0, 500))
            .slice(0, 20);

        const result = await db.run(
            `UPDATE similarities SET tips = ?
             WHERE source_surah = ? AND source_ayah = ?
               AND target_surah = ? AND target_ayah = ?`,
            [JSON.stringify(cleaned), ss, sa, ts, ta]
        );

        if (result.changes === 0) {
            return res.status(404).json({ success: false, message: "Pair not found." });
        }

        res.json({ success: true, data: { tips: cleaned } });
    } catch (err) {
        next(err);
    }
});

module.exports = router;