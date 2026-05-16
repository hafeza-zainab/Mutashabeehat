//C:\quran-similarity-app\backend\modules\auth\auth.controller.js
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("./user.model");
const { formatSuccess, formatError } = require("../../utils/responseFormatter");
const JWT_SECRET = process.env.JWT_SECRET || "your_super_secret_quran_app_key";

exports.signup = async (req, res, next) => {
    try {
        const { username, email, password } = req.body;
        if (!username || !email || !password) return res.status(400).json(formatError("All fields are required"));
        const passwordRegex = /^(?=.*[A-Z])(?=.*\d).{8,}$/;
        if (!passwordRegex.test(password)) return res.status(400).json(formatError("Password must be at least 8 characters, include 1 uppercase letter and 1 number."));
        const existingUser = await User.findUserByEmail(email);
        if (existingUser) return res.status(400).json(formatError("Email already registered"));
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        await User.createUser(username, email, hashedPassword);
        res.status(201).json(formatSuccess(null, "Account created successfully!"));
    } catch (error) {
        if (error.message && error.message.includes("UNIQUE constraint failed: users.username")) return res.status(400).json(formatError("This username is already taken."));
        next(error);
    }
};

exports.login = async (req, res, next) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) return res.status(400).json(formatError("Email and password are required"));
        const user = await User.findUserByEmail(email);
        if (!user) return res.status(401).json(formatError("Invalid credentials"));
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(401).json(formatError("Invalid credentials"));
        const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: "7d" });
        res.status(200).json(formatSuccess({ token, username: user.username }, "Login successful"));
    } catch (error) { next(error); }
};