// C:\quran-similarity-app\backend\modules\diary\diary.repository.js
const db = require("../../config/database");

const createLog = (userId, type, rangeFrom, rangeTo, score, date) =>
    db.run(
        `INSERT INTO diary_logs
            (user_id, type, range_from, range_to, score, created_at)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [userId, type, rangeFrom, rangeTo ?? "", score, `${date}T00:00:00`]
    );

const getLogsByDate = (userId, date) =>
    db.all(
        `SELECT id, type, range_from, range_to, score,
                DATE(created_at) AS log_date
         FROM diary_logs
         WHERE user_id = ? AND DATE(created_at) = ?
         ORDER BY created_at DESC`,
        [userId, date]
    );

const deleteLog = (logId, userId) =>
    db.run("DELETE FROM diary_logs WHERE id = ? AND user_id = ?", [logId, userId]);

const updateLog = (logId, userId, { score }) =>
    db.run(
        "UPDATE diary_logs SET score = ? WHERE id = ? AND user_id = ?",
        [score, logId, userId]
    );

module.exports = { createLog, getLogsByDate, deleteLog, updateLog };