//C:\quran-similarity-app\backend\modules\tasks\task.model.js
const db = require("../../config/database");

const addTask = (userId, title, category, date) =>
    db.run(
        "INSERT INTO tasks (user_id, title, category, status, date) VALUES (?, ?, ?, 'pending', ?)",
        [userId, title, category, date]
    );

const getTasksByDate = (userId, date) =>
    db.all(
        "SELECT * FROM tasks WHERE user_id = ? AND date = ? ORDER BY category ASC, id ASC",
        [userId, date]
    );

const updateTaskStatus = (taskId, status, userId) =>
    db.run(
        "UPDATE tasks SET status = ? WHERE id = ? AND user_id = ?",
        [status, taskId, userId]
    );

const updateTaskTitle = (taskId, title, userId) =>
    db.run(
        "UPDATE tasks SET title = ? WHERE id = ? AND user_id = ?",
        [title, taskId, userId]
    );

const deleteTask = (taskId, userId) =>
    db.run("DELETE FROM tasks WHERE id = ? AND user_id = ?", [taskId, userId]);

module.exports = { addTask, getTasksByDate, updateTaskStatus, updateTaskTitle, deleteTask };