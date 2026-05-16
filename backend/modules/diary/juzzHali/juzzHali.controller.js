// C:\quran-similarity-app\backend\modules\diary\juzzHali\juzzHali.controller.js
const service = require("./juzzHali.service");
const ThemeModel = require('../../themes/theme.model');
const { formatSuccess, formatError } = require("../../../utils/responseFormatter");

exports.addJuzzHaliLog = async (req, res, next) => {
    try {
        const { entries, date } = req.body;
        if (!entries || !Array.isArray(entries)) return res.status(400).json(formatError("Invalid entries"));
        const count = await service.createJuzzHaliLogs(req.user.id, entries, date || new Date().toISOString().split("T")[0]);
        await ThemeModel.incrementStreak(req.user.id);
        
        
        res.status(201).json(formatSuccess("Logged " + count + " juzz hali entries"));
    } catch (error) { next(error); }
};

