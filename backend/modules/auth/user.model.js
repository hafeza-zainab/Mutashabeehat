// C:\quran-similarity-app\backend\modules\auth\user.model.js
// Fix #2: this file was incorrectly containing router definitions.
// It is now a proper data-access model used by auth.controller.js.

const db = require('../../config/database');

/**
 * Find a user by email address (case-insensitive via lowercase convention).
 * Returns the full user row including hashed password, or undefined if not found.
 */
const findByEmail = (email) =>
    db.get(
        'SELECT id, username, email, password FROM users WHERE email = ?',
        [email]
    );

/**
 * Find a user by their primary key.
 * Returns id, username, email (no password).
 */
const findById = (id) =>
    db.get(
        'SELECT id, username, email FROM users WHERE id = ?',
        [id]
    );

/**
 * Insert a new user row.
 * Caller is responsible for hashing the password before passing it in.
 */
const createUser = (username, email, hashedPassword) =>
    db.run(
        'INSERT INTO users (username, email, password) VALUES (?, ?, ?)',
        [username, email, hashedPassword]
    );

module.exports = { findByEmail, findById, createUser };