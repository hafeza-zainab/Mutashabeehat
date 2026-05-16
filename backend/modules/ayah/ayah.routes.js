//C:\quran-similarity-app\backend\modules\ayah\ayah.routes.js
const express = require("express");
const router = express.Router();
const ayahController = require("./ayah.controller");
router.get("/juzz-pages", ayahController.getJuzzPages);
router.get("/pages-in-range", ayahController.getPagesInRange);
router.get("/page-details", ayahController.getPageDetails);
router.get("/surahs", ayahController.getSurahs);
router.get("/context", ayahController.getAyahContext);
router.get("/:surah/ayahs", ayahController.getAyahsBySurah);
module.exports = router;