//C:\quran-similarity-app\backend\modules\ayah\ayah.routes.js
const express    = require("express");
const router     = express.Router();
const controller = require("./ayah.controller");

// Order matters: specific paths before parameterized ones
router.get("/juz-pages",      controller.getJuzPages);
router.get("/pages-in-range", controller.getPagesInRange);
router.get("/page-details",   controller.getPageDetails);
router.get("/surahs",         controller.getSurahs);
router.get("/context",        controller.getAyahContext);
router.get("/:surah/ayahs",   controller.getAyahsBySurah);

module.exports = router;