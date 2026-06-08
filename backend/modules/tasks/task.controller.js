//C:\quran-similarity-app\backend\modules\tasks\task.controller.js
const Task = require("./task.model");
const db   = require("../../config/database");
const { formatSuccess, formatError } = require("../../utils/responseFormatter");

exports.createTask = async (req, res, next) => {
    try {
        const { title, category } = req.body;
        const today = new Date().toISOString().split("T")[0];
        await Task.addTask(req.user.id, title.trim(), category, today);
        res.status(201).json(formatSuccess(null, "Task added."));
    } catch (err) { next(err); }
};

exports.getTasks = async (req, res, next) => {
    try {
        const date  = req.query.date || new Date().toISOString().split("T")[0];
        const tasks = await Task.getTasksByDate(req.user.id, date);
        res.status(200).json(formatSuccess(tasks));
    } catch (err) { next(err); }
};

exports.updateTask = async (req, res, next) => {
    try {
        const result = await Task.updateTaskStatus(req.params.id, req.body.status, req.user.id);
        if (result.changes === 0) return res.status(404).json(formatError("Task not found."));
        res.status(200).json(formatSuccess(null, "Task updated."));
    } catch (err) { next(err); }
};

exports.editTaskTitle = async (req, res, next) => {
    try {
        const result = await Task.updateTaskTitle(req.params.id, req.body.title.trim(), req.user.id);
        if (result.changes === 0) return res.status(404).json(formatError("Task not found."));
        res.status(200).json(formatSuccess(null, "Task title updated."));
    } catch (err) { next(err); }
};

exports.deleteTask = async (req, res, next) => {
    try {
        const result = await Task.deleteTask(req.params.id, req.user.id);
        if (result.changes === 0) return res.status(404).json(formatError("Task not found."));
        res.status(200).json(formatSuccess(null, "Task deleted."));
    } catch (err) { next(err); }
};

exports.getStreak = async (req, res, next) => {
    try {
        const dates = await db.all(
            `SELECT DISTINCT DATE(created_at) AS log_date
             FROM diary_logs
             WHERE user_id = ? AND created_at >= DATE('now', '-60 days')
             ORDER BY log_date DESC`,
            [req.user.id]
        );

        if (dates.length === 0) {
            return res.status(200).json(formatSuccess({ streak: 0 }));
        }

        const today      = new Date().toISOString().split("T")[0];
        const yesterday  = new Date(Date.now() - 86400000).toISOString().split("T")[0];
        const mostRecent = dates[0].log_date;

        if (mostRecent !== today && mostRecent !== yesterday) {
            return res.status(200).json(formatSuccess({ streak: 0 }));
        }

        let streak       = 1;
        let expectedDate = mostRecent === today ? yesterday : mostRecent;

        for (let i = 1; i < dates.length; i++) {
            if (dates[i].log_date === expectedDate) {
                streak++;
                const d = new Date(expectedDate + "T00:00:00");
                d.setDate(d.getDate() - 1);
                expectedDate = d.toISOString().split("T")[0];
            } else {
                break;
            }
        }

        res.status(200).json(formatSuccess({ streak }));
    } catch (err) { next(err); }
};