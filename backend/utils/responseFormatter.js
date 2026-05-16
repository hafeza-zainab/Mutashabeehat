//C:\quran-similarity-app\backend\utils\responseFormatter.js
const formatSuccess = (data, message = "Success") => ({ success: true, message, data });
const formatError = (message = "Error", statusCode = 400) => ({ success: false, message, statusCode });
module.exports = { formatSuccess, formatError };