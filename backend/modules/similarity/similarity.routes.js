//C:\quran-similarity-app\backend\modules\similarity\similarity.routes.js
const express = require("express");
const router = express.Router();
const similarityController = require("./similarity.controller");
router.get("/", similarityController.getSimilarities);
module.exports = router;