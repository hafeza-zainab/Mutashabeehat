// C:\quran-similarity-app\backend\modules\themes\theme.model.js
const db = require('../../config/database');

const getActive = async (userId) => {
    return await db.get(
        `SELECT * FROM user_themes WHERE user_id = ? AND is_active = 1`,
        [userId]
    );
};

const getAll = async (userId) => {
    return await db.all(
        `SELECT theme_id, streak, max_streak, frozen_streak, last_log_date, is_active, created_at 
         FROM user_themes WHERE user_id = ?`,
        [userId]
    );
};

const activate = async (userId, themeId, streak = 0) => {
    await db.run('UPDATE user_themes SET is_active = 0 WHERE user_id = ? AND is_active = 1', [userId]);
    await db.run(
        `INSERT OR REPLACE INTO user_themes (user_id, theme_id, streak, max_streak, frozen_streak, is_active)
         VALUES (?, ?, ?, ?, ?, 1)`,
        [userId, themeId, streak, Math.max(streak, streak), streak]
    );
};

const deactivateCurrent = async (userId) => {
    const current = await getActive(userId);
    if (current) {
        await db.run(
            'UPDATE user_themes SET is_active = 0, frozen_streak = ? WHERE user_id = ? AND theme_id = ?',
            [current.streak, userId, current.theme_id]
        );
    }
    return current;
};

const incrementStreak = async (userId) => {
    const active = await getActive(userId);
    if (!active) return null;

    const today = new Date().toISOString().split('T')[0];
    if (active.last_log_date === today) return active;

    let newStreak;
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

    if (active.last_log_date === yesterday) {
        newStreak = active.streak + 1;
    } else {
        newStreak = 1;
    }

    const newMax = Math.max(active.max_streak, newStreak);
    await db.run(
        'UPDATE user_themes SET streak = ?, max_streak = ?, last_log_date = ? WHERE user_id = ? AND is_active = 1',
        [newStreak, newMax, today, userId]
    );

    return { ...active, streak: newStreak, max_streak: newMax };
};

module.exports = { getActive, getAll, activate, deactivateCurrent, incrementStreak };