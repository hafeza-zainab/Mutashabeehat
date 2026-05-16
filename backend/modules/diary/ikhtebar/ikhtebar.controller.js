//C:\quran-similarity-app\backend\modules\diary\ikhtebar\ikhtebar.controller.js
const service = require("./ikhtebar.service");
const ThemeModel = require('../../themes/theme.model');
const { formatSuccess, formatError } = require("../../../utils/responseFormatter");
exports.addIkhtebarLog = async (req, res, next) => {
    try {
        const { entries, date } = req.body;
        if (!entries || !Array.isArray(entries)) return res.status(400).json(formatError("Invalid entries"));
        const count = await service.createIkhtebarLogs(req.user.id, entries, date || new Date().toISOString().split("T")[0]);
        
        await ThemeModel.incrementStreak(req.user.id);
        
        res.status(201).json(formatSuccess("Logged " + count + " ikhtebar entries"));
    } catch (error) { next(error); }
};

