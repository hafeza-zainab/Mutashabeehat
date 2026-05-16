// C:\quran-similarity-app\backend\modules\diary\diary.repository.js
const db = require('../../config/database');

const createLog = async (userId, type, rangeFrom, rangeTo, score, notes, date) => {
    return await db.run(
        `INSERT INTO diary_logs (user_id, type, range_from, range_to, score, notes, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)`, 
        [userId, type, rangeFrom, rangeTo, score, notes, date]
    );
};
const ThemeModel = require('../themes/theme.model');
const getLogsByDate = async (userId, date) => {
    let logs = await db.all(
        `SELECT id, type, range_from, range_to, score, notes, DATE(created_at) as log_date 
         FROM diary_logs WHERE user_id = ? AND DATE(created_at) = ? ORDER BY created_at DESC`, 
        [userId, date]
    );
    if (logs.length === 0) {
        logs = await db.all(
            `SELECT id, type, range_from, range_to, score, notes, DATE(created_at) as log_date 
             FROM diary_logs WHERE user_id = ? AND created_at LIKE ? ORDER BY created_at DESC`, 
            [userId, date + '%']
        );
    }
    return logs;
};

const deleteLog = async (logId, userId) => db.run(`DELETE FROM diary_logs WHERE id = ? AND user_id = ?`, [logId, userId]);
const updateLog = async (logId, userId, data) => db.run(`UPDATE diary_logs SET score = ?, notes = ? WHERE id = ? AND user_id = ?`, [data.score, data.notes, logId, userId]);
const saveReflection = async (userId, date, reflection) => db.run(`INSERT OR REPLACE INTO daily_reflections (user_id, date, reflection) VALUES (?, ?, ?)`, [userId, date, reflection]);
const getReflection = async (userId, date) => db.get(`SELECT reflection FROM daily_reflections WHERE user_id = ? AND date = ?`, [userId, date]);

module.exports = { createLog, getLogsByDate, deleteLog, updateLog, saveReflection, getReflection };