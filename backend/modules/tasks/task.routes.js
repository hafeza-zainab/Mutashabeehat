//C:\quran-similarity-app\backend\modules\tasks\task.routes.js
const express = require("express"); const router = express.Router();
const taskController = require("./task.controller");
const authMiddleware = require("../../middleware/authMiddleware");
router.get("/streak", authMiddleware, taskController.getStreak);
router.post("/", authMiddleware, taskController.createTask);
router.get("/", authMiddleware, taskController.getTasks);
router.patch("/:id", authMiddleware, taskController.updateTask);
router.put("/:id", authMiddleware, taskController.editTaskTitle);
router.delete("/:id", authMiddleware, taskController.deleteTask);
module.exports = router;