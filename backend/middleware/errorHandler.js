//C:\quran-similarity-app\backend\middleware\errorHandler.js
const { formatError } = require("../utils/responseFormatter");

// eslint-disable-next-line no-unused-vars
module.exports = (err, req, res, next) => {
    console.error(`[${new Date().toISOString()}] ${req.method} ${req.path} —`, err.stack || err.message);

    const statusCode = err.statusCode || 500;
    const message =
        process.env.NODE_ENV === "production" && statusCode === 500
            ? "Internal Server Error"
            : err.message || "Internal Server Error";

    res.status(statusCode).json(formatError(message, statusCode));
};