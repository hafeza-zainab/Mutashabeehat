// C:\quran-similarity-app\backend\modules\themes\theme.model.js
const db = require("../../config/database");

const VALID_THEMES = new Set(["forest", "sky", "mountain", "oasis", "ship"]);

const getActive = (userId) =>
    db.get("SELECT * FROM user_themes WHERE user_id = ? AND is_active = 1", [userId]);

const getAll = (userId) =>
    db.all(
        `SELECT theme_id, streak, max_streak, frozen_streak, last_log_date, is_active, created_at
         FROM user_themes WHERE user_id = ?`,
        [userId]
    );

const incrementStreak = async (userId) => {
    const active = await getActive(userId);
    if (!active) return null;

    const today     = new Date().toISOString().split("T")[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];

    // Already logged today — don't double-count
    if (active.last_log_date === today) return active;

    const newStreak = active.last_log_date === yesterday ? active.streak + 1 : 1;
    const newMax    = Math.max(active.max_streak, newStreak);

    await db.run(
        "UPDATE user_themes SET streak = ?, max_streak = ?, last_log_date = ? WHERE user_id = ? AND is_active = 1",
        [newStreak, newMax, today, userId]
    );

    return { ...active, streak: newStreak, max_streak: newMax };
};

module.exports = { getActive, getAll, incrementStreak, VALID_THEMES };