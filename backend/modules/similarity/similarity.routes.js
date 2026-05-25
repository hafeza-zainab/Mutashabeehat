//C:\quran-similarity-app\backend\modules\similarity\similarity.routes.js
const express    = require("express");
const router     = express.Router();
const controller = require("./similarity.controller");

router.get("/", controller.getSimilarities);

module.exports = router;