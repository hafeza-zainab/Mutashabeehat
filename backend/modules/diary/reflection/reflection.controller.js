//C:\quran-similarity-app\backend\modules\diary\reflection\reflection.controller.js
const repo = require("../diary.repository");
const { formatSuccess } = require("../../../utils/responseFormatter");
exports.save = async (req, res, next) => {
    try {
        const date = req.body.date || new Date().toISOString().split("T")[0];
        await repo.saveReflection(req.user.id, date, JSON.stringify({ hifz_today: req.body.hifz_today || "", target_tomorrow: req.body.target_tomorrow || "", plan_action: req.body.plan_action || "" }));
        res.status(201).json(formatSuccess(null, "Saved"));
    } catch (error) { next(error); }
};
exports.get = async (req, res, next) => {
    try {
        const date = req.query.date || new Date().toISOString().split("T")[0];
        const row = await repo.getReflection(req.user.id, date);
        let parsed = { hifz_today: "", target_tomorrow: "", plan_action: "" };
        if (row && row.reflection) { try { parsed = JSON.parse(row.reflection); } catch(e) { parsed.hifz_today = row.reflection; } }
        res.status(200).json(formatSuccess(parsed));
    } catch (error) { next(error); }
};
exports.getLogs = async (req, res, next) => {
    try {
        const date = req.query.date || new Date().toISOString().split("T")[0];
        const logs = await repo.getLogsByDate(req.user.id, date);
        res.status(200).json(formatSuccess(logs));
    } catch (error) { next(error); }
};
exports.updateLog = async (req, res, next) => {
    try {
        const result = await repo.updateLog(req.params.id, req.user.id, req.body);
        if (result.changes === 0) return res.status(404).json({ success: false, message: "Log not found" });
        res.status(200).json({ success: true, message: "Updated" });
    } catch (error) { next(error); }
};
exports.deleteLog = async (req, res, next) => {
    try {
        const result = await repo.deleteLog(req.params.id, req.user.id);
        if (result.changes === 0) return res.status(404).json({ success: false, message: "Log not found" });
        res.status(200).json({ success: true, message: "Deleted" });
    } catch (error) { next(error); }
};