//C:\quran-similarity-app\backend\modules\diary\diary.routes.js
const express = require("express");
const router = express.Router();
const auth = require("../../middleware/authMiddleware");
router.post("/murajah", auth, require("./murajah/murajah.controller").addMurajahLog);
router.post("/tasmee", auth, require("./tasmee/tasmee.controller").addTasmeeLog);
router.post("/ikhtebar", auth, require("./ikhtebar/ikhtebar.controller").addIkhtebarLog);
router.post("/jadeed", auth, require("./jadeed/jadeed.controller").addJadeedLog);
router.post("/juzz_hali", auth, require("./juzzHali/juzzHali.controller").addJuzzHaliLog);
const refCtrl = require("./reflection/reflection.controller");
router.post("/reflection", auth, refCtrl.save);
router.get("/reflection", auth, refCtrl.get);
router.get("/logs", auth, refCtrl.getLogs);
router.put("/log/:id", auth, refCtrl.updateLog);
router.delete("/log/:id", auth, refCtrl.deleteLog);
module.exports = router;