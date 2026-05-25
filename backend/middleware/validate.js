// C:\quran-similarity-app\backend\middleware\validate.js
// Fix #3: this file was missing. Routes import { validate, rules } from here.
//
// validate(ruleArray) returns an Express middleware that runs each rule
// against req.body and responds with 400 + first error if any rule fails.
//
// rules.* are factory functions that return a single rule function:
//   (body) => errorString | null

const { formatError } = require('../utils/responseFormatter');

// ─── Rule factories ──────────────────────────────────────────────────────────

const required = (field) => (body) => {
    const val = body[field];
    if (val === undefined || val === null || String(val).trim() === '') {
        return `${field} is required.`;
    }
    return null;
};

const minLength = (field, min) => (body) => {
    const val = body[field];
    if (val && String(val).length < min) {
        return `${field} must be at least ${min} characters.`;
    }
    return null;
};

const maxLength = (field, max) => (body) => {
    const val = body[field];
    if (val && String(val).length > max) {
        return `${field} must be at most ${max} characters.`;
    }
    return null;
};

const isEmail = (field) => (body) => {
    const val = body[field];
    if (val && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(val))) {
        return `${field} must be a valid email address.`;
    }
    return null;
};

const matches = (field, regex, message) => (body) => {
    const val = body[field];
    if (val && !regex.test(String(val))) {
        return message || `${field} is invalid.`;
    }
    return null;
};

const isInt = (field, { min, max } = {}) => (body) => {
    const val = body[field];
    if (val === undefined || val === null) return null; // let required() handle presence
    const n = Number(val);
    if (!Number.isInteger(n)) return `${field} must be an integer.`;
    if (min !== undefined && n < min) return `${field} must be at least ${min}.`;
    if (max !== undefined && n > max) return `${field} must be at most ${max}.`;
    return null;
};

const isArray = (field) => (body) => {
    if (!Array.isArray(body[field])) {
        return `${field} must be an array.`;
    }
    return null;
};

const oneOf = (field, allowed) => (body) => {
    const val = body[field];
    if (val !== undefined && !allowed.includes(val)) {
        return `${field} must be one of: ${allowed.join(', ')}.`;
    }
    return null;
};

// ─── Middleware factory ──────────────────────────────────────────────────────

const validate = (ruleFns) => (req, res, next) => {
    for (const ruleFn of ruleFns) {
        const error = ruleFn(req.body);
        if (error) {
            return res.status(400).json(formatError(error, 400));
        }
    }
    next();
};

// ─── Exports ─────────────────────────────────────────────────────────────────

module.exports = {
    validate,
    rules: {
        required,
        minLength,
        maxLength,
        isEmail,
        matches,
        isInt,
        isArray,
        oneOf,
    },
};