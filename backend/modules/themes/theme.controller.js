// C:\quran-similarity-app\backend\modules\themes\theme.controller.js
const ThemeModel = require('./theme.model');
const { formatSuccess, formatError } = require('../../utils/responseFormatter');

exports.getCurrent = async (req, res, next) => {
    try {
        const active = await ThemeModel.getActive(req.user.id);
        res.json(formatSuccess({
            theme_id: active?.theme_id || null,
            streak: active?.streak || 0,
            max_streak: active?.max_streak || 0,
            can_switch: true,
            has_theme: !!active
        }));
    } catch (err) { next(err); }
};

exports.getAll = async (req, res, next) => {
    try {
        const themes = await ThemeModel.getAll(req.user.id);
        const active = await ThemeModel.getActive(req.user.id);
        res.json(formatSuccess({
            themes,
            can_switch: true,
            active_id: active?.theme_id
        }));
    } catch (err) { next(err); }
};

exports.select = async (req, res, next) => {
    try {
        const { theme_id } = req.body;
        if (!theme_id) return res.status(400).json(formatError('Theme required'));

        const validThemes = ['forest', 'house', 'sky', 'lanterns', 'garden', 'library', 'mountain', 'oasis', 'ship', 'city'];
        if (!validThemes.includes(theme_id)) return res.status(400).json(formatError('Invalid theme'));

        const active = await ThemeModel.getActive(req.user.id);
        const db = require('../../config/database');

        if (active) {
            // Save current theme's progress before switching
            await db.run(
                'UPDATE user_themes SET is_active = 0, frozen_streak = ? WHERE user_id = ? AND theme_id = ?',
                [active.streak, req.user.id, active.theme_id]
            );
        }

        // Check if user has used this theme before
        const existing = await db.get(
            'SELECT frozen_streak FROM user_themes WHERE user_id = ? AND theme_id = ?',
            [req.user.id, theme_id]
        );

        // ALWAYS resume from frozen_streak (never reset to 0)
        const resumeStreak = existing?.frozen_streak || 0;
        const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

        await db.run(
            `UPDATE user_themes 
             SET is_active = 1, streak = ?, last_log_date = ? 
             WHERE user_id = ? AND theme_id = ?`,
            [resumeStreak, yesterday, req.user.id, theme_id]
        );

        // If theme row doesn't exist yet, create it
        if (!existing) {
            await db.run(
                `INSERT INTO user_themes (user_id, theme_id, streak, max_streak, frozen_streak, last_log_date, is_active)
                 VALUES (?, ?, ?, ?, ?, ?, 1)`,
                [req.user.id, theme_id, 0, 0, 0, yesterday]
            );
        }

        res.json(formatSuccess(null, 'Theme switched'));
    } catch (err) { next(err); }
};

exports.preview = async (req, res, next) => {
    try {
        const { getActive } = require('./theme.model');
        const active = await getActive(req.user.id);
        res.json(formatSuccess({ alreadySelected: !!active }));
    } catch (err) { next(err); }
};