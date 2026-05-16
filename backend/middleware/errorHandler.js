//C:\quran-similarity-app\backend\middleware\errorHandler.js
const { formatError } = require("../utils/responseFormatter");
module.exports = (err, req, res, next) => {
    console.error(err.stack);
    const statusCode = err.statusCode || 500;
    res.status(statusCode).json(formatError(err.message || "Internal Server Error", statusCode));
};