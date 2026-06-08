// C:\quran-similarity-app\backend\modules\diary\log\log.controller.js

const repo = require("../diary.repository");
const { formatSuccess, formatError } = require("../../../utils/responseFormatter");

exports.getLogs = async (req, res, next) => {
    try {
        const date = req.query.date || new Date().toISOString().split("T")[0];
        const logs = await repo.getLogsByDate(req.user.id, date);
        res.status(200).json(formatSuccess(logs));
    } catch (err) { next(err); }
};

exports.updateLog = async (req, res, next) => {
    try {
        const { score } = req.body;
        if (score === undefined || score < 0 || score > 10) {
            return res.status(400).json(formatError("score must be between 0 and 10."));
        }
        const result = await repo.updateLog(req.params.id, req.user.id, { score });
        if (result.changes === 0) {
            return res.status(404).json(formatError("Log not found or not owned by user."));
        }
        res.status(200).json(formatSuccess(null, "Log updated."));
    } catch (err) { next(err); }
};

exports.deleteLog = async (req, res, next) => {
    try {
        const result = await repo.deleteLog(req.params.id, req.user.id);
        if (result.changes === 0) {
            return res.status(404).json(formatError("Log not found or not owned by user."));
        }
        res.status(200).json(formatSuccess(null, "Log deleted."));
    } catch (err) { next(err); }
};