//C:\quran-similarity-app\backend\modules\tasks\task.controller.js
const Task = require("./task.model");
const db = require("../../config/database");
const { formatSuccess } = require("../../utils/responseFormatter");
exports.createTask = async (req, res, next) => { try { const { title, category } = req.body; if (!title || !category) return res.status(400).json({success:false,message:"Missing fields"}); await Task.addTask(req.user.id, title, category, new Date().toISOString().split("T")[0]); res.status(201).json(formatSuccess(null, "Task added")); } catch(error){next(error);} };
exports.getTasks = async (req, res, next) => { try { const date = req.query.date || new Date().toISOString().split("T")[0]; const tasks = await Task.getTasksByDate(req.user.id, date); res.status(200).json(formatSuccess(tasks)); } catch(error){next(error);} };
exports.updateTask = async (req, res, next) => { try { const { status } = req.body; await Task.updateTaskStatus(req.params.id, status, req.user.id); res.status(200).json(formatSuccess(null, "Updated")); } catch(error){next(error);} };
exports.editTaskTitle = async (req, res, next) => { try { const { title } = req.body; await Task.updateTaskTitle(req.params.id, title, req.user.id); res.status(200).json(formatSuccess(null, "Title updated")); } catch(error){next(error);} };
exports.deleteTask = async (req, res, next) => { try { await Task.deleteTask(req.params.id, req.user.id); res.status(200).json(formatSuccess(null, "Deleted")); } catch(error){next(error);} };
exports.getStreak = async (req, res, next) => {
    try {
        const dates = await db.all("SELECT DISTINCT DATE(created_at) as log_date FROM diary_logs WHERE user_id = ? AND created_at >= DATE('now', '-60 days') ORDER BY log_date DESC", [req.user.id]);
        let streak = 0; const today = new Date().toISOString().split("T")[0]; const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];
        if (dates.length === 0 || (dates[0].log_date !== today && dates[0].log_date !== yesterday)) return res.status(200).json(formatSuccess({ streak: 0 }));
        streak = 1; let expectedDate = dates[0].log_date === today ? yesterday : dates[0].log_date;
        for (let i = 1; i < dates.length; i++) {
            if (dates[i].log_date === expectedDate) { streak++; const d = new Date(expectedDate + "T00:00:00"); d.setDate(d.getDate() - 1); expectedDate = d.toISOString().split("T")[0]; } else break;
        }
        res.status(200).json(formatSuccess({ streak }));
    } catch (error) { next(error); }
};