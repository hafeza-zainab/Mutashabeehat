// C:\quran-similarity-app\backend\modules\auth\auth.routes.js
const express        = require('express');
const router         = express.Router();
const authController = require('./auth.controller');
const rateLimiter    = require('../../middleware/rateLimiter');
const { validate, rules } = require('../../middleware/validate');

const signupRules = [
    rules.required('username'),
    rules.minLength('username', 3),
    rules.maxLength('username', 30),
    rules.required('email'),
    rules.isEmail('email'),
    rules.required('password'),
    rules.minLength('password', 8),
    rules.matches(
        'password',
        /^(?=.*[A-Z])(?=.*\d).{8,}$/,
        'Password must be at least 8 characters and include 1 uppercase letter and 1 number.'
    ),
];

const loginRules = [
    rules.required('email'),
    rules.isEmail('email'),
    rules.required('password'),
];

router.post('/signup', rateLimiter, validate(signupRules), authController.signup);
router.post('/login',  rateLimiter, validate(loginRules),  authController.login);

module.exports = router;