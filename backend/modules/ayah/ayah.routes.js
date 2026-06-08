const express    = require("express");
const router     = express.Router();
const controller = require("./ayah.controller");

// ── Specific string routes first (before any :param routes) ──
router.get("/juz-pages",      controller.getJuzPages);
router.get("/pages-in-range", controller.getPagesInRange);
router.get("/page-details",   controller.getPageDetails);
router.get("/surahs",         controller.getSurahs);
router.get("/context",        controller.getAyahContext);

// ── Parameterized routes with sub-paths ──
router.get("/page/:page/full",    controller.getPageFull);
router.get("/juz/:juz/full",      controller.getJuzFull);
router.get("/:surah/full",        controller.getSurahFull);      // ← single registration
router.get("/:surah/first-words", controller.getFirstWords);
router.get("/:surah/ayahs",       controller.getAyahsBySurah);

module.exports = router;