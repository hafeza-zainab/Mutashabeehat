// C:\quran-similarity-app\backend\modules\diary\diary.routes.js
const express = require("express");
const router  = express.Router();
const auth    = require("../../middleware/authMiddleware");
const { validate, rules } = require("../../middleware/validate");

// Shared rule: all batch-entry diary types send { entries: [...], date? }
const batchEntryRules = [rules.isArray("entries")];

// Jadeed has a richer payload
const jadeedRules = [
    rules.required("range_from_surah"),
    rules.required("range_from_ayah"),
    rules.isInt("score", { min: 0, max: 10 }),
];

// Write routes
router.post("/murajah",  auth, validate(batchEntryRules), require("./murajah/murajah.controller").addMurajahLog);
router.post("/tasmee",   auth, validate(batchEntryRules), require("./tasmee/tasmee.controller").addTasmeeLog);
router.post("/ikhtebar", auth, validate(batchEntryRules), require("./ikhtebar/ikhtebar.controller").addIkhtebarLog);
router.post("/jadeed",   auth, validate(jadeedRules),     require("./jadeed/jadeed.controller").addJadeedLog);
router.post("/juz-hali", auth, validate(batchEntryRules), require("./juzzHali/juzzHali.controller").addJuzHaliLog);

// Read / update / delete routes
router.get("/logs",       auth, require("./log/log.controller").getLogs);
router.put("/log/:id",    auth, validate([rules.isInt("score", { min: 0, max: 10 })]), require("./log/log.controller").updateLog);
router.delete("/log/:id", auth, require("./log/log.controller").deleteLog);

module.exports = router;