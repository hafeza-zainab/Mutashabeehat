//C:\quran-similarity-app\backend\modules\auth\user.model.js
const db = require("../../config/database");
const createUser = async (username, email, hashedPassword) => {
    return await db.run("INSERT INTO users (username, email, password) VALUES (?, ?, ?)", [username, email, hashedPassword]);
};
const findUserByEmail = async (email) => {
    return await db.get("SELECT * FROM users WHERE email = ?", [email]);
};
module.exports = { createUser, findUserByEmail };