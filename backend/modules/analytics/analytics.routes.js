//C:\quran-similarity-app\backend\modules\analytics\analytics.routes.js
const express = require("express");
const router = express.Router();
const analyticsController = require("./analytics.controller");
const authMiddleware = require("../../middleware/authMiddleware");
router.get("/trend", authMiddleware, analyticsController.getTrend);
router.get("/deep-dive", authMiddleware, analyticsController.getDeepDive);
router.get("/heatmap", authMiddleware, analyticsController.getHeatmapData);
module.exports = router;