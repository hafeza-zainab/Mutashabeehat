// C:\quran-similarity-app\backend\modules\themes\theme.controller.js
const db         = require("../../config/database");
const ThemeModel = require("./theme.model");
const { formatSuccess, formatError } = require("../../utils/responseFormatter");

exports.getCurrent = async (req, res, next) => {
    try {
        const active = await ThemeModel.getActive(req.user.id);
        res.json(formatSuccess({
            theme_id:   active?.theme_id   ?? null,
            streak:     active?.streak     ?? 0,
            max_streak: active?.max_streak ?? 0,
            has_theme:  !!active,
        }));
    } catch (err) { next(err); }
};

exports.getAll = async (req, res, next) => {
    try {
        const [themes, active] = await Promise.all([
            ThemeModel.getAll(req.user.id),
            ThemeModel.getActive(req.user.id),
        ]);
        res.json(formatSuccess({ themes, active_id: active?.theme_id ?? null }));
    } catch (err) { next(err); }
};

exports.select = async (req, res, next) => {
    try {
        const { theme_id } = req.body;

        if (!theme_id) {
            return res.status(400).json(formatError("theme_id is required."));
        }
        if (!ThemeModel.VALID_THEMES.has(theme_id)) {
            return res.status(400).json(
                formatError(`Invalid theme. Valid themes: ${[...ThemeModel.VALID_THEMES].join(", ")}.`)
            );
        }

        const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];

        await db.transaction(async (tx) => {
            // Freeze current active theme's streak
            const active = await ThemeModel.getActive(req.user.id);
            if (active) {
                await tx.run(
                    "UPDATE user_themes SET is_active = 0, frozen_streak = ? WHERE user_id = ? AND theme_id = ?",
                    [active.streak, req.user.id, active.theme_id]
                );
            }

            // Check if target theme already exists for this user
            const existing = await db.get(
                "SELECT frozen_streak FROM user_themes WHERE user_id = ? AND theme_id = ?",
                [req.user.id, theme_id]
            );

            if (existing) {
                await tx.run(
                    "UPDATE user_themes SET is_active = 1, streak = ?, last_log_date = ? WHERE user_id = ? AND theme_id = ?",
                    [existing.frozen_streak ?? 0, yesterday, req.user.id, theme_id]
                );
            } else {
                await tx.run(
                    `INSERT INTO user_themes
                        (user_id, theme_id, streak, max_streak, frozen_streak, last_log_date, is_active)
                     VALUES (?, ?, 0, 0, 0, ?, 1)`,
                    [req.user.id, theme_id, yesterday]
                );
            }
        });

        res.json(formatSuccess(null, "Theme switched."));
    } catch (err) { next(err); }
};

exports.preview = async (req, res, next) => {
    try {
        const active = await ThemeModel.getActive(req.user.id);
        res.json(formatSuccess({ alreadySelected: !!active }));
    } catch (err) { next(err); }
};