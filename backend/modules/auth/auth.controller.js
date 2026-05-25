//C:\quran-similarity-app\backend\modules\auth\auth.controller.js
const bcrypt = require("bcrypt");
const jwt    = require("jsonwebtoken");
const User   = require("./user.model");
const { formatSuccess, formatError } = require("../../utils/responseFormatter");

const JWT_SECRET  = process.env.JWT_SECRET;
const SALT_ROUNDS = 12;

// Constant-time dummy hash — prevents user enumeration via timing differences
const DUMMY_HASH = "$2b$12$invalidhashfortimingattackprevention000000000000000000";

exports.signup = async (req, res, next) => {
    try {
        const { username, email, password } = req.body;
        // Note: format validation is handled upstream by validate middleware

        const existing = await User.findByEmail(email.toLowerCase());
        if (existing) {
            return res.status(409).json(formatError("Email is already registered."));
        }

        const hashed = await bcrypt.hash(password, SALT_ROUNDS);
        await User.createUser(username.trim(), email.toLowerCase(), hashed);

        res.status(201).json(formatSuccess(null, "Account created successfully."));
    } catch (err) {
        if (err.message?.includes("UNIQUE constraint failed: users.username")) {
            return res.status(409).json(formatError("Username is already taken."));
        }
        next(err);
    }
};

exports.login = async (req, res, next) => {
    try {
        const { email, password } = req.body;

        const user = await User.findByEmail(email.toLowerCase());

        // Always run bcrypt.compare — prevents timing-based user enumeration
        const isMatch = user
            ? await bcrypt.compare(password, user.password)
            : await bcrypt.compare(password, DUMMY_HASH).then(() => false);

        if (!user || !isMatch) {
            return res.status(401).json(formatError("Invalid email or password."));
        }

        const token = jwt.sign(
            { id: user.id, username: user.username },
            JWT_SECRET,
            { expiresIn: "7d" }
        );

        res.status(200).json(formatSuccess({ token, username: user.username }, "Login successful."));
    } catch (err) {
        next(err);
    }
};